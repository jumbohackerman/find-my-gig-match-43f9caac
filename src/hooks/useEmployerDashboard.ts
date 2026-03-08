/**
 * Employer dashboard data — fetches jobs, applications, and candidates.
 * Uses provider registry for backend-agnostic data access.
 * Falls back to direct Supabase when needed (enrichment) — will be migrated
 * to repository layer once listForEmployer returns enriched data natively.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  calculateMatch,
  dbCandidateToCandidate,
  type MatchResult,
} from "@/lib/matchScoring";
import type {
  Candidate,
  Job,
  EnrichedEmployerApplication,
  ApplicationStatus,
  ApplicationSource,
} from "@/domain/models";

// Re-export for backward compat during migration
export type EmployerApplication = EnrichedEmployerApplication;

export interface DbCandidate {
  id: string;
  user_id: string;
  title: string;
  skills: string[];
  seniority: string;
  salary_min: number;
  salary_max: number;
  work_mode: string;
  location: string;
  experience: string;
  bio: string;
  summary: string;
  availability: string;
  employment_type: string;
  last_active: string;
  links: Record<string, string>;
  experience_entries: unknown[];
  cv_url: string | null;
}

export interface DbJob {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
  salary: string;
  tags: string[];
  type: string;
  description: string;
  employer_id: string;
  status: string;
}

function dbJobToDomain(j: DbJob): Job {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    logo: j.logo,
    salary: j.salary,
    tags: j.tags,
    type: j.type as Job["type"],
    description: j.description,
    posted: "",
    status: j.status as Job["status"],
    employerId: j.employer_id,
  };
}

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

    // Fetch employer's jobs + system-seeded jobs
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .or(`employer_id.eq.${user.id},employer_id.eq.00000000-0000-0000-0000-000000000000`);

    const dbJobs = (jobsData || []) as unknown as DbJob[];
    const domainJobs = dbJobs.map(dbJobToDomain);
    setJobs(domainJobs);

    if (dbJobs.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // Fetch applications for these jobs
    const jobIds = dbJobs.map((j) => j.id);
    const { data: appsData } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("applied_at", { ascending: false });

    const rawApps = (appsData || []) as unknown as {
      id: string;
      job_id: string;
      candidate_id: string;
      status: string;
      source: string;
      applied_at: string;
    }[];

    // Fetch candidate profiles for all unique candidate_ids
    const candidateIds = [...new Set(rawApps.map((a) => a.candidate_id))];
    if (candidateIds.length > 0) {
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .in("user_id", candidateIds);

      const candidateMap: Record<string, DbCandidate> = {};
      (candidatesData || []).forEach((c: any) => {
        candidateMap[c.user_id] = c as DbCandidate;
      });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar")
        .in("user_id", candidateIds);

      const profileMap: Record<string, { full_name: string; avatar: string | null }> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name, avatar: p.avatar };
      });

      // Enrich applications with domain Candidate, Job, and match scores
      const enrichedApps: EnrichedEmployerApplication[] = rawApps.map((app) => {
        const dbCandidate = candidateMap[app.candidate_id];
        const job = domainJobs.find((j) => j.id === app.job_id);
        let matchResult: MatchResult | undefined;
        let candidate: Candidate | undefined;

        if (dbCandidate) {
          candidate = dbCandidateToCandidate(dbCandidate, profileMap[app.candidate_id]);
          if (job) {
            matchResult = calculateMatch(candidate, job);
          }
        }

        return {
          id: app.id,
          jobId: app.job_id,
          candidateId: app.candidate_id,
          status: app.status as ApplicationStatus,
          source: app.source as ApplicationSource,
          appliedAt: app.applied_at,
          candidate,
          job,
          matchResult,
        };
      });

      setApplications(enrichedApps);
    } else {
      setApplications(
        rawApps.map((app) => ({
          id: app.id,
          jobId: app.job_id,
          candidateId: app.candidate_id,
          status: app.status as ApplicationStatus,
          source: app.source as ApplicationSource,
          appliedAt: app.applied_at,
        })),
      );
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("employer-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
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
