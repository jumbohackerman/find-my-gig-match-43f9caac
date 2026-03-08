# Recently Viewed Jobs — Status

## ✅ Implemented

| Component | Description | File |
|---|---|---|
| **Hook** | `useRecentlyViewed()` — tracks up to 20 jobs, newest first, deduplicated | `src/hooks/useRecentlyViewed.ts` |
| **List component** | `RecentlyViewedList` — shows viewed jobs with relative timestamps, clear button | `src/components/RecentlyViewedList.tsx` |
| **Tab** | "Ostatnie" tab in candidate view with count badge | `src/pages/Index.tsx` |
| **Tracking** | Views are recorded when job detail modal opens (`openJobModal`) | `src/pages/Index.tsx` |
| **Deep-link** | `/?tab=recent` works like other tabs | `src/pages/Index.tsx` |

## How it works

- **Storage**: `sessionStorage` under key `recently_viewed_jobs`
- **Format**: Array of `{ job: Job, viewedAt: ISO string }`, capped at 20
- **Trigger**: Opening a job detail modal (tap on card, click from any list)
- **Dedup**: Re-viewing a job moves it to the top instead of creating duplicates
- **Clear**: "Wyczyść historię" button appears when >3 entries
- **Difference from Saved**: Saved is intentional (star action); Recent is passive (any view)

## ⏳ What changes with live persistence

| Area | Current | With persistence |
|---|---|---|
| **Storage** | `sessionStorage` (lost on tab close) | `user_preferences` or dedicated `viewed_jobs` table |
| **Cross-device** | Not synced | Synced via DB |
| **Hook swap** | Replace `sessionStorage` calls with `getProvider("recentlyViewed")` | Same interface, different backend |
| **Capacity** | 20 items, client-enforced | Could increase with server-side pagination |
| **Auth dependency** | Works without auth (session-local) | Would require authenticated user |
