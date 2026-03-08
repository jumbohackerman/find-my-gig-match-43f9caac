/**
 * Lightweight feature / debug flags.
 *
 * Rules:
 * 1. All flags live here — no scattered `import.meta.env` checks.
 * 2. Flags default to a safe value (usually off for risky features).
 * 3. Override via VITE_ env vars OR by calling `setFlag()` at runtime (dev console / tests).
 * 4. Flags are READ at call-time so runtime overrides take effect immediately.
 */

function env(key: string): string | undefined {
  return (import.meta as any).env?.[key] as string | undefined;
}

// ── Flag definitions ─────────────────────────────────────────────────────────

export interface FeatureFlags {
  /** Show moderation / report UI */
  moderation: boolean;
  /** Enable in-app messaging (employer ↔ candidate) */
  messages: boolean;
  /** Render analytics placeholders (event logging, dashboards) */
  analyticsPlaceholders: boolean;
  /** Show staging helpers (reset buttons, seed tools, debug info) */
  stagingHelpers: boolean;
  /** Enable seed / demo data utilities */
  seedDemo: boolean;
  /** Show match-score breakdown details */
  matchBreakdown: boolean;
  /** Enable recently-viewed tracking */
  recentlyViewed: boolean;
}

const DEFAULTS: FeatureFlags = {
  moderation: true,
  messages: true,
  analyticsPlaceholders: false,
  stagingHelpers: false,
  seedDemo: false,
  matchBreakdown: true,
  recentlyViewed: true,
};

/** Map from flag key → VITE_ env var name (only for flags that can be env-configured) */
const ENV_MAP: Partial<Record<keyof FeatureFlags, string>> = {
  moderation: "VITE_FLAG_MODERATION",
  messages: "VITE_FLAG_MESSAGES",
  analyticsPlaceholders: "VITE_FLAG_ANALYTICS_PLACEHOLDERS",
  stagingHelpers: "VITE_FLAG_STAGING_HELPERS",
  seedDemo: "VITE_FLAG_SEED_DEMO",
  matchBreakdown: "VITE_FLAG_MATCH_BREAKDOWN",
  recentlyViewed: "VITE_FLAG_RECENTLY_VIEWED",
};

// ── Runtime overrides (for dev console / tests) ──────────────────────────────

const runtimeOverrides: Partial<FeatureFlags> = {};

/** Override a flag at runtime. Useful in dev console: `setFlag('seedDemo', true)` */
export function setFlag<K extends keyof FeatureFlags>(key: K, value: boolean): void {
  runtimeOverrides[key] = value;
}

/** Clear all runtime overrides */
export function resetFlags(): void {
  for (const k of Object.keys(runtimeOverrides) as (keyof FeatureFlags)[]) {
    delete runtimeOverrides[k];
  }
}

// ── Reader ───────────────────────────────────────────────────────────────────

function resolveBool(envVal: string | undefined, fallback: boolean): boolean {
  if (envVal === "true" || envVal === "1") return true;
  if (envVal === "false" || envVal === "0") return false;
  return fallback;
}

/** Read a single flag value. Priority: runtime override > env var > default. */
export function flag<K extends keyof FeatureFlags>(key: K): boolean {
  if (key in runtimeOverrides) return runtimeOverrides[key]!;
  const envKey = ENV_MAP[key];
  if (envKey) return resolveBool(env(envKey), DEFAULTS[key]);
  return DEFAULTS[key];
}

/** Snapshot of all current flag values (useful for debug panels). */
export function allFlags(): FeatureFlags {
  const result = {} as FeatureFlags;
  for (const k of Object.keys(DEFAULTS) as (keyof FeatureFlags)[]) {
    result[k] = flag(k);
  }
  return result;
}

// Expose to dev console
if (typeof window !== "undefined") {
  (window as any).__flags = { flag, setFlag, resetFlags, allFlags };
}
