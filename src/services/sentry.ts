/**
 * Sentry implementation of ErrorTrackingService.
 * Silently no-ops if Sentry was not initialized (no DSN configured).
 */
import * as Sentry from "@sentry/react";
import type { ErrorTrackingService } from "./interfaces";

const enabled = Boolean(import.meta.env.VITE_SENTRY_DSN);

export const sentryErrorTracking: ErrorTrackingService = {
  captureException(error, context) {
    if (!enabled) return;
    try { Sentry.captureException(error, context ? { extra: context } : undefined); }
    catch (e) { console.warn("[sentry] capture failed", e); }
  },
  setUser(user) {
    if (!enabled) return;
    try { Sentry.setUser(user); } catch (e) { console.warn("[sentry] setUser failed", e); }
  },
  addBreadcrumb(message, data) {
    if (!enabled) return;
    try { Sentry.addBreadcrumb({ message, data }); } catch (e) { console.warn("[sentry] breadcrumb failed", e); }
  },
};
