# Live Supabase Rollout: Migration Rehearsal & Rollback Plan

**Date:** 2026-03-09
**Status:** Planned

This document outlines the step-by-step strategy for rolling out the Supabase backend to the **Live** environment. It includes the rehearsal approach, migration order, verification checkpoints, and a concrete rollback strategy to minimize risk.

---

## 1. Staging Rehearsal Strategy

Before touching the Live environment, the entire cutover must be rehearsed.

1. **Provision Staging**: Use the Lovable Test environment (or a dedicated staging project) as a clean slate.
2. **Execute Migrations**: Apply all pending `.sql` files in chronological order.
3. **Execute Triggers**: Manually insert a test user into `auth.users` to confirm the `handle_new_user` trigger fires and creates `profiles` and `candidates` rows.
4. **Run E2E Suite**: Execute `npx playwright test` to verify all candidate and employer flows work against the real database.
5. **Simulate Rollback**: Pick one complex migration (e.g., adding `applications`) and manually run its rollback script to ensure no deadlocks occur.

---

## 2. Migration Sequence & Dependency Order

Migrations must be applied in this exact wave sequence to satisfy foreign key and function dependencies.

| Wave | Entities | Dependencies | Notes |
|---|---|---|---|
| **1. Enums & Types** | Custom ENUMs (e.g., `app_role`, `job_status`) | None | Foundation for all tables |
| **2. Base Auth Tables** | `profiles`, `candidates` | None | Triggers rely on these |
| **3. Core Business** | `jobs` | `companies` (if added) | Base for all interactions |
| **4. Interactions** | `applications`, `saved_jobs`, `swipe_events` | `jobs`, `candidates` | FKs require Jobs to exist |
| **5. Communication** | `messages`, `notifications` | `applications` | Requires active application context |
| **6. Utilities** | `reports`, `audit_log`, `user_preferences` | Base tables | Standalone tracking features |
| **7. Logic & Triggers** | `handle_new_user`, `apply_to_job`, `get_user_role` | All Tables | Must be created after tables to avoid missing relation errors |
| **8. Storage RLS** | `cvs` bucket policies | `applications`, `jobs` | Requires join policies |

---

## 3. Verification Checkpoints

After applying migrations in the Live environment, perform these manual/automated checks before routing user traffic:

### Checkpoint 1: Database Integrity (Post-Schema)
- [ ] Connect to Live DB via Cloud UI.
- [ ] Verify all 12+ tables exist in the `public` schema.
- [ ] Run `SELECT * FROM pg_policies;` to confirm RLS is active on all tables.

### Checkpoint 2: Auth Triggers (Post-Logic)
- [ ] Sign up as a new test user via the Live frontend.
- [ ] Verify a `profiles` record is automatically created.
- [ ] Verify a `candidates` record is created (if role is candidate).

### Checkpoint 3: RPCs & Storage (Post-Cutover)
- [ ] Upload a dummy PDF in the candidate profile; verify it lands in the `cvs` bucket.
- [ ] Employer creates a job, candidate applies; verify `apply_to_job` RPC succeeds atomically.

---

## 4. Post-Migration Seed & Reset

Once the schema is verified, use the Edge Functions to prepare the environment:

1. **Clean Slate**: 
   Run `curl -X POST .../reset-demo-data` to wipe any accidental test data generated during the verification checkpoints.
2. **Seed Initial State**: 
   Run `curl -X POST .../seed-demo-data` to insert standard demo accounts (`candidate@demo.jobswipe.pl`, `employer@demo.jobswipe.pl`) and lookup data.
3. **Final Smoke Test**: 
   Log in with the seeded demo accounts to ensure dashboards load without 500/403 errors.

---

## 5. Rollback Guidance

If a critical failure occurs during or immediately after the cutover:

### Scenario A: Schema Migration Fails Mid-Deployment
*   **Action**: Execute the specific `-- Rollback:` comments documented at the top of the failing migration file.
*   *Example*: If `applications` fails, run `DROP TABLE applications CASCADE;` to remove partial creations.

### Scenario B: Application Crashes on Live (Code/DB Mismatch)
*   **Action**: 
    1. Revert the Lovable app deployment to the previous stable commit (which relies on local storage/mocks).
    2. Update `src/providers/registry.ts` to swap `supabase*Repository` back to `mock*Repository`.
    3. Redeploy the UI. This isolates the broken DB from the live traffic.

### Scenario C: Data Corruption or Bad Trigger
*   **Action**: If user data is corrupted, use Supabase Point-in-Time Recovery (PITR) to restore the database to the exact minute before the cutover began.

---

## 6. Avoiding Current Flow Breakages

To achieve a **zero-downtime cutover**:

1. **Additive Schema First**: Deploy all database tables, columns, and RLS policies **before** deploying the frontend code that reads/writes to them.
2. **Feature Flags**: Keep the `src/providers/registry.ts` configured to use Mock providers while deploying the DB. 
3. **Silent Cutover**: Once the DB is verified (Checkpoint 1 & 2), flip the registry to Supabase providers and deploy just the UI changes.
4. **No Destructive Drops**: Do not drop legacy tables or remove mock code files until the Supabase implementation has been stable in Live for at least 48 hours.