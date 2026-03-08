# Final Readiness Report

**Date:** 2026-03-08
**Audited from:** Lovable workspace code (not docs or summaries)

---

## 1. Truly Ready Now

These are live in the registry, backed by Supabase tables with RLS, and actively used by UI code.

| Provider | Registry Import | DB Table | RLS Policies | Realtime | Called By |
|----------|----------------|----------|-------------|----------|-----------|
| `jobs` | `supabaseJobRepository` | `jobs` | 4 | — | `useJobs`, `useJobFeed`, `useEmployerJobs` |
| `candidates` | `supabaseCandidateRepository` | `candidates` | 2 | — | `useCandidateProfile`, `useCandidates`, employer dashboard |
| `applications` | `supabaseApplicationRepository` | `applications` | 5 | — | `useJobFeed.applyToJob`, `useApplications`, `useEmployerDashboard` |
| `profiles` | `supabaseProfileRepository` | `profiles` | 4 | — | `useAuth` (indirect), `MyProfile`, employer cross-read |
| `messages` | `supabaseMessageRepository` | `messages` | 2 | ✅ | `useEmployerMessages` |
| `storage` | `supabaseStorageService` | `cvs` bucket | 5 | — | `MyProfile` CV upload |
| `savedJobs` | `supabaseSavedJobRepository` | `saved_jobs` | 3 | — | `useSavedJobs`, `useJobFeed` |
| `swipeEvents` | `supabaseSwipeEventRepository` | `swipe_events` | 3 | — | `useJobFeed` |
| `notifications` | `supabaseNotificationRepository` | `notifications` | 3 | ✅ | `useNotifications` |
| `preferences` | `supabasePreferencesRepository` | `user_preferences` | 4 | — | `usePreferences` |

**Total: 10/10 data providers on Supabase. 9 tables + 1 storage bucket. 35 RLS policies.**

### DB functions & triggers (live)

| Function | Type | Purpose |
|----------|------|---------|
| `apply_to_job` | RPC (SECURITY DEFINER) | Atomic static-job upsert + application create |
| `get_user_role` | SQL (SECURITY DEFINER) | RLS helper — prevents recursion |
| `handle_new_user` | Trigger on `auth.users` | Auto-creates profile + candidate row on signup |
| `update_updated_at_column` | Trigger function | Timestamp maintenance |

### Enums (live)

| Enum | Values |
|------|--------|
| `swipe_direction` | `left`, `right`, `save` |
| `notification_type` | `status_change`, `new_message`, `shortlisted`, `interview_scheduled`, `hired` |

---

## 2. Supabase-Ready but Not Yet Switched Live

These have **complete Supabase implementations** but are not yet connected to external services or wired into active user flows.

| Provider | Registry Value | Implementation Exists | Blocker |
|----------|---------------|----------------------|---------|
| `email` | `noopEmail` | Edge function `send-email/index.ts` (stub with auth + CORS) | Needs `RESEND_API_KEY` secret |
| `ai` | `noopAI` | Edge function `process-cv/index.ts` (stub with auth + path ownership) | Needs Lovable AI call implementation in stub body |

**Neither `email` nor `ai` is called by any UI code.** `getProvider("email")` and `getProvider("ai")` appear zero times in the codebase. They are interface-ready with noop fallbacks but have no callers.

### Edge functions (deployed, stubs)

| Function | Auth | CORS | Status |
|----------|------|------|--------|
| `process-cv` | ✅ JWT + path ownership | ✅ Full headers | Stub — returns `{ parsed: null }` |
| `send-email` | ✅ JWT | ✅ Full headers | Stub — returns `{ success: true }` |
| `rate-limiter` | ✅ JWT + user-scoped keys | ✅ Full headers | Functional (in-memory) but not wired into any flow |
| `validate-status-transition` | ✅ JWT | ✅ Full headers | Functional logic but not wired as DB trigger |

---

## 3. Still Noop-Only (No Supabase Implementation Exists)

| Provider | Registry Value | Interface Defined | Implementation File | UI Callers |
|----------|---------------|------------------|--------------------|-----------| 
| `analytics` | `noopAnalytics` | `AnalyticsService` in `services/interfaces.ts` | Only `noop.ts` | **Zero** — `getProvider("analytics")` never called |
| `errorTracking` | `noopErrorTracking` | `ErrorTrackingService` | Only `noop.ts` | **Zero** — `getProvider("errorTracking")` never called |

These are pure placeholders. No Supabase repo, no edge function, no UI integration. They are interface definitions + noop implementations only.

