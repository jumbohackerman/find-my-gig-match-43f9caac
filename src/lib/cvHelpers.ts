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
  const { data } = await (supabase as any)
    .from("cv_uploads")
    .select("id, file_name, file_path, status, error_message, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as CvRecord | null;
}

/** Check if a cv_parsed_data record already exists for a given cv_upload_id */
export async function fetchParsedData(cvUploadId: string): Promise<CvParsedRecord | null> {
  const { data } = await (supabase as any)
    .from("cv_parsed_data")
    .select("id, cv_upload_id, user_id, raw_text, parsed_json, parse_confidence, model_name, created_at")
    .eq("cv_upload_id", cvUploadId)
    .maybeSingle();
  return data as CvParsedRecord | null;
}

/** Begin the AI preparation flow: set status to processing, create parsed_data placeholder */
export async function startAiPreparation(
  cvUploadId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Set cv_uploads status to 'processing'
  const { error: updateErr } = await (supabase as any)
    .from("cv_uploads")
    .update({ status: "processing", error_message: null })
    .eq("id", cvUploadId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // 2. Try to insert cv_parsed_data (unique constraint prevents duplicates)
  const { error: insertErr } = await (supabase as any)
    .from("cv_parsed_data")
    .insert({
      cv_upload_id: cvUploadId,
      user_id: userId,
      raw_text: null,
      parsed_json: null,
      parse_confidence: null,
      model_name: null,
    });

  // If duplicate (23505 = unique_violation), that's fine — record already exists
  if (insertErr && insertErr.code !== "23505") {
    // Rollback status
    await (supabase as any)
      .from("cv_uploads")
      .update({ status: "failed", error_message: insertErr.message })
      .eq("id", cvUploadId);
    return { success: false, error: insertErr.message };
  }

  // 3. Set status to needs_review (placeholder for when real AI is wired up)
  const { error: finalErr } = await (supabase as any)
    .from("cv_uploads")
    .update({ status: "needs_review" })
    .eq("id", cvUploadId);

  if (finalErr) {
    await (supabase as any)
      .from("cv_uploads")
      .update({ status: "failed", error_message: finalErr.message })
      .eq("id", cvUploadId);
    return { success: false, error: finalErr.message };
  }

  return { success: true };
}
