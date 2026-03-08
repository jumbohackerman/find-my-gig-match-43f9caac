/**
 * Provider registry — single place to swap between mock and real implementations.
 *
 * Usage in any component/hook:
 *   import { getProvider } from "@/providers/registry";
 *   const jobs = getProvider("jobs");
 *   const analytics = getProvider("analytics");
 *
 * To switch to Supabase later, just change the registrations here.
 */

import type {
  JobRepository,
  CandidateRepository,
  ApplicationRepository,
  MessageRepository,
  ProfileRepository,
} from "@/repositories/interfaces";

import type {
  AnalyticsService,
  ErrorTrackingService,
  EmailService,
  AIService,
  StorageService,
} from "@/services/interfaces";

// ── Import mock implementations ──────────────────────────────────────────────
import { mockJobRepository } from "@/repositories/mock/jobs";
import { mockCandidateRepository } from "@/repositories/mock/candidates";
import { mockApplicationRepository } from "@/repositories/mock/applications";
import { mockMessageRepository } from "@/repositories/mock/messages";
import { mockProfileRepository } from "@/repositories/mock/profiles";
import {
  noopAnalytics,
  noopErrorTracking,
  noopEmail,
  noopAI,
  noopStorage,
} from "@/services/noop";

// ── Provider map ─────────────────────────────────────────────────────────────

interface ProviderMap {
  jobs: JobRepository;
  candidates: CandidateRepository;
  applications: ApplicationRepository;
  messages: MessageRepository;
  profiles: ProfileRepository;
  analytics: AnalyticsService;
  errorTracking: ErrorTrackingService;
  email: EmailService;
  ai: AIService;
  storage: StorageService;
}

const providers: ProviderMap = {
  // Data repositories — currently mock, swap to Supabase repos later
  jobs: mockJobRepository,
  candidates: mockCandidateRepository,
  applications: mockApplicationRepository,
  messages: mockMessageRepository,
  profiles: mockProfileRepository,

  // External services — currently no-op, swap to real providers later
  analytics: noopAnalytics,
  errorTracking: noopErrorTracking,
  email: noopEmail,
  ai: noopAI,
  storage: noopStorage,
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
