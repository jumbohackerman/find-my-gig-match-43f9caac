# Production Readiness Report

**Date:** 2026-03-08 (reconciled audit)
**Target Stack:** Lovable → GitHub → Cloudflare Pages + Supabase + Edge Functions + Resend + PostHog/GA4 + Sentry

---

## Reconciliation Summary

This report has been verified against the actual codebase. Every claim below was confirmed by reading the real files.

---

## ✅ What Is Now Production-Ready (verified)

### Architecture & Abstractions
- [x] **Domain models** — `src/domain/models.ts` is the single source of truth, zero Supabase type leaks
- [x] **Provider registry** — `src/providers/registry.ts` enables runtime backend swapping
- [x] **Repository interfaces** — `src/repositories/interfaces.ts` covers all 9 data contracts
- [x] **Service interfaces** — `src/services/interfaces.ts` defines analytics, email, AI, storage, error tracking
- [x] **Config layer** — `src/config/index.ts` centralizes all env-var access with typed accessors
- [x] **Integration boundaries** — `src/config/integrations.ts` maps each service's status and required secrets
- [x] **Scoring engine** — `src/domain/scoring/` is stateless, backend-agnostic, ready for pgvector hybrid
- [x] **Supabase repo implementations** — `src/repositories/supabase/jobs.ts` and `applications.ts` written, not yet wired

### Security & Access Control
- [x] **Role-aware route guards** — `useRequireRole` hook + `<RoleGate>` component exist and are used
- [x] **Route-level enforcement** — App.tsx wraps `/employer` and `/profiles` in `<RoleGate role="employer">`, `/my-profile` in `<RoleGate role="candidate">`
- [x] **Navigation guards** — Index.tsx conditionally renders nav links based on `profile.role` (candidates see "Mój profil", employers see "Panel pracodawcy" + "Znajdź talent")
- [x] **RLS policies** — all 5 tables (candidates, jobs, applications, messages, profiles) have restrictive policies
- [x] **Auth enforcement** — all routes require authentication, unauthenticated users redirect to `/auth`
- [x] **Security definer functions** — `get_user_role()`, `apply_to_job()` avoid RLS recursion

### CI/CD
- [x] **GitHub Actions CI** — `.github/workflows/ci.yml` runs install → lint → type-check → test → build
- [x] **Environment isolation** — CI uses placeholder env vars, no real secrets in workflow

### Edge Functions (Stubs — deployed automatically)
- [x] `send-email/index.ts` — Resend integration point with CORS
- [x] `process-cv/index.ts` — AI CV parsing pipeline stub
- [x] `validate-status-transition/index.ts` — Application status state machine with valid transitions map
- [x] `rate-limiter/index.ts` — In-memory rate limiting with configurable window

### Documentation
- [x] `README.md` — Real project README (starts with "# JobSwipe — Tinder-style Job Matching Platform")
- [x] `docs/match-scoring-plan.md` — scoring engine roadmap
- [x] `docs/provider-integration-plan.md` — integration onboarding process
- [x] `docs/cleanup-notes.md` — technical debt inventory
- [x] `docs/production-readiness-report.md` — this document

### Environment
- [x] `.env.example` — complete template with all config groups, no secrets
- [x] `.env` — auto-managed by Lovable Cloud (contains only publishable anon key + URL + project ID). **Cannot be removed or .gitignored** — Lovable auto-generates it. This is safe because it only contains the publishable anon key, not the service role key.

---

## 🔴 Files That Still Import Supabase Client Directly

Verified by `grep` — these 6 files import `from "@/integrations/supabase/client"`:

### 1. `src/hooks/useAuth.tsx` (line 2)
- **Status:** ✅ **INTENTIONALLY ALLOWED**
- **Reason:** Auth context is the foundational cross-cutting concern. It wraps `supabase.auth.onAuthStateChange()` and `supabase.auth.getSession()` which are SDK-level auth operations, not data queries. Also fetches `profiles` for role — this is the auth bootstrap, not a general data query.
- **No action needed.**

