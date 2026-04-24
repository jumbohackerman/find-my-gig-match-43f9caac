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
  ShortlistRepository,
  CandidateNotesRepository,
} from "@/repositories/interfaces";
import {
  publicJobListingRepository,
  type PublicJobListingRepository,
} from "@/repositories/supabase/publicJobListings";

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
import { supabaseNotificationRepository } from "@/repositories/supabase/notifications";
import { supabasePreferencesRepository } from "@/repositories/supabase/preferences";
import { supabaseShortlistRepository } from "@/repositories/supabase/shortlist";
import { candidateNotesRepository } from "@/repositories/supabase/candidateNotes";
import { supabaseStorageService } from "@/services/supabaseStorage";

// ── Import noop services (pending external integration) ──────────────────────
import {
  noopAnalytics,
  noopErrorTracking,
  noopEmail,
  noopAI,
} from "@/services/noop";
import { posthogAnalytics } from "@/services/posthog";
import { sentryErrorTracking } from "@/services/sentry";

const POSTHOG_ON = Boolean(import.meta.env.VITE_POSTHOG_KEY);
const SENTRY_ON = Boolean(import.meta.env.VITE_SENTRY_DSN);

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
  shortlist: ShortlistRepository;
  candidateNotes: CandidateNotesRepository;
  publicJobListings: PublicJobListingRepository;
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
  notifications: supabaseNotificationRepository,
  preferences: supabasePreferencesRepository,

  // Monetization & recruiter tools
  shortlist: supabaseShortlistRepository,
  candidateNotes: candidateNotesRepository,

  // Read-only public market research feed (employer panel)
  publicJobListings: publicJobListingRepository,

  // External services
  analytics: POSTHOG_ON ? posthogAnalytics : noopAnalytics,
  errorTracking: SENTRY_ON ? sentryErrorTracking : noopErrorTracking,
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
