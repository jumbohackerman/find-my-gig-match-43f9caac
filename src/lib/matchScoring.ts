/**
 * Match scoring engine.
 * Uses domain Candidate model. Eliminates the old CandidateProfile type.
 * Weights: skills 40%, seniority 15%, salary 15%, location 15%, work_mode 15%.
 */

import type { Candidate, Job, MatchResult, ScoreBreakdown } from "@/domain/models";

export type { MatchResult, ScoreBreakdown } from "@/domain/models";

/** Subset of Job fields needed for scoring (avoids importing full Job in tests) */
export type JobForScoring = Pick<Job, "tags" | "salary" | "location" | "type" | "title" | "description">;

// Default demo candidate — used when no real profile is loaded
export const DEMO_CANDIDATE: Candidate = {
  id: "demo",
  userId: "demo",
  name: "Demo User",
  avatar: "👤",
  title: "Frontend Developer",
  location: "Warszawa",
  bio: "",
  summary: "",
  skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Next.js"],
  seniority: "Senior",
  experience: "5 lat",
  workMode: "Zdalnie",
  employmentType: "Full-time",
  availability: "Elastycznie",
  salaryMin: 18000,
  salaryMax: 28000,
  experienceEntries: [],
  links: {},
  cvUrl: null,
  lastActive: new Date().toISOString(),
};

function parseSalaryRange(salary: string): { min: number; max: number } | null {
  const plnMatch = salary.match(/(\d[\d\s]*)\s*zł\s*-\s*(\d[\d\s]*)\s*zł/i);
  if (plnMatch) {
    return {
      min: parseInt(plnMatch[1].replace(/\s/g, "")) / 1000,
      max: parseInt(plnMatch[2].replace(/\s/g, "")) / 1000,
    };
  }
  const matches = salary.match(/\$(\d+)k\s*-\s*\$(\d+)k/i);
  if (matches) return { min: parseInt(matches[1]), max: parseInt(matches[2]) };
  const single = salary.match(/\$(\d+)k/i);
  if (single) return { min: parseInt(single[1]), max: parseInt(single[1]) };
  return null;
}

function inferSeniority(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("lead") || t.includes("principal") || t.includes("staff")) return "Lead";
  if (t.includes("senior") || t.includes("sr")) return "Senior";
  if (t.includes("junior") || t.includes("jr") || t.includes("intern")) return "Junior";
  return "Mid";
}

function computeWorkModeScore(candidate: Candidate, job: JobForScoring): { score: number; reason: string } {
  const jobLoc = job.location.toLowerCase();
  const jobType = job.type.toLowerCase();
  const isJobRemote = jobLoc.includes("zdaln") || jobLoc.includes("remote") || jobType === "remote";
  const isJobHybrid = jobLoc.includes("hybry") || jobType.includes("hybrid");

  const candPref = (candidate.workMode || "Zdalnie").toLowerCase();

  if (candPref === "any" || candPref === "dowolnie" || candPref === "flexible") {
    return { score: 100, reason: "Elastyczny tryb pracy" };
  }

  if (isJobRemote && (candPref.includes("zdaln") || candPref.includes("remote"))) {
    return { score: 100, reason: "Tryb pracy pasuje — zdalnie" };
  }

  if (isJobHybrid && (candPref.includes("hybry") || candPref.includes("hybrid"))) {
    return { score: 100, reason: "Tryb pracy pasuje — hybrydowo" };
  }

  if (!isJobRemote && !isJobHybrid && (candPref.includes("stacj") || candPref.includes("on-site") || candPref.includes("onsite"))) {
    return { score: 100, reason: "Tryb pracy pasuje — stacjonarnie" };
  }

  if (isJobRemote || candPref.includes("zdaln") || candPref.includes("remote")) {
    return { score: 60, reason: "Częściowe dopasowanie trybu pracy" };
  }

  return { score: 40, reason: "Tryb pracy może nie odpowiadać" };
}

/** Convert Candidate salaryMin/salaryMax to thousands for scoring comparison */
function candidateSalaryInThousands(candidate: Candidate): { min: number; max: number } {
  // If values are > 1000, assume they're in PLN; convert to thousands
  const min = candidate.salaryMin > 1000 ? candidate.salaryMin / 1000 : candidate.salaryMin;
  const max = candidate.salaryMax > 1000 ? candidate.salaryMax / 1000 : candidate.salaryMax;
  return { min, max };
}

