/**
 * Supabase implementation of JobRepository.
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
  // Structured fields
  summary: string;
  about_role: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string;
  recruitment_steps: string[];
  offer_highlights: string[];
  team_size: string;
  seniority: string;
  contract_type: string;
  work_mode: string;
  experience_level: string;
  apply_url: string;
  salary_from: number;
  salary_to: number;
  salary_currency: string;
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
    // Structured fields
    summary: row.summary || "",
    aboutRole: row.about_role || "",
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    niceToHave: row.nice_to_have || [],
    benefits: row.benefits || [],
    aboutCompany: row.about_company || "",
    recruitmentSteps: row.recruitment_steps || [],
    highlights: row.offer_highlights || [],
    teamSize: row.team_size || "",
    seniority: row.seniority || "",
    contractType: row.contract_type || "",
    workMode: row.work_mode || "",
    experienceLevel: row.experience_level || "",
    applyUrl: row.apply_url || "",
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

  async listForEmployer(employerId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .or(
        `employer_id.eq.${employerId},employer_id.eq.00000000-0000-0000-0000-000000000000`,
      );

    if (error) {
      console.error("[supabaseJobRepo] listForEmployer error:", error);
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
        summary: job.summary || "",
        about_role: job.aboutRole || "",
        responsibilities: job.responsibilities || [],
        requirements: job.requirements || [],
        nice_to_have: job.niceToHave || [],
        benefits: job.benefits || [],
        about_company: job.aboutCompany || "",
        recruitment_steps: job.recruitmentSteps || [],
        offer_highlights: job.highlights || [],
        team_size: job.teamSize || "",
        seniority: job.seniority || "",
        contract_type: job.contractType || "",
        work_mode: job.workMode || "",
        experience_level: job.experienceLevel || "",
        apply_url: job.applyUrl || "",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return toDomain(data as unknown as DbJob);
  },

  async update(id: string, data: Partial<Omit<Job, "id" | "posted">>): Promise<Job> {
    const dbData: Record<string, unknown> = {};
    if (data.title !== undefined) dbData.title = data.title;
    if (data.company !== undefined) dbData.company = data.company;
    if (data.location !== undefined) dbData.location = data.location;
    if (data.logo !== undefined) dbData.logo = data.logo;
    if (data.salary !== undefined) dbData.salary = data.salary;
    if (data.tags !== undefined) dbData.tags = data.tags;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.description !== undefined) dbData.description = data.description;
    if (data.status !== undefined) dbData.status = data.status;
    // Structured fields
    if (data.summary !== undefined) dbData.summary = data.summary;
    if (data.aboutRole !== undefined) dbData.about_role = data.aboutRole;
    if (data.responsibilities !== undefined) dbData.responsibilities = data.responsibilities;
    if (data.requirements !== undefined) dbData.requirements = data.requirements;
    if (data.niceToHave !== undefined) dbData.nice_to_have = data.niceToHave;
    if (data.benefits !== undefined) dbData.benefits = data.benefits;
    if (data.aboutCompany !== undefined) dbData.about_company = data.aboutCompany;
    if (data.recruitmentSteps !== undefined) dbData.recruitment_steps = data.recruitmentSteps;
    if (data.highlights !== undefined) dbData.offer_highlights = data.highlights;
    if (data.teamSize !== undefined) dbData.team_size = data.teamSize;
    if (data.seniority !== undefined) dbData.seniority = data.seniority;
    if (data.contractType !== undefined) dbData.contract_type = data.contractType;
    if (data.workMode !== undefined) dbData.work_mode = data.workMode;
    if (data.experienceLevel !== undefined) dbData.experience_level = data.experienceLevel;
    if (data.applyUrl !== undefined) dbData.apply_url = data.applyUrl;

    const { error } = await supabase.from("jobs").update(dbData).eq("id", id);
    if (error) throw new Error(`Failed to update job: ${error.message}`);

    const result = await supabaseJobRepository.getById(id);
    if (!result) throw new Error("Job not found after update");
    return result;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "closed" })
      .eq("id", id);
    if (error) throw new Error(`Failed to archive job: ${error.message}`);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete job: ${error.message}`);
  },
};
