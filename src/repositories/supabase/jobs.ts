/**
 * Supabase implementation of JobRepository.
 *
 * READY TO USE — swap into provider registry when migrating from mock.
 * Currently not wired in; mock is still active.
 */

import { supabase } from "@/integrations/supabase/client";
import type { JobRepository, JobFilters } from "@/repositories/interfaces";
import type { Job, JobType, JobStatus } from "@/domain/models";

interface DbJob {
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
  created_at: string;
}

function toDomain(row: DbJob): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    logo: row.logo,
    salary: row.salary,
    tags: row.tags,
    type: row.type as JobType,
    description: row.description,
    posted: row.created_at,
    status: row.status as JobStatus,
    employerId: row.employer_id,
  };
}

export const supabaseJobRepository: JobRepository = {
  async list(filters?: JobFilters): Promise<Job[]> {
    let query = supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (filters?.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("[supabaseJobRepo] list error:", error);
      return [];
    }
    return (data as unknown as DbJob[]).map(toDomain);
  },

  async getById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return toDomain(data as unknown as DbJob);
  },

  async create(job: Omit<Job, "id" | "posted">): Promise<Job> {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: job.title,
        company: job.company,
        location: job.location,
        logo: job.logo,
        salary: job.salary,
        tags: job.tags,
        type: job.type,
        description: job.description,
        employer_id: job.employerId!,
        status: job.status || "active",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return toDomain(data as unknown as DbJob);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete job: ${error.message}`);
  },
};
