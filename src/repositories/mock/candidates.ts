/**
 * Mock candidate repository — backed by static seekers data.
 */

import type { CandidateRepository, CandidateFilters } from "@/repositories/interfaces";
import type { Candidate, Seniority, WorkMode, EmploymentType } from "@/domain/models";
import { getAllSkills, emptySkills, emptyLinks } from "@/domain/models";
import { seekers } from "@/data/seekers";

function seekerToDomain(s: typeof seekers[number]): Candidate {
  return {
    id: s.id,
    userId: s.id,
    fullName: s.name,
    title: s.title,
    location: s.location,
    summary: s.summary || "",
    seniority: (s.seniority || "Mid") as Seniority,
    workMode: (s.work_mode || "Zdalnie") as WorkMode,
    employmentType: (s.employment_type || "Full-time") as EmploymentType,
    salaryMin: s.salary_min || 0,
    salaryMax: s.salary_max || 0,
    salaryCurrency: "PLN",
    availability: s.availability,
    skills: { advanced: s.skills || [], intermediate: [], beginner: [] },
    experienceEntries: (s.experience_entries || []).map((e) => ({
      job_title: e.title || "",
      company_name: e.company || "",
      start_date: e.startDate || "",
      end_date: e.endDate || "",
      is_current: false,
      description_points: e.bullets || [],
    })),
    links: {
      portfolio_url: (s.links as any)?.portfolio || "",
      github_url: (s.links as any)?.github || "",
      linkedin_url: (s.links as any)?.linkedin || "",
      website_url: (s.links as any)?.website || "",
    },
    languages: [],
    primaryIndustry: "",
    profileCompleteness: 0,
    cvUrl: s.cv_url || null,
    lastActive: s.last_active || new Date().toISOString(),
  };
}

export const mockCandidateRepository: CandidateRepository = {
  async list(filters?: CandidateFilters): Promise<Candidate[]> {
    let result = seekers.map(seekerToDomain);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          getAllSkills(c).some((sk) => sk.toLowerCase().includes(q)) ||
          c.location.toLowerCase().includes(q),
      );
    }
    if (filters?.skills && filters.skills.length > 0) {
      const skillsLower = filters.skills.map((s) => s.toLowerCase());
      result = result.filter((c) =>
        getAllSkills(c).some((s) => skillsLower.includes(s.toLowerCase())),
      );
    }

    return result;
  },

  async getByUserId(userId: string): Promise<Candidate | null> {
    const found = seekers.find((s) => s.id === userId);
    return found ? seekerToDomain(found) : null;
  },

  async upsert(userId: string, data: Partial<Candidate>): Promise<Candidate> {
    console.debug("[mockCandidateRepo] upsert", userId, data);
    const existing = seekers.find((s) => s.id === userId);
    const base = existing ? seekerToDomain(existing) : {
      id: userId,
      userId,
      fullName: "Nowy kandydat",
      title: "",
      location: "",
      summary: "",
      seniority: "Mid" as Seniority,
      workMode: "Zdalnie" as WorkMode,
      employmentType: "Full-time" as EmploymentType,
      salaryMin: 0,
      salaryMax: 0,
      salaryCurrency: "PLN",
      availability: "Otwarty na oferty",
      skills: emptySkills(),
      experienceEntries: [],
      links: emptyLinks(),
      languages: [],
      primaryIndustry: "",
      profileCompleteness: 0,
      cvUrl: null,
      lastActive: new Date().toISOString(),
    };
    return { ...base, ...data };
  },
};
