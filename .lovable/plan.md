

## Problem Analysis

From the screenshot and code inspection, three issues:

1. **Buttons not working** — The card container has `overflow-hidden` with a fixed `maxHeight` that clips the card, but the action buttons (X, Star, Check) are **outside** the card in `Index.tsx` (lines 169-191). The real problem is the card stack container height (`clamp(300px, 52vh, 440px)`) is too small — the card itself also uses the same maxHeight, so the card fills the entire container and pushes buttons below the fold. The buttons exist but require scrolling down to reach them.

2. **Card too tall** — The "Dlaczego to pasuje" match section (lines 122-130) and the work mode detail row (lines 142-146) take significant vertical space. The match explainability section with all its bullet points and skill tags makes the card overflow.

3. **Work mode redundancy** — The `Wifi` icon + workMode text duplicates info already shown in the grid icons below tags.

## Plan

### 1. Slim down SwipeCard content (SwipeCard.tsx)
- **Remove** the "Dlaczego to pasuje" match explainability block (lines 122-130) — move this to `JobDetailModal` only (shown on tap)
- **Remove** the work mode row (Wifi icon + workMode) from the details grid (lines 142-146) — already visible in the icon row
- **Remove** the Clock/posted row from the details grid (lines 147-149) — already shown in the header next to company name
- This leaves a compact grid with just Location + Job Type (2 items instead of 4)
- Keep tags but limit to first 4 tags with `slice(0, 4)` to prevent overflow

### 2. Fix card + button layout (Index.tsx + SwipeCard.tsx)
- **Reduce** card stack container height to `clamp(260px, 42vh, 380px)` so buttons are always visible
- **Match** the card's internal maxHeight to the same value
- This ensures card + buttons + counter all fit in viewport without scrolling

### 3. Ensure buttons are clickable
- The buttons in Index.tsx (lines 169-191) are already wired to `handleSwipeWithRefetch`. The issue is purely that they're pushed off-screen. Fixing the height resolves this.

### Files to change
- `src/components/SwipeCard.tsx` — remove match explainability block, remove work mode + clock rows, limit tags
- `src/pages/Index.tsx` — reduce card stack container height

