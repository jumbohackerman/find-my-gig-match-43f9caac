/**
 * Mock candidate repository — backed by static seekers data.
 */

import type { CandidateRepository, CandidateFilters } from "@/repositories/interfaces";
import type { Candidate, Seniority, WorkMode, EmploymentType } from "@/domain/models";
import { seekers } from "@/data/seekers";

function seekerToDomain(s: typeof seekers[number]): Candidate {
  return {
    id: s.id,
    userId: s.id, // mock: user_id === seeker id
    title: s.title,
    location: s.location,
    bio: s.bio,
    summary: s.summary || "",
    skills: s.skills,
    seniority: (s.seniority || "Mid") as Seniority,
    experience: s.experience,
    workMode: (s.work_mode || "Zdalnie") as WorkMode,
    employmentType: (s.employment_type || "Full-time") as EmploymentType,
    salaryMin: s.salary_min || 0,
    salaryMax: s.salary_max || 0,
    availability: s.availability,
    experienceEntries: (s.experience_entries || []).map((e) => ({
      ...e,
      isCurrent: false,
      description: "",
    })),
    links: s.links || {},
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
          c.title.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.skills.some((sk) => sk.toLowerCase().includes(q)) ||
          c.location.toLowerCase().includes(q),
      );
    }
    if (filters?.skills && filters.skills.length > 0) {
      const skillsLower = filters.skills.map((s) => s.toLowerCase());
      result = result.filter((c) =>
        c.skills.some((s) => skillsLower.includes(s.toLowerCase())),
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
      title: "",
      location: "",
      bio: "",
      summary: "",
      skills: [],
      seniority: "Mid" as Seniority,
      experience: "0 lat",
      workMode: "Zdalnie" as WorkMode,
      employmentType: "Full-time" as EmploymentType,
      salaryMin: 0,
      salaryMax: 0,
      availability: "Otwarty na oferty",
      experienceEntries: [],
      links: {},
      cvUrl: null,
      lastActive: new Date().toISOString(),
    };
    return { ...base, ...data };
  },
};
