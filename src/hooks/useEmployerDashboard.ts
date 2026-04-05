/**
 * Employer dashboard data — fetches jobs, applications, and candidates
 * through the provider registry. NO direct Supabase imports.
 *
 * Match scoring is computed in this hook (business logic),
 * while data fetching + enrichment is handled by the repository.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import { calculateMatch } from "@/lib/matchScoring";
import { toScoringCandidate } from "@/domain/models";
import type {
  Job,
  EnrichedEmployerApplication,
} from "@/domain/models";

// Re-export for backward compat
export type EmployerApplication = EnrichedEmployerApplication;

export function useEmployerDashboardData() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<EnrichedEmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch employer's jobs through provider
    const employerJobs = await getProvider("jobs").listForEmployer(user.id);
    setJobs(employerJobs);

    if (employerJobs.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // Fetch enriched applications through provider
    const enrichedApps = await getProvider("applications").listForEmployer(user.id);

    // Compute match scores (business logic — stays in hook)
    const appsWithScores = enrichedApps.map((app) => {
      if (app.candidate && app.job) {
        return { ...app, matchResult: calculateMatch(app.candidate, app.job) };
      }
      return app;
    });

    setApplications(appsWithScores);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription through provider
  useEffect(() => {
    if (!user) return;
    const unsubscribe = getProvider("applications").subscribeForEmployer(
      user.id,
      () => fetchData(),
    );
    return unsubscribe;
  }, [user, fetchData]);

  // Group applications by job
  const applicationsByJob = useMemo(() => {
    const map: Record<string, EnrichedEmployerApplication[]> = {};
    applications.forEach((app) => {
      if (!map[app.jobId]) map[app.jobId] = [];
      map[app.jobId].push(app);
    });
    Object.values(map).forEach((apps) => {
      apps.sort((a, b) => (b.matchResult?.score || 0) - (a.matchResult?.score || 0));
    });
    return map;
  }, [applications]);

  return {
    jobs,
    applications,
    applicationsByJob,
    loading,
    refetch: fetchData,
  };
}
