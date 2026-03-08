/**
 * Legacy façade — re-exports from the new domain scoring engine.
 * All new code should import from `@/domain/scoring` directly.
 *
 * @deprecated Import from `@/domain/scoring` and `@/domain/mappers` instead.
 */

export { calculateMatch } from "@/domain/scoring";
export type { MatchResult, ScoreBreakdown, ScoringJob as JobForScoring } from "@/domain/scoring";
import { dbCandidateToCandidate } from "@/domain/mappers";
export { dbCandidateToCandidate };
