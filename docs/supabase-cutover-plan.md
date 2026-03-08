# Supabase Cutover Plan

**Date:** 2026-03-08
**Status:** All 10 data providers are already wired to Supabase. This document records the migration history, dependency order, testing plan, and final launch checklist.

---

## 1. Migration History (already applied)

All migrations have been applied to the **Test** environment via Lovable Cloud.

| Phase | Migration | Tables Created | Depends On |
|-------|-----------|---------------|------------|
| 1 (initial) | Core schema | `profiles`, `candidates`, `jobs`, `applications`, `messages` | — |
| 2 | Candidate persistence | `saved_jobs`, `swipe_events` | `jobs` (FK) |
| 3 | Remaining mock replacement | `notifications`, `user_preferences` | — |
| 4 | Security hardening | Storage RLS on `cvs`, profiles employer cross-read | `applications`, `jobs` (join in policies) |

### Migration dependency graph

```
profiles ──────────────────────────────┐
candidates ────────────────────────────┤
jobs ──────┬───────────────────────────┤
           │                           │
           ├── applications ───────────┤
           │       │                   │
           │       ├── messages        │
           │       └── (employer read  │
           │            policies)      │
           ├── saved_jobs              │
           └── swipe_events            │
                                       │
notifications ─────────────────────────┘
user_preferences ──────────────────────┘
```

---

## 2. Provider Switch Order (already completed)

The switch was done in dependency order. This section documents the sequence for reference and rollback planning.

### Wave 1 — Core (no inter-provider dependencies)

These can be switched independently. Order within the wave doesn't matter.

