# Pre-Stack Integration Checklist

> **Date:** 2026-03-08
> **Purpose:** Operational checklist for moving from Lovable workspace into GitHub → Cloudflare Pages → Supabase Free → live production.
> **This is not a feature doc.** It assumes zero new code — only sync, verify, connect.

---

## 1. GitHub Sync

### Steps

1. Open Lovable Editor → Settings → GitHub → Connect project
2. Authorize the Lovable GitHub App
3. Select target GitHub account / organization
4. Click **Create Repository** (Lovable pushes full workspace)
5. Wait for push confirmation in Lovable

### Verify After Sync

- [ ] Repo contains `src/`, `supabase/`, `docs/`, `public/`, `e2e/` directories
- [ ] `package.json` version and dependencies match workspace
- [ ] `supabase/config.toml` is present (single file, not duplicated)
- [ ] `supabase/functions/` contains all 6 edge functions
- [ ] `.env` is present (contains only publishable keys — safe)
- [ ] `.env.example` is present
- [ ] No `node_modules/` or `dist/` committed
- [ ] `docs/` directory has all 26+ status files
- [ ] `src/integrations/supabase/types.ts` matches current DB schema

### Known Risk

- Lovable auto-manages `.env` with publishable keys only — this is intentional and safe (see `docs/security-prelaunch.md`)
- If GitHub shows `.env` in diff review, confirm it contains only `VITE_*` vars

---

## 2. Browser Smoke Test (after sync, before any external connection)

Run in **Lovable preview** (or GitHub Pages dev build) while still on Lovable Cloud backend.

### Critical Flows — Test In Order

| # | Flow | Route | What to verify |
|---|------|-------|----------------|
| 1 | Guest redirect | `/` | Redirects to `/auth` |
| 2 | Candidate signup | `/auth` | Role selector → candidate → signup → lands on `/` |
| 3 | Candidate onboarding | `/` | Modal appears for new candidate |
| 4 | Swipe & apply | `/` | Swipe right → toast → application created |
| 5 | Save job | `/` | Star → toast → appears in Saved tab |
| 6 | My Profile | `/my-profile` | Load profile → edit → save → toast |
| 7 | Employer signup | `/auth` (state: employer) | Signup → lands on `/employer` |
| 8 | Employer dashboard | `/employer` | Create job → see in list |
| 9 | Employer applicants | `/employer` (expand job) | See applicant → open profile modal |
| 10 | Legal pages | `/privacy`, `/terms`, `/cookies` | All render, links work |
| 11 | 404 page | `/nonexistent` | Branded 404 with navigation back |
| 12 | Cookie banner | Any page (clear localStorage) | Banner appears → choices work |

### Mobile Check

- [ ] `/` on 375px viewport — swipe card fits, buttons accessible
- [ ] `/employer` on 375px — job list scrollable, form usable

---

## 3. Readiness: Cloudflare Pages

### Prerequisites

- [ ] GitHub repo is synced and up to date
- [ ] Build command: `npm run build` (or `bun run build`)
- [ ] Output directory: `dist`
- [ ] Node.js compatibility: 18+ (Vite requires it)

### Cloudflare Pages Setup

1. Connect GitHub repo in Cloudflare Pages dashboard
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variables:
   - `VITE_SUPABASE_URL` → copy from `.env`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → copy from `.env`
   - `VITE_SUPABASE_PROJECT_ID` → copy from `.env`
5. Deploy

### Verify After Deploy

- [ ] App loads on Cloudflare Pages URL
- [ ] Auth flow works (Supabase backend is still Lovable Cloud at this stage)
- [ ] SPA routing works (all routes return `index.html` — Cloudflare Pages handles this by default)
- [ ] No mixed-content warnings in console

### Important: Do NOT yet

- Do NOT set up custom domain until Supabase Free is connected
- Do NOT change edge function CORS origins yet (still `*`)
- Cloudflare Pages is frontend-only — edge functions stay on Lovable Cloud / Supabase

---

## 4. Readiness: Supabase Free (external project)

### When to Connect

**Only after** Cloudflare Pages is working with Lovable Cloud backend. This way you always have a working baseline.

### Migration Path

1. Create a new Supabase project (free tier) at supabase.com
2. Apply all migrations from `supabase/migrations/` in order
3. Verify all 9 tables exist with correct schemas
4. Verify all RLS policies (35 total) are applied
5. Verify functions exist: `apply_to_job`, `get_user_role`, `handle_new_user`, `update_updated_at_column`, `hide_job`, `unhide_job`
6. Verify trigger on `auth.users` → `handle_new_user` exists
7. Create storage bucket `cvs` (private)
8. Apply storage RLS policies
9. Enable realtime for `messages` and `notifications` tables
10. Deploy edge functions from `supabase/functions/`

