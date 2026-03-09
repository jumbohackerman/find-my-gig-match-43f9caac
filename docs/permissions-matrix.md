# Permissions Matrix & Access Control

This document serves as the single source of truth for all entity permissions across the platform. It maps out which actors can perform which actions on which entities, and outlines how these rules are enforced across the stack.

## 1. Actor Definitions

- **Guest**: Unauthenticated user.
- **Candidate**: Authenticated user seeking jobs (`profiles.role = 'candidate'`).
- **Employer**: Authenticated user posting jobs (`profiles.role = 'employer'`).
- **Moderator**: Elevated user responsible for content safety (future implementation via `user_roles`).
- **Admin**: Superuser with full system access (future implementation via `user_roles`).

## 2. Permissions Matrix

**Legend**: 
- **C** = Create / Insert
- **R** = Read / Select
- **U** = Update
- **D** = Delete
- **❌** = No Access

| Entity / Feature | Guest | Candidate | Employer | Moderator | Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Jobs** | ❌ | R *(Active)* | C, R *(Active + Own)*, U *(Own)*, D *(Own)* | R *(All)*, U *(Hide/Unhide via RPC)* | Full CRUD |
| **Applications** | ❌ | C, R *(Own)*, D *(Withdraw)* | R, U *(Status for own jobs)* | R *(If reported)* | Full CRUD |
| **Candidate Profiles** | ❌ | R, U *(Own)* | R *(Only applicants to own jobs)* | R *(All)* | Full CRUD |
| **Employer Profiles** | ❌ | R *(Implicit via jobs)* | R, U *(Own)* | R *(All)* | Full CRUD |
| **CVs / Storage** | ❌ | C, R, D *(Own)* | R *(Only applicants to own jobs)* | R *(All)* | Full CRUD |
| **Messages** | ❌ | C, R *(If participant)* | C, R *(If participant)* | R *(If reported)* | R *(All)* |
| **Reports** | ❌ | C, R *(Own submissions)* | C, R *(Own submissions)* | R, U *(Review & Status)* | Full CRUD |
| **Audit Logs** | ❌ | R *(Own actions)* | R *(Own actions)* | R *(System-wide)* | R *(All)* |
| **Saved Jobs/Swipes**| ❌ | C, R, U, D *(Own)* | ❌ | ❌ | R *(All)* |
| **Notifications** | ❌ | R, U, D *(Own)* | R, U, D *(Own)* | ❌ | R *(All)* |

---

## 3. Enforcement Strategy

Access control is enforced in layers. **Frontend checks are strictly for UX; backend RLS is the actual security boundary.**

### Layer 1: Frontend (UX & Routing)
- **Mechanism**: React Router `<ProtectedRoute>`, `<RoleGate>`, and UI conditional rendering (e.g., hiding the "Edit" button if not the owner).
- **Purpose**: Prevent users from seeing irrelevant UI, provide quick redirects for unauthorized access.
- **Limitation**: Easily bypassed by interacting with the API directly. Never rely on this for actual data security.

### Layer 2: Backend (Row Level Security - RLS)
- **Mechanism**: PostgreSQL RLS policies attached to each table.
- **Purpose**: The primary security layer. Enforces that `SELECT`, `INSERT`, `UPDATE`, and `DELETE` queries only return or modify rows the `auth.uid()` is authorized for.
- **Pattern**: Uses `auth.uid()` and fast, optimized subqueries (e.g., checking if `auth.uid()` owns the job an application is tied to).

### Layer 3: Edge Functions & RPC (Security Definer)
- **Mechanism**: Supabase Edge Functions and PostgreSQL functions marked with `SECURITY DEFINER`.
- **Purpose**: For actions that require elevated privileges that the user doesn't natively have, or for wrapping complex multi-table mutations into a single atomic transaction.
- **Examples**: 
  - `apply_to_job()`: Atomically creates an application and verifies job constraints.
  - `hide_job()` / `unhide_job()`: Allows moderators to change job status without granting them direct `UPDATE` privileges on the entire `jobs` table.
  - Automated emails: Edge Functions listening to Webhooks to email users based on status changes.

---

## 4. Current Permission Inconsistencies & Gaps

As of the current implementation, the following mismatches exist between the intended matrix and actual backend enforcement:

1. **Guest Access in RLS vs UI**: 
   - The UI strictly redirects unauthenticated users to `/auth`. 
   - However, the `jobs` RLS policy `(status = 'active'::text) OR (employer_id = auth.uid())` technically does not explicitly require `auth.role() = 'authenticated'`. A direct API call without a token might fetch active jobs. 
   - **Fix**: Update RLS to explicitly check `auth.role() = 'authenticated'` if we want a strict walled garden.

2. **Moderator & Admin Roles**:
   - The matrix defines Moderator and Admin, but the actual database currently lacks a `user_roles` table. 
   - Roles are checked via `profiles.role`, which is just 'candidate' or 'employer'. 
   - **Fix**: Implement the `user_roles` schema defined in `docs/rls-plan.md` and integrate it into RLS via a `has_role()` security definer function.

3. **Application RLS "RESTRICTIVE" Note**:
   - Earlier plans (`docs/rls-plan.md`) noted that applications had a mismatch with `RESTRICTIVE` policies, though the current schema defines them as `PERMISSIVE` (which is standard). This needs to be actively audited to ensure employer application views don't accidentally union candidate views.

4. **Account Deletion**:
   - Users currently cannot `DELETE` their own profiles due to missing RLS `DELETE` policies on the `profiles` table. 
   - **Fix**: Account deletion should ideally be handled by an Edge Function that cleans up Supabase Auth and all cascading user data atomically, rather than raw RLS deletes.

5. **Storage Bucket RLS**:
   - `cvs` bucket policies must be strictly bound to the `employer_id` subqueries (as defined in `rls-plan.md`) to prevent candidates from iterating through URLs and reading others' CVs.

6. **Missing Report/Moderation Logic**:
   - The `reports` table exists, but the UI and backend logic to transition a job to `hidden` via a Moderator dashboard is not yet wired up.
