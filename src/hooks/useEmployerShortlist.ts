/**
 * Employer-side hook for shortlist management.
 * Encapsulates shortlist business rules (max 5, AI generation, replace logic).
 * Uses repository layer for persistence.
 */

import { useState, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import type { ApplicationSource, EnrichedEmployerApplication } from "@/domain/models";
import { toast } from "sonner";

export const MAX_SHORTLIST = 5;

export interface ReplaceTarget {
  jobId: string;
  appId: string;
  source: ApplicationSource;
}

export function useEmployerShortlist(refetch: () => void) {
  const [replacingFor, setReplacingFor] = useState<ReplaceTarget | null>(null);

  const getShortlisted = useCallback(
    (apps: EnrichedEmployerApplication[]) =>
      apps.filter((a) => a.status === "shortlisted"),
    [],
  );

  const shortlistCandidate = useCallback(
    async (
      appId: string,
      source: ApplicationSource,
      allApps: EnrichedEmployerApplication[],
      jobId: string,
    ) => {
      const shortlisted = allApps.filter((a) => a.status === "shortlisted");
      if (shortlisted.length >= MAX_SHORTLIST) {
        setReplacingFor({ jobId, appId, source });
        return;
      }
      await getProvider("applications").updateStatus(appId, "shortlisted", source);
      toast.success(source === "ai" ? "Dodano do shortlisty (AI)" : "Dodano do shortlisty");
      refetch();
    },
    [refetch],
  );

  const replaceShortlisted = useCallback(
    async (removeAppId: string) => {
      if (!replacingFor) return;
      await getProvider("applications").updateStatus(removeAppId, "applied", "candidate");
      await getProvider("applications").updateStatus(replacingFor.appId, "shortlisted", replacingFor.source);
      toast.success("Zamieniono kandydata na shortliście");
      setReplacingFor(null);
      refetch();
    },
    [replacingFor, refetch],
  );

  const generateShortlist = useCallback(
    async (jobId: string, jobApps: EnrichedEmployerApplication[]) => {
      const shortlisted = jobApps.filter((a) => a.status === "shortlisted");
      const slotsAvailable = MAX_SHORTLIST - shortlisted.length;
      if (slotsAvailable <= 0) {
        toast.error("Shortlista pełna (5/5). Zamień kandydata ręcznie.");
        return;
      }

      const toShortlist = jobApps
        .filter((a) => a.status !== "shortlisted" && a.matchResult)
        .sort((a, b) => (b.matchResult?.score || 0) - (a.matchResult?.score || 0))
        .slice(0, slotsAvailable);

      if (toShortlist.length === 0) {
        toast.info("Brak nowych kandydatów do dodania");
        return;
      }

      for (const app of toShortlist) {
        await getProvider("applications").updateStatus(app.id, "shortlisted", "ai");
      }
      toast.success(`AI dodał ${toShortlist.length} kandydatów do shortlisty`);
      refetch();
    },
    [refetch],
  );

  return {
    replacingFor,
    setReplacingFor,
    getShortlisted,
    shortlistCandidate,
    replaceShortlisted,
    generateShortlist,
    MAX_SHORTLIST,
  };
}
