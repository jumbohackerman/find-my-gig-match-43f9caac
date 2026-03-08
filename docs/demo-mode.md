# Demo Mode Strategy

## Principle

Demo mode is **explicit and isolated**. All mock/demo data lives in the mock repository layer (`src/repositories/mock/`) and the static data layer (`src/data/`). Page components and UI components never contain hardcoded demo data.

## Architecture

```
UI Components / Pages
        │
        ▼
    Hooks (useJobs, useCandidates, useNotifications, usePreferences, useCandidateProfile)
        │
        ▼
    Provider Registry (src/providers/registry.ts)
        │
        ├── Demo mode: mock repositories (src/repositories/mock/*)
        │       └── reads from src/data/* (static demo datasets)
        │
        └── Production: Supabase repositories (future)
```

## How demo mode is detected

`isDemoMode()` from `src/providers/registry.ts` returns `true` when mock providers are registered (the default). This can be used by the `DemoBanner` component or any conditional UI.

## Demo data locations

| File | Purpose | Imported by |
|---|---|---|
| `src/data/jobs.ts` | Static job listings | `repositories/mock/jobs.ts` only |
| `src/data/seekers.ts` | Static candidate profiles | `repositories/mock/candidates.ts` only |
| `src/data/defaults.ts` | Fallback values (DEFAULT_CANDIDATE, createFallbackCandidate) | Hooks and Employer.tsx for null-safety |

**Rule**: Files in `src/data/` are NEVER imported by page components or UI components directly. They are consumed exclusively by mock repositories.

## What was moved out of UI layer

| Issue | Before | After |
|---|---|---|
| `DEMO_CANDIDATE` hardcoded in matchScoring.ts | Imported by Index.tsx | Moved to `src/data/defaults.ts`, consumed via `useCandidateProfile` hook |
| Inline `Notification` type in Index.tsx | Local interface in page | Uses `Notification` from `@/domain/models`, loaded via `useNotifications` hook |
| `localStorage` for onboarding flag | Direct `localStorage.getItem` in Index.tsx | Wrapped behind `usePreferences` hook → `PreferencesRepository` |
| Hardcoded fallback candidate in Employer.tsx | 20-line inline object literal | `createFallbackCandidate()` from `src/data/defaults.ts` |
| Chat messages in Employer.tsx | Local state only | Still local state (intentional — messages provider exists for future wiring) |

## localStorage usage

All `localStorage` access for business flows is wrapped behind `PreferencesRepository`:

- **Demo**: `mockPreferencesRepository` uses localStorage directly
- **Production**: will use a `user_preferences` Supabase table

The only remaining direct `localStorage` usage is in `src/integrations/supabase/client.ts` for auth session persistence (managed by Supabase SDK — do not change).

## Switching to production

1. Implement Supabase repositories in `src/repositories/supabase/`
2. In `src/providers/registry.ts`, call `registerProvider()` with real implementations
3. `isDemoMode()` automatically returns `false`
4. No page or component code changes needed

## Notifications

Notifications are wired through `NotificationRepository` → `useNotifications` hook. In demo mode the store is empty. In production, notifications will be populated by database triggers or edge functions when application status changes.

## DemoBanner

`src/components/DemoBanner.tsx` shows a banner when no user is authenticated. It does not contain any business logic or demo data.
