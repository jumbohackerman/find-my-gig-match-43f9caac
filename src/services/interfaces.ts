/**
 * External service interfaces — stubs for future integration.
 * Each service has a no-op/console implementation for dev mode
 * and will be swapped for the real provider later.
 */

// ─── Analytics (GA4 / PostHog) ───────────────────────────────────────────────

export interface AnalyticsService {
  /** Track a named event with optional properties */
  track(event: string, properties?: Record<string, unknown>): void;
  /** Identify a user for session tracking */
  identify(userId: string, traits?: Record<string, unknown>): void;
  /** Track a page view */
  page(name: string, properties?: Record<string, unknown>): void;
}

// ─── Error Tracking (Sentry) ─────────────────────────────────────────────────

export interface ErrorTrackingService {
  /** Capture an exception */
  captureException(error: unknown, context?: Record<string, unknown>): void;
  /** Set the current user context */
  setUser(user: { id: string; email?: string } | null): void;
  /** Add breadcrumb for debugging */
  addBreadcrumb(message: string, data?: Record<string, unknown>): void;
}

// ─── Email (Resend) ──────────────────────────────────────────────────────────

export interface EmailService {
  /** Send a transactional email — typically called from backend functions */
  send(params: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ success: boolean; error?: string }>;
}

// ─── AI Processing (CV parsing, matching) ────────────────────────────────────

export interface AIService {
  /** Parse a CV file and return structured candidate data */
  parseCV(fileUrl: string): Promise<ParsedCV>;
  /** Generate AI match explanation between candidate and job */
  explainMatch(candidateId: string, jobId: string): Promise<string>;
  /** Generate AI-powered shortlist for a job */
  generateShortlist(jobId: string, candidateIds: string[], limit: number): Promise<string[]>;
}

export interface ParsedCV {
  title: string;
  skills: string[];
  experience: string;
  summary: string;
  experienceEntries: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }[];
}

// ─── File Storage (Supabase Storage / Cloudflare R2) ─────────────────────────

export interface StorageService {
  upload(bucket: string, path: string, file: File): Promise<{ url: string; error?: string }>;
  getPublicUrl(bucket: string, path: string): string;
  delete(bucket: string, path: string): Promise<void>;
}
