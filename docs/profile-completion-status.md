# Profile Completion Status

## Overview
Added targeted completion guidance for both candidate and employer-side flows to encourage account setup with actionable next steps.

## Candidate Completion UX
**Location:** `src/pages/MyProfile.tsx`
- The `computeCompleteness` function has been enhanced to return both the `score` (0-100) and a `missing` array detailing actionable items (e.g., "Dodaj tytuł zawodowy", "Dodaj lokalizację").
- **UI Changes:** Below the completion progress bar, a "Kolejne kroki:" (Next steps) list appears, displaying up to 3 missing items to guide the candidate. A neat truncation handles remaining items (e.g., "...oraz X innych").
- **Evaluation Criteria:**
  1. Professional Title
  2. Location
  3. Summary
  4. Minimum 3 skills
  5. Minimum 1 experience entry
  6. Expected minimum salary
  7. At least one linked profile (portfolio, github, etc.)

## Employer Completion UX
**Location:** `src/pages/Employer.tsx`
- Employers now see a "Gotowość konta pracodawcy" (Employer account readiness) section at the top of their dashboard if their setup is incomplete.
- **Evaluation Criteria:**
  1. Has provided a Company Name/Full Name (checked via auth metadata and DB profile).
  2. Has created at least one job offer.
- **UI Changes:** Displays a progress bar and clear next steps like "Dodaj nazwę firmy w zakładce Mój Profil" and "Opublikuj pierwszą ofertę pracy". Disappears completely once both steps are completed.

## Live Backend Dependencies
- The Employer completeness checks `domainJobs.length` fetched via `useEmployerDashboardData()`, which depends on real Supabase jobs data.
- The Candidate checks rely on `useCandidateProfile()` mapping local or backend candidate data to calculate missing fields.
- Ensuring avatars count toward completion would require integration with live storage files in the future.