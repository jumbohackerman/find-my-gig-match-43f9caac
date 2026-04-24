/**
 * PostHog implementation of AnalyticsService.
 * No-ops silently if VITE_POSTHOG_KEY is not configured.
 */
import posthog from "posthog-js";
import type { AnalyticsService } from "./interfaces";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
let initialized = false;

export function initPostHog() {
  if (initialized || !KEY || typeof window === "undefined") return;
  try {
    posthog.init(KEY, {
      api_host: "https://eu.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
    initialized = true;
  } catch (e) {
    console.warn("[posthog] init failed", e);
  }
}

export const posthogAnalytics: AnalyticsService = {
  track(event, properties) {
    if (!initialized) return;
    try { posthog.capture(event, properties); } catch (e) { console.warn("[posthog] track failed", e); }
  },
  identify(userId, traits) {
    if (!initialized) return;
    try { posthog.identify(userId, traits); } catch (e) { console.warn("[posthog] identify failed", e); }
  },
  page(name, properties) {
    if (!initialized) return;
    try { posthog.capture("$pageview", { $current_url: name, ...properties }); } catch (e) { console.warn("[posthog] page failed", e); }
  },
};
