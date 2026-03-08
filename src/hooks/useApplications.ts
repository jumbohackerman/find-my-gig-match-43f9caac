import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ApplicationStatus } from "@/types/application";

export interface ApplicationWithJob {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  source: string;
  applied_at: string;
  job?: {
    id: string;
    title: string;
    company: string;
    location: string;
    logo: string;
    salary: string;
    tags: string[];
    type: string;
    description: string;
  };
}

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
    const { data, error } = await supabase
      .from("applications")
      .select("*, job:jobs(id, title, company, location, logo, salary, tags, type, description)")
      .eq("candidate_id", user.id)
      .order("applied_at", { ascending: false });

    if (!error && data) {
      setApplications(data as unknown as ApplicationWithJob[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("candidate-applications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `candidate_id=eq.${user.id}`,
        },
        (payload) => {
          setApplications((prev) =>
            prev.map((a) =>
              a.id === payload.new.id ? { ...a, ...payload.new } : a
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { applications, loading, refetch: fetchApplications };
}

/** Employer-side: update application status */
export function useUpdateApplicationStatus() {
  const [updating, setUpdating] = useState(false);

  const updateStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    setUpdating(true);
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);
    setUpdating(false);
    return { error };
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

    // First get employer's job IDs
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id")
      .eq("employer_id", user.id);

    if (!jobsData || jobsData.length === 0) {
      // Also fetch applications for system-seeded jobs (employer_id = 00000000...)
      // since demo jobs use a placeholder employer_id
      const { data, error } = await supabase
        .from("applications")
        .select("*, job:jobs(id, title, company, location, logo, salary, tags, type, description)")
        .order("applied_at", { ascending: false });

      if (!error && data) {
        setApplications(data as unknown as ApplicationWithJob[]);
      }
      setLoading(false);
      return;
    }

    const jobIds = jobsData.map((j) => j.id);
    const { data, error } = await supabase
      .from("applications")
      .select("*, job:jobs(id, title, company, location, logo, salary, tags, type, description)")
      .in("job_id", jobIds)
      .order("applied_at", { ascending: false });

    if (!error && data) {
      setApplications(data as unknown as ApplicationWithJob[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Realtime subscription for status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("employer-applications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchApplications]);

  return { applications, loading, refetch: fetchApplications };
}

/** Employer-side: fetch applications for a specific job */
export function useJobApplications(jobId: string | null) {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });

    if (!error && data) {
      setApplications(data as unknown as ApplicationWithJob[]);
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, loading, refetch: fetchApplications };
}
