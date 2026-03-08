/**
 * Match scoring engine — orchestrates dimension scorers and produces MatchResult.
 *
 * Strategy: "rules" (current) — pure deterministic scoring.
 * Future: "hybrid" — rules + embedding similarity, "embedding" — pure vector.
 *
 * The engine is stateless and has no dependency on any demo data or specific DB shape.
 */

import type { MatchResult, ScoreBreakdown, ScoringCandidate, ScoringJob, DimensionScore } from "./types";
import { scoreSkills, scoreSeniority, scoreSalary, scoreLocation, scoreWorkMode } from "./dimensions";

/**
 * Calculate match between a candidate and a job using rule-based scoring.
 */
export function calculateMatch(candidate: ScoringCandidate, job: ScoringJob): MatchResult {
  const skillResult = scoreSkills(candidate, job);
  const seniorityResult = scoreSeniority(candidate, job);
  const salaryResult = scoreSalary(candidate, job);
  const locationResult = scoreLocation(candidate, job);
  const workModeResult = scoreWorkMode(candidate, job);

  const dimensions: DimensionScore[] = [
    skillResult,
    seniorityResult,
    salaryResult,
    locationResult,
    workModeResult,
  ];

  // Weighted total
  const totalScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  // Collect reasons (skip empty)
  const reasons = dimensions.map((d) => d.reason).filter(Boolean);
  if (skillResult.missingSkills.length > 0) {
    reasons.push(`Brakuje: ${skillResult.missingSkills.join(", ")}`);
  }

  // Legacy-compatible flat breakdown
  const breakdown: ScoreBreakdown = {
    skills: skillResult.score,
    experience: seniorityResult.score,
    salary: salaryResult.score,
    location: locationResult.score,
    workMode: workModeResult.score,
  };

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    matchedSkills: skillResult.matchedSkills,
    missingSkills: skillResult.missingSkills,
    reasons: reasons.slice(0, 5),
    breakdown,
    dimensions,
    strategy: "rules",
  };
}
