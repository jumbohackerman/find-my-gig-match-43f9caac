# Responsive Pass — Status

## ✅ Files Changed

| File | Changes |
|---|---|
| `src/pages/Index.tsx` | Tabs: horizontal scroll on mobile, smaller padding/font; `scrollbar-none` utility |
| `src/index.css` | Added `.scrollbar-none` utility class |
| `src/components/JobFilters.tsx` | Filter grid: `grid-cols-1 sm:grid-cols-2` |
| `src/pages/Employer.tsx` | Header stacks on mobile; form grids collapse to single column; candidate card layout stacks vertically on small screens |
| `src/pages/MyProfile.tsx` | Header buttons show icons-only on mobile; seniority grid `grid-cols-2 sm:grid-cols-4` |
| `src/pages/Profiles.tsx` | Header responsive padding; nav button icon-only on mobile |
| `src/components/OnboardingModal.tsx` | Seniority grid `grid-cols-2 sm:grid-cols-4` |

## Key Issues Fixed

1. **Tab bar overflow** — Candidate browse tabs now scroll horizontally on narrow screens instead of wrapping/overflowing
2. **Employer form grids** — 2- and 3-column grids collapse to single column on mobile
3. **Employer header** — Title and "Add job" button stack vertically on small screens
4. **Profile header buttons** — Show icon-only on mobile, full text on `sm:` breakpoint
5. **Seniority selectors** — 4-column grid collapses to 2 columns on mobile (MyProfile + Onboarding)
6. **Candidate card (employer)** — Skills and action buttons wrap below candidate info on mobile instead of being cramped to the right
7. **Filter panel** — Dropdowns stack vertically on mobile

## ⏳ Areas Needing Future Device-Specific Testing

| Area | Notes |
|---|---|
| **Swipe card on very small phones** (320px) | Card height uses `clamp()` but tag wrapping may push content; needs manual QA |
| **Employer chat panel** | Input + send button tested structurally but real keyboard interaction on iOS/Android not verified |
| **Modals on landscape mobile** | `max-h-[85vh]` works well in portrait; landscape may reduce visible content significantly |
| **Drag/swipe on tablets** | Touch drag thresholds may feel different on larger touch targets |
| **Select dropdowns (Radix)** | Radix Select on mobile browsers may have z-index or scroll-lock quirks |
