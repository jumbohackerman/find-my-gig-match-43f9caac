/**
 * Application hooks — candidate-side and employer-side.
 * All data access goes through the provider registry.
 * NO direct Supabase imports.
 */

import { useEffect, useState, useCallback } from "react";
import { getProvider } from "@/providers/registry";
import { useAuth } from "@/hooks/useAuth";
import type { ApplicationStatus } from "@/types/application";
import type { ApplicationWithJob } from "@/domain/models";

// Re-export the domain type so existing imports still work
export type { ApplicationWithJob } from "@/domain/models";

/** Candidate-side: fetch own applications with job info */
export function useCandidateApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }
    const data = await getProvider("applications").listForCandidate(user.id);
    setApplications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Subscribe to realtime changes through provider
  useEffect(() => {
    if (!user) return;
    const unsubscribe = getProvider("applications").subscribeForCandidate(
      user.id,
      (payload) => {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === payload.new?.id ? { ...a, ...payload.new } : a,
          ),
        );
      },
    );
    return unsubscribe;
  }, [user]);

  return { applications, loading, refetch: fetchApplications };
}

/** Employer-side: update application status */
export function useUpdateApplicationStatus() {
  const [updating, setUpdating] = useState(false);

  const updateStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    setUpdating(true);
    try {
      await getProvider("applications").updateStatus(applicationId, status);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setUpdating(false);
    }
  }, []);

  return { updateStatus, updating };
}

/** Employer-side: fetch all applications for employer's jobs with realtime */
export function useEmployerApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }
    const data = await getProvider("applications").listForEmployer(user.id);
    // Cast enriched to ApplicationWithJob (compatible superset)
    setApplications(data as unknown as ApplicationWithJob[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getProvider("applications").subscribeForEmployer(
      user.id,
      () => fetchApplications(),
    );
    return unsubscribe;
  }, [user, fetchApplications]);

  return { applications, loading, refetch: fetchApplications };
}

/** Employer-side: fetch applications for a specific job */
export function useJobApplications(jobId: string | null) {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchApplications = useCallback(async () => {
    if (!jobId || !user) return;
    setLoading(true);
    const allApps = await getProvider("applications").listForEmployer(user.id);
    const filtered = allApps.filter((a) => a.jobId === jobId);
    setApplications(filtered as unknown as ApplicationWithJob[]);
    setLoading(false);
  }, [jobId, user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, loading, refetch: fetchApplications };
}
