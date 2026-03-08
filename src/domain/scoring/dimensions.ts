/**
 * Individual scoring dimension calculators.
 * Each function is pure — takes candidate + job inputs, returns DimensionScore.
 */

import type { DimensionScore, ScoringCandidate, ScoringJob } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseSalaryRange(salary: string): { min: number; max: number } | null {
  const plnMatch = salary.match(/(\d[\d\s]*)\s*zł\s*-\s*(\d[\d\s]*)\s*zł/i);
  if (plnMatch) {
    return {
      min: parseInt(plnMatch[1].replace(/\s/g, ""), 10) / 1000,
      max: parseInt(plnMatch[2].replace(/\s/g, ""), 10) / 1000,
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

function candidateSalaryInThousands(c: ScoringCandidate): { min: number; max: number } {
  const min = c.salaryMin > 1000 ? c.salaryMin / 1000 : c.salaryMin;
  const max = c.salaryMax > 1000 ? c.salaryMax / 1000 : c.salaryMax;
  return { min, max };
}

// ─── Dimension: Skills (weight 0.40) ─────────────────────────────────────────

export function scoreSkills(candidate: ScoringCandidate, job: ScoringJob): DimensionScore & { matchedSkills: string[]; missingSkills: string[] } {
  const jobSkills = job.tags.map((t) => t.toLowerCase());
  const candidateSkills = candidate.skills.map((s) => s.toLowerCase());
  const matchedSkills = job.tags.filter((t) => candidateSkills.includes(t.toLowerCase()));
  const missingSkills = job.tags.filter((t) => !candidateSkills.includes(t.toLowerCase()));
  const score = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 50;

  let reason: string;
  if (matchedSkills.length > 0 && missingSkills.length > 0) {
    reason = `${matchedSkills.length}/${job.tags.length} wymaganych umiejętności pasuje`;
  } else if (matchedSkills.length > 0) {
    reason = `Wszystkie ${matchedSkills.length} wymagane umiejętności pasują`;
  } else {
    reason = "Brak wspólnych umiejętności";
  }

  return {
    key: "skills",
    label: "Umiejętności",
    score: Math.round(score),
    weight: 0.40,
    reason,
    matchedSkills,
    missingSkills,
  };
}

// ─── Dimension: Seniority / Experience (weight 0.15) ─────────────────────────

export function scoreSeniority(candidate: ScoringCandidate, job: ScoringJob): DimensionScore {
  const jobSeniority = inferSeniority(job.title);
  const levels = ["Junior", "Mid", "Senior", "Lead"];
  const jobIdx = levels.indexOf(jobSeniority);
  const candIdx = levels.indexOf(candidate.seniority);
  const diff = Math.abs(jobIdx - candIdx);
  const score = diff === 0 ? 100 : diff === 1 ? 70 : 30;

  const reason = diff === 0
    ? `Poziom doświadczenia pasuje (${candidate.seniority})`
    : `Różnica poziomu: ${candidate.seniority} vs ${jobSeniority}`;

  return { key: "experience", label: "Doświadczenie", score, weight: 0.15, reason };
}

// ─── Dimension: Salary (weight 0.15) ─────────────────────────────────────────

export function scoreSalary(candidate: ScoringCandidate, job: ScoringJob): DimensionScore {
  const range = parseSalaryRange(job.salary);
  const candSalary = candidateSalaryInThousands(candidate);
  let score = 50;
  let reason = "Brak danych o wynagrodzeniu";

  if (range) {
    const overlap = Math.min(range.max, candSalary.max) - Math.max(range.min, candSalary.min);
    const span = range.max - range.min || 1;
    score = overlap >= 0 ? Math.min(100, (overlap / span) * 100 + 30) : 10;
    reason = overlap >= 0 ? "Wynagrodzenie zgodne z oczekiwaniami" : "Wynagrodzenie może nie spełniać oczekiwań";
  }

  return { key: "salary", label: "Wynagrodzenie", score: Math.round(score), weight: 0.15, reason };
}

// ─── Dimension: Location (weight 0.15) ───────────────────────────────────────

export function scoreLocation(candidate: ScoringCandidate, job: ScoringJob): DimensionScore {
  const jobLoc = job.location.toLowerCase();
  const candLoc = candidate.location.toLowerCase();
  let score = 50;
  let reason = "";

  if (
    candidate.workMode.toLowerCase().includes("zdaln") ||
    jobLoc.includes("zdaln") || jobLoc.includes("remote") ||
    job.type === "Remote"
  ) {
    score = 100;
    reason = "Praca zdalna";
  } else if (jobLoc.includes(candLoc) || candLoc.includes(jobLoc.split(",")[0])) {
    score = 100;
    reason = "Lokalizacja pasuje";
  } else {
    score = 30;
    reason = `Inna lokalizacja: ${job.location}`;
  }

  return { key: "location", label: "Lokalizacja", score, weight: 0.15, reason };
}

// ─── Dimension: Work Mode (weight 0.15) ──────────────────────────────────────

export function scoreWorkMode(candidate: ScoringCandidate, job: ScoringJob): DimensionScore {
  const jobLoc = job.location.toLowerCase();
  const jobType = job.type.toLowerCase();
  const isJobRemote = jobLoc.includes("zdaln") || jobLoc.includes("remote") || jobType === "remote";
  const isJobHybrid = jobLoc.includes("hybry") || jobType.includes("hybrid");
  const candPref = (candidate.workMode || "Zdalnie").toLowerCase();

  let score: number;
  let reason: string;

  if (candPref === "any" || candPref === "dowolnie" || candPref === "flexible") {
    score = 100; reason = "Elastyczny tryb pracy";
  } else if (isJobRemote && (candPref.includes("zdaln") || candPref.includes("remote"))) {
    score = 100; reason = "Tryb pracy pasuje — zdalnie";
  } else if (isJobHybrid && (candPref.includes("hybry") || candPref.includes("hybrid"))) {
    score = 100; reason = "Tryb pracy pasuje — hybrydowo";
  } else if (!isJobRemote && !isJobHybrid && (candPref.includes("stacj") || candPref.includes("on-site") || candPref.includes("onsite"))) {
    score = 100; reason = "Tryb pracy pasuje — stacjonarnie";
  } else if (isJobRemote || candPref.includes("zdaln") || candPref.includes("remote")) {
    score = 60; reason = "Częściowe dopasowanie trybu pracy";
  } else {
    score = 40; reason = "Tryb pracy może nie odpowiadać";
  }

  return { key: "workMode", label: "Tryb pracy", score, weight: 0.15, reason };
}
