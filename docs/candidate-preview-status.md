# Candidate Profile Preview Status

## Overview
Added a lightweight preview mode to the candidate profile page, allowing users to see exactly how their profile will appear to employers and recruiters before or after saving.

## Implementation Details
1. **Trigger (`MyProfile.tsx`)**
   - Added a "Podgląd" (Preview) button with an eye icon in the top header, exclusively for candidate accounts.
   - Positioned between "Przeglądaj oferty" and "Zapisz profil" actions.

2. **Rendering (`MyProfile.tsx` & `CandidateProfileModal.tsx`)**
   - Reuses the existing `CandidateProfileModal` component (the same one employers see when clicking on an applicant).
   - Generates an in-memory `Candidate` object from the current state of the profile form.
   - This means the preview is "live" and reflects unsaved changes instantly, helping candidates iterate on their profile effectively.

## Live Data Dependencies
- Relies on current component state (`title`, `skills`, `summary`, etc.) mapped into the `Candidate` domain model shape.
- Does not require a backend request to preview; it is entirely client-side.
- The `avatar` defaults to the generic `👤` emoji, as custom avatars are not yet fully implemented for candidates.
