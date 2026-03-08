/**
 * No-op / console-log implementations of all service interfaces.
 * Used in development. Swap for real implementations via provider registry.
 */

import type {
  AnalyticsService,
  ErrorTrackingService,
  EmailService,
  AIService,
  StorageService,
  ParsedCV,
} from "./interfaces";

// ─── Analytics ───────────────────────────────────────────────────────────────

export const noopAnalytics: AnalyticsService = {
  track(event, properties) {
    console.debug("[analytics:noop] track", event, properties);
  },
  identify(userId, traits) {
    console.debug("[analytics:noop] identify", userId, traits);
  },
  page(name, properties) {
    console.debug("[analytics:noop] page", name, properties);
  },
};

// ─── Error Tracking ──────────────────────────────────────────────────────────

export const noopErrorTracking: ErrorTrackingService = {
  captureException(error, context) {
    console.error("[errorTracking:noop]", error, context);
  },
  setUser(user) {
    console.debug("[errorTracking:noop] setUser", user);
  },
  addBreadcrumb(message, data) {
    console.debug("[errorTracking:noop] breadcrumb", message, data);
  },
};

// ─── Email ───────────────────────────────────────────────────────────────────

export const noopEmail: EmailService = {
  async send(params) {
    console.debug("[email:noop] send", params);
    return { success: true };
  },
};

// ─── AI ──────────────────────────────────────────────────────────────────────

export const noopAI: AIService = {
  async parseCV(fileUrl): Promise<ParsedCV> {
    console.debug("[ai:noop] parseCV", fileUrl);
    return { title: "", skills: [], experience: "", summary: "", experienceEntries: [] };
  },
  async explainMatch(candidateId, jobId) {
    console.debug("[ai:noop] explainMatch", candidateId, jobId);
    return "Match explanation not available in demo mode.";
  },
  async generateShortlist(jobId, candidateIds, limit) {
    console.debug("[ai:noop] generateShortlist", jobId, limit);
    return candidateIds.slice(0, limit);
  },
};

// ─── Storage ─────────────────────────────────────────────────────────────────

export const noopStorage: StorageService = {
  async upload(bucket, path, file) {
    console.debug("[storage:noop] upload", bucket, path, file.name);
    return { url: `mock://${bucket}/${path}` };
  },
  getPublicUrl(bucket, path) {
    return `mock://${bucket}/${path}`;
  },
  async delete(bucket, path) {
    console.debug("[storage:noop] delete", bucket, path);
  },
};
