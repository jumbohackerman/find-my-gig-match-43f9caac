# Error & Fallback Status

## ✅ Covered Cases

| Case | Handling | File(s) |
|---|---|---|
| **404 / unknown route** | Branded 404 page with path display, "Przeglądaj oferty" + "Wróć" buttons | `NotFound.tsx` |
| **Uncaught runtime error** | Global `ErrorBoundary` wrapping entire app — shows friendly message with "Odśwież" and "Spróbuj ponownie" | `ErrorBoundary.tsx`, `main.tsx` |
| **Dev error details** | Stack trace shown in collapsible `<details>` only in `import.meta.env.DEV` | `ErrorBoundary.tsx` |
| **Catch-all route** | `<Route path="*">` renders `NotFound` | `App.tsx` |
| **Auth redirect** | Unauthenticated users redirect to `/auth` via `ProtectedRoute` | `App.tsx` |
| **Role mismatch** | `RoleGate` redirects to appropriate page | `App.tsx` |

## Design Consistency

Both fallback pages use:
- Same navbar header with JobSwipe branding + logo link
- Same footer with privacy/terms links
- Same design tokens (`bg-background`, `text-foreground`, `btn-gradient`, etc.)
- Accessible focus rings and aria-labels
- Clear recovery actions (not dead-end pages)

## ⏳ Depends on Live/Deployment to Verify

| Scenario | Notes |
|---|---|
| Server-side 404 (SPA fallback) | Requires hosting config to serve `index.html` for all routes |
| Network failure mid-navigation | Currently unhandled at route level; individual hooks handle their own errors |
| Chunk load failure (code splitting) | Not applicable yet (no lazy routes), but ErrorBoundary would catch it |
| Edge function errors | Handled per-hook with toast messages, not route-level |