export function calculateMatch(candidate: Candidate, job: JobForScoring): MatchResult {
  const reasons: string[] = [];

  // 1. Skill match (40%)
  const jobSkills = job.tags.map((t) => t.toLowerCase());
  const candidateSkills = candidate.skills.map((s) => s.toLowerCase());
  const matchedSkills = job.tags.filter((t) => candidateSkills.includes(t.toLowerCase()));
  const missingSkills = job.tags.filter((t) => !candidateSkills.includes(t.toLowerCase()));
  const skillScore = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 50;

  if (matchedSkills.length > 0) {
    reasons.push(`${matchedSkills.length}/${job.tags.length} wymaganych umiejętności pasuje`);
  }
  if (missingSkills.length > 0) {
    reasons.push(`Brakuje: ${missingSkills.join(", ")}`);
  }

  // 2. Seniority match (15%)
  const jobSeniority = inferSeniority(job.title);
  const seniorityLevels = ["Junior", "Mid", "Senior", "Lead"];
  const jobIdx = seniorityLevels.indexOf(jobSeniority);
  const candIdx = seniorityLevels.indexOf(candidate.seniority);
  const seniorityDiff = Math.abs(jobIdx - candIdx);
  const seniorityScore = seniorityDiff === 0 ? 100 : seniorityDiff === 1 ? 70 : 30;

  if (seniorityDiff === 0) {
    reasons.push(`Poziom doświadczenia pasuje (${candidate.seniority})`);
  } else {
    reasons.push(`Różnica poziomu: ${candidate.seniority} vs ${jobSeniority}`);
  }

  // 3. Salary alignment (15%)
  const salaryRange = parseSalaryRange(job.salary);
  const candSalary = candidateSalaryInThousands(candidate);
  let salaryScore = 50;
  if (salaryRange) {
    const overlap =
      Math.min(salaryRange.max, candSalary.max) -
      Math.max(salaryRange.min, candSalary.min);
    const range = salaryRange.max - salaryRange.min || 1;
    salaryScore = overlap >= 0 ? Math.min(100, (overlap / range) * 100 + 30) : 10;
    if (overlap >= 0) {
      reasons.push("Wynagrodzenie zgodne z oczekiwaniami");
    } else {
      reasons.push("Wynagrodzenie może nie spełniać oczekiwań");
    }
  }

  // 4. Location compatibility (15%)
  let locationScore = 50;
  const jobLoc = job.location.toLowerCase();
  const candLoc = candidate.location.toLowerCase();
  if (
    candidate.workMode === "Zdalnie" ||
    jobLoc.includes("zdaln") ||
    jobLoc.includes("remote") ||
    job.type === "Remote"
  ) {
    locationScore = 100;
    if (jobLoc.includes("zdaln") || jobLoc.includes("remote") || job.type === "Remote") reasons.push("Praca zdalna");
  } else if (jobLoc.includes(candLoc) || candLoc.includes(jobLoc.split(",")[0])) {
    locationScore = 100;
    reasons.push("Lokalizacja pasuje");
  } else {
    locationScore = 30;
    reasons.push(`Inna lokalizacja: ${job.location}`);
  }

  // 5. Work mode (15%)
  const workModeResult = computeWorkModeScore(candidate, job);
  const workModeScore = workModeResult.score;
  reasons.push(workModeResult.reason);

  const totalScore = Math.round(
    skillScore * 0.4 +
    seniorityScore * 0.15 +
    salaryScore * 0.15 +
    locationScore * 0.15 +
    workModeScore * 0.15
  );

  const breakdown: ScoreBreakdown = {
    skills: Math.round(skillScore),
    experience: seniorityScore,
    salary: Math.round(salaryScore),
    location: locationScore,
    workMode: workModeScore,
  };

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    matchedSkills,
    missingSkills,
    reasons: reasons.slice(0, 5),
    breakdown,
  };
}

/** Convert DB candidate row to domain Candidate for scoring */
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

/**
 * @deprecated Use `calculateMatch(candidate, job)` directly with a Candidate.
 * Kept only for backward compatibility during migration.
 */
export type CandidateProfile = Candidate;

/**
 * @deprecated Use `dbCandidateToCandidate` instead.
 */
export function dbCandidateToProfile(candidate: {
  skills: string[];
  seniority: string;
  salary_min: number;
  salary_max: number;
  work_mode: string;
  location: string;
  experience: string;
  title: string;
}): Candidate {
  return dbCandidateToCandidate({
    user_id: "",
    ...candidate,
  });
}
