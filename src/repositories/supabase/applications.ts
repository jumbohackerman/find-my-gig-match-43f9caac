/**
 * Supabase implementation of ApplicationRepository.
 *
 * Handles:
 * - Candidate application listing with joined job data
 * - Employer enrichment (applications + candidates + profiles)
 * - Atomic apply via apply_to_job RPC
 * - Realtime subscriptions for both roles
 * - Status counting per job
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
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .or(
        `employer_id.eq.${employerId},employer_id.eq.00000000-0000-0000-0000-000000000000`,
      );

    if (!jobsData || jobsData.length === 0) return [];

    const domainJobs = jobsData.map(dbJobToDomain);
    const jobIds = jobsData.map((j: any) => j.id);

    const { data: appsData } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("applied_at", { ascending: false });

    if (!appsData || appsData.length === 0) return [];

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
    // Detect if the job ID is already a real UUID (from Supabase) vs a static numeric ID
    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.id);

    if (isRealUuid) {
      // Job already exists in DB — direct insert
      // Check for existing application first
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("candidate_id", candidateId)
        .eq("job_id", job.id)
        .maybeSingle();

      if (existing) {
        return {
          id: existing.id,
          jobId: job.id,
          candidateId,
          status: "applied",
          source: source as ApplicationSource,
          appliedAt: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from("applications")
        .insert({
          candidate_id: candidateId,
          job_id: job.id,
          source,
          status: "applied",
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to apply: ${error.message}`);

      return {
        id: data.id,
        jobId: data.job_id,
        candidateId: data.candidate_id,
        status: data.status as ApplicationStatus,
        source: data.source as ApplicationSource,
        appliedAt: data.applied_at,
      };
    }

    // Static/demo job — use RPC to upsert job row + create application atomically
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

  async updateStatus(applicationId, status, source): Promise<void> {
    // 1. Fetch current status to validate transition
    const { data: currentApp, error: fetchError } = await supabase
      .from("applications")
      .select("status")
      .eq("id", applicationId)
      .single();

    if (fetchError || !currentApp) {
      throw new Error(`Application not found: ${fetchError?.message}`);
    }

    const currentStatus = currentApp.status as ApplicationStatus;

    // 2. Validate transition
    const { validateTransition } = await import("@/domain/application-state-machine");
    validateTransition(currentStatus, status, "employer");

    // 3. Perform update
    const updateData: Record<string, unknown> = { status };
    if (source) updateData.source = source;

    const { error } = await supabase
      .from("applications")
      .update(updateData)
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

  async countByStatus(jobId: string): Promise<Record<ApplicationStatus, number>> {
    const { data, error } = await supabase
      .from("applications")
      .select("status")
      .eq("job_id", jobId);

    const counts = {} as Record<ApplicationStatus, number>;
    const statuses: ApplicationStatus[] = [
      "applied", "shortlisted", "viewed", "interview", "hired", "not_selected", "position_closed",
    ];
    statuses.forEach((s) => { counts[s] = 0; });

    if (!error && data) {
      data.forEach((row: any) => {
        const s = row.status as ApplicationStatus;
        if (counts[s] !== undefined) counts[s]++;
      });
    }

    return counts;
  },
};
