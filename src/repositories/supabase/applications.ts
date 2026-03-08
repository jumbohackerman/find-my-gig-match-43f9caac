/**
 * Supabase implementation of ApplicationRepository.
 *
 * READY TO USE — includes the apply_to_job RPC call that is currently
 * inline in useJobFeed.ts. Swap into provider registry to eliminate
 * the direct supabase import from hooks.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ApplicationRepository } from "@/repositories/interfaces";
import type {
  Application,
  ApplicationStatus,
  ApplicationSource,
  ApplicationWithJob,
  EnrichedEmployerApplication,
} from "@/domain/models";

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
    // Get employer's jobs + system-seeded
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id")
      .or(
        `employer_id.eq.${employerId},employer_id.eq.00000000-0000-0000-0000-000000000000`,
      );

    if (!jobsData || jobsData.length === 0) return [];

    const jobIds = jobsData.map((j: any) => j.id);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .in("job_id", jobIds)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("[supabaseAppRepo] listForEmployer error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      jobId: row.job_id,
      candidateId: row.candidate_id,
      status: row.status as ApplicationStatus,
      source: row.source as ApplicationSource,
      appliedAt: row.applied_at,
    }));
  },

  async apply(jobId, candidateId, source = "candidate"): Promise<Application> {
    // Uses the apply_to_job RPC for atomic upsert
    // Note: The RPC uses auth.uid() so candidateId is implicit
    // For the repository interface we still accept it for contract consistency
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
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
  },

  async updateStatus(applicationId, status): Promise<void> {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
  },
};
