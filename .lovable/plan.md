

## Problem

When clicking "Aplikuj na to stanowisko" inside the JobDetailModal, the modal closes but the same job card remains visible. The `onApply` callback on line 404 of `Index.tsx` only calls `applyToJob(job)` — it does not advance the card to the next one.

Meanwhile, swiping right (which also applies) uses `handleSwipeWithRefetch("right")`, which both applies AND advances `currentIndex`.

## Fix

**File: `src/pages/Index.tsx`, line 404**

Change the `onApply` handler from:
```ts
onApply={(job) => { applyToJob(job); refetchApps(); }}
```
to:
```ts
onApply={(job) => { handleSwipeWithRefetch("right"); }}
```

This reuses the same swipe-right logic (record swipe event, apply, advance index, refetch apps, trigger exit animation). The modal already calls `onClose()` internally after `onApply`, so it will close and the next card will appear immediately.

**One change, one file, one line.**

