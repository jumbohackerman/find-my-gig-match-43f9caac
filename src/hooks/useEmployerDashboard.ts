import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculateMatch, dbCandidateToProfile, type MatchResult, type CandidateProfile } from "@/lib/matchScoring";
import type { ApplicationStatus } from "@/types/application";

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

export interface EmployerApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  source: string;
  applied_at: string;
  candidate?: DbCandidate;
  job?: DbJob;
  matchResult?: MatchResult;
  candidateProfile?: CandidateProfile;
}

export function useEmployerDashboardData() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [candidates, setCandidates] = useState<Record<string, DbCandidate>>({});
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
    setJobs(dbJobs);

    if (dbJobs.length === 0) {
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

    const dbApps = (appsData || []) as unknown as EmployerApplication[];

    // Fetch candidate profiles for all unique candidate_ids
    const candidateIds = [...new Set(dbApps.map((a) => a.candidate_id))];
    if (candidateIds.length > 0) {
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .in("user_id", candidateIds);

      const candidateMap: Record<string, DbCandidate> = {};
      (candidatesData || []).forEach((c: any) => {
        candidateMap[c.user_id] = c as DbCandidate;
      });
      setCandidates(candidateMap);

      // Also fetch profile names
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar")
        .in("user_id", candidateIds);

      const profileMap: Record<string, { full_name: string; avatar: string | null }> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name, avatar: p.avatar };
      });

      // Enrich applications with candidate data, job data, and match scores
      const enrichedApps = dbApps.map((app) => {
        const candidate = candidateMap[app.candidate_id];
        const job = dbJobs.find((j) => j.id === app.job_id);
        let matchResult: MatchResult | undefined;
        let candidateProfile: CandidateProfile | undefined;

        if (candidate && job) {
          candidateProfile = dbCandidateToProfile(candidate);
          matchResult = calculateMatch(candidateProfile, { ...job, type: job.type as any });
        }

        // Attach profile name to candidate
        if (candidate && profileMap[app.candidate_id]) {
          (candidate as any).full_name = profileMap[app.candidate_id].full_name;
          (candidate as any).avatar = profileMap[app.candidate_id].avatar;
        }

        return {
          ...app,
          candidate,
          job,
          matchResult,
          candidateProfile,
        };
      });

      setApplications(enrichedApps);
    } else {
      setApplications(dbApps);
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
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  // Group applications by job
  const applicationsByJob = useMemo(() => {
    const map: Record<string, EmployerApplication[]> = {};
    applications.forEach((app) => {
      if (!map[app.job_id]) map[app.job_id] = [];
      map[app.job_id].push(app);
    });
    // Sort each job's applications by match score descending
    Object.values(map).forEach((apps) => {
      apps.sort((a, b) => (b.matchResult?.score || 0) - (a.matchResult?.score || 0));
    });
    return map;
  }, [applications]);

  return {
    jobs,
    applications,
    applicationsByJob,
    candidates,
    loading,
    refetch: fetchData,
  };
}