### Environment Variable Swap

Update Cloudflare Pages env vars:
- `VITE_SUPABASE_URL` → new Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` → new project anon key
- `VITE_SUPABASE_PROJECT_ID` → new project ID

### Add Secrets to New Supabase Project

- `SUPABASE_SERVICE_ROLE_KEY` (auto-available)
- `SUPABASE_DB_URL` (auto-available)
- `LOVABLE_API_KEY` (if using Lovable AI — may not transfer)

### Verify After Supabase Swap

- [ ] Signup creates profile + candidate record (trigger works)
- [ ] Login redirects correctly by role
- [ ] Candidate can apply (RPC `apply_to_job` works)
- [ ] Employer can see applicants (cross-table RLS works)
- [ ] Messages send and appear in realtime
- [ ] CV upload works to storage bucket
- [ ] No RLS permission errors in console

### Cost Awareness

Supabase Free tier includes:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- 500,000 edge function invocations

**No immediate cost risk** for MVP/staging.

---

## 5. Readiness: Mock → Live Cutover

All 10 data providers are **already wired to Supabase** (see `docs/supabase-cutover-plan.md` § 3). There is no mock → live switch needed in code.

### What "cutover" means here

The app is already live on Supabase via Lovable Cloud. Cutover = switching from Lovable Cloud's Supabase to your own Supabase project (§ 4 above).

### Remaining noop providers (not urgent)

| Provider | Service | Cost Implication | When to Connect |
|----------|---------|-----------------|-----------------|
| `analytics` | PostHog / GA4 | Free tier available | After launch, when you need usage data |
| `errorTracking` | Sentry | Free tier available | After launch, when you need crash reports |
| `email` | Resend | Free: 100 emails/day | Before inviting real users (for password reset, notifications) |
| `ai` | Lovable AI | Usage-based | Before enabling CV processing |

---

## 6. Source of Truth References

| Topic | Document |
|-------|----------|
| Database schema & RLS | `supabase/migrations/` (ordered SQL) + `src/integrations/supabase/types.ts` |
| Provider wiring | `src/providers/registry.ts` |
| Integration definitions | `src/config/integrations.ts` |
| Security posture | `docs/security-prelaunch.md` |
| Cutover history & rollback | `docs/supabase-cutover-plan.md` |
| Production readiness | `docs/production-readiness-report.md` |
| Auth & role UX | `docs/auth-ux-status.md` |
| Legal / consent | `docs/legal-pages-status.md` |
| Accessibility | `docs/accessibility-status.md` |
| Action state UX | `docs/action-state-status.md` |
| Error fallbacks | `docs/error-fallback-status.md` |
| Domain model | `docs/domain-model.md` |
| Architecture | `docs/architecture.md` |

---

## 7. Current Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Edge function CORS is `*` | LOW | Restrict to production domain after Cloudflare Pages deploy |
| No email verification enforcement | LOW | Enable `enable_confirmations` in Supabase auth settings |
| Legal text is placeholder | MEDIUM | Replace before real user signups |
| No consent backend logging | LOW | Acceptable for MVP; add before GDPR audit |
| No rate limiting on apply/message | LOW | Edge functions exist but aren't wired |
| `handle_new_user` trigger must exist in target DB | HIGH | Manually verify after Supabase Free migration |
| Lovable AI key may not transfer | MEDIUM | Re-provision if using AI features on external Supabase |

---

## 8. Recommended Connection Order

```
1. GitHub sync              ← free, zero risk, do first
2. Verify smoke tests       ← still on Lovable Cloud backend
3. Cloudflare Pages         ← frontend deploy, still Lovable Cloud backend
4. Supabase Free project    ← migrate schema, swap env vars
5. Resend (email)           ← only before inviting real users
6. Sentry (errors)          ← only after real traffic
7. PostHog (analytics)      ← only after real traffic
8. Lovable AI               ← only when CV processing is needed
```

### What should wait (may generate cost or complexity)

- **Resend**: Don't connect until you have a verified sender domain and real users who need password reset emails
- **PostHog/Sentry**: Free tiers are generous but still add complexity — wait for real traffic
- **Lovable AI**: Usage-based pricing — wait until CV processing feature is actually needed
- **Custom domain**: Wait until Cloudflare Pages + Supabase are both verified working
