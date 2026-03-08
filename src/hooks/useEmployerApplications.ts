/**
 * Employer-side hook for application status management.
 * Uses the provider registry — backend-agnostic.
 */

import { useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { ApplicationStatus, Candidate, EnrichedEmployerApplication } from "@/domain/models";
import { createFallbackCandidate } from "@/data/defaults";
import { dbCandidateToCandidate } from "@/lib/matchScoring";

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

export function getCandidateDisplayName(app: EnrichedEmployerApplication): string {
  const c = app.candidate;
  if (!c) return "Kandydat";
  return c.name || c.title || "Kandydat";
}

export function getCandidateAvatar(app: EnrichedEmployerApplication): string {
  const c = app.candidate;
  if (!c) return "👤";
  return c.avatar || "👤";
}
