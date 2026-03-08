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

## Key directories

| Path | Purpose |
|---|---|
| `src/domain/models.ts` | All TypeScript interfaces — provider-agnostic |
| `src/repositories/interfaces.ts` | Repository contracts (data access) |
| `src/repositories/mock/` | Mock implementations using `src/data/` static files |
| `src/services/interfaces.ts` | External service contracts (analytics, email, AI, etc.) |
| `src/services/noop.ts` | Console-log/no-op implementations for dev |
| `src/providers/registry.ts` | Single place to swap mock ↔ real implementations |
| `src/data/` | Static demo data (jobs.ts, seekers.ts) — ONLY imported by mock repos |
| `docs/` | Architecture and integration docs |

## Domain models

All entities are defined in `src/domain/models.ts`:

- **Job** — job posting
- **Candidate** — candidate/seeker profile
- **Application** — link between candidate and job
- **Message** — chat message in application context
- **UserProfile** — auth-adjacent profile data
- **MatchResult** — scoring output

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
