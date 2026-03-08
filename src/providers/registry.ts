/**
 * Provider registry — single place to swap between mock and real implementations.
 */

import type {
  JobRepository,
  CandidateRepository,
  ApplicationRepository,
  MessageRepository,
  NotificationRepository,
  ProfileRepository,
  PreferencesRepository,
  SavedJobRepository,
  SwipeEventRepository,
} from "@/repositories/interfaces";

import type {
  AnalyticsService,
  ErrorTrackingService,
  EmailService,
  AIService,
  StorageService,
} from "@/services/interfaces";

// ── Import Supabase implementations ──────────────────────────────────────────
import { supabaseJobRepository } from "@/repositories/supabase/jobs";
import { supabaseCandidateRepository } from "@/repositories/supabase/candidates";
import { supabaseApplicationRepository } from "@/repositories/supabase/applications";
import { supabaseProfileRepository } from "@/repositories/supabase/profiles";
import { supabaseMessageRepository } from "@/repositories/supabase/messages";
import { supabaseSavedJobRepository } from "@/repositories/supabase/savedJobs";
import { supabaseSwipeEventRepository } from "@/repositories/supabase/swipeEvents";
import { supabaseStorageService } from "@/services/supabaseStorage";

// ── Import mock implementations (for providers not yet migrated) ─────────────
import { mockNotificationRepository } from "@/repositories/mock/notifications";
import { mockPreferencesRepository } from "@/repositories/mock/preferences";
import {
  noopAnalytics,
  noopErrorTracking,
  noopEmail,
  noopAI,
} from "@/services/noop";

// ── Provider map ─────────────────────────────────────────────────────────────

interface ProviderMap {
  jobs: JobRepository;
  candidates: CandidateRepository;
  applications: ApplicationRepository;
  messages: MessageRepository;
  notifications: NotificationRepository;
  profiles: ProfileRepository;
  preferences: PreferencesRepository;
  savedJobs: SavedJobRepository;
  swipeEvents: SwipeEventRepository;
  analytics: AnalyticsService;
  errorTracking: ErrorTrackingService;
  email: EmailService;
  ai: AIService;
  storage: StorageService;
}

const providers: ProviderMap = {
  // Data repositories — Supabase for core flows
  jobs: supabaseJobRepository,
  candidates: supabaseCandidateRepository,
  applications: supabaseApplicationRepository,
  profiles: supabaseProfileRepository,
  messages: supabaseMessageRepository,
  storage: supabaseStorageService,

  // Data repositories — Supabase (migrated)
  savedJobs: supabaseSavedJobRepository,
  swipeEvents: supabaseSwipeEventRepository,

  // Data repositories — still mock (no DB tables yet)
  notifications: mockNotificationRepository,
  preferences: mockPreferencesRepository,

  // External services
  analytics: noopAnalytics,
  errorTracking: noopErrorTracking,
  email: noopEmail,
  ai: noopAI,
};

/** Type-safe provider accessor */
export function getProvider<K extends keyof ProviderMap>(key: K): ProviderMap[K] {
  return providers[key];
}

/** Register a provider — use in app init to swap implementations */
export function registerProvider<K extends keyof ProviderMap>(
  key: K,
  implementation: ProviderMap[K],
): void {
  providers[key] = implementation;
}
