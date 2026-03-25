

## Issues identified

1. **Horizontal scrollbar on tab switch** — The non-swipe tabs (applied, saved, recent) use `overflow-y-auto` on the `.browse-shell` container (line 234) without restricting horizontal overflow. Content or motion animations can cause horizontal overflow, producing the visible scrollbar in the "Ostatnie" tab screenshot.

2. **Filters panel causing horizontal overflow** — The skill tags row and the filter grid can extend beyond the container on certain viewports, contributing to the horizontal scrollbar.

## Plan

### File: `src/pages/Index.tsx`

**Line 234** — Add `overflow-x-hidden` to the browse-shell for non-swipe tabs:
```tsx
<div className={`browse-shell flex-1 min-h-0 ${activeTab === "swipe" ? "flex flex-col" : "overflow-y-auto overflow-x-hidden"}`}>
```

### File: `src/index.css`

Add `overflow-x: hidden` to `.browse-shell` as a global safeguard so no child can produce a horizontal scrollbar:
```css
.browse-shell {
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  overflow-x: hidden;
}
```

### File: `src/components/JobFilters.tsx`

Add `overflow-hidden` to the skills flex-wrap container to prevent any skill tag from extending beyond the panel boundary. Also ensure the filter panel itself has `overflow-hidden`:
- Add `overflow-hidden` to the outer `motion.div` wrapper (the collapsible panel)

These are three small, targeted changes — no redesign, no layout restructuring.

