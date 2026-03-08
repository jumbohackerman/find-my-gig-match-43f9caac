# Production Readiness Report

**Date:** 2026-03-08 (post saved_jobs + swipe_events migration)
**Target Stack:** Lovable → GitHub → Cloudflare Pages + Supabase + Edge Functions + Resend + PostHog/GA4 + Sentry

---

## Provider Registry — Current State

### ✅ Supabase (live)

| Provider | Repo File | Key Methods |
|----------|-----------|-------------|
| `jobs` | `supabase/jobs.ts` | `list`, `listForEmployer`, `getById`, `create`, `update`, `archive`, `delete` |
| `applications` | `supabase/applications.ts` | `listForCandidate`, `listForEmployer`, `apply` (RPC), `updateStatus`, `countByStatus`, `subscribeForCandidate`, `subscribeForEmployer` |
| `candidates` | `supabase/candidates.ts` | `list`, `getByUserId`, `upsert` |
| `profiles` | `supabase/profiles.ts` | `getByUserId`, `update` |
| `messages` | `supabase/messages.ts` | `listByApplication`, `send`, `subscribe` |
| `storage` | `supabaseStorage.ts` | `upload`, `getPublicUrl`, `delete` |
| `savedJobs` | `supabase/savedJobs.ts` | `listIds`, `save`, `remove`, `isSaved` |
| `swipeEvents` | `supabase/swipeEvents.ts` | `record`, `listSwipedJobIds`, `clear` |

### 🟡 Mock (DB tables not yet created)

| Provider | Mock File | Needs Table |
|----------|-----------|-------------|
| `notifications` | `mock/notifications.ts` | `notifications` |
| `preferences` | `mock/preferences.ts` | `user_preferences` |

### 🟡 Noop (pending external integration)

| Provider | Future Service |
|----------|---------------|
| `analytics` | PostHog / GA4 |
| `errorTracking` | Sentry |
| `email` | Resend |
| `ai` | Lovable AI |

---

## Repository Contract Coverage

All 9 repository interfaces now fully cover every product flow:

- **JobRepository**: list, listForEmployer, getById, create, update, archive, delete
- **ApplicationRepository**: apply (RPC), listForCandidate, listForEmployer, updateStatus (with source), countByStatus, subscribeForCandidate, subscribeForEmployer
- **MessageRepository**: listByApplication, send, subscribe (realtime)
- **CandidateRepository**: list (with filters), getByUserId, upsert
- **ProfileRepository**: getByUserId, update
- **SavedJobRepository**: listIds, save, remove, isSaved ✅ **(Supabase)**
- **SwipeEventRepository**: record, listSwipedJobIds, clear ✅ **(Supabase)**
- **NotificationRepository**: listForUser, markRead, markAllRead, countUnread, subscribe
- **PreferencesRepository**: get, set, delete

---

## Files That Import Supabase Directly (all allowed)

| File | Reason |
|------|--------|
| `src/hooks/useAuth.tsx` | Auth bootstrap |
| `src/pages/Auth.tsx` | Sign-in/sign-up |
| `src/pages/ResetPassword.tsx` | Password reset |
| `src/repositories/supabase/*.ts` | ARE the abstraction boundary |
| `src/services/supabaseStorage.ts` | IS the storage service |

---

## Security

- RLS on all 7 existing tables (jobs, applications, candidates, profiles, messages, saved_jobs, swipe_events)
- Role-aware route guards in App.tsx
- Navigation guards in Index.tsx
- Storage bucket `cvs` needs RLS policies (documented in security-prelaunch.md)

---

## Missing Infrastructure

- [ ] DB tables: `notifications`, `user_preferences`
- [ ] Storage RLS for `cvs` bucket
- [ ] Cloudflare Pages config
- [ ] pgvector extension
- [ ] Realtime publication for `messages` table
