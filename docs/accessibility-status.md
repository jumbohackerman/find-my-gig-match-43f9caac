# Accessibility Status

## ✅ Improvements Made

### Keyboard Navigation & Focus
| Area | Improvement |
|---|---|
| **All modals** (JobDetail, CandidateProfile, Report, Onboarding) | ESC key closes the modal |
| **JobDetailModal** | Focus trap — Tab cycles within modal; close button auto-focused on open |
| **CandidateProfileModal** | ESC close + auto-focus close button |
| **ReportButton modal** | ESC close + auto-focus close button |
| **OnboardingModal** | ESC close |
| **Navbar notifications** | ESC close + click-outside close |
| **All interactive elements** | Global `focus-visible` ring via CSS (2px solid `--ring`) |
| **Auth forms** | Proper `htmlFor`/`id` label associations, `autoComplete` attributes |

### ARIA & Semantic Roles
| Area | Improvement |
|---|---|
| **Navbar** | `role="banner"`, `<nav aria-label>`, icon-only buttons have `aria-label` |
| **Notification button** | `aria-expanded`, `aria-haspopup`, dynamic `aria-label` with unread count |
| **Notification panel** | `role="region"`, `role="list"` / `role="listitem"` |
| **Index tabs** | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` |
| **Swipe action buttons** | `role="group" aria-label="Akcje swipe"`, each button has `aria-label` via `title` |
| **All modals** | `role="dialog"`, `aria-modal="true"`, `aria-label` with content context |
| **Report reasons** | `<fieldset>` with `<legend class="sr-only">`, `role="radio"` + `aria-checked` |
| **Close buttons** | All have `aria-label="Zamknij"` |
| **Decorative icons** | `aria-hidden="true"` on all decorative icons |
| **Logo links** | Hidden-text labels on icon-only mobile states via `aria-label` |

### Reduced Motion
| Area | Improvement |
|---|---|
| **Global CSS** | `@media (prefers-reduced-motion: reduce)` disables all CSS animations and transitions |
| **Framer Motion** | Framer-motion respects `prefers-reduced-motion` by default (auto-reduces) |

### Auth Form Improvements
| Field | Change |
|---|---|
| Full name | `id="auth-fullname"` + `htmlFor` label + `autoComplete="name"` |
| Email | `id="auth-email"` + `htmlFor` label + `autoComplete="email"` |
| Password | `id="auth-password"` + `htmlFor` label + `autoComplete="current-password"` / `"new-password"` |
| Form element | `aria-label` describing form purpose |

## ⏳ Remaining Gaps for Later Review

| Gap | Notes |
|---|---|
| **Full focus trap** in CandidateProfile/Report/Onboarding modals | ESC works; full Tab cycling trap not yet implemented (only JobDetailModal has it) |
| **Skip to content** link | Not yet added — useful for screen reader users |
| **Employer dashboard** | Complex table/card interactions could benefit from more ARIA roles |
| **Color contrast audit** | Dark theme appears compliant but needs formal WCAG 2.1 AA testing |
| **Screen reader live regions** | Toast notifications (sonner) may need `aria-live` review |
| **Language attribute** | `<html lang="pl">` should be verified in index.html |
| **MyProfile form** | Labels use inline text but not `htmlFor`/`id` associations |
