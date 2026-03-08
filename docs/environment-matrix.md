# Environment Matrix

> Practical reference for local / staging / production configuration.

## Environment Overview

| Aspect | Local (dev) | Staging (preview) | Production |
|--------|------------|-------------------|------------|
| URL | `localhost:5173` | `*.lovable.app` | custom domain |
| Database | Cloud test instance | Cloud test instance | Cloud live instance |
| Auth | Cloud (test) | Cloud (test) | Cloud (live) |
| Edge functions | Auto-deployed (test) | Auto-deployed (test) | Auto-deployed (live) |
| Demo mode | Optional (`VITE_DEMO_MODE=true`) | Off | Off |

---

## Environment Variables

### Client-side (`VITE_*`)

| Variable | Local | Staging | Production | Notes |
|----------|-------|---------|------------|-------|
| `VITE_SUPABASE_URL` | auto | auto | auto | Never edit manually |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | auto | auto | auto | Never edit manually |
| `VITE_SUPABASE_PROJECT_ID` | auto | auto | auto | Never edit manually |
| `VITE_APP_ENV` | `development` | `staging` | `production` | Controls logging verbosity |
| `VITE_APP_BASE_URL` | `http://localhost:5173` | `https://*.lovable.app` | `https://yourdomain.com` | Used for canonical URLs, OG tags |
| `VITE_DEMO_MODE` | `true` or `false` | `false` | `false` | Swaps to mock repositories |
| `VITE_ANALYTICS_ENABLED` | `false` | `false` | `true` | PostHog / GA4 |
| `VITE_POSTHOG_KEY` | — | — | `phc_...` | Only needed in prod |
| `VITE_POSTHOG_HOST` | — | — | `https://app.posthog.com` | Default if omitted |
| `VITE_ERROR_TRACKING_ENABLED` | `false` | `true` | `true` | Sentry |
| `VITE_SENTRY_DSN` | — | DSN value | DSN value | Staging + prod |
| `VITE_AI_ENABLED` | `true` | `true` | `true` | Lovable AI — no key needed client-side |
| `VITE_AI_DEFAULT_MODEL` | `google/gemini-2.5-flash` | same | same | Can override per-env |
| `VITE_EMAIL_ENABLED` | `false` | `false` | `true` | UI toggle only; backend needs secret |
| `VITE_EMAIL_FROM` | — | — | `noreply@yourdomain.com` | |
| `VITE_STORAGE_CV_BUCKET` | `cvs` | `cvs` | `cvs` | Pre-created bucket |
| `VITE_STORAGE_MAX_UPLOAD_SIZE` | `10485760` | `10485760` | `10485760` | 10 MB |

### Backend secrets (edge functions only)

| Secret | Local | Staging | Production | Notes |
|--------|-------|---------|------------|-------|
| `SUPABASE_URL` | auto | auto | auto | Auto-provisioned |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | auto | auto | Auto-provisioned |
| `SUPABASE_DB_URL` | auto | auto | auto | Auto-provisioned |
| `SUPABASE_ANON_KEY` | auto | auto | auto | Auto-provisioned |
| `LOVABLE_API_KEY` | auto | auto | auto | For Lovable AI calls |
| `RESEND_API_KEY` | — | — | manual | Required for email sending |

---

## Integration Status by Environment

| Integration | Local | Staging | Production |
|-------------|-------|---------|------------|
| Database (Cloud) | ✅ live (test) | ✅ live (test) | ✅ live (live) |
| Auth | ✅ live (test) | ✅ live (test) | ✅ live (live) |
| File Storage | ✅ live (test) | ✅ live (test) | ✅ live (live) |
| AI (Lovable AI) | ✅ via edge fn | ✅ via edge fn | ✅ via edge fn |
| Analytics | ❌ noop | ❌ noop | ✅ PostHog |
| Error Tracking | ❌ noop | ✅ Sentry | ✅ Sentry |
| Email (Resend) | ❌ noop | ❌ noop | ✅ edge fn |
| Rate Limiter | ✅ in-memory | ✅ in-memory | ⚠️ needs persistent store |

Reference: `src/config/integrations.ts` for canonical integration definitions.

---

## Mock vs Live Decision Matrix

| Feature | Local (demo mode) | Local (live mode) | Staging | Production |
|---------|-------------------|-------------------|---------|------------|
| Job feed | mock data | Cloud DB | Cloud DB | Cloud DB |
| Applications | mock (localStorage) | Cloud DB | Cloud DB | Cloud DB |
| Saved jobs | mock (localStorage) | Cloud DB | Cloud DB | Cloud DB |
| Swipe events | mock (localStorage) | Cloud DB | Cloud DB | Cloud DB |
| Messages | mock (no realtime) | Cloud DB + realtime | Cloud DB + realtime | Cloud DB + realtime |
| Notifications | mock | Cloud DB | Cloud DB | Cloud DB |
| Profiles | mock | Cloud DB | Cloud DB | Cloud DB |
| Candidates | mock | Cloud DB | Cloud DB | Cloud DB |
| Preferences | mock (localStorage) | Cloud DB | Cloud DB | Cloud DB |
| Consent logging | console.log | console.log | console.log | Cloud DB (future) |
| CV upload | noop | Cloud Storage | Cloud Storage | Cloud Storage |
| Analytics events | noop | noop | PostHog | PostHog |
| Error capture | console only | console only | Sentry | Sentry |

Mock ↔ live swap is controlled by `src/providers/registry.ts` which reads `config.app.isDemoMode()`.

---

## What Differs Between Environments

### Local → Staging
- `VITE_APP_ENV`: `development` → `staging`
- Error tracking activates (Sentry DSN required)
- Demo mode should be off
- Same Cloud test database instance

### Staging → Production
- `VITE_APP_ENV`: `staging` → `production`
- Database switches from test to live instance (automatic on publish)
- Analytics activates (PostHog key required)
- Email activates (Resend API key required)
- Rate limiter should use persistent store
- Custom domain configured
- `robots.txt` allows indexing

### Key safety rails
- **Test data never leaks to prod**: test and live are separate DB instances
- **Secrets are environment-scoped**: edge function secrets are per-environment
- **Demo mode is client-only**: `VITE_DEMO_MODE=true` uses mock repos, no DB calls

---

## Config Architecture Reference

```
src/config/index.ts          → typed env accessors (single import.meta.env reader)
src/config/integrations.ts   → integration boundary definitions
src/providers/registry.ts    → runtime mock ↔ real swap
.env                         → auto-managed by Cloud (DO NOT edit)
.env.example                 → reference for all supported vars
```

---

## Future Revision Needed

| Item | Status |
|------|--------|
| `VITE_APP_ENV` not yet set in staging/prod builds | needs build config or Cloud env override |
| Rate limiter persistent store for prod | planned; currently in-memory only |
| Consent logging backend | stub ready in `src/lib/consent.ts`; needs `consent_log` table |
| Email integration | noop; needs `RESEND_API_KEY` secret + edge fn activation |
| Analytics provider wiring | noop; needs PostHog SDK init in app entry |
| `robots.txt` staging vs prod differentiation | currently allows all; staging should `Disallow: /` |
