/**
 * Mock profile repository.
 */

import type { ProfileRepository } from "@/repositories/interfaces";
import type { UserProfile } from "@/domain/models";

const store: Record<string, UserProfile> = {};

export const mockProfileRepository: ProfileRepository = {
  async getByUserId(userId: string): Promise<UserProfile | null> {
    return store[userId] || null;
  },

  async update(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const existing = store[userId] || {
      id: userId,
      userId,
      fullName: "",
      role: "candidate" as const,
      avatar: null,
    };
    const updated = { ...existing, ...data };
    store[userId] = updated;
    return updated;
  },
};
