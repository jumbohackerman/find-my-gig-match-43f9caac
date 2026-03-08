/**
 * Scoring engine types — pure domain types for match scoring.
 * No dependency on any specific candidate or job shape.
 */

/** Individual dimension score with explanation */
export interface DimensionScore {
  /** Dimension key */
  key: string;
  /** Human-readable label (localized) */
  label: string;
  /** 0–100 score for this dimension */
  score: number;
  /** Weight applied to total (0–1, all weights sum to 1) */
  weight: number;
  /** Short explanation for this score */
  reason: string;
}

/** Full structured match result */
export interface MatchResult {
  /** 0–100 total weighted score */
  score: number;
  /** Tags/skills present on both sides */
  matchedSkills: string[];
  /** Tags/skills required but missing */
  missingSkills: string[];
  /** Human-readable explanation lines (top 5) */
  reasons: string[];
  /** Per-dimension breakdown */
  breakdown: ScoreBreakdown;
  /** Individual dimension details (for future granular UI) */
  dimensions: DimensionScore[];
  /** Scoring strategy that produced this result */
  strategy: "rules" | "hybrid" | "embedding";
}

/** Legacy-compatible flat breakdown for existing UI components */
export interface ScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
  workMode: number;
}

/** Input abstraction — what the scoring engine needs from a candidate */
export interface ScoringCandidate {
  skills: string[];
  seniority: string;
  salaryMin: number;
  salaryMax: number;
  workMode: string;
  location: string;
  availability?: string;
}

/** Input abstraction — what the scoring engine needs from a job */
export interface ScoringJob {
  title: string;
  description: string;
  tags: string[];
  salary: string;
  location: string;
  type: string;
}
