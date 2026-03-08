# Cleanup Notes

> Audit performed 2026-03-08. Tracks dead code removed, duplicates consolidated,
> and future-sensitive areas requiring attention before production.

## Dead Code Removed

| File | Reason |
|------|--------|
| `src/components/DemoBanner.tsx` | Not imported anywhere |
| `src/components/NavLink.tsx` | Not imported anywhere |
| `src/components/AppliedList.tsx` | Replaced by `ApplicationStatusList.tsx`, not imported |
| `dbCandidateToProfile()` in `lib/matchScoring.ts` | Deprecated, no callers |

## Duplicates Consolidated

| Duplicate | Canonical Location | Notes |
|-----------|-------------------|-------|
| `ApplicationStatus` type in `types/application.ts` | `domain/models.ts` | `types/application.ts` now re-exports from domain |
| `ApplicationSource` type in `types/application.ts` | `domain/models.ts` | Same |
| `ApplicationWithJob` in `hooks/useApplications.ts` | `domain/models.ts` | Hook still has its own shape (DB-level); will converge when hook uses provider |
| `DbCandidate`, `DbJob` in `useEmployerDashboard.ts` | Inline types for raw DB rows | Acceptable until Supabase repos replace direct queries |

## Direct Backend Access (To Migrate)

These files bypass the provider registry and call Supabase directly:

| File | What it does | Migration path |
|------|-------------|----------------|
| `hooks/useApplications.ts` | All 4 hooks query `supabase.from("applications")` | Move to `ApplicationRepository` |
| `hooks/useEmployerDashboard.ts` | Queries jobs, applications, candidates, profiles | Move to enriched `ApplicationRepository.listForEmployer()` |
| `hooks/useJobFeed.ts` | `supabase.rpc("apply_to_job")` | Move to `ApplicationRepository.apply()` |

## localStorage Usage

| File | Usage | Risk | Plan |
|------|-------|------|------|
| `repositories/mock/preferences.ts` | Wraps localStorage for demo prefs | Low — behind adapter | Replace with Supabase `user_preferences` table |
| `integrations/supabase/client.ts` | Auth session persistence | None — standard Supabase pattern | Keep |

## Route & Role Separation

| Route | Expected Role | Guard |
|-------|--------------|-------|
| `/` (Index) | candidate | `useAuth()` → redirects to `/auth` if no session |
| `/employer` | employer | `useAuth()` — **no role check yet** |
| `/profiles` | employer | `useAuth()` — **no role check yet** |
| `/my-profile` | candidate | `useAuth()` |
| `/auth` | any | Public |

### ⚠️ Issue: Missing Role Guards

`/employer` and `/profiles` are accessible to candidates. Future fix:
- Add `useRequireRole("employer")` hook that checks `profiles.role`
- Redirect unauthorized users to `/`
- Backend RLS already prevents data leaks, but UI should match

## Future-Sensitive Areas

### 1. CV Files (`cvs` Storage Bucket)

- **Current**: Bucket is private, RLS not yet enforced at storage level
- **Risk**: If storage policies are missing, any authenticated user could access any CV
- **Fix needed**: Add storage RLS policies:
  - Owner can upload/read/delete own CVs
  - Employers can read CVs only for candidates who applied to their jobs
  - See `docs/rls-plan.md` § Storage Policies

### 2. Profile Data (PII)

- **Current**: `profiles` table has SELECT restricted to own user
- **Risk**: Employer can't see candidate names/avatars — but `useEmployerDashboard` joins profiles directly
- **Fix needed**: The RPC/view approach in `rls-plan.md` should expose only necessary profile fields to employers

### 3. Private Messaging

- **Current**: RLS correctly scopes messages to application participants
- **Risk**: No message content sanitization; no rate limiting
- **Fix needed**: 
  - Add edge function for message sending with rate limits
  - Sanitize HTML/XSS in message content
  - Consider message encryption for sensitive discussions

### 4. Application Status Changes

- **Current**: Employers can update any application status to any value
- **Risk**: No validation of valid status transitions (e.g., can set "hired" directly)
- **Fix needed**: Add a DB trigger or edge function to validate status transitions

### 5. Employer-Candidate Boundary

- **Current**: Role stored in `profiles.role` (single editable text field)
- **Risk**: User could potentially change own role if UPDATE policy is too broad
- **Current mitigation**: UPDATE policy uses `user_id = auth.uid()` — user can edit own profile including role
- **Fix needed**: 
  - Move to `user_roles` table as planned in `docs/rls-plan.md`
  - Make role immutable via RLS (no UPDATE on role column)
  - Or use a trigger to prevent role changes

### 6. System-Seeded Jobs

- **Current**: `employer_id = '00000000-0000-0000-0000-000000000000'` for demo jobs
- **Risk**: Any employer sees these in their dashboard via the OR clause
- **Fix needed**: Flag system jobs with a `is_seed` boolean or separate them from employer queries

## Files Retained (Not Dead, But Worth Noting)

| File | Status | Notes |
|------|--------|-------|
| `src/data/seekers.ts` | Used by `mock/candidates.ts` | Remove when Supabase repo replaces mock |
| `src/data/jobs.ts` | Used by `mock/jobs.ts` | Same |
| `src/data/defaults.ts` | Used by `useCandidateProfile`, `useEmployerApplications` | Keep — provides fallbacks |
| `src/services/noop.ts` | All no-op service impls | Keep until real services are added |
| `src/test/example.test.ts` | Placeholder test | Replace with real tests |
