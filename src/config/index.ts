/**
 * Centralized, typed configuration access.
 *
 * All environment variables are read here and exposed as typed accessors.
 * Page components and hooks MUST NOT access `import.meta.env` directly —
 * they use `config.*` instead.
 *
 * The only file allowed to read `import.meta.env` besides this one is
 * `src/integrations/supabase/client.ts` (auto-generated, read-only).
 */

// ─── Raw env reader (single place) ──────────────────────────────────────────

function env(key: string): string | undefined {
  return (import.meta as any).env?.[key] as string | undefined;
}

function requireEnv(key: string): string {
  const value = env(key);
  if (!value) {
    console.warn(`[config] Missing required env var: ${key}`);
  }
  return value ?? "";
}

// ─── Supabase ────────────────────────────────────────────────────────────────

export const supabase = {
  url: () => requireEnv("VITE_SUPABASE_URL"),
  anonKey: () => requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
  projectId: () => env("VITE_SUPABASE_PROJECT_ID") ?? "",
} as const;

// ─── Analytics (future: PostHog, GA4) ────────────────────────────────────────

export const analytics = {
  enabled: () => env("VITE_ANALYTICS_ENABLED") === "true",
  posthogKey: () => env("VITE_POSTHOG_KEY") ?? "",
  posthogHost: () => env("VITE_POSTHOG_HOST") ?? "https://app.posthog.com",
} as const;

// ─── Error Tracking (future: Sentry) ─────────────────────────────────────────

export const errorTracking = {
  enabled: () => env("VITE_ERROR_TRACKING_ENABLED") === "true",
  sentryDsn: () => env("VITE_SENTRY_DSN") ?? "",
  environment: () => env("VITE_APP_ENV") ?? "development",
} as const;

// ─── AI (Lovable AI models — no user key needed for supported models) ────────

export const ai = {
  /** Whether AI features are enabled in the UI */
  enabled: () => env("VITE_AI_ENABLED") !== "false", // enabled by default
  /** Default model for general AI tasks */
  defaultModel: () => env("VITE_AI_DEFAULT_MODEL") ?? "google/gemini-2.5-flash",
} as const;

// ─── Storage ─────────────────────────────────────────────────────────────────

export const storage = {
  /** CV bucket name */
  cvBucket: () => env("VITE_STORAGE_CV_BUCKET") ?? "cvs",
  /** Max upload size in bytes (default 10MB) */
  maxUploadSize: () => parseInt(env("VITE_STORAGE_MAX_UPLOAD_SIZE") ?? "10485760", 10),
} as const;

// ─── Email (backend-only, referenced here for documentation) ─────────────────

export const email = {
  /** Whether transactional emails are enabled */
  enabled: () => env("VITE_EMAIL_ENABLED") === "true",
  /** Sender address (set in edge function secrets, not VITE_) */
  fromAddress: () => env("VITE_EMAIL_FROM") ?? "noreply@findmygig.app",
} as const;

// ─── App-level ───────────────────────────────────────────────────────────────

export const app = {
  /** Current environment */
  environment: () => env("VITE_APP_ENV") ?? "development",
  /** Whether running in demo/mock mode */
  isDemoMode: () => env("VITE_DEMO_MODE") === "true",
  /** Base URL for the app */
  baseUrl: () => env("VITE_APP_BASE_URL") ?? "https://find-my-gig-match.lovable.app",
} as const;

// ─── Convenience: full config namespace ──────────────────────────────────────

const config = {
  supabase,
  analytics,
  errorTracking,
  ai,
  storage,
  email,
  app,
} as const;

export default config;
