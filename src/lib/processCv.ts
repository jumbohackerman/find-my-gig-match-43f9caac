/**
 * Block 11 client helper — invokes the `process-cv` edge function with raw CV text.
 *
 * Edge function returns a structured ParsedCv (mock for now) which is then
 * passed to MyProfile.handleCvParsed for form pre-fill. The data is never
 * persisted automatically — the user must explicitly save the profile.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProcessCvResult {
  success: true;
  parsed: unknown;
}

export async function invokeProcessCv(cvText: string): Promise<ProcessCvResult> {
  const trimmed = cvText.trim();
  if (!trimmed) throw new Error("CV text is empty");

  const { data, error } = await supabase.functions.invoke("process-cv", {
    body: { cvText: trimmed },
  });

  if (error) {
    console.error("[process-cv] invoke error:", error);
    throw new Error(error.message ?? "AI extraction failed");
  }
  if (!data || typeof data !== "object" || !("parsed" in data)) {
    throw new Error("Malformed response from process-cv");
  }
  return data as ProcessCvResult;
}
