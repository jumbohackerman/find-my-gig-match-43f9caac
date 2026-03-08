/**
 * Supabase implementation of ProfileRepository.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ProfileRepository } from "@/repositories/interfaces";
import type { UserProfile, UserRole } from "@/domain/models";

export const supabaseProfileRepository: ProfileRepository = {
  async getByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      role: data.role as UserRole,
      avatar: data.avatar,
    };
  },

  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const dbData: Record<string, unknown> = {};
    if (data.fullName !== undefined) dbData.full_name = data.fullName;
    if (data.avatar !== undefined) dbData.avatar = data.avatar;

    const { error } = await supabase
      .from("profiles")
      .update(dbData)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update profile: ${error.message}`);

    const result = await this.getByUserId(userId);
    if (!result) throw new Error("Profile not found after update");
    return result;
  },
};
