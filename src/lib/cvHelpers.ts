import { supabase } from "@/integrations/supabase/client";
import { downloadFromBucket, extractTextFromPdf, validateExtractedText } from "@/lib/pdfExtract";

export interface CvRecord {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface CvParsedRecord {
  id: string;
  cv_upload_id: string;
  user_id: string;
  raw_text: string | null;
  parsed_json: unknown;
  parse_confidence: number | null;
  model_name: string | null;
  created_at: string;
}

/** Fetch the most recent CV upload for a user */
export async function fetchLatestCv(userId: string): Promise<CvRecord | null> {
  const { data, error } = await (supabase as any)
    .from("cv_uploads")
    .select("id, file_name, file_path, status, error_message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[cvHelpers] fetchLatestCv error:", error);
    return null;
  }
  return data as CvRecord | null;
}

/** Check if a cv_parsed_data record already exists for a given cv_upload_id */
export async function fetchParsedData(cvUploadId: string): Promise<CvParsedRecord | null> {
  const { data, error } = await (supabase as any)
    .from("cv_parsed_data")
    .select("id, cv_upload_id, user_id, raw_text, parsed_json, parse_confidence, model_name, created_at")
    .eq("cv_upload_id", cvUploadId)
    .maybeSingle();

  if (error) {
    console.error("[cvHelpers] fetchParsedData error:", error);
    return null;
  }
  return data as CvParsedRecord | null;
}

/** Helper to set cv_uploads status */
async function setCvStatus(
  cvUploadId: string,
  userId: string,
  status: string,
  errorMessage: string | null = null
) {
  const { data, error } = await (supabase as any)
    .from("cv_uploads")
    .update({ status, error_message: errorMessage })
    .eq("id", cvUploadId)
    .eq("user_id", userId)
    .select("id, status")
    .maybeSingle();

  if (error) console.error(`[cvHelpers] setCvStatus(${status}) error:`, error);
  return { data, error };
}

/**
 * Full AI preparation flow:
 * 1. Set status → processing
 * 2. Download PDF from bucket
 * 3. Extract text
 * 4. Validate text quality
 * 5. Upsert cv_parsed_data with raw_text
 * 6. Set status → needs_review
 */
export async function startAiPreparation(
  cvUploadId: string,
  userId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[cvHelpers] startAiPreparation called with", { cvUploadId, userId, filePath });

  // 1. Set status to processing
  const { data: updateData, error: updateErr } = await setCvStatus(cvUploadId, userId, "processing");
  if (updateErr || !updateData) {
    return { success: false, error: updateErr?.message || "Nie znaleziono rekordu CV do aktualizacji." };
  }

  // 2. Download PDF
  let pdfBuffer: ArrayBuffer;
  try {
    pdfBuffer = await downloadFromBucket("candidate-cvs", filePath);
    console.log("[cvHelpers] PDF downloaded, size:", pdfBuffer.byteLength);
  } catch (err: any) {
    console.error("[cvHelpers] PDF download failed:", err);
    await setCvStatus(cvUploadId, userId, "failed", err.message);
    return { success: false, error: err.message };
  }

  // 3. Extract text
  let rawText: string;
  try {
    rawText = await extractTextFromPdf(pdfBuffer);
    console.log("[cvHelpers] Extracted text length:", rawText.length);
  } catch (err: any) {
    console.error("[cvHelpers] PDF text extraction failed:", err);
    const msg = "Nie udało się odczytać tekstu z PDF: " + err.message;
    await setCvStatus(cvUploadId, userId, "failed", msg);
    return { success: false, error: msg };
  }

  // 4. Validate quality
  const validationError = validateExtractedText(rawText);
  if (validationError) {
    console.warn("[cvHelpers] Text validation failed:", validationError);
    await setCvStatus(cvUploadId, userId, "failed", validationError);
    return { success: false, error: validationError };
  }

  // 5. Upsert cv_parsed_data (try update first, then insert)
  const existing = await fetchParsedData(cvUploadId);

  if (existing) {
    const { error: updErr } = await (supabase as any)
      .from("cv_parsed_data")
      .update({ raw_text: rawText })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (updErr) {
      console.error("[cvHelpers] cv_parsed_data update failed:", updErr);
      await setCvStatus(cvUploadId, userId, "failed", updErr.message);
      return { success: false, error: updErr.message };
    }
    console.log("[cvHelpers] cv_parsed_data updated with raw_text");
  } else {
    const { error: insErr } = await (supabase as any)
      .from("cv_parsed_data")
      .insert({
        cv_upload_id: cvUploadId,
        user_id: userId,
        raw_text: rawText,
        parsed_json: null,
        parse_confidence: null,
        model_name: null,
      })
      .select("id")
      .maybeSingle();

    if (insErr && insErr.code !== "23505") {
      console.error("[cvHelpers] cv_parsed_data insert failed:", insErr);
      await setCvStatus(cvUploadId, userId, "failed", insErr.message);
      return { success: false, error: insErr.message };
    }
    console.log("[cvHelpers] cv_parsed_data inserted with raw_text");
  }

  // 6. Set status to needs_review (text extracted, ready for AI parsing)
  const { error: finalErr } = await setCvStatus(cvUploadId, userId, "needs_review");
  if (finalErr) {
    await setCvStatus(cvUploadId, userId, "failed", finalErr.message);
    return { success: false, error: finalErr.message };
  }

  console.log("[cvHelpers] startAiPreparation completed successfully");
  return { success: true };
}

/**
 * Call the parse-cv-ai edge function to parse raw_text into structured JSON.
 * Returns the parsed JSON on success.
 */
export async function startAiParsing(
  cvUploadId: string,
  userId: string
): Promise<{ success: boolean; error?: string; parsedJson?: unknown }> {
  console.log("[cvHelpers] startAiParsing called", { cvUploadId, userId });

  const {
    data: { session: debugSession },
    error: debugSessionError,
  } = await supabase.auth.getSession();

  console.log("[cvHelpers] DEBUG session:", debugSession);
  console.log("[cvHelpers] DEBUG access token:", debugSession?.access_token);
  console.log("[cvHelpers] DEBUG session error:", debugSessionError);

  // Verify parsed data with raw_text exists
  const existing = await fetchParsedData(cvUploadId);
  if (!existing || !existing.raw_text || existing.raw_text.length < 30) {
    return { success: false, error: "Brak tekstu z CV do analizy. Najpierw odczytaj tekst z PDF." };
  }

  // If parsed_json already exists, don't re-parse
  if (existing.parsed_json && typeof existing.parsed_json === "object" && Object.keys(existing.parsed_json as Record<string, unknown>).length > 0) {
    console.log("[cvHelpers] parsed_json already exists, skipping AI call");
    return { success: true, parsedJson: existing.parsed_json };
  }

  // Call edge function with the current user's access token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[cvHelpers] getSession error:", sessionError);
    return { success: false, error: sessionError.message || "Nie udało się pobrać sesji użytkownika." };
  }

  if (!session?.access_token) {
    return { success: false, error: "Brak aktywnej sesji użytkownika. Zaloguj się ponownie." };
  }

  console.log("[cvHelpers] invoking function with token:", session?.access_token);

  const { data, error } = await supabase.functions.invoke("parse-cv-ai", {
    body: { cv_upload_id: cvUploadId },
    headers: session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : {},
  });

  if (error) {
    console.error("[cvHelpers] parse-cv-ai invoke error:", error);
    return { success: false, error: error.message || "Błąd wywołania analizy AI." };
  }

  if (data?.error) {
    console.error("[cvHelpers] parse-cv-ai returned error:", data.error);
    return { success: false, error: data.error };
  }

  if (!data?.success) {
    return { success: false, error: "Nieoczekiwana odpowiedź z serwera." };
  }

  console.log("[cvHelpers] AI parsing succeeded, confidence:", data.parse_confidence);
  return { success: true, parsedJson: data.parsed_json };
}