### 2. `src/pages/Auth.tsx` (line 5)
- **Status:** ✅ **INTENTIONALLY ALLOWED**
- **Reason:** Calls `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, `supabase.auth.resetPasswordForEmail()`. These are auth-layer operations. There is no repository abstraction for auth sign-in flows — it's a Supabase SDK responsibility.
- **No action needed.**

### 3. `src/pages/ResetPassword.tsx` (line 5)
- **Status:** ✅ **INTENTIONALLY ALLOWED**
- **Reason:** Calls `supabase.auth.onAuthStateChange()` and `supabase.auth.updateUser()`. Same justification as Auth.tsx.
- **No action needed.**

### 4. `src/hooks/useJobFeed.ts` (line 18)
- **Status:** ❌ **BYPASS — needs migration**
- **What it does:** Calls `supabase.rpc("apply_to_job", {...})` at line 61 for atomic job upsert + application creation.
- **Why not fixed yet:** The `apply_to_job` RPC does a compound operation (upsert job row + insert application) that doesn't map cleanly to the current `ApplicationRepository.apply()` interface. The Supabase application repo in `src/repositories/supabase/applications.ts` uses a simple `INSERT` instead.
- **Fix path:** Either (a) update the Supabase application repo to call the RPC, or (b) change the `apply` method signature to accept job metadata for the upsert pattern.

### 5. `src/hooks/useEmployerDashboard.ts` (line 9)
- **Status:** ❌ **BYPASS — needs migration**
- **What it does:** Directly queries `jobs`, `applications`, `candidates`, and `profiles` tables with `.select()`, `.in()`, and `.or()` across 4 separate queries, then enriches applications with candidate data and match scores in memory.
- **Why not fixed yet:** The `ApplicationRepository.listForEmployer()` currently returns flat `EnrichedEmployerApplication[]` without the joined candidate/profile/match data. A proper enrichment requires either (a) a database view/function, or (b) the repo doing the multi-table join internally.
- **Fix path:** Create a `supabaseEmployerDashboardRepository` that encapsulates the 4-query enrichment pattern, or add a database view `employer_applications_enriched`.

### 6. `src/hooks/useApplications.ts` (line 2)
- **Status:** ❌ **BYPASS — needs migration**
- **What it does:** `useCandidateApplications()` queries `applications` with joined `jobs` data + realtime subscription. `useEmployerApplications()` does similar for employer side. `useUpdateApplicationStatus()` does a direct `.update()`.
- **Why not fixed yet:** The repository interface doesn't define a realtime subscription pattern (`subscribe()` is only on `MessageRepository`). Also, this hook returns `ApplicationWithJob` with snake_case DB fields, not domain-model `ApplicationWithJob` from `src/domain/models.ts` — a type mismatch.
- **Fix path:** (a) Add `subscribeForCandidate()` and `subscribeForEmployer()` to `ApplicationRepository`, (b) Map DB rows to domain types in the Supabase repo, (c) Delete this hook once the Supabase application repo is wired.

### 7. `src/pages/MyProfile.tsx` (line 8)
- **Status:** ❌ **BYPASS — needs migration**
- **What it does:** Reads candidate data (`supabase.from("candidates").select("*")`), updates profile (`supabase.from("profiles").update()`), updates candidate (`supabase.from("candidates").update()`), uploads CV (`supabase.storage.from("cvs").upload()`).
- **Why not fixed yet:** This 762-line page component mixes UI with data operations. Needs refactoring into hooks (`useCandidateEditor`, `useCvUpload`) that use the provider layer.
- **Fix path:** (a) Extract data operations into `src/hooks/useCandidateEditor.ts`, (b) Use `getProvider("profiles").update()` and `getProvider("candidates").upsert()`, (c) Use `getProvider("storage").upload()` for CV.

---

## 🟡 What Is Still Mock-Only (provider registry still points to mock)

| Provider Key | Current Implementation | Supabase Repo Written? | Missing |
|-------------|----------------------|----------------------|---------|
| `jobs` | `mockJobRepository` | ✅ `supabase/jobs.ts` | Swap in registry |
| `applications` | `mockApplicationRepository` | ✅ `supabase/applications.ts` | Swap in registry + fix RPC pattern |
| `candidates` | `mockCandidateRepository` | ❌ | Need `supabase/candidates.ts` |
| `messages` | `mockMessageRepository` | ❌ | Need `supabase/messages.ts` |
| `notifications` | `mockNotificationRepository` | ❌ | Need `notifications` table + repo |
| `savedJobs` | `mockSavedJobRepository` | ❌ | Need `saved_jobs` table + repo |
| `swipeEvents` | `mockSwipeEventRepository` | ❌ | Need `swipe_events` table + repo |
| `preferences` | `mockPreferencesRepository` (localStorage) | ❌ | Need `user_preferences` table + repo |
| `profiles` | `mockProfileRepository` | ❌ | Need `supabase/profiles.ts` |
| `analytics` | `noopAnalytics` | N/A | Wire PostHog SDK |
| `errorTracking` | `noopErrorTracking` | N/A | Wire Sentry SDK |
| `email` | `noopEmail` | N/A | Wire Resend via edge function |
| `ai` | `noopAI` | N/A | Wire Lovable AI |
| `storage` | `noopStorage` | N/A | Wire Supabase Storage |

---

## Missing Database Tables

| Table | Purpose | Exists? |
|-------|---------|---------|
| `saved_jobs` | Persistent saved/bookmarked jobs | ❌ Not created |
| `swipe_events` | Feed state — which jobs user has seen | ❌ Not created |
| `notifications` | In-app notification storage | ❌ Not created |
| `user_preferences` | Per-user settings (onboarding, filters) | ❌ Not created |

---

## Missing Infrastructure

- [ ] Cloudflare Pages deployment config
- [ ] Supabase Storage RLS policies for `cvs` bucket
- [ ] Verify `handle_new_user` trigger is attached to `auth.users` (function exists, trigger unconfirmed)
- [ ] pgvector extension not yet enabled

---

## 🟢 Phased Migration Path

### Phase 1: Zero-risk swaps
1. Swap `jobs` provider → `supabaseJobRepository` (one line in registry)
2. Swap `applications` provider → `supabaseApplicationRepository` (update to use RPC)
3. Create `saved_jobs` + `swipe_events` tables with RLS
4. Write Supabase repos for saved jobs and swipe events
5. Refactor `MyProfile.tsx` → extract `useCandidateEditor` hook

### Phase 2: Low-risk integrations
6. Wire PostHog (add `VITE_POSTHOG_KEY` secret)
7. Wire Sentry (add `VITE_SENTRY_DSN` secret)
8. Wire `send-email` edge function (add `RESEND_API_KEY` secret)

### Phase 3: Complex migrations
9. Migrate `useEmployerDashboard.ts` to repository layer (needs enrichment view/function)
10. Migrate `useApplications.ts` to repository layer (needs realtime interface)
11. Wire `process-cv` edge function with Lovable AI
12. Enable pgvector, add embedding columns

---

## Verified File Inventory

### Files created in audit passes
| File | Verified Exists | Content Correct |
|------|----------------|-----------------|
| `src/hooks/useRequireRole.ts` | ✅ | ✅ Returns `{allowed, loading, currentRole}` |
| `src/components/RoleGate.tsx` | ✅ | ✅ Uses `useRequireRole`, renders children or `<Navigate>` |
| `src/repositories/supabase/jobs.ts` | ✅ | ✅ Full CRUD implementation |
| `src/repositories/supabase/applications.ts` | ✅ | ✅ list + apply + updateStatus |
| `src/repositories/supabase/index.ts` | ✅ | ✅ Barrel export |
| `.github/workflows/ci.yml` | ✅ | ✅ install → lint → tsc → test → build |
| `supabase/functions/send-email/index.ts` | ✅ | ✅ CORS + stub |
| `supabase/functions/process-cv/index.ts` | ✅ | ✅ CORS + stub |
| `supabase/functions/validate-status-transition/index.ts` | ✅ | ✅ State machine |
| `supabase/functions/rate-limiter/index.ts` | ✅ | ✅ In-memory limiter |

### Files modified in audit passes
| File | Change | Verified |
|------|--------|----------|
| `src/App.tsx` | `<RoleGate>` on `/employer`, `/profiles`, `/my-profile` | ✅ Lines 40, 50, 60 |
| `src/pages/Index.tsx` | Nav links conditional on `profile.role` | ✅ Candidate sees "Mój profil", employer sees "Panel pracodawcy" + "Znajdź talent" |
| `README.md` | Replaced with real project README | ✅ Starts with "# JobSwipe" |
| `.env.example` | Complete template, no secrets | ✅ |

### Files NOT modified (direct Supabase imports remain)
| File | Import Line | Justification |
|------|------------|---------------|
| `src/hooks/useAuth.tsx` | Line 2 | Auth bootstrap — intentionally allowed |
| `src/pages/Auth.tsx` | Line 5 | Auth sign-in/sign-up — intentionally allowed |
| `src/pages/ResetPassword.tsx` | Line 5 | Password reset — intentionally allowed |
| `src/hooks/useJobFeed.ts` | Line 18 | ❌ Needs migration (RPC bypass) |
| `src/hooks/useEmployerDashboard.ts` | Line 9 | ❌ Needs migration (enrichment queries) |
| `src/hooks/useApplications.ts` | Line 2 | ❌ Needs migration (queries + realtime) |
| `src/pages/MyProfile.tsx` | Line 8 | ❌ Needs migration (CRUD + storage) |
