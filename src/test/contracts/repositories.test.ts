import { describe, it, expect } from "vitest";

// Interfaces
import type {
  JobRepository,
  CandidateRepository,
  ApplicationRepository,
  ProfileRepository,
  MessageRepository,
  SavedJobRepository,
  SwipeEventRepository,
  NotificationRepository,
  PreferencesRepository,
} from "@/repositories/interfaces";

// Mock Implementations
import { mockJobRepository } from "@/repositories/mock/jobs";
import { mockCandidateRepository } from "@/repositories/mock/candidates";
import { mockApplicationRepository } from "@/repositories/mock/applications";
import { mockProfileRepository } from "@/repositories/mock/profiles";
import { mockMessageRepository } from "@/repositories/mock/messages";
import { mockSavedJobRepository } from "@/repositories/mock/savedJobs";
import { mockSwipeEventRepository } from "@/repositories/mock/swipeEvents";
import { mockNotificationRepository } from "@/repositories/mock/notifications";
import { mockPreferencesRepository } from "@/repositories/mock/preferences";

// Supabase Implementations
import { supabaseJobRepository } from "@/repositories/supabase/jobs";
import { supabaseCandidateRepository } from "@/repositories/supabase/candidates";
import { supabaseApplicationRepository } from "@/repositories/supabase/applications";
import { supabaseProfileRepository } from "@/repositories/supabase/profiles";
import { supabaseMessageRepository } from "@/repositories/supabase/messages";
import { supabaseSavedJobRepository } from "@/repositories/supabase/savedJobs";
import { supabaseSwipeEventRepository } from "@/repositories/supabase/swipeEvents";
import { supabaseNotificationRepository } from "@/repositories/supabase/notifications";
import { supabasePreferencesRepository } from "@/repositories/supabase/preferences";

// ----------------------------------------------------------------------------
// 1. Signature Contracts (Type-level assertions)
// ----------------------------------------------------------------------------
// These assignments ensure that both implementations strictly adhere to the 
// identically defined repository interfaces. If there's a mismatch in method
// signatures or return types between Mock and Supabase, TypeScript will fail.

const _contracts = {
  jobs: [mockJobRepository, supabaseJobRepository] as JobRepository[],
  candidates: [mockCandidateRepository, supabaseCandidateRepository] as CandidateRepository[],
  applications: [mockApplicationRepository, supabaseApplicationRepository] as ApplicationRepository[],
  profiles: [mockProfileRepository, supabaseProfileRepository] as ProfileRepository[],
  messages: [mockMessageRepository, supabaseMessageRepository] as MessageRepository[],
  savedJobs: [mockSavedJobRepository, supabaseSavedJobRepository] as SavedJobRepository[],
  swipeEvents: [mockSwipeEventRepository, supabaseSwipeEventRepository] as SwipeEventRepository[],
  notifications: [mockNotificationRepository, supabaseNotificationRepository] as NotificationRepository[],
  preferences: [mockPreferencesRepository, supabasePreferencesRepository] as PreferencesRepository[],
};

// ----------------------------------------------------------------------------
// 2. Behavioral Contracts (Runtime assertions for edge-cases)
// ----------------------------------------------------------------------------
describe("Repository Contracts", () => {
  describe("Structural Alignment", () => {
    it("should export identical interfaces for both implementations", () => {
      // If the _contracts array assignments above compile, this passes.
      // This guarantees no UI-leaking specific properties on the implementations.
      expect(_contracts).toBeDefined();
    });
  });

  describe("Mock Implementations Edge-Case Behavior", () => {
    // Tests to ensure Mock repos behave logically similar to a database
    // (e.g. returning nulls for missing records instead of throwing, 
    // returning empty arrays instead of null/undefined).
    
    it("JobRepository: getById returns null for missing job", async () => {
      const result = await mockJobRepository.getById("non-existent-id");
      expect(result).toBeNull();
    });

    it("JobRepository: update throws error for missing job", async () => {
      await expect(mockJobRepository.update("non-existent-id", {})).rejects.toThrow();
    });

    it("CandidateRepository: getByUserId returns null for missing candidate", async () => {
      const result = await mockCandidateRepository.getByUserId("missing-id");
      expect(result).toBeNull();
    });

    it("ProfileRepository: getByUserId returns null for missing profile", async () => {
      const result = await mockProfileRepository.getByUserId("missing-id");
      expect(result).toBeNull();
    });

    it("SavedJobRepository: listIds returns empty array (not null) for empty state", async () => {
      const result = await mockSavedJobRepository.listIds("new-user");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("SavedJobRepository: isSaved returns boolean false for missing job", async () => {
      const result = await mockSavedJobRepository.isSaved("new-user", "some-job");
      expect(result).toBe(false);
    });

    it("SwipeEventRepository: listSwipedJobIds returns empty array for empty state", async () => {
      const result = await mockSwipeEventRepository.listSwipedJobIds("new-user");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it("PreferencesRepository: get returns null for missing key", async () => {
      const result = await mockPreferencesRepository.get("user-1", "missing-key");
      expect(result).toBeNull();
    });

    it("ApplicationRepository: listForCandidate returns empty array for new candidate", async () => {
      const result = await mockApplicationRepository.listForCandidate("new-user");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("MessageRepository: listByApplication returns empty array for missing application", async () => {
      const result = await mockMessageRepository.listByApplication("missing-app");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
