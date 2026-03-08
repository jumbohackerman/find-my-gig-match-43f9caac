# State Polish Status

## Covered Areas

| Area | Loading | Empty | Error/Retry | Notes |
|------|---------|-------|-------------|-------|
| Job feed (swipe) | ✅ Skeleton card | ✅ "Brak ofert" with filter hint | ✅ try/catch in useJobFeed | — |
| Saved jobs | ✅ via parent skeleton | ✅ "Brak zapisanych" + CTA hint | — | — |
| My applications | ✅ Pulse skeletons (3) | ✅ "Brak aplikacji" + swipe hint | — | — |
| Employer dashboard | ✅ Skeleton cards with metrics | ✅ EmptyState "Dodaj ogłoszenie" | — | — |
| Candidate profiles | ✅ CardSkeleton x3 | ✅ EmptyView with search context | — | — |
| My profile | ✅ ProfileSkeleton | n/a | ✅ toast on save error | — |
| Chat panel | n/a (inline) | ✅ "Brak wiadomości" empty | — | — |
| Auth | ✅ Button loading text | n/a | ✅ toast.error on failure | — |

## Reusable Components

All in `src/components/StateViews.tsx`:

- `Skeleton` — generic pulse block
- `CardSkeleton` — list item card skeleton
- `SwipeCardSkeleton` — swipe card shape skeleton
- `ProfileSkeleton` — profile form skeleton
- `EmptyView` — empty state with icon, title, description, optional CTA
- `ErrorView` — error state with retry button
- `Spinner` — inline loading spinner
- `PageLoading` — full page centered spinner

## Remaining Gaps

- **Network error retry**: ErrorView + onRetry is available but not yet wired to hooks that could expose error/refetch pairs. Requires refactoring hooks to expose error state.
- **Employer messages**: Error states for message send failure need live backend to test.
- **Offline indicator**: No offline detection banner yet.
- **Optimistic updates**: Apply/save actions don't show inline loading on the button that was pressed.
