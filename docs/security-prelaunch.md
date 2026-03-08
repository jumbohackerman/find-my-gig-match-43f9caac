# Security Pre-Launch Checklist

**Date:** 2026-03-08 (post security hardening phase)

---

## Current Committed Secrets Analysis

### `.env` (auto-managed by Lovable Cloud)

| Variable | Value Type | Risk | Action |
|----------|-----------|------|--------|
| `VITE_SUPABASE_URL` | Public project URL | ✅ Safe | Designed to be public — used by client SDK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable JWT | ✅ Safe | This is the **anon key**, not the service role key. It's designed to be embedded in client-side code. Security is enforced by RLS policies, not key secrecy. |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | ✅ Safe | Public metadata, not a secret |

**Verdict: No rotation needed.** All values in `.env` are publishable by design.

### `.env` tracking in Git

The `.env` file is **auto-managed by Lovable Cloud** and cannot be removed from tracking. This is acceptable because:
1. It contains only the publishable anon key (equivalent to a public API key)
2. RLS policies enforce all data access rules server-side
3. The service role key is stored in Supabase secrets (never in `.env`)

---

## What Is Safe to Expose Publicly

| Item | Reason |
|------|--------|
| `VITE_SUPABASE_URL` | Public API endpoint — required for client SDK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key — RLS policies are the real access control |
| `VITE_SUPABASE_PROJECT_ID` | Identifier only, no access implications |
| All `VITE_*` feature toggles | Boolean flags, no secrets |
| `VITE_POSTHOG_HOST` default | Public SaaS endpoint |
| `VITE_EMAIL_FROM` | Public sender address |

---

## What Must NEVER Be Committed

| Secret | Where It Lives | Purpose |
|--------|---------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secrets (edge functions only) | Bypasses RLS — full DB access |
| `SUPABASE_DB_URL` | Supabase secrets | Direct Postgres connection string |
| `RESEND_API_KEY` | Supabase secrets (future) | Transactional email sending |
| `SENTRY_AUTH_TOKEN` | CI secrets (future) | Source map upload |
| `POSTHOG_API_KEY` | If using server-side PostHog | Server-side analytics |
| Any `*_SECRET_*` or `*_PRIVATE_*` key | Supabase secrets / CI secrets | Various integrations |

**Rule:** Only `VITE_*` prefixed variables go in `.env`. Backend secrets go in Supabase secrets (accessible from edge functions via `Deno.env.get()`).

---

## Security Posture

### ✅ Secured (implemented)

1. **RLS policies on all 9 tables** — restrictive mode
   - `jobs`: 4 policies (SELECT active/own, INSERT/UPDATE/DELETE employer-owned)
   - `applications`: 5 policies (candidate CRUD, employer SELECT/UPDATE via job ownership)
   - `candidates`: 2 policies (self-manage, employer cross-read via applications)
   - `profiles`: 4 policies (self CRUD + **employer cross-read for applicants**)
   - `messages`: 2 policies (participant SELECT/INSERT)
   - `saved_jobs`: 3 policies (self SELECT/INSERT/DELETE)
   - `swipe_events`: 3 policies (self SELECT/INSERT/DELETE)
   - `notifications`: 3 policies (self SELECT/UPDATE/DELETE, INSERT is server-only)
   - `user_preferences`: 4 policies (self full CRUD)

2. **Storage bucket RLS** ✅ FIXED
   - `cvs` bucket: candidate self-access (INSERT/SELECT/UPDATE/DELETE)
   - Employer cross-read: can read CVs of candidates who applied to their jobs
   - Path enforcement: files must be in `{user_id}/` folder

3. **Profiles cross-read** ✅ FIXED
   - Employers can read profiles of candidates who applied to their jobs
   - Least-privilege: only applicant profiles are visible, not all candidates

4. **Security definer functions** (`get_user_role`, `apply_to_job`) prevent RLS recursion
5. **Role-aware route guards** via `useRequireRole` + `<RoleGate>` in App.tsx
6. **No service role key in client code** — only anon key exposed
7. **Auth enforcement** — all routes require authentication
8. **Provider abstraction** — no direct Supabase queries in UI layer (except auth)

### ✅ Edge Function Security Hardening

All 4 edge functions have been hardened:

| Function | Auth Check | CORS Headers | User Scoping |
|----------|-----------|--------------|--------------|
| `process-cv` | ✅ Token validation | ✅ Full Supabase headers | ✅ Path must match `{userId}/` |
| `send-email` | ✅ Token validation | ✅ Full Supabase headers | ✅ Authenticated users only |
| `rate-limiter` | ✅ Token validation | ✅ Full Supabase headers | ✅ Keys prefixed with userId |
| `validate-status-transition` | ✅ Token validation | ✅ Full Supabase headers | ✅ Authenticated users only |

