# Match Scoring Architecture

> Living document — describes the current rule-based scoring engine and the
> planned evolution toward hybrid (rules + embeddings + LLM explainability).

## Current Architecture (v1 — Rule-Based)

```
src/domain/scoring/
├── index.ts          # Public API barrel
├── types.ts          # ScoringCandidate, ScoringJob, MatchResult, DimensionScore
├── dimensions.ts     # Individual dimension scorers (pure functions)
└── engine.ts         # Orchestrator: runs dimensions, produces MatchResult
```

### Design Principles

1. **Backend-agnostic** — the engine operates on `ScoringCandidate` and `ScoringJob`
   abstractions, not on raw DB rows or demo data objects.
2. **Stateless** — every call to `calculateMatch()` is pure; no side effects.
3. **Extensible** — new dimensions are added as functions in `dimensions.ts`.
4. **Explainable** — every `DimensionScore` carries a human-readable `reason`.

### Scoring Dimensions (v1 Weights)

| Dimension    | Key          | Weight | Scorer                    |
|-------------|-------------|--------|---------------------------|
| Skills      | `skills`     | 40%    | `scoreSkills()`           |
| Seniority   | `experience` | 15%    | `scoreSeniority()`        |
| Salary      | `salary`     | 15%    | `scoreSalary()`           |
| Location    | `location`   | 15%    | `scoreLocation()`         |
| Work mode   | `workMode`   | 15%    | `scoreWorkMode()`         |

Each scorer returns a `DimensionScore`:

```typescript
interface DimensionScore {
  key: string;
  label: string;       // Localized display label
  score: number;       // 0–100
  weight: number;      // 0–1
  reason: string;      // Human-readable explanation
}
```

### MatchResult Structure

```typescript
interface MatchResult {
  score: number;              // 0–100 weighted total
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];          // Top 5 explanation lines
  breakdown: ScoreBreakdown;  // Legacy flat object for existing UI
  dimensions: DimensionScore[]; // Granular per-dimension data
  strategy: "rules" | "hybrid" | "embedding";
}
```

### Input Abstractions

```typescript
interface ScoringCandidate {
  skills: string[];
  seniority: string;
  salaryMin: number;
  salaryMax: number;
  workMode: string;
  location: string;
  availability?: string;
}

interface ScoringJob {
  title: string;
  description: string;
  tags: string[];
  salary: string;
  location: string;
  type: string;
}
```

Both `Candidate` (domain model) and `Job` satisfy these interfaces, so they can
be passed directly — no adapter needed.

---

## DB Mapper Layer

`src/domain/mappers.ts` contains `dbCandidateToCandidate()` which converts raw
Supabase rows into domain `Candidate` objects. This is intentionally separate
from the scoring engine.

---

## Migration from Legacy

The old `src/lib/matchScoring.ts` is now a thin re-export façade:

```
lib/matchScoring.ts  →  re-exports from  →  domain/scoring/index.ts
                                              domain/mappers.ts
```

Existing consumers (`useJobFeed`, `useEmployerDashboard`, `SwipeCard`, etc.)
continue to work unchanged. New code should import from `@/domain/scoring`.

---

## Future: Hybrid Scoring (v2)

### Phase 1 — Embedding Similarity

- Store `embedding: number[]` on both `candidates` and `jobs` tables (pgvector).
- Add a `scoreEmbeddingSimilarity()` dimension that computes cosine similarity.
- Weight: ~20% (redistributed from skills).
- Strategy field becomes `"hybrid"`.

### Phase 2 — LLM Explainability

- After rule + embedding scoring, pass the top matches to an LLM for
  natural-language explanations.
- Replace generic `reason` strings with contextual prose.
- Use Lovable AI supported models (e.g., `google/gemini-2.5-flash`).
- Cache explanations in a `match_explanations` table.

### Phase 3 — Learned Weights

- Track user swipe/apply/reject signals.
- Use logistic regression or a small model to learn optimal dimension weights
  per employer or per candidate.
- Weights become dynamic, stored per user/company.

### Phase 4 — Full Semantic Matching

- Strategy: `"embedding"` — pure vector-based retrieval.
- Rules become post-filters (hard constraints like salary range).
- Embedding model: fine-tuned on job market data.

---

## Availability Dimension (Planned)

Not yet scored. Will be added as:

```typescript
function scoreAvailability(candidate: ScoringCandidate, job: ScoringJob): DimensionScore
```

Requires `availability` field on `ScoringJob` (currently not present in job listings).

---

## Access from UI

| Component                    | Import                        | What it uses              |
|-----------------------------|-------------------------------|---------------------------|
| `SwipeCard`                 | `@/domain/models` (MatchResult type) | `matchResult.matchedSkills` |
| `MatchBadge`                | `@/domain/models` (MatchResult type) | `result.score`, `result.reasons` |
| `MatchScoreBreakdown`       | `@/domain/models` (ScoreBreakdown)   | `breakdown.*` bars        |
| `useJobFeed`                | `@/domain/scoring`            | `calculateMatch()`        |
| `useEmployerDashboard`      | `@/lib/matchScoring` (façade) | `calculateMatch()`, `dbCandidateToCandidate()` |
