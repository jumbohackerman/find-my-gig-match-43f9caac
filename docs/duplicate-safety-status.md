# Duplicate-Action Safety — Status

## ✅ Protected Flows

| Flow | File | Mechanism |
|---|---|---|
| **Swipe (apply/skip/save)** | `src/hooks/useJobFeed.ts` | `actionPending` state guard; early return if pending |
| **Apply from saved** | `src/hooks/useJobFeed.ts` | `actionPending` guard added; prevents double apply |
| **Save / Unsave job** | `src/hooks/useSavedJobs.ts` | Per-operation `pendingOps` ref set; idempotent per job ID |
| **Report submit** | `src/components/ReportButton.tsx` | `sending` guard + `disabled` on button; early return if already sending |
| **Message send** | `src/components/employer/ChatPanel.tsx` | `sending` guard + `disabled` on button + retry on failure (already existed) |
| **Profile save** | `src/pages/MyProfile.tsx` | `saving` guard with early return; button `disabled` + `aria-busy` |
| **Hide / Unhide job** | `src/pages/Employer.tsx` | `hidePending` state per job ID; button `disabled` while in-flight |
| **Advance status** | `src/pages/Employer.tsx` | `statusPending` state guard (already existed) |
| **Create job** | `src/hooks/useEmployerJobs.ts` | `submitting` guard with early return; button `disabled` |

## Files Changed

| File | Change |
|---|---|
| `src/hooks/useSavedJobs.ts` | Added `pendingOps` ref for per-job idempotency on save/remove |
| `src/hooks/useJobFeed.ts` | Added `actionPending` guard to `applyFromSaved` |
| `src/hooks/useEmployerJobs.ts` | Added `submitting` early-return guard to `createJob` |
| `src/components/ReportButton.tsx` | Added `sending` to early-return condition |
| `src/pages/MyProfile.tsx` | Added `saving` to early-return condition |
| `src/pages/Employer.tsx` | Added `hidePending` state for hide/unhide idempotency |

## ⏳ Still Depends on Backend/DB Constraints

| Area | Notes |
|---|---|
| **Duplicate applications** | Frontend guards prevent double-click, but true idempotency requires a DB unique constraint on `(candidate_id, job_id)` in `applications` |
| **Duplicate saved jobs** | Same — a unique constraint on `(user_id, job_id)` in `saved_jobs` would be the final safety net |
| **Duplicate reports** | A unique constraint on `(reporter_id, target_id, target_type)` would prevent re-reporting the same target |
| **Duplicate swipe events** | A unique constraint on `(user_id, job_id)` in `swipe_events` prevents duplicate swipes at DB level |
| **Race conditions across tabs** | If the user has multiple tabs open, frontend guards per-tab won't prevent cross-tab duplicates — only DB constraints solve this |
| **Optimistic UI rollback** | Save/unsave updates state optimistically; on failure the ref clears but state may be stale if the network call partially succeeded |
