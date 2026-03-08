# Production Readiness Report

**Date:** 2026-03-08
**Target Stack:** Lovable → GitHub → Cloudflare Pages + Supabase + Edge Functions + Resend + PostHog/GA4 + Sentry

---

## ✅ What Is Now Production-Ready

### Architecture & Abstractions
- [x] **Domain models** — `src/domain/models.ts` is the single source of truth, zero Supabase leaks
- [x] **Provider registry** — `src/providers/registry.ts` enables runtime backend swapping
- [x] **Repository interfaces** — `src/repositories/interfaces.ts` covers all data contracts
- [x] **Service interfaces** — `src/services/interfaces.ts` defines analytics, email, AI, storage, error tracking
- [x] **Config layer** — `src/config/index.ts` centralizes all env-var access with typed accessors
- [x] **Integration boundaries** — `src/config/integrations.ts` maps each service's status and required secrets
- [x] **Scoring engine** — `src/domain/scoring/` is stateless, backend-agnostic, ready for pgvector hybrid

### Security & Access Control
- [x] **Role-aware route guards** — `useRequireRole` hook + `<RoleGate>` component
- [x] **Protected routes** — `/employer` and `/profiles` require `employer` role; `/my-profile` requires `candidate`
- [x] **RLS policies** — all 5 tables have restrictive policies (candidates, jobs, applications, messages, profiles)
- [x] **Auth enforcement** — all routes require authentication, unauthenticated users redirect to `/auth`
- [x] **Security definer functions** — `get_user_role()`, `apply_to_job()` avoid RLS bypass

### CI/CD
- [x] **GitHub Actions CI** — `.github/workflows/ci.yml` runs install → lint → type-check → test → build
- [x] **Environment isolation** — CI uses placeholder env vars, no secrets in workflow

### Edge Functions (Stubs)
- [x] `send-email` — Resend integration point, CORS configured
- [x] `process-cv` — AI CV parsing pipeline, references Lovable AI
- [x] `validate-status-transition` — Application status state machine
- [x] `rate-limiter` — In-memory rate limiting for sensitive endpoints

### Documentation
- [x] Real project README with architecture overview, tech stack, user flows
- [x] `docs/match-scoring-plan.md` — scoring engine roadmap
- [x] `docs/provider-integration-plan.md` — integration onboarding process
- [x] `docs/cleanup-notes.md` — technical debt inventory
- [x] `docs/production-readiness-report.md` — this document

---

## 🟡 What Is Still Mock-Only

| Component | Current State | Migration Path |
|-----------|--------------|----------------|
| `jobs` provider | Mock in-memory | `supabaseJobRepository` already written, swap in registry |
| `applications` provider | Mock in-memory | `supabaseApplicationRepository` already written, swap in registry |
| `candidates` provider | Mock in-memory | Need `src/repositories/supabase/candidates.ts` |
| `messages` provider | Mock in-memory | Need `src/repositories/supabase/messages.ts` |
| `notifications` provider | Mock in-memory | Need notifications table + repo |
| `savedJobs` provider | Mock in-memory | Need saved_jobs table + repo |
| `swipeEvents` provider | Mock in-memory | Need swipe_events table + repo |
| `preferences` provider | localStorage | Need user_preferences table + repo |
| Analytics service | console.debug noop | Wire PostHog SDK |
| Error tracking | console.error noop | Wire Sentry SDK |
| Email service | console.debug noop | Wire Resend via edge function |
| AI service | Noop stubs | Wire Lovable AI via edge function |
| Storage service | Noop stubs | Wire Supabase Storage (bucket `cvs` already exists) |

---

## 🔴 What Still Blocks Full Supabase Integration

### Direct Supabase Bypasses (5 files)
These files import `supabase` client directly instead of going through the repository layer:

1. **`src/hooks/useJobFeed.ts`** — `supabase.rpc("apply_to_job", ...)` (line 61)
   - **Fix:** Replace with `getProvider("applications").apply(...)` after swapping to Supabase app repo
   - **Blocker:** The RPC function `apply_to_job` does atomic job upsert + application insert. The application repository needs to support this compound operation.

