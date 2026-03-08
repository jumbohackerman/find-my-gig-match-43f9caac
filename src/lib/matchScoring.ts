/**
 * Legacy façade — re-exports from the new domain scoring engine.
 * All new code should import from `@/domain/scoring` directly.
 * This file exists only for backward compatibility during migration.
 *
 * @deprecated Import from `@/domain/scoring` and `@/domain/mappers` instead.
 */

export { calculateMatch } from "@/domain/scoring";
export type { MatchResult, ScoreBreakdown, ScoringJob as JobForScoring } from "@/domain/scoring";
import { dbCandidateToCandidate } from "@/domain/mappers";
export { dbCandidateToCandidate };

// Legacy aliases
import type { Candidate } from "@/domain/models";

/** @deprecated Use Candidate directly */
export type CandidateProfile = Candidate;

/** @deprecated Use dbCandidateToCandidate instead */
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
  return dbCandidateToCandidate({ user_id: "", ...candidate });
}
