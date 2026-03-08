/**
 * Supabase implementation of PreferencesRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { PreferencesRepository } from "@/repositories/interfaces";

export const supabasePreferencesRepository: PreferencesRepository = {
  async get(userId, key) {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("value")
      .eq("user_id", userId)
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("[supabasePreferencesRepo] get error:", error);
      return null;
    }
    return data?.value ?? null;
  },

  async set(userId, key, value) {
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,key" },
      );

    if (error) {
      console.error("[supabasePreferencesRepo] set error:", error);
      throw new Error(`Failed to set preference: ${error.message}`);
    }
  },

  async delete(userId, key) {
    const { error } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", userId)
      .eq("key", key);

    if (error) {
      console.error("[supabasePreferencesRepo] delete error:", error);
      throw new Error(`Failed to delete preference: ${error.message}`);
    }
  },
};
