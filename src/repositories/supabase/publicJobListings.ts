/**
 * PublicJobListingRepository — read-only public job feed for employer market research.
 *
 * SAFETY:
 * - Uses ONLY public, narrow column projection (same or narrower than candidate-facing view).
 * - Excludes private/operational fields (apply_url, employer_id, status flags beyond active).
 * - Always filters status='active' (no hidden/closed/draft).
 * - Excludes the requesting employer's own jobs.
 * - This repository must NEVER be used for management actions.
 */

import { supabase } from "@/integrations/supabase/client";

export interface PublicJobListing {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  workMode: string;
  employmentType: string;
  contractType: string;
  seniority: string;
  experienceLevel: string;
  salary: string;
  salaryFrom: number;
  salaryTo: number;
  salaryCurrency: string;
  summary: string;
  tags: string[];
  postedAt: string;
}

export interface PublicJobListingDetail extends PublicJobListing {
  description: string;
  aboutRole: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  aboutCompany: string;
  highlights: string[];
  teamSize: string;
}

export interface PublicJobListingFilters {
  search?: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  seniority?: string;
  sort?: "newest" | "salary_desc" | "salary_asc";
  /** Employer making the request — their own jobs are excluded. */
  excludeEmployerId?: string;
  limit?: number;
  offset?: number;
}

// Narrow public projection — DO NOT add private columns here.
const LISTING_COLUMNS =
  "id, title, company, logo, location, work_mode, type, contract_type, seniority, experience_level, salary, salary_from, salary_to, salary_currency, summary, tags, created_at";

const DETAIL_COLUMNS = `${LISTING_COLUMNS}, description, about_role, responsibilities, requirements, nice_to_have, benefits, about_company, offer_highlights, team_size`;

interface DbRow {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  work_mode: string;
  type: string;
  contract_type: string;
  seniority: string;
  experience_level: string;
  salary: string;
  salary_from: number;
  salary_to: number;
  salary_currency: string;
  summary: string;
  tags: string[];
  created_at: string;
}

interface DbDetailRow extends DbRow {
  description: string;
  about_role: string;
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  about_company: string;
  offer_highlights: string[];
  team_size: string;
}

function toListing(row: DbRow): PublicJobListing {
  return {
    id: row.id,
    title: row.title,
    company: row.company || "",
    logo: row.logo || "🏢",
    location: row.location || "",
    workMode: row.work_mode || "",
    employmentType: row.type || "",
    contractType: row.contract_type || "",
    seniority: row.seniority || "",
    experienceLevel: row.experience_level || "",
    salary: row.salary || "",
    salaryFrom: row.salary_from || 0,
    salaryTo: row.salary_to || 0,
    salaryCurrency: row.salary_currency || "PLN",
    summary: row.summary || "",
    tags: row.tags || [],
    postedAt: row.created_at,
  };
}

function toDetail(row: DbDetailRow): PublicJobListingDetail {
  return {
    ...toListing(row),
    description: row.description || "",
    aboutRole: row.about_role || "",
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    niceToHave: row.nice_to_have || [],
    benefits: row.benefits || [],
    aboutCompany: row.about_company || "",
    highlights: row.offer_highlights || [],
    teamSize: row.team_size || "",
  };
}

export interface PublicJobListingRepository {
  list(filters: PublicJobListingFilters): Promise<PublicJobListing[]>;
  getById(id: string, requesterId?: string): Promise<PublicJobListingDetail | null>;
}

export const publicJobListingRepository: PublicJobListingRepository = {
  async list(filters: PublicJobListingFilters): Promise<PublicJobListing[]> {
    let query = supabase
      .from("jobs")
      .select(LISTING_COLUMNS)
      .eq("status", "active");

    // Exclude requesting employer's own jobs + system seed bucket
    if (filters.excludeEmployerId) {
      query = query.neq("employer_id", filters.excludeEmployerId);
    }

    if (filters.search?.trim()) {
      const s = filters.search.trim();
      query = query.or(
        `title.ilike.%${s}%,company.ilike.%${s}%,summary.ilike.%${s}%`,
      );
    }
    if (filters.location?.trim()) {
      query = query.ilike("location", `%${filters.location.trim()}%`);
    }
    if (filters.workMode?.trim()) {
      query = query.ilike("work_mode", filters.workMode.trim());
    }
    if (filters.employmentType?.trim()) {
      query = query.ilike("type", filters.employmentType.trim());
    }
    if (filters.seniority?.trim()) {
      query = query.ilike("seniority", filters.seniority.trim());
    }

    // Sort
    if (filters.sort === "salary_desc") {
      query = query.order("salary_to", { ascending: false, nullsFirst: false });
    } else if (filters.sort === "salary_asc") {
      query = query.order("salary_from", { ascending: true, nullsFirst: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const limit = filters.limit ?? 24;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      console.error("[publicJobListings] list error:", error);
      return [];
    }
    return (data as unknown as DbRow[]).map(toListing);
  },

  async getById(id: string, requesterId?: string): Promise<PublicJobListingDetail | null> {
    let query = supabase
      .from("jobs")
      .select(DETAIL_COLUMNS)
      .eq("id", id)
      .eq("status", "active");

    if (requesterId) {
      // Defense in depth: never return the requester's own job through this read-only path.
      query = query.neq("employer_id", requesterId);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return toDetail(data as unknown as DbDetailRow);
  },
};
