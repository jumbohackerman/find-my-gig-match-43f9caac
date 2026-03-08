# Candidate Flows

## Overview

All candidate-side flows are **persistence-ready** and **backend-agnostic**. Business logic lives in dedicated hooks that access data through the provider registry. Page components (`Index.tsx`) are thin UI shells.

## Flow architecture

```
Index.tsx (UI only)
  ├── useJobFeed()         → browse, swipe, apply, reset
  ├── useOnboarding()      → onboarding state + completion
  ├── useSavedJobs()       → saved jobs CRUD
  ├── useNotifications()   → notification list + mark-read
  └── useCandidateApplications() → application list (DB-backed)
```

## Flows

### 1. Browse Jobs

| Step | Hook | Provider | Future DB |
|---|---|---|---|
| Load all jobs | `useJobs()` | `jobs.list()` | `SELECT * FROM jobs WHERE status = 'active'` |
| Apply client filters | `useJobFeed` (in-memory) | — | Future: server-side filtering |
| Calculate match scores | `useJobFeed` → `calculateMatch()` | — | Future: pgvector cosine similarity |
| Track swiped IDs | `useJobFeed` | `swipeEvents.listSwipedJobIds()` | `SELECT job_id FROM swipe_events WHERE user_id = $1` |

### 2. Skip Job (swipe left)

| Step | Provider | Future DB |
|---|---|---|
| Record swipe | `swipeEvents.record(userId, jobId, 'left')` | `INSERT INTO swipe_events (user_id, job_id, direction)` |
| Advance index | Local state | — |

### 3. Save Job (star)

| Step | Provider | Future DB |
|---|---|---|
| Record swipe | `swipeEvents.record(userId, jobId, 'save')` | `INSERT INTO swipe_events ...` |
| Add to saved | `savedJobs.save(userId, jobId)` | `INSERT INTO saved_jobs (user_id, job_id)` |
| Advance index | Local state | — |

### 4. Apply to Job (swipe right)

| Step | Provider | Future DB |
|---|---|---|
| Record swipe | `swipeEvents.record(userId, jobId, 'right')` | `INSERT INTO swipe_events ...` |
| Create application | Direct `supabase.rpc('apply_to_job')` | Already in DB via RPC |
| Refetch applications | `useCandidateApplications().refetch()` | Realtime subscription |

**Note**: The `apply_to_job` RPC is currently called directly from `useJobFeed`. When we create a Supabase `ApplicationRepository`, this will move to `applications.apply()`.

### 5. Apply from Saved

| Step | Provider | Future DB |
|---|---|---|
| Remove from saved | `savedJobs.remove(userId, jobId)` | `DELETE FROM saved_jobs WHERE ...` |
| Create application | Same as "Apply to Job" | Same |

### 6. Onboarding Completion

| Step | Provider | Future DB |
|---|---|---|
| Check if onboarded | `preferences.get(userId, 'onboarded_...')` | `SELECT value FROM candidate_preferences WHERE ...` |
| Save profile data | `useCandidateProfile().updateProfile()` | `UPDATE candidates SET ... WHERE user_id = $1` |
| Mark onboarded | `preferences.set(userId, 'onboarded_...', 'true')` | `INSERT INTO candidate_preferences ...` |

### 7. My Applications

| Step | Provider | Future DB |
|---|---|---|
| List applications | `useCandidateApplications()` | `SELECT *, job:jobs(*) FROM applications WHERE candidate_id = $1` |
| Realtime updates | Supabase channel subscription | `postgres_changes` on `applications` |

### 8. Notifications

| Step | Provider | Future DB |
|---|---|---|
| List notifications | `notifications.listForUser(userId)` | `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC` |
| Mark all read | `notifications.markAllRead(userId)` | `UPDATE notifications SET read = true WHERE user_id = $1` |

### 9. Candidate Preferences

| Step | Provider | Future DB |
|---|---|---|
| Get preference | `preferences.get(userId, key)` | `SELECT value FROM candidate_preferences WHERE user_id = $1 AND key = $2` |
| Set preference | `preferences.set(userId, key, value)` | `UPSERT INTO candidate_preferences ...` |

## Repository mapping

| Provider key | Mock implementation | Future Supabase table |
|---|---|---|
| `jobs` | `mock/jobs.ts` (static data) | `jobs` |
| `savedJobs` | `mock/savedJobs.ts` (in-memory Set) | `saved_jobs` |
| `swipeEvents` | `mock/swipeEvents.ts` (in-memory array) | `swipe_events` |
| `applications` | `mock/applications.ts` | `applications` |
| `notifications` | `mock/notifications.ts` | `notifications` |
| `preferences` | `mock/preferences.ts` (localStorage) | `candidate_preferences` |
| `candidates` | `mock/candidates.ts` | `candidates` + `profiles` |
| `profiles` | `mock/profiles.ts` | `profiles` |
| `messages` | `mock/messages.ts` | `messages` |

## Hook responsibility matrix

| Hook | Business logic | Persistence | UI state |
|---|---|---|---|
| `useJobFeed` | Filter, match score, swipe orchestration | swipeEvents, savedJobs | currentIndex, filters |
| `useSavedJobs` | — | savedJobs | savedJobIds set |
| `useOnboarding` | Onboarding gate logic | preferences, candidates | showOnboarding |
| `useNotifications` | Unread count | notifications | notifications list |
| `useCandidateApplications` | — | Direct Supabase (to migrate) | applications list |
| `useCandidateProfile` | — | candidates | candidate object |
| `usePreferences` | — | preferences | — |

## Migration notes

### What moved out of Index.tsx

| Before | After |
|---|---|
| `useState<Job[]>([])` for savedJobs | `useSavedJobs()` → `SavedJobRepository` |
| `useState<Job[]>([])` for skippedJobs | `useJobFeed()` → `SwipeEventRepository` |
| `useState<Job[]>([])` for appliedJobs | Removed — `dbApplications` is the source of truth |
| Inline `applyToJob` with `supabase.rpc` | Moved to `useJobFeed.applyToJob()` |
| Inline onboarding `useEffect` + handler | `useOnboarding()` hook |
| `localStorage` via `usePreferences` | Same, but now swipe/save state also uses repos |

### What still uses direct Supabase

- `useCandidateApplications` — direct `supabase.from('applications')` queries
- `useJobFeed.applyToJob` — direct `supabase.rpc('apply_to_job')`

These will migrate to `getProvider('applications').apply()` and `getProvider('applications').listForCandidate()` when Supabase repositories are created.
