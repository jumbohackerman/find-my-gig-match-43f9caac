# Action State Status

Status of pending / success / error UX across core user actions.

## ✅ Implemented

| Action | Pending guard | Success feedback | Error feedback | Retry | File(s) |
|---|---|---|---|---|---|
| **Swipe: Apply (right)** | `actionPending` disables all 3 buttons, shows spinner on apply | Toast "Zaaplikowano na: …" | Toast "Nie udało się zaaplikować" | Card advances; user can re-browse | `useJobFeed.ts`, `Index.tsx` |
| **Swipe: Save (star)** | `actionPending` disables all 3 buttons | Toast "Oferta zapisana ⭐" | Toast "Nie udało się zapisać" | Card advances | `useJobFeed.ts`, `Index.tsx` |
| **Swipe: Skip (left)** | `actionPending` disables all 3 buttons | Silent (expected UX) | Non-blocking console warn | N/A | `useJobFeed.ts`, `Index.tsx` |
| **Apply from Saved list** | Per-item `pendingId` disables button, shows spinner | Toast from applyToJob | Toast from applyToJob | Button re-enables on failure | `SavedList.tsx` |
| **Send message** | `sending` disables input + button, shows spinner | Input clears | Error bar with "Ponów" retry button | Yes — retry resends failed text | `ChatPanel.tsx` |
| **Profile save** | `saving` disables button, shows "Zapisuję..." | Toast "Profil zapisany" | Toast "Nie udało się zapisać profilu" | Button re-enables | `MyProfile.tsx` |
| **Employer: status update** | `statusPending` per-app prevents double-click | Toast "Status zaktualizowany" | Toast with retry message | Button re-enables on failure | `Employer.tsx` |
| **CV upload** | `uploading` state | Toast "CV przesłane" | Toast "Przesyłanie nie powiodło się" | Can re-upload | `MyProfile.tsx` |

## Patterns used

- **Optimistic UI**: Messages use optimistic insert → replace on confirm → remove on failure
- **Guard flags**: `actionPending`, `sending`, `pendingId`, `statusPending` prevent duplicate clicks
- **Toast notifications**: All success/error feedback uses `sonner` toasts
- **Auto-recovery**: All pending flags reset in `finally` blocks — UI never stays permanently disabled

## ⏳ Depends on live backend to fully test

- Apply to job (requires `apply_to_job` RPC + RLS)
- Save job (requires `saved_jobs` table + RLS)
- Send message (requires `messages` table + RLS + realtime)
- Employer status update (requires `applications` table + employer RLS)
- CV upload (requires Supabase Storage bucket `cvs`)
- Swipe event recording (requires `swipe_events` table + RLS)
