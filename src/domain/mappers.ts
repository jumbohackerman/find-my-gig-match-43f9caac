/**
 * DB-to-domain mappers.
 * Converts raw database rows into domain models.
 */

import type { Candidate, SkillsByLevel, ExperienceEntry, CandidateLinks, Language } from "@/domain/models";
import { emptySkills, emptyLinks } from "@/domain/models";

/** Safely parse skills from DB jsonb — handles both old string[] and new SkillsByLevel format */
function parseSkills(raw: unknown): SkillsByLevel {
  if (!raw) return emptySkills();
  if (Array.isArray(raw)) {
    // Legacy: flat string array → all become "advanced"
    return { advanced: raw.filter((s: any) => typeof s === "string"), intermediate: [], beginner: [] };
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      advanced: Array.isArray(obj.advanced) ? obj.advanced.filter((s: any) => typeof s === "string") : [],
      intermediate: Array.isArray(obj.intermediate) ? obj.intermediate.filter((s: any) => typeof s === "string") : [],
      beginner: Array.isArray(obj.beginner) ? obj.beginner.filter((s: any) => typeof s === "string") : [],
    };
  }
  return emptySkills();
}

/** Safely parse experience_entries from DB jsonb */
function parseExperienceEntries(raw: unknown): ExperienceEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.slice(0, 8).map((e: any) => ({
    job_title: e.job_title || e.title || "",
    company_name: e.company_name || e.company || "",
    start_date: e.start_date || e.startDate || "",
    end_date: e.end_date || e.endDate || "",
    is_current: Boolean(e.is_current || e.isCurrent),
    description_points: Array.isArray(e.description_points)
      ? e.description_points
      : Array.isArray(e.bullets)
        ? e.bullets.filter(Boolean)
        : [],
  }));
}

/** Safely parse links from DB jsonb */
function parseLinks(raw: unknown): CandidateLinks {
  if (!raw || typeof raw !== "object") return emptyLinks();
  const obj = raw as Record<string, unknown>;
  return {
    portfolio_url: (obj.portfolio_url as string) || (obj.portfolio as string) || "",
    github_url: (obj.github_url as string) || (obj.github as string) || "",
    linkedin_url: (obj.linkedin_url as string) || (obj.linkedin as string) || "",
    website_url: (obj.website_url as string) || (obj.website as string) || "",
  };
}

/** Safely parse languages from DB jsonb */
function parseLanguages(raw: unknown): Language[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((l: any) => ({
    name: l.name || "",
    level: l.level || "",
  })).filter(l => l.name);
}

/** Convert a raw DB candidate row into a domain Candidate */
export function dbCandidateToCandidate(row: Record<string, any>): Candidate {
  return {
    id: row.id || row.user_id,
    userId: row.user_id,
    fullName: row.full_name || "",
    title: row.title || "",
    location: row.location || "",
    summary: row.summary || "",
    seniority: (row.seniority || "Mid") as Candidate["seniority"],
    workMode: (row.work_mode || "Zdalnie") as Candidate["workMode"],
    employmentType: (row.employment_type || "Full-time") as Candidate["employmentType"],
    salaryMin: row.salary_min || 0,
    salaryMax: row.salary_max || 0,
    salaryCurrency: row.salary_currency || "PLN",
    availability: row.availability || "Otwarty na oferty",
    skills: parseSkills(row.skills),
    experienceEntries: parseExperienceEntries(row.experience_entries),
    links: parseLinks(row.links),
    languages: parseLanguages(row.languages),
    primaryIndustry: row.primary_industry || "",
    profileCompleteness: row.profile_completeness || 0,
    cvUrl: row.cv_url || null,
    lastActive: row.last_active || new Date().toISOString(),
  };
}
