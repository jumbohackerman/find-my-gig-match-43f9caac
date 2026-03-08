# Consistency Report — Repository Contracts vs Product Flows

**Date:** 2026-03-08

## Summary

This report verifies that every product flow is fully covered by repository contracts and that all hooks/pages access data exclusively through the provider registry.

---

## Jobs

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| List active jobs | `useJobs()` | `jobs.list(filters?)` | ✅ Supabase |
| List employer's jobs | `useEmployerDashboard` | `jobs.listForEmployer(id)` | ✅ Supabase |
| Get single job | `useJob(id)` | `jobs.getById(id)` | ✅ Supabase |
| Create job | `useEmployerJobs.createJob()` | `jobs.create(data)` | ✅ Supabase |
| Edit job | `useEmployerJobs.editJob()` | `jobs.update(id, data)` | ✅ Supabase |
| Archive/close job | `useEmployerJobs.archiveJob()` | `jobs.archive(id)` | ✅ Supabase |
| Delete job | `useEmployerJobs.deleteJob()` | `jobs.delete(id)` | ✅ Supabase |

## Applications

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| Apply to job | `useJobFeed.applyToJob()` | `applications.apply(job, candidateId)` | ✅ Supabase (RPC) |
| Candidate's applications | `useCandidateApplications()` | `applications.listForCandidate(id)` | ✅ Supabase |
| Employer's applications | `useEmployerDashboard` | `applications.listForEmployer(id)` | ✅ Supabase |
| Update status | `useUpdateApplicationStatus()` | `applications.updateStatus(id, status, source?)` | ✅ Supabase |
| Shortlist candidate | `useEmployerShortlist` | `applications.updateStatus(id, "shortlisted", source)` | ✅ Supabase |
| AI shortlist | `useEmployerShortlist.generateShortlist()` | batch `updateStatus` calls | ✅ Supabase |
| Replace shortlisted | `useEmployerShortlist.replaceShortlisted()` | 2× `updateStatus` calls | ✅ Supabase |
| Count by status | — | `applications.countByStatus(jobId)` | ✅ Supabase |
| Candidate realtime | `useCandidateApplications()` | `applications.subscribeForCandidate()` | ✅ Supabase |
| Employer realtime | `useEmployerDashboard` | `applications.subscribeForEmployer()` | ✅ Supabase |

## Messages

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| List messages | `useEmployerMessages.loadMessages()` | `messages.listByApplication(id)` | ✅ Supabase |
| Send message | `useEmployerMessages.sendMessage()` | `messages.send(appId, senderId, content)` | ✅ Supabase |
| Realtime messages | — | `messages.subscribe(appId, callback)` | ✅ Supabase |

## Candidates

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| List candidates | `useCandidates(filters?)` | `candidates.list(filters?)` | ✅ Supabase |
| Get own profile | `useCandidateProfile()` | `candidates.getByUserId(id)` | ✅ Supabase |
| Update profile | `MyProfile.tsx` | `candidates.upsert(id, data)` | ✅ Supabase |

## Profiles

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| Get profile | `useAuth` (bootstrap) | `profiles.getByUserId(id)` | ✅ Supabase |
| Update profile | `MyProfile.tsx` | `profiles.update(id, data)` | ✅ Supabase |

## Storage

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| Upload CV | `MyProfile.tsx` | `storage.upload(bucket, path, file)` | ✅ Supabase |
| Get public URL | `MyProfile.tsx` | `storage.getPublicUrl(bucket, path)` | ✅ Supabase |
| Delete file | — | `storage.delete(bucket, path)` | ✅ Supabase |

## Saved Jobs

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| List saved IDs | `useSavedJobs()` | `savedJobs.listIds(userId)` | 🟡 Mock |
| Save job | `useSavedJobs.saveJob()` | `savedJobs.save(userId, jobId)` | 🟡 Mock |
| Remove saved | `useSavedJobs.removeJob()` | `savedJobs.remove(userId, jobId)` | 🟡 Mock |
| Check if saved | `useSavedJobs.isSaved()` | `savedJobs.isSaved(userId, jobId)` | 🟡 Mock |

## Swipe Events

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| Record swipe | `useJobFeed.handleSwipe()` | `swipeEvents.record(userId, jobId, dir)` | 🟡 Mock |
| List swiped IDs | `useJobFeed` (mount) | `swipeEvents.listSwipedJobIds(userId)` | 🟡 Mock |
| Reset feed | `useJobFeed.resetFeed()` | `swipeEvents.clear(userId)` | 🟡 Mock |

## Notifications

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| List notifications | `useNotifications()` | `notifications.listForUser(userId)` | 🟡 Mock |
| Mark all read | `useNotifications.markAllRead()` | `notifications.markAllRead(userId)` | 🟡 Mock |
| Count unread | — | `notifications.countUnread(userId)` | 🟡 Mock |
| Realtime subscribe | — | `notifications.subscribe(userId, cb)` | 🟡 Mock |

## Preferences

| Flow | Hook | Provider Method | Implementation |
|------|------|----------------|----------------|
| Get preference | `usePreferences.get()` | `preferences.get(userId, key)` | 🟡 Mock (localStorage) |
| Set preference | `usePreferences.set()` | `preferences.set(userId, key, value)` | 🟡 Mock (localStorage) |
| Delete preference | — | `preferences.delete(userId, key)` | 🟡 Mock (localStorage) |

---

## Still Missing Supabase Implementations

| Provider | Missing DB Table | Missing Repo |
|----------|-----------------|--------------|
| `savedJobs` | `saved_jobs` | `supabase/savedJobs.ts` |
| `swipeEvents` | `swipe_events` | `supabase/swipeEvents.ts` |
| `notifications` | `notifications` | `supabase/notifications.ts` |
| `preferences` | `user_preferences` | `supabase/preferences.ts` |

These are all wired through the provider registry and will swap with zero UI changes.
