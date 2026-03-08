# Domain Model Reference

## Canonical types (src/domain/models.ts)

All domain types live in a single file. No Supabase or provider-specific imports.

### Entities

| Type | Purpose | DB table |
|---|---|---|
| `Job` | Job posting | `jobs` |
| `Candidate` | Candidate profile + display fields (name, avatar from profiles) | `candidates` + `profiles` |
| `Application` | Link between candidate and job | `applications` |
| `Message` | Chat message | `messages` |
| `UserProfile` | Auth-adjacent profile | `profiles` |
| `Notification` | In-app notification (future) | TBD |

### Value types

| Type | Purpose |
|---|---|
| `SalaryRange` | Structured min/max/currency/period |
| `ExperienceEntry` | Single work experience block |
| `CandidateLinks` | Portfolio/GitHub/LinkedIn/website URLs |
| `MatchResult` | Scoring output with breakdown |
| `ScoreBreakdown` | Per-dimension match scores |

### Enums / unions

| Type | Values |
|---|---|
| `Seniority` | Junior, Mid, Senior, Lead |
| `WorkMode` | Zdalnie, Hybrydowo, Stacjonarnie |
| `EmploymentType` | Full-time, Contract, Part-time |
| `JobType` | Full-time, Part-time, Contract, Remote |
| `JobStatus` | active, closed, draft |
| `UserRole` | candidate, employer |
| `ApplicationStatus` | applied, shortlisted, viewed, interview, hired, not_selected, position_closed |
| `ApplicationSource` | candidate, ai, employer |
| `NotificationType` | status_change, new_message, shortlisted, interview_scheduled, hired |
| `Currency` | PLN, EUR, USD |
| `SalaryPeriod` | month, hour, year |

### Helpers (exported from domain)

- `parseSalaryString(salary: string): SalaryRange | null` — parse Polish salary strings
- `getActivityLabel(lastActive?: string)` — human-readable activity status

### Enriched UI types

- `ApplicationWithJob` — Application + optional Job
- `EnrichedEmployerApplication` — Application + Candidate + Job + MatchResult

## Migration from legacy types

### Removed types

| Old type | Location | Replaced by |
|---|---|---|
| `ExtendedSeeker` | `CandidateProfileModal.tsx` | `Candidate` from domain |
| `CandidateProfile` | `matchScoring.ts` | `Candidate` (aliased for backward compat) |
| Local `getActivityLabel` | `CandidateProfileModal.tsx`, `Employer.tsx` | `getActivityLabel` from `@/domain/models` |

### Preserved types (data layer only)

| Type | Location | Purpose |
|---|---|---|
| `Seeker` | `src/data/seekers.ts` | Raw demo data shape. Only imported by `src/repositories/mock/candidates.ts` |
| `Job` (legacy) | `src/data/jobs.ts` | Raw demo data shape. Only imported by `src/repositories/mock/jobs.ts` |

### How the migration was done safely

1. `Candidate` gained `name` and `avatar` fields (previously only on `Seeker`/`UserProfile`)
2. Mock candidate repo maps `Seeker.name` → `Candidate.name` and `Seeker.avatar` → `Candidate.avatar`
3. `CandidateProfileModal` now accepts `candidate: Candidate` instead of `seeker: ExtendedSeeker`
4. `SeekerCard` now accepts `candidate: Candidate` instead of `seeker: Seeker`
5. `Employer.tsx` uses `dbCandidateToCandidate()` from matchScoring to map DB rows → `Candidate`
6. `matchScoring.ts` `calculateMatch()` now takes `Candidate` directly instead of `CandidateProfile`
7. `CandidateProfile` is kept as a deprecated type alias (`= Candidate`) for any remaining references
8. `DEMO_CANDIDATE` is now a full `Candidate` object

### Salary field normalization

- `Candidate.salaryMin` / `Candidate.salaryMax` — numbers in PLN (not thousands)
- `Job.salary` — display string (kept for backward compat)
- `Job.salaryRange` — optional structured `SalaryRange` for future use
- `matchScoring.ts` auto-detects whether salary values are in PLN or thousands

### Future: pgvector

`Candidate.embedding?: number[]` is reserved for semantic search vectors. Will be populated by AI service when CV is parsed.
