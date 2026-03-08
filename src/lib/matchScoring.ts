/**
 * Match scoring engine.
 * Weights: skills 40%, seniority 15%, salary 15%, location 15%, work_mode 15%.
 */

export interface CandidateProfile {
  skills: string[];
  seniority: string; // Junior | Mid | Senior | Lead
  preferredSalaryMin: number; // in thousands PLN
  preferredSalaryMax: number;
  remotePreference: string; // Zdalnie | Hybrydowo | Stacjonarnie | Dowolnie | Any
  location: string;
  experienceYears: number;
  title: string;
  workMode?: string; // Remote | Hybrid | On-site
}

export interface JobForScoring {
  tags: string[];
  salary: string;
  location: string;
  type: string;
  title: string;
  description: string;
}

export interface MatchResult {
  score: number; // 0–100
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
  workMode: number;
}

// Default demo candidate
export const DEMO_CANDIDATE: CandidateProfile = {
  skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Next.js"],
  seniority: "Senior",
  preferredSalaryMin: 18,
  preferredSalaryMax: 28,
  remotePreference: "Any",
  location: "Warszawa",
  experienceYears: 5,
  title: "Frontend Developer",
  workMode: "Remote",
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

function computeWorkModeScore(candidate: CandidateProfile, job: JobForScoring): { score: number; reason: string } {
  const jobLoc = job.location.toLowerCase();
  const jobType = job.type.toLowerCase();
  const isJobRemote = jobLoc.includes("zdaln") || jobLoc.includes("remote") || jobType === "remote";
  const isJobHybrid = jobLoc.includes("hybry") || jobType.includes("hybrid");

  const candPref = (candidate.workMode || candidate.remotePreference || "Any").toLowerCase();

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

  // Partial match
  if (isJobRemote || candPref.includes("zdaln") || candPref.includes("remote")) {
    return { score: 60, reason: "Częściowe dopasowanie trybu pracy" };
  }

  return { score: 40, reason: "Tryb pracy może nie odpowiadać" };
}

export function calculateMatch(candidate: CandidateProfile, job: JobForScoring): MatchResult {
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
  let salaryScore = 50;
  if (salaryRange) {
    const overlap =
      Math.min(salaryRange.max, candidate.preferredSalaryMax) -
      Math.max(salaryRange.min, candidate.preferredSalaryMin);
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
    candidate.remotePreference === "Any" ||
    candidate.remotePreference === "Dowolnie" ||
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

/** Convert DB candidate row to CandidateProfile for scoring */
export function dbCandidateToProfile(candidate: {
  skills: string[];
  seniority: string;
  salary_min: number;
  salary_max: number;
  work_mode: string;
  location: string;
  experience: string;
  title: string;
}): CandidateProfile {
  const expMatch = candidate.experience.match(/(\d+)/);
  return {
    skills: candidate.skills || [],
    seniority: candidate.seniority || "Mid",
    preferredSalaryMin: (candidate.salary_min || 0) / 1000, // stored as PLN, convert to thousands
    preferredSalaryMax: (candidate.salary_max || 0) / 1000,
    remotePreference: candidate.work_mode || "Any",
    workMode: candidate.work_mode || "Any",
    location: candidate.location || "",
    experienceYears: parseInt(expMatch?.[1] || "3"),
    title: candidate.title || "",
  };
}