CORS headers now include all Supabase client headers:
```
authorization, x-client-info, apikey, content-type,
x-supabase-client-platform, x-supabase-client-platform-version,
x-supabase-client-runtime, x-supabase-client-runtime-version
```

### ⚠️ Remaining Risks for Launch

| Risk | Severity | Status | Remediation |
|------|----------|--------|-------------|
| **Leaked password protection** | MEDIUM | ⚠️ Config-only | Enable in Supabase auth settings (not a migration — requires dashboard toggle) |
| **CORS origin wildcard** | LOW | ⚠️ Pre-launch | Replace `*` with production domain before launch. Currently acceptable for development. |
| **No server-side status transition enforcement** | MEDIUM | ⚠️ Planned | `validate-status-transition` exists but is not yet wired as a DB trigger. Client can still call `updateStatus` with any valid status. |
| **Message spam** | LOW | ⚠️ Planned | Rate limiter exists but is not yet integrated into message send flow |
| **Application spam** | LOW | ⚠️ Planned | Rate limiter exists but is not yet integrated into apply flow |
| **No email verification enforcement** | LOW | ⚠️ Config | Verify `enable_confirmations = true` in auth config |

---

## Abuse Prevention Notes

### Application Spam
- **Current protection**: RLS ensures `candidate_id = auth.uid()`, unique constraint on `(candidate_id, job_id)` in the `apply_to_job` RPC prevents duplicate applications.
- **TODO**: Integrate `rate-limiter` edge function to limit applications per candidate per hour (e.g., 20/hour).

### Message Spam
- **Current protection**: RLS ensures only application participants can send messages. `sender_id = auth.uid()` check.
- **TODO**: Integrate `rate-limiter` to limit message sends per user per minute (e.g., 30/minute).

### CV Upload Abuse
- **Current protection**: Storage RLS restricts uploads to `{user_id}/` folder. Only authenticated users.
- **TODO**: Integrate `rate-limiter` to limit uploads per user per day (e.g., 5/day). Add file size validation in `process-cv`.

### Status Transition Abuse
- **Current protection**: Only employers owning the job can update application status (RLS).
- **TODO**: Wire `validate-status-transition` as a Postgres trigger to enforce valid state machine server-side.

---

## Pre-Connection Remediation Steps

### Before connecting Resend
1. Add `RESEND_API_KEY` to Supabase secrets
2. Update `send-email` edge function CORS origin to production domain
3. Verify sender domain in Resend dashboard
4. Test with a non-production email first

### Before connecting PostHog / GA4
1. Set `VITE_POSTHOG_KEY` (publishable key — safe in client code)
2. Set `VITE_ANALYTICS_ENABLED=true`
3. Create PostHog analytics provider in `src/services/posthog.ts`
4. Register in provider registry

### Before connecting Sentry
1. Set `VITE_SENTRY_DSN` (publishable DSN — safe in client code)
2. Set `VITE_ERROR_TRACKING_ENABLED=true`
3. Create Sentry provider in `src/services/sentry.ts`
4. For source maps: add `SENTRY_AUTH_TOKEN` to GitHub Actions secrets

### Before enabling AI pipeline
1. `LOVABLE_API_KEY` is already auto-provisioned
2. Update `process-cv` edge function with actual Lovable AI calls
3. Test with sample CV uploads

---

## Environment Variable Reference

All expected variables are documented in `.env.example`. The config layer (`src/config/index.ts`) is the single access point — no component reads `import.meta.env` directly.

| Group | Variables | Source |
|-------|-----------|--------|
| Supabase | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Auto-provisioned by Lovable Cloud |
| App | `VITE_APP_ENV`, `VITE_APP_BASE_URL`, `VITE_DEMO_MODE` | Developer sets in `.env` |
| Analytics | `VITE_ANALYTICS_ENABLED`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` | Developer sets; key is publishable |
| Error Tracking | `VITE_ERROR_TRACKING_ENABLED`, `VITE_SENTRY_DSN` | Developer sets; DSN is publishable |
| AI | `VITE_AI_ENABLED`, `VITE_AI_DEFAULT_MODEL` | Developer sets; no secret needed |
| Storage | `VITE_STORAGE_CV_BUCKET`, `VITE_STORAGE_MAX_UPLOAD_SIZE` | Developer sets; config only |
| Email | `VITE_EMAIL_ENABLED`, `VITE_EMAIL_FROM` | Developer sets; toggles UI only |
