import { supabase } from "@/integrations/supabase/client";

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
  console.log("[cvHelpers] fetchLatestCv result:", data);
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
  console.log("[cvHelpers] fetchParsedData result:", data);
  return data as CvParsedRecord | null;
}

/** Begin the AI preparation flow: set status to processing, create parsed_data placeholder */
export async function startAiPreparation(
  cvUploadId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[cvHelpers] startAiPreparation called with", { cvUploadId, userId });

  // 1. Set cv_uploads status to 'processing' — use .select() to verify row was actually updated
  const { data: updateData, error: updateErr } = await (supabase as any)
    .from("cv_uploads")
    .update({ status: "processing", error_message: null })
    .eq("id", cvUploadId)
    .eq("user_id", userId)
    .select("id, status")
    .maybeSingle();

  console.log("[cvHelpers] update to processing:", { updateData, updateErr });

  if (updateErr) {
    console.error("[cvHelpers] Failed to set processing:", updateErr);
    return { success: false, error: updateErr.message };
  }
  if (!updateData) {
    console.error("[cvHelpers] Update to processing returned no rows — RLS or row not found");
    return { success: false, error: "Nie znaleziono rekordu CV do aktualizacji." };
  }

  // 2. Insert cv_parsed_data (unique constraint prevents duplicates)
  const { data: insertData, error: insertErr } = await (supabase as any)
    .from("cv_parsed_data")
    .insert({
      cv_upload_id: cvUploadId,
      user_id: userId,
      raw_text: null,
      parsed_json: null,
      parse_confidence: null,
      model_name: null,
    })
    .select("id")
    .maybeSingle();

  console.log("[cvHelpers] insert cv_parsed_data:", { insertData, insertErr });

  // 23505 = unique_violation — record already exists, that's OK
  if (insertErr && insertErr.code !== "23505") {
    console.error("[cvHelpers] Failed to insert cv_parsed_data:", insertErr);
    // Rollback status
    await (supabase as any)
      .from("cv_uploads")
      .update({ status: "failed", error_message: insertErr.message })
      .eq("id", cvUploadId)
      .eq("user_id", userId);
    return { success: false, error: insertErr.message };
  }

  // 3. Set status to needs_review
  const { data: finalData, error: finalErr } = await (supabase as any)
    .from("cv_uploads")
    .update({ status: "needs_review" })
    .eq("id", cvUploadId)
    .eq("user_id", userId)
    .select("id, status")
    .maybeSingle();

  console.log("[cvHelpers] update to needs_review:", { finalData, finalErr });

  if (finalErr) {
    console.error("[cvHelpers] Failed to set needs_review:", finalErr);
    await (supabase as any)
      .from("cv_uploads")
      .update({ status: "failed", error_message: finalErr.message })
      .eq("id", cvUploadId)
      .eq("user_id", userId);
    return { success: false, error: finalErr.message };
  }
  if (!finalData) {
    console.error("[cvHelpers] Update to needs_review returned no rows");
    return { success: false, error: "Nie udało się zaktualizować statusu CV." };
  }

  console.log("[cvHelpers] startAiPreparation completed successfully");
  return { success: true };
}
