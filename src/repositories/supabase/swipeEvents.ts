/**
 * Supabase implementation of SwipeEventRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { SwipeEventRepository, SwipeDirection } from "@/repositories/interfaces";

export const supabaseSwipeEventRepository: SwipeEventRepository = {
  async record(userId, jobId, direction) {
    const { error } = await supabase
      .from("swipe_events")
      .upsert(
        { user_id: userId, job_id: jobId, direction },
        { onConflict: "user_id,job_id" },
      );

    if (error) {
      console.error("[supabaseSwipeEventRepo] record error:", error);
      throw new Error(`Failed to record swipe: ${error.message}`);
    }
  },

  async listSwipedJobIds(userId) {
    const { data, error } = await supabase
      .from("swipe_events")
      .select("job_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[supabaseSwipeEventRepo] listSwipedJobIds error:", error);
      return [];
    }
    return (data ?? []).map((row: any) => row.job_id);
  },

  async clear(userId) {
    const { error } = await supabase
      .from("swipe_events")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("[supabaseSwipeEventRepo] clear error:", error);
      throw new Error(`Failed to clear swipe events: ${error.message}`);
    }
  },
};
