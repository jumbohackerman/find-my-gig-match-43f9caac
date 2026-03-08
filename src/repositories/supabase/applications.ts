/**
 * Supabase implementation of ApplicationRepository.
 *
 * Handles:
 * - Candidate application listing with joined job data
 * - Employer enrichment (applications + candidates + profiles)
 * - Atomic apply via apply_to_job RPC
 * - Realtime subscriptions for both roles
 */

import { supabase } from "@/integrations/supabase/client";
import type { ApplicationRepository } from "@/repositories/interfaces";
import { dbCandidateToCandidate } from "@/domain/mappers";
import type {
  Application,
  ApplicationStatus,
  ApplicationSource,
  ApplicationWithJob,
  EnrichedEmployerApplication,
  Job,
  JobType,
  JobStatus,
} from "@/domain/models";

function dbJobToDomain(j: any): Job {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    logo: j.logo,
    salary: j.salary,
    tags: j.tags,
    type: j.type as JobType,
    description: j.description,
    posted: j.created_at || "",
    status: j.status as JobStatus,
    employerId: j.employer_id,
  };
}

export const supabaseApplicationRepository: ApplicationRepository = {
  async listForCandidate(candidateId: string): Promise<ApplicationWithJob[]> {
    const { data, error } = await supabase
      .from("applications")
      .select(
        "*, job:jobs(id, title, company, location, logo, salary, tags, type, description)",
      )
      .eq("candidate_id", candidateId)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("[supabaseAppRepo] listForCandidate error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      jobId: row.job_id,
      candidateId: row.candidate_id,
      status: row.status as ApplicationStatus,
      source: row.source as ApplicationSource,
      appliedAt: row.applied_at,
      job: row.job
        ? {
            id: row.job.id,
            title: row.job.title,
            company: row.job.company,
            location: row.job.location,
            logo: row.job.logo,
            salary: row.job.salary,
            tags: row.job.tags,
            type: row.job.type,
            description: row.job.description,
            posted: "",
          }
        : undefined,
    }));
  },

  async listForEmployer(employerId: string): Promise<EnrichedEmployerApplication[]> {
    // 1. Get employer's jobs + system-seeded jobs
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .or(
        `employer_id.eq.${employerId},employer_id.eq.00000000-0000-0000-0000-000000000000`,
      );

    if (!jobsData || jobsData.length === 0) return [];

    const domainJobs = jobsData.map(dbJobToDomain);
    const jobIds = jobsData.map((j: any) => j.id);

    // 2. Get applications for those jobs
    const { data: appsData } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("applied_at", { ascending: false });

    if (!appsData || appsData.length === 0) return [];

    // 3. Fetch candidate data for all unique candidate IDs
    const candidateIds = [...new Set(appsData.map((a: any) => a.candidate_id))];
    const candidateMap: Record<string, any> = {};
    const profileMap: Record<string, { full_name: string; avatar: string | null }> = {};

    if (candidateIds.length > 0) {
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .in("user_id", candidateIds);

      (candidatesData || []).forEach((c: any) => {
        candidateMap[c.user_id] = c;
      });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar")
        .in("user_id", candidateIds);

      (profilesData || []).forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name, avatar: p.avatar };
      });
    }

    // 4. Enrich applications with candidate + job data (matchResult computed by hook)
    return appsData.map((app: any) => {
      const dbCandidate = candidateMap[app.candidate_id];
      const job = domainJobs.find((j) => j.id === app.job_id);
      const candidate = dbCandidate
        ? dbCandidateToCandidate(dbCandidate, profileMap[app.candidate_id])
        : undefined;

      return {
        id: app.id,
        jobId: app.job_id,
        candidateId: app.candidate_id,
        status: app.status as ApplicationStatus,
        source: app.source as ApplicationSource,
        appliedAt: app.applied_at,
        candidate,
        job,
      };
    });
  },

  async apply(job: Job, candidateId: string, source = "candidate"): Promise<Application> {
    // Use the apply_to_job RPC for atomic job upsert + application creation
    const { data, error } = await supabase.rpc("apply_to_job", {
      _static_job_id: job.id,
      _job_title: job.title,
      _job_company: job.company,
      _job_location: job.location,
      _job_logo: job.logo,
      _job_salary: job.salary,
      _job_tags: job.tags,
      _job_type: job.type,
      _job_description: job.description,
    });

    if (error) throw new Error(`Failed to apply: ${error.message}`);

    return {
      id: data as string,
      jobId: job.id,
      candidateId,
      status: "applied",
      source: source as ApplicationSource,
      appliedAt: new Date().toISOString(),
    };
  },

  async updateStatus(applicationId, status): Promise<void> {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
  },

  subscribeForCandidate(candidateId: string, onPayload: (payload: any) => void): () => void {
    const channel = supabase
      .channel(`candidate-apps-${candidateId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `candidate_id=eq.${candidateId}`,
        },
        onPayload,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeForEmployer(_employerId: string, onChange: () => void): () => void {
    const channel = supabase
      .channel("employer-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        onChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
