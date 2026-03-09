# Suggested Actions UX Status

## Overview
Added lightweight, contextual suggested actions to guide users toward higher-value activities without blocking their core workflows.

## Candidate Flow (`src/pages/Index.tsx`)
- **Location:** At the top of the job swipe stack, below the filter bar.
- **Trigger Conditions:**
  1. Missing CV: If `!candidate.cvUrl`, a suggestion appears: "Zwiększ szanse na odpowiedź. Dodaj CV do profilu" with a direct link to the Profile page.
  2. Unapplied Saved Jobs: If `savedJobs.length > 0` (and CV exists), a suggestion appears: "Masz X zapisanych ofert. Zobacz je!" with a button that shifts the tab view to the 'Saved' list.
- **UX:** Subtle dismissible banner (`bg-secondary/60`).

## Employer Flow (`src/pages/Employer.tsx`)
- **Location:** Inside individual job listing cards, right above the title.
- **Trigger Conditions:**
  1. Incomplete Job Listing: If a job has no tags (`job.tags.length === 0`) or a very short description (`job.description.length < 50`), a suggestion appears: "Wskazówka: Dodaj tagi i dłuższy opis, aby poprawić jakość dopasowań AI."
- **UX:** Subtle inline alert box.

## Dependencies on Live Data
- **Candidate CV Detection:** Relies on `useCandidateProfile()` mapping `cvUrl` from Supabase's `candidates` table.
- **Saved Jobs Count:** Relies on `useJobFeed()` tracking the saved status state, mapping to Supabase's `saved_jobs` table.
- **Job Tags/Description Check:** Assumes `domainJobs` properly fetches and reflects real-time lengths of `description` and `tags` fields from Supabase's `jobs` table.