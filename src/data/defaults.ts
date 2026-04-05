/**
 * Default / fallback values for demo mode.
 * Only imported by mock repositories and hooks that need a fallback.
 */

import type { Candidate } from "@/domain/models";
import { emptySkills, emptyLinks } from "@/domain/models";

export const DEFAULT_CANDIDATE: Candidate = {
  id: "demo",
  userId: "demo",
  fullName: "Demo User",
  title: "Frontend Developer",
  location: "Warszawa",
  summary: "",
  seniority: "Senior",
  workMode: "Zdalnie",
  employmentType: "Full-time",
  availability: "Otwarty na oferty",
  salaryMin: 18000,
  salaryMax: 28000,
  salaryCurrency: "PLN",
  skills: { advanced: ["React", "TypeScript", "Node.js"], intermediate: ["GraphQL", "Tailwind CSS"], beginner: ["Next.js"] },
  experienceEntries: [],
  links: emptyLinks(),
  languages: [],
  primaryIndustry: "",
  profileCompleteness: 0,
  cvUrl: null,
  lastActive: new Date().toISOString(),
};

export function createFallbackCandidate(candidateId: string): Candidate {
  return {
    id: candidateId,
    userId: candidateId,
    fullName: "Kandydat",
    title: "",
    location: "",
    summary: "",
    seniority: "Mid",
    workMode: "Zdalnie",
    employmentType: "Full-time",
    availability: "Otwarty na oferty",
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: "PLN",
    skills: emptySkills(),
    experienceEntries: [],
    links: emptyLinks(),
    languages: [],
    primaryIndustry: "",
    profileCompleteness: 0,
    cvUrl: null,
    lastActive: new Date().toISOString(),
  };
}