---

## 4. Remaining Security Blockers

### Must fix before production launch

| Blocker | Severity | Status | Fix |
|---------|----------|--------|-----|
| **Leaked password protection disabled** | MEDIUM | ⚠️ Config-only | Toggle in auth settings (not a migration) |
| **Email verification enforcement** | MEDIUM | ⚠️ Config-only | Verify `enable_confirmations = true` in auth config |
| **CORS origin wildcard on edge functions** | LOW | ⚠️ Code change | Replace `"*"` with production domain in all 4 functions before launch |

### Should fix before production launch

| Blocker | Severity | Status | Fix |
|---------|----------|--------|-----|
| **No server-side status transition enforcement** | MEDIUM | Edge function exists | Wire `validate-status-transition` as a Postgres trigger on `applications` |
| **No rate limiting on apply/message** | LOW | Edge function exists | Integrate `rate-limiter` calls before `applications.apply()` and `messages.send()` |
| **No notification creation triggers** | LOW | Table + repo ready | Create DB trigger on `applications.status` change to INSERT into `notifications` |

### Not a blocker (acceptable for launch)

| Item | Why it's OK |
|------|------------|
| No message read receipts | Feature gap, not security risk |
| No candidate-side messaging UI | Employer-led by design |
| No pgvector | Future enhancement, not required |
| Noop analytics/errorTracking | App works without them; no data leak risk |

---

## 5. Safest Next External Services to Connect First

Ordered by risk (lowest first) and value (highest first).

### 1. Analytics (PostHog) — **FREE tier, zero risk**

- **Why first:** No secret needed server-side. Publishable key only (`VITE_POSTHOG_KEY`).
- **Effort:** Create `src/services/posthog.ts`, register in provider registry, add `posthog-js` dependency.
- **Cost:** Free tier covers 1M events/month.
- **Risk:** None — client-side only, no backend changes.
- **Config:** `integrations.ts` already defines the interface.

### 2. Error Tracking (Sentry) — **FREE tier, zero risk**

- **Why second:** Publishable DSN only. No backend secret needed for basic error capture.
- **Effort:** Create `src/services/sentry.ts`, register in provider registry, add `@sentry/react` dependency.
- **Cost:** Free tier covers 5K errors/month.
- **Risk:** None — client-side only.
- **Config:** `integrations.ts` already defines the interface.

### 3. AI (Lovable AI) — **No additional API key needed**

- **Why third:** `LOVABLE_API_KEY` is already provisioned. Just needs implementation in `process-cv` edge function.
- **Effort:** Implement the TODO body in `process-cv/index.ts` — download PDF, extract text, call Lovable AI gateway.
- **Cost:** Included with Lovable plan.
- **Risk:** Low — edge function only, auth already enforced.

---

## 6. Future Cost-Generating Integrations (Should Wait)

| Service | Provider Key | Why Wait | Estimated Cost |
|---------|-------------|----------|---------------|
| **Resend** (transactional email) | `email` | Requires `RESEND_API_KEY`, sender domain verification, and a reason to send emails (no automated triggers yet). Wait until notification triggers are wired. | Free tier: 100 emails/day. Paid: $20/month for 50K. |
| **PostHog** (beyond free tier) | `analytics` | Free tier is generous. Only pay if >1M events/month. | $0 until scale. Then ~$450/month per 10M events. |
| **Sentry** (beyond free tier) | `errorTracking` | Free tier is generous. Only pay if >5K errors/month. | $26/month for 50K errors. |
| **Cloudflare Pages** (custom domain) | — | Not a code change. Deploy config only. | Free for most use cases. Custom domain: free with Cloudflare DNS. |
| **pgvector** extension | — | Requires DB extension enable + embedding pipeline. No UI currently uses vector search. | No direct cost, but AI calls to generate embeddings will have volume-based cost. |

---

## File Inventory Summary

| Category | Count | Files |
|----------|-------|-------|
| Supabase repos (live) | 10 | `src/repositories/supabase/*.ts` |
| Mock repos (retained, unused) | 9 | `src/repositories/mock/*.ts` |
| Noop services | 4 | `src/services/noop.ts` (analytics, errorTracking, email, ai) |
| Edge functions | 4 | `supabase/functions/*/index.ts` |
| Service interfaces | 5 | `src/services/interfaces.ts` |
| Config | 2 | `src/config/index.ts`, `src/config/integrations.ts` |
| Docs | 7 | `docs/*.md` |
