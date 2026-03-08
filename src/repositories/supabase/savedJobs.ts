/**
 * Supabase implementation of SavedJobRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { SavedJobRepository } from "@/repositories/interfaces";

export const supabaseSavedJobRepository: SavedJobRepository = {
  async listIds(userId) {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[supabaseSavedJobRepo] listIds error:", error);
      return [];
    }
    return (data ?? []).map((row: any) => row.job_id);
  },

  async save(userId, jobId) {
    const { error } = await supabase
      .from("saved_jobs")
      .upsert({ user_id: userId, job_id: jobId }, { onConflict: "user_id,job_id" });

    if (error) {
      console.error("[supabaseSavedJobRepo] save error:", error);
      throw new Error(`Failed to save job: ${error.message}`);
    }
  },

  async remove(userId, jobId) {
    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", jobId);

    if (error) {
      console.error("[supabaseSavedJobRepo] remove error:", error);
      throw new Error(`Failed to remove saved job: ${error.message}`);
    }
  },

  async isSaved(userId, jobId) {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .maybeSingle();

    if (error) {
      console.error("[supabaseSavedJobRepo] isSaved error:", error);
      return false;
    }
    return data !== null;
  },
};
