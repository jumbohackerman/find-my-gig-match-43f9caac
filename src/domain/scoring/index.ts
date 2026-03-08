/**
 * Public API for the scoring engine.
 * All consumers should import from here.
 */

export { calculateMatch } from "./engine";
export type {
  MatchResult,
  ScoreBreakdown,
  DimensionScore,
  ScoringCandidate,
  ScoringJob,
} from "./types";