2. **`src/hooks/useEmployerDashboard.ts`** — Direct queries to jobs, applications, candidates, profiles tables
   - **Fix:** Create Supabase implementations for `listForEmployer()` that return fully enriched data
   - **Blocker:** Enrichment (candidate + profile + match score) requires joined queries not yet in the repo interface

3. **`src/hooks/useApplications.ts`** — Direct Supabase queries + realtime subscriptions
   - **Fix:** Move to application repository with realtime support
   - **Blocker:** Repository interface doesn't define realtime subscription pattern

4. **`src/pages/MyProfile.tsx`** — Direct CRUD on candidates + profiles tables + storage upload
   - **Fix:** Move to candidate and profile repositories + storage service
   - **Blocker:** 762-line page component needs refactoring into smaller hooks

5. **`src/pages/Auth.tsx`** + **`src/pages/ResetPassword.tsx`** — Direct `supabase.auth.*` calls
   - **Status:** ✅ ACCEPTABLE. Auth is a cross-cutting concern. The `useAuth` hook already wraps session management. Login/signup/reset are auth-layer operations, not data-layer.

### Missing Database Tables
| Table | Purpose | Status |
|-------|---------|--------|
| `saved_jobs` | Persistent saved/bookmarked jobs | Not created |
| `swipe_events` | Feed state — which jobs user has seen | Not created |
| `notifications` | In-app notification storage | Not created |
| `user_preferences` | Per-user settings (onboarding, filters) | Not created |

### Missing Infrastructure
- [ ] Cloudflare Pages deployment config (`wrangler.toml` or Pages settings)
- [ ] Supabase Storage RLS policies for `cvs` bucket (owner-only + employer read)
- [ ] Database trigger for `handle_new_user` (exists as function but trigger not verified)
- [ ] pgvector extension not yet enabled (needed for future semantic matching)

---

## 🟢 What Can Be Connected Next With Minimal Risk

### Phase 1: Zero-risk (no new secrets, no new services)
1. **Swap job + application providers to Supabase repos** — implementations already written
2. **Create `saved_jobs` and `swipe_events` tables** — simple schema, no external deps
3. **Refactor MyProfile.tsx** — extract hooks, move Supabase calls behind providers
4. **Add realtime support to repository interfaces** — extend with `subscribe()` method

### Phase 2: Low-risk (one secret each)
5. **Connect PostHog** — add `VITE_POSTHOG_KEY`, create real analytics provider
6. **Connect Sentry** — add `VITE_SENTRY_DSN`, create real error tracking provider
7. **Wire `send-email` edge function** — add `RESEND_API_KEY` secret

### Phase 3: Moderate complexity
8. **Wire `process-cv` edge function** — uses Lovable AI (key already configured)
9. **Enable pgvector** — add embedding columns, update scoring engine
10. **Cloudflare Pages deployment** — build output config, env var mapping

---

## File Change Summary

### Created
| File | Purpose |
|------|---------|
| `src/hooks/useRequireRole.ts` | Role-aware hook for route protection |
| `src/components/RoleGate.tsx` | Declarative role gate wrapper component |
| `src/repositories/supabase/jobs.ts` | Production-ready Supabase job repository |
| `src/repositories/supabase/applications.ts` | Production-ready Supabase application repository |
| `src/repositories/supabase/index.ts` | Barrel export for Supabase repos |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |
| `supabase/functions/send-email/index.ts` | Resend email integration stub |
| `supabase/functions/process-cv/index.ts` | AI CV parsing stub |
| `supabase/functions/validate-status-transition/index.ts` | Status state machine |
| `supabase/functions/rate-limiter/index.ts` | Rate limiting middleware stub |
| `docs/production-readiness-report.md` | This document |

### Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Added `<RoleGate>` to `/employer`, `/profiles`, `/my-profile` routes |
| `README.md` | Replaced generic Lovable README with real project documentation |
| `.env.example` | Already up-to-date from previous pass |