| Provider | Switched To | Independent? | Rollback |
|----------|------------|-------------|----------|
| `jobs` | `supabaseJobRepository` | ✅ Yes | Swap back to `mockJobRepository` in registry |
| `candidates` | `supabaseCandidateRepository` | ✅ Yes | Swap back to `mockCandidateRepository` |
| `profiles` | `supabaseProfileRepository` | ✅ Yes | Swap back to `mockProfileRepository` |
| `storage` | `supabaseStorageService` | ✅ Yes | Swap back to noop (files won't persist) |

**Test after Wave 1:**
- [ ] Sign up as candidate → profile created in DB
- [ ] Edit profile → changes persist after refresh
- [ ] Employer creates job → visible in feed
- [ ] CV upload → file appears in storage bucket

### Wave 2 — Application flow (depends on Wave 1: jobs, candidates)

| Provider | Switched To | Independent? | Rollback |
|----------|------------|-------------|----------|
| `applications` | `supabaseApplicationRepository` | ❌ Depends on `jobs` | Swap to mock; static jobs won't be in DB |
| `messages` | `supabaseMessageRepository` | ❌ Depends on `applications` | Swap to mock; messages won't persist |

**Test after Wave 2:**
- [ ] Swipe right → application created (check for UUID fix on real vs static jobs)
- [ ] Employer dashboard → see applicant with correct candidate data
- [ ] Employer sends message → message persists after refresh
- [ ] Realtime: open two tabs → message appears in both

### Wave 3 — Candidate persistence (depends on Wave 1: jobs)

| Provider | Switched To | Independent? | Rollback |
|----------|------------|-------------|----------|
| `savedJobs` | `supabaseSavedJobRepository` | ⚠️ Depends on `jobs` (FK) | Swap to mock; saved state resets per session |
| `swipeEvents` | `supabaseSwipeEventRepository` | ⚠️ Depends on `jobs` (FK) | Swap to mock; feed resets per session |

**Test after Wave 3:**
- [ ] Save a job → persists after refresh
- [ ] Swipe left → job excluded from feed after refresh
- [ ] Reset feed → all jobs reappear

### Wave 4 — Independent utilities (no dependencies)

| Provider | Switched To | Independent? | Rollback |
|----------|------------|-------------|----------|
| `notifications` | `supabaseNotificationRepository` | ✅ Yes | Swap to mock; notifications empty |
| `preferences` | `supabasePreferencesRepository` | ✅ Yes | Swap to mock (localStorage fallback) |

**Test after Wave 4:**
- [ ] Notification list loads without errors (empty is fine — no triggers yet)
- [ ] Set a preference → persists after refresh (once triggers/UI exist)

---

## 3. Current State Summary

```
┌─────────────────────────────────────────────┐
│           Provider Registry                  │
├──────────────┬──────────────────────────────┤
│ Provider     │ Implementation               │
├──────────────┼──────────────────────────────┤
│ jobs         │ ✅ supabaseJobRepository      │
│ candidates   │ ✅ supabaseCandidateRepository│
│ applications │ ✅ supabaseApplicationRepo    │
│ profiles     │ ✅ supabaseProfileRepository  │
│ messages     │ ✅ supabaseMessageRepository  │
│ storage      │ ✅ supabaseStorageService     │
│ savedJobs    │ ✅ supabaseSavedJobRepository │
│ swipeEvents  │ ✅ supabaseSwipeEventRepo     │
│ notifications│ ✅ supabaseNotificationRepo   │
│ preferences  │ ✅ supabasePreferencesRepo    │
│ analytics    │ 🔇 noopAnalytics             │
│ errorTracking│ 🔇 noopErrorTracking         │
│ email        │ 🔇 noopEmail                 │
│ ai           │ 🔇 noopAI                    │
└──────────────┴──────────────────────────────┘
```

Mock files in `src/repositories/mock/` are **retained but not imported** by the registry. They serve as rollback targets.

---

## 4. Rollback Procedure

If any Supabase provider causes runtime errors:

1. **Identify the failing provider** from console errors (all Supabase repos log `[supabase*Repo]` prefixed errors).
2. **Edit `src/providers/registry.ts`**: swap the failing provider back to its mock implementation.
3. **Import the mock**: re-add the import line (e.g., `import { mockSavedJobRepository } from "@/repositories/mock/savedJobs"`).
4. **Deploy**: the app will fall back to in-memory/localStorage behavior for that provider.

Rollback is per-provider and does not affect other providers.

---

## 5. Final Pre-Launch Checklist

### Database & RLS

- [x] All 9 tables created with RLS enabled
- [x] 33 RLS policies across all tables
- [x] Storage bucket `cvs` has RLS (candidate self-access + employer cross-read)
- [x] Profiles employer cross-read policy added
- [x] `apply_to_job` RPC handles static job upsert atomically
- [x] `handle_new_user` trigger creates profile + candidate on signup
- [x] `get_user_role` security definer function prevents RLS recursion
- [ ] Enable leaked password protection (auth settings toggle)
- [ ] Verify `enable_confirmations = true` for email verification

### Realtime

- [x] `messages` table in `supabase_realtime` publication
- [x] `notifications` table in `supabase_realtime` publication
- [x] Message subscription with dedup + cleanup in `useEmployerMessages`
- [x] Notification subscription in `supabaseNotificationRepository`

### Edge Functions

- [x] All 4 functions have JWT auth validation
- [x] All 4 functions have full Supabase CORS headers
- [x] `process-cv` enforces path ownership (`{userId}/`)
- [x] `rate-limiter` scopes keys with userId prefix
- [ ] Restrict CORS origin from `*` to production domain
- [ ] Wire `validate-status-transition` as DB trigger
- [ ] Integrate `rate-limiter` into apply + message flows

### Code Quality

- [x] All 10 data providers wired to Supabase in registry
- [x] Zero direct Supabase imports in UI components (only in repos/auth)
- [x] Mock implementations retained for rollback
- [x] UUID fix: real UUIDs use direct INSERT, static IDs use RPC

### External Services (post-launch)

- [ ] Connect Resend (`RESEND_API_KEY` secret)
- [ ] Connect PostHog (`VITE_POSTHOG_KEY` — publishable)
- [ ] Connect Sentry (`VITE_SENTRY_DSN` — publishable)
- [ ] Enable AI pipeline in `process-cv`

### Pre-Publish Data Check

- [ ] Verify no test data in Live environment
- [ ] Confirm `handle_new_user` trigger exists in Live
- [ ] Confirm `apply_to_job` RPC exists in Live
- [ ] Confirm `get_user_role` function exists in Live
- [ ] Confirm storage bucket `cvs` exists in Live

---

## 6. Publish Sequence

1. Review all migrations in Lovable Cloud history
2. Verify Live database has all 9 tables + functions + triggers
3. Test critical flows in preview (sign up → profile → apply → employer view)
4. Publish via Lovable
5. Smoke-test on production URL
6. Monitor console for `[supabase*Repo]` errors
