# Server/Client Boundary Review

This document defines the strict boundaries between the frontend application, direct Supabase backend access (via Row Level Security), and secure server-side execution (via Supabase Edge Functions). It outlines how different features of the platform should be architected to ensure security, performance, and maintainability.

## 1. Direct Frontend to Supabase (Frontend-Safe)

These operations are safe to perform directly from the frontend client using the Supabase JS library, relying entirely on PostgREST and Row Level Security (RLS) policies for enforcement.

**Characteristics:**
- Involves simple CRUD operations.
- Security rules can be fully expressed in RLS.
- Does not require third-party API secrets or elevated database privileges.

**Features in this category:**
- **Auth (Supabase GoTrue):** Sign up, sign in, password reset, and session management.
- **Jobs:** Querying active jobs (Candidate), creating/updating own jobs (Employer).
- **Candidate Profiles:** Reading and updating own profile. Employers reading limited profile data of applicants.
- **Messages:** Sending and reading messages within an application context (RLS enforces participation).
- **Notifications/Preferences:** Reading and managing personal preferences and alerts.
- **Saved Jobs / Swipe Events:** Recording and retrieving personal interactions.

## 2. Protected via Database RPC (Security Definer)

These are operations triggered from the frontend but execute securely within the database bypassing standard RLS to perform atomic or complex logical operations safely.

**Characteristics:**
- Requires writing across multiple tables transactionally.
- Involves logic that shouldn't be manipulatable by the client.
- Needs elevated access but only for a very specific, constrained action.

**Features in this category:**
- **Job Application (`apply_to_job`):** Ensures a candidate can only apply once and securely links to job data without exposing the whole jobs table to open inserts.
- **Moderation Actions (`hide_job`, `unhide_job`):** Allows authorized roles to change state and generate audit logs simultaneously.
- **Role Checking (`get_user_role`, `has_role`):** Prevents recursive RLS policy loops while ensuring authoritative role resolution.

## 3. Server-Only execution via Edge Functions

These operations must NEVER be executed directly from the frontend. They require Edge Functions to protect secrets, perform heavy computation, or orchestrate complex side-effects securely.

**Characteristics:**
- Requires third-party API keys (e.g., Email, AI, Analytics).
- Requires elevated `service_role` database access to bypass all RLS.
- Handles complex validation or state machines that shouldn't be duplicated in the client.

**Features in this category:**
- **CV Parsing / AI Processing:** Taking an uploaded CV, sending it to an AI provider (e.g., Lovable AI Gateway / Gemini), and storing the structured output. (Requires AI API secrets).
- **Automated Email Sending:** Triggering transactional emails (e.g., "You have a new message", "Interview scheduled") using services like Resend or SendGrid. (Requires Email API secrets).
- **Demo Data Seed/Reset:** Wiping and repopulating the database for demo purposes. (Requires `service_role` key).
- **Secure File/Storage Deletion:** While users can delete their own files via RLS, cascading deletes (e.g., deleting a user account and all their files) must be handled server-side to ensure complete cleanup.
- **Account Deletion:** Removing a user from Supabase Auth and cascading the deletion across public tables.
- **Advanced State Transitions:** While basic status updates might use RLS, complex transitions (e.g., moving to "Hired" which triggers emails, closes the job, and updates audit logs) should ideally be moved to an Edge Function or complex DB Trigger to ensure consistency.

## 4. Never Exposed to the Client

The following data and capabilities must remain strictly on the server or behind secure infrastructure:

- **Service Role Keys / DB Passwords:** Used only in Edge Functions or administrative scripts.
- **Third-party API Keys:** SendGrid, OpenAI, Stripe, etc.
- **Full User Roles Table (`user_roles`):** The frontend only sees what the `has_role` function returns or what's stamped on their JWT/Profile; it never queries the full role matrix.
- **Complete Audit Logs:** RLS restricts users to seeing only their own generated logs; global audit logs are strictly for Admin/Moderator dashboards or backend analysis.
- **Other Users' Private Data:** Unapplied candidates' contact info, private employer notes, etc., must be strictly filtered via Views or restrictive RLS policies before reaching the client.

## 5. Current Architecture vs. Future Needs (Transition Plan)

### Areas Currently Handled in Client/Mocks that Must Move to Edge Functions

1. **Email Notifications:** Currently mocked or non-existent. Future state: Supabase Database Webhooks trigger an Edge Function (`send-email`) on insert to `messages` or update to `applications`.
2. **Application Status State Machine:** Currently, `src/domain/application-state-machine.ts` validates transitions in the client before sending the update to the DB. 
   - **Risk:** A malicious client could bypass the JS check and send an invalid `UPDATE` directly to PostgREST.
   - **Fix:** Move the transition validation into a Database Trigger (e.g., `BEFORE UPDATE ON applications`) or mandate that status changes go through a dedicated Edge Function (`update-application-status`).
3. **Account Deletion:** Currently not implemented. Must be built as an Edge Function using the Admin API to delete the Auth user.
4. **CV Processing:** The `process-cv` function is scaffolded. It needs to securely read the uploaded file, call the AI gateway, and use a `service_role` client to update the candidate profile, entirely outside the client's control.

### Summary of Repository / Provider Responsibilities

- **Repositories (`src/repositories`):** Continue to act as the boundary layer in the frontend. They encapsulate the PostgREST calls or Edge Function invocations, ensuring UI components remain agnostic to whether an action is a direct DB write or a serverless function call.
- **Providers (`src/providers`):** Manage client-side state and caching (via React Query) based on the repository outputs.

This boundary ensures the frontend remains fast and responsive while securing critical business logic and sensitive integrations behind robust backend infrastructure.