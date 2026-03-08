# Local Fallback & Error Boundary Status

## Architecture

A reusable `LocalErrorBoundary` component (`src/components/LocalErrorBoundary.tsx`) catches render-time errors within a specific panel, modal, or section — preventing a single broken area from crashing the entire page.

Two modes:
- **Standard** — centered fallback with icon, message, retry button (for panels/sections)
- **Compact** (`compact` prop) — single-line inline fallback (for embedded widgets like chat)

Dev-only error details shown via `<details>` when `import.meta.env.DEV` is true.

## Protected Areas

| Area | Component | Mode | Label |
|---|---|---|---|
| Job detail modal | `JobDetailModal.tsx` | standard | "Szczegóły oferty" |
| Candidate profile modal | `CandidateProfileModal.tsx` | standard | "Profil kandydata" |
| Chat panel (employer) | `ChatPanel.tsx` | compact | "Chat" |
| Candidate browse tabs (Index) | `Index.tsx` | standard | "Panel" |
| Employer job list | `Employer.tsx` | standard | "Lista ogłoszeń" |
| Profile form (MyProfile) | `MyProfile.tsx` | standard | "Formularz profilu" |

## What This Covers

- A rendering crash inside a modal won't break the page behind it
- A broken chat widget won't take down the employer card view
- A profile form error won't leave the user stuck with no navigation
- All fallbacks show a retry button that re-mounts the children

## Still Depends on Global / Live Handling

| Scenario | Notes |
|---|---|
| Async/network errors | Handled per-hook with toast; not caught by error boundaries |
| Global uncaught errors | Covered by the existing top-level `ErrorBoundary` in `main.tsx` |
| Suspense boundaries | Not yet used; would complement local boundaries for lazy routes |
| Error logging / reporting | Currently console-only; needs a service (e.g. Sentry) in production |
