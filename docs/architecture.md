# JobSwipe Architecture

## Overview

The app follows a **repository/adapter pattern** to cleanly separate UI from data sources. This enables swapping between mock (demo) data and production backends (Supabase, Cloudflare, etc.) without touching page components.

## Layer diagram

```
┌──────────────────────────────────┐
│         Pages / Components       │  React UI — uses hooks only
├──────────────────────────────────┤
│         Custom Hooks             │  useJobs(), useCandidates(), etc.
├──────────────────────────────────┤
│     Provider Registry            │  getProvider("jobs"), getProvider("analytics")
├────────────────┬─────────────────┤
│  Repositories  │    Services     │  Interfaces in src/repositories/ & src/services/
├────────────────┼─────────────────┤
│  Mock Repos    │   No-op Svc     │  src/repositories/mock/, src/services/noop.ts
│  Supabase Repos│   Real Svc      │  (future) src/repositories/supabase/
└────────────────┴─────────────────┘
│         Domain Models            │  src/domain/models.ts
└──────────────────────────────────┘
```

## Wiring status (current)

### ✅ Fully wired through provider registry

| Page / Component | Hook | Provider key | Notes |
|---|---|---|---|
| `Index.tsx` (job swipe feed) | `useJobs()` | `jobs` | Was importing `jobs` array directly from `src/data/jobs.ts` |
| `Profiles.tsx` (talent pool) | `useCandidates()` | `candidates` | Was importing `seekers` array directly from `src/data/seekers.ts` |

### ✅ Type imports migrated to domain models

All components now import `Job` from `@/domain/models` instead of `@/data/jobs`:
- `SwipeCard`, `JobFilters`, `JobDetailModal`, `AppliedList`, `SavedList`

`Employer.tsx` imports `Job` from `@/domain/models`.

### ⚠️ Legacy type imports (intentional, backward-compat)

`Seeker` type from `@/data/seekers` is still imported by:
- `SeekerCard`, `CandidateProfileModal`, `EmployerCandidateSwipe`

These components use `Seeker` as their prop type. The `Profiles.tsx` page maps `Candidate` → `ExtendedSeeker` at the boundary. When we refactor these components to accept `Candidate` directly, the `Seeker` type can be removed.

### ⚠️ Not yet behind repository layer

| Feature | Current approach | Future fix |
|---|---|---|
| Employer dashboard (jobs + applications) | `useEmployerDashboardData` → direct Supabase queries | Move to `getProvider("applications").listForEmployer()` |
| Candidate applications | `useCandidateApplications` → direct Supabase queries | Move to `getProvider("applications").listForCandidate()` |
| Chat messages | Local state in `Employer.tsx` | `getProvider("messages")` |
| Job posting / deletion | Direct `supabase.from("jobs")` in `Employer.tsx` | `getProvider("jobs").create()` / `.delete()` |
| Apply to job | Direct `supabase.rpc("apply_to_job")` in `Index.tsx` | `getProvider("applications").apply()` |
| Onboarding flag | `localStorage` | `getProvider("profiles").update()` or dedicated flag |
| Saved jobs | Local state array | Future: `getProvider("savedJobs")` or DB table |

### Data flow: `src/data/` files

| File | Imported by | Status |
|---|---|---|
| `src/data/jobs.ts` | `src/repositories/mock/jobs.ts` ONLY | ✅ Isolated |
| `src/data/seekers.ts` | `src/repositories/mock/candidates.ts` ONLY | ✅ Isolated |

No page or component imports data files directly anymore.

## Key directories

| Path | Purpose |
|---|---|
| `src/domain/models.ts` | All TypeScript interfaces — provider-agnostic |
| `src/repositories/interfaces.ts` | Repository contracts (data access) |
| `src/repositories/mock/` | Mock implementations using `src/data/` static files |
| `src/services/interfaces.ts` | External service contracts (analytics, email, AI, etc.) |
| `src/services/noop.ts` | Console-log/no-op implementations for dev |
| `src/providers/registry.ts` | Single place to swap mock ↔ real implementations |
| `src/hooks/useJobs.ts` | Hook wrapping `getProvider("jobs")` |
| `src/hooks/useCandidates.ts` | Hook wrapping `getProvider("candidates")` |
| `src/data/` | Static demo data — ONLY imported by mock repos |
| `docs/` | Architecture and integration docs |

## Domain models

All entities are defined in `src/domain/models.ts` (see `docs/domain-model.md` for full reference):

- **Job** — job posting with optional structured `SalaryRange`
- **Candidate** — canonical candidate profile (replaces legacy Seeker, ExtendedSeeker, CandidateProfile)
- **Application** — link between candidate and job
- **Message** — chat message in application context
- **UserProfile** — auth-adjacent profile data
- **Notification** — in-app notification (future)
- **MatchResult** / **ScoreBreakdown** — scoring output

## Repositories

Each repository has a single interface in `src/repositories/interfaces.ts`:

- `JobRepository` — CRUD for jobs
- `CandidateRepository` — list/get/upsert candidates
- `ApplicationRepository` — apply, list, update status
- `MessageRepository` — send/list/subscribe to messages
- `ProfileRepository` — get/update user profiles

## Services

External integrations have interfaces in `src/services/interfaces.ts`:

- `AnalyticsService` — GA4 / PostHog
- `ErrorTrackingService` — Sentry
- `EmailService` — Resend
- `AIService` — CV parsing, match explanation, shortlisting
- `StorageService` — file uploads (Supabase Storage / Cloudflare R2)

## Switching to production

1. Create `src/repositories/supabase/jobs.ts` implementing `JobRepository`
2. In `src/providers/registry.ts`, change: `jobs: supabaseJobRepository`
3. No page or component code changes needed

Same pattern for services:
1. Create `src/services/posthog.ts` implementing `AnalyticsService`
2. Register: `analytics: posthogAnalytics`

## Integration targets

| Service | Interface | Future implementation |
|---|---|---|
| Supabase Postgres | All repositories | `src/repositories/supabase/` |
| Supabase Auth | `useAuth` hook | Already integrated |
| Supabase Storage | `StorageService` | `src/services/supabaseStorage.ts` |
| Cloudflare Pages | Deployment | No code changes needed |
| Resend | `EmailService` | Edge function + `src/services/resend.ts` |
| GA4 / PostHog | `AnalyticsService` | `src/services/posthog.ts` |
| Sentry | `ErrorTrackingService` | `src/services/sentry.ts` |
| AI (CV parsing) | `AIService` | Edge function + `src/services/aiProcessing.ts` |
| pgvector | Part of `CandidateRepository` | Semantic search in Supabase repo |
