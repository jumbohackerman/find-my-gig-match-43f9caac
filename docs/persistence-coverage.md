# Persistence Coverage Report

**Date:** 2026-03-08

---

## Summary

8 of 9 repository interfaces are now backed by Supabase. Only `notifications` and `preferences` remain mock.

## Database Tables

| Table | Status | RLS | Indexes | Constraints |
|-------|--------|-----|---------|-------------|
| `jobs` | ✅ Live | ✅ 4 policies | PK | — |
| `applications` | ✅ Live | ✅ 5 policies | PK | FK → jobs |
| `candidates` | ✅ Live | ✅ 2 policies | PK | — |
| `profiles` | ✅ Live | ✅ 3 policies | PK | — |
| `messages` | ✅ Live | ✅ 2 policies | PK | FK → applications |
| `saved_jobs` | ✅ Live | ✅ 3 policies | PK, idx_user_id | FK → jobs, UNIQUE(user_id, job_id) |
| `swipe_events` | ✅ Live | ✅ 3 policies | PK, idx_user_id | FK → jobs, UNIQUE(user_id, job_id), enum direction |

## Provider Registry Mapping

| Provider Key | Implementation | File |
|---|---|---|
| `jobs` | Supabase | `repositories/supabase/jobs.ts` |
| `candidates` | Supabase | `repositories/supabase/candidates.ts` |
| `applications` | Supabase | `repositories/supabase/applications.ts` |
| `profiles` | Supabase | `repositories/supabase/profiles.ts` |
| `messages` | Supabase | `repositories/supabase/messages.ts` |
| `storage` | Supabase | `services/supabaseStorage.ts` |
| `savedJobs` | **Supabase** | `repositories/supabase/savedJobs.ts` |
| `swipeEvents` | **Supabase** | `repositories/supabase/swipeEvents.ts` |
| `notifications` | Mock | `repositories/mock/notifications.ts` |
| `preferences` | Mock | `repositories/mock/preferences.ts` |

## Remaining Blockers

1. **notifications** — needs `notifications` table + Supabase repo
2. **preferences** — needs `user_preferences` table + Supabase repo
3. **Realtime** — `messages` table not yet added to `supabase_realtime` publication
4. **Storage RLS** — `cvs` bucket needs RLS policies

## Migration Details

### saved_jobs
- `id` UUID PK
- `user_id` UUID (not FK to auth.users — matches project pattern)
- `job_id` UUID FK → jobs(id) ON DELETE CASCADE
- `created_at` timestamptz DEFAULT now()
- UNIQUE(user_id, job_id)
- RLS: SELECT/INSERT/DELETE scoped to `auth.uid()`

### swipe_events
- `id` UUID PK
- `user_id` UUID
- `job_id` UUID FK → jobs(id) ON DELETE CASCADE
- `direction` enum `swipe_direction` ('left', 'right', 'save')
- `created_at` timestamptz DEFAULT now()
- UNIQUE(user_id, job_id)
- RLS: SELECT/INSERT/DELETE scoped to `auth.uid()`
