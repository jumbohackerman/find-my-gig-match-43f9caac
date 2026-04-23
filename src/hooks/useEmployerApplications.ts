/**
 * Employer-side hook for application status management.
 * Uses the provider registry — backend-agnostic.
 */

import { useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { ApplicationStatus, Candidate, EnrichedEmployerApplication } from "@/domain/models";
import { createFallbackCandidate } from "@/data/defaults";
import { getInitials } from "@/lib/candidateAnonymization";

export function useEmployerApplicationActions(refetch: () => void) {
  const advanceStatus = useCallback(
    async (appId: string, newStatus: ApplicationStatus) => {
      await getProvider("applications").updateStatus(appId, newStatus);
      refetch();
    },
    [refetch],
  );

  const viewCandidate = useCallback(
    (app: EnrichedEmployerApplication): { candidate: Candidate; shouldAdvance: boolean } => {
      const candidate = app.candidate || createFallbackCandidate(app.candidateId);
      const shouldAdvance = app.status === "applied";
      return { candidate, shouldAdvance };
    },
    [],
  );

  return { advanceStatus, viewCandidate };
}

// ── Display helpers (pure functions, no backend dependency) ──────────────────

const SHORTLISTED_STATUSES: ApplicationStatus[] = ["shortlisted", "interview", "hired"];

/**
 * Display name with hard anonymization before shortlist.
 * Pre-shortlist: initials only (e.g. "A.K.").
 * Post-shortlist: full name (or fallback to title/initials).
 *
 * NOTE: the candidate object passed to employer flows is already PII-stripped
 * server-side for non-shortlisted statuses (fullName=""). This helper is the
 * UI fallback so we never accidentally render an empty string.
 */
export function getCandidateDisplayName(app: EnrichedEmployerApplication): string {
  const c = app.candidate;
  const status = app.status as ApplicationStatus;
  const isShortlisted = SHORTLISTED_STATUSES.includes(status);

  if (!c) return "Kandydat";

  if (isShortlisted) {
    return c.fullName || c.title || "Kandydat";
  }

  // Pre-shortlist: never show full name — initials would themselves leak identity,
  // so we render a fully anonymous label.
  return "Kandydat";
}

/** Avatar placeholder — never identity-revealing in employer context. */
export function getCandidateAvatar(_app: EnrichedEmployerApplication): string {
  return "👤";
}
