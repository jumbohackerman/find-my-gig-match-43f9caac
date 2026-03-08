/**
 * Integration boundary definitions.
 *
 * Each integration has:
 * - a status: which layer handles it (edge function, client SDK, noop)
 * - required secrets: what backend env vars it needs
 * - client config: what VITE_ vars the frontend reads
 *
 * This is the single reference for onboarding new integrations.
 */

export interface IntegrationDefinition {
  /** Human-readable name */
  name: string;
  /** Where the integration runs */
  layer: "client" | "edge-function" | "both";
  /** Current implementation status */
  status: "active" | "noop" | "planned";
  /** Provider registry key (if applicable) */
  providerKey?: string;
  /** Required backend secrets (Supabase vault / edge function env) */
  requiredSecrets: string[];
  /** Required VITE_ client env vars */
  clientEnvVars: string[];
  /** Notes on setup */
  notes?: string;
}

export const integrations: Record<string, IntegrationDefinition> = {
  supabase: {
    name: "Lovable Cloud (Supabase)",
    layer: "both",
    status: "active",
    requiredSecrets: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_URL"],
    clientEnvVars: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PROJECT_ID"],
    notes: "Auto-configured by Lovable Cloud. Never edit .env or client.ts manually.",
  },
  analytics: {
    name: "Analytics (PostHog / GA4)",
    layer: "client",
    status: "noop",
    providerKey: "analytics",
    requiredSecrets: [],
    clientEnvVars: ["VITE_ANALYTICS_ENABLED", "VITE_POSTHOG_KEY", "VITE_POSTHOG_HOST"],
    notes: "Enable by setting VITE_ANALYTICS_ENABLED=true and providing PostHog key.",
  },
  errorTracking: {
    name: "Error Tracking (Sentry)",
    layer: "client",
    status: "noop",
    providerKey: "errorTracking",
    requiredSecrets: [],
    clientEnvVars: ["VITE_ERROR_TRACKING_ENABLED", "VITE_SENTRY_DSN"],
    notes: "Enable by setting VITE_ERROR_TRACKING_ENABLED=true and providing Sentry DSN.",
  },
  email: {
    name: "Transactional Email (Resend)",
    layer: "edge-function",
    status: "noop",
    providerKey: "email",
    requiredSecrets: ["RESEND_API_KEY"],
    clientEnvVars: ["VITE_EMAIL_ENABLED", "VITE_EMAIL_FROM"],
    notes: "Runs in edge functions only. Client just toggles UI visibility.",
  },
  ai: {
    name: "AI Services (Lovable AI)",
    layer: "edge-function",
    status: "noop",
    providerKey: "ai",
    requiredSecrets: ["LOVABLE_API_KEY"],
    clientEnvVars: ["VITE_AI_ENABLED", "VITE_AI_DEFAULT_MODEL"],
    notes: "Uses Lovable AI supported models — no external API key needed. LOVABLE_API_KEY is auto-provisioned.",
  },
  storage: {
    name: "File Storage (Supabase Storage)",
    layer: "both",
    status: "active",
    providerKey: "storage",
    requiredSecrets: [],
    clientEnvVars: ["VITE_STORAGE_CV_BUCKET", "VITE_STORAGE_MAX_UPLOAD_SIZE"],
    notes: "Uses Supabase Storage via the client SDK. CV bucket is pre-created.",
  },
};
