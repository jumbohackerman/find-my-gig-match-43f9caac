/**
 * DB-to-domain mappers.
 * Converts raw database rows into domain models.
 * Kept separate from scoring engine to maintain clean boundaries.
 */

import type { Candidate } from "@/domain/models";

/** Convert a raw DB candidate row + optional profile into a domain Candidate */
export function dbCandidateToCandidate(row: {
  id?: string;
  user_id: string;
  skills: string[];
  seniority: string;
  salary_min: number;
  salary_max: number;
  work_mode: string;
  location: string;
  experience: string;
  title: string;
  bio?: string;
  summary?: string;
  availability?: string;
  employment_type?: string;
  experience_entries?: unknown[];
  links?: Record<string, string>;
  cv_url?: string | null;
  last_active?: string;
}, profile?: { full_name?: string; avatar?: string | null }): Candidate {
  return {
    id: row.id || row.user_id,
    userId: row.user_id,
    name: profile?.full_name || row.title || "Kandydat",
    avatar: profile?.avatar || "👤",
    title: row.title || "",
    location: row.location || "",
    bio: row.bio || "",
    summary: row.summary || "",
    skills: row.skills || [],
    seniority: (row.seniority || "Mid") as Candidate["seniority"],
    experience: row.experience || "",
    workMode: (row.work_mode || "Zdalnie") as Candidate["workMode"],
    employmentType: (row.employment_type || "Full-time") as Candidate["employmentType"],
    availability: row.availability || "Elastycznie",
    salaryMin: row.salary_min || 0,
    salaryMax: row.salary_max || 0,
    experienceEntries: ((row.experience_entries || []) as any[]).map((e: any) => ({
      title: e.title || "",
      company: e.company || "",
      startDate: e.startDate || e.start_date || "",
      endDate: e.endDate || e.end_date || "",
      isCurrent: e.isCurrent || false,
      description: e.description || "",
      bullets: e.bullets || [],
    })),
    links: (row.links || {}) as Candidate["links"],
    cvUrl: row.cv_url || null,
    lastActive: row.last_active || new Date().toISOString(),
  };
}
