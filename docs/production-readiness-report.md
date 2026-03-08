# Production Readiness Report

**Date:** 2026-03-08 (all providers on Supabase, security hardened)
**Target Stack:** Lovable → GitHub → Cloudflare Pages + Supabase + Edge Functions + Resend + PostHog/GA4 + Sentry

---

## Provider Registry — Current State

### ✅ Supabase (live — all 10 data providers)

| Provider | Repo File | Key Methods |
|----------|-----------|-------------|
| `jobs` | `supabase/jobs.ts` | `list`, `listForEmployer`, `getById`, `create`, `update`, `archive`, `delete` |
| `applications` | `supabase/applications.ts` | `listForCandidate`, `listForEmployer`, `apply` (RPC + direct), `updateStatus`, `countByStatus`, `subscribeForCandidate`, `subscribeForEmployer` |
| `candidates` | `supabase/candidates.ts` | `list`, `getByUserId`, `upsert` |
| `profiles` | `supabase/profiles.ts` | `getByUserId`, `update` |
| `messages` | `supabase/messages.ts` | `listByApplication`, `send`, `subscribe` |
| `storage` | `supabaseStorage.ts` | `upload`, `getPublicUrl`, `delete` |
| `savedJobs` | `supabase/savedJobs.ts` | `listIds`, `save`, `remove`, `isSaved` |
| `swipeEvents` | `supabase/swipeEvents.ts` | `record`, `listSwipedJobIds`, `clear` |
| `notifications` | `supabase/notifications.ts` | `listForUser`, `markRead`, `markAllRead`, `countUnread`, `subscribe` |
| `preferences` | `supabase/preferences.ts` | `get`, `set`, `delete` |

### 🔇 Noop (pending external integration)

| Provider | Future Service |
|----------|---------------|
| `analytics` | PostHog / GA4 |
| `errorTracking` | Sentry |
| `email` | Resend |
| `ai` | Lovable AI |

---

## Database Tables (9 total)

| Table | RLS Policies | Realtime | Storage |
|-------|-------------|----------|---------|
| `jobs` | 4 | — | — |
| `applications` | 5 | — | — |
| `candidates` | 2 | — | — |
| `profiles` | 4 (incl. employer cross-read) | — | — |
| `messages` | 2 | ✅ | — |
| `saved_jobs` | 3 | — | — |
| `swipe_events` | 3 | — | — |
| `notifications` | 3 (INSERT server-only) | ✅ | — |
| `user_preferences` | 4 | — | — |
| `cvs` bucket | 5 (candidate CRUD + employer read) | — | ✅ |

**Total: 35 RLS policies across 9 tables + 1 storage bucket**

---

## Security Status

| Area | Status |
|------|--------|
| RLS on all tables | ✅ |
| Storage bucket RLS | ✅ |
| Profiles least-privilege cross-read | ✅ |
| Edge function auth validation | ✅ (all 4 functions) |
| Edge function CORS hardening | ✅ (full Supabase headers) |
| Role-aware route guards | ✅ |
| No service role key in client | ✅ |
| Leaked password protection | ⚠️ Needs auth settings toggle |
| CORS origin restriction | ⚠️ Still `*` (pre-launch) |
| Status transition enforcement | ⚠️ Function exists, not wired as trigger |
| Rate limiting integration | ⚠️ Function exists, not wired into flows |

See `docs/security-prelaunch.md` for full details.

---

## Cutover Status

All provider switches are complete. See `docs/supabase-cutover-plan.md` for:
- Migration dependency graph
- Provider switch order and wave grouping
- Per-wave test checklists
- Rollback procedure
- Final pre-launch checklist

---

## Missing Infrastructure

- [ ] Leaked password protection (auth settings)
- [ ] Email verification enforcement
- [ ] CORS origin restriction for edge functions
- [ ] Status transition DB trigger
- [ ] Rate limiter integration into apply/message flows
- [ ] Notification creation triggers (server-side)
- [ ] Candidate-side messaging UI
- [ ] Message read receipts (`read_at` column)
- [ ] pgvector extension
- [ ] Cloudflare Pages config
