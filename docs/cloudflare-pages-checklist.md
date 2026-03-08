# Cloudflare Pages Deployment Checklist

> Practical checklist for deploying this Vite + React SPA to Cloudflare Pages.

---

## 1. Build Configuration

| Setting | Value |
|---------|-------|
| **Framework preset** | None (or Vite) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (project root) |
| **Node.js version** | `18` or `20` (set via `NODE_VERSION` env var) |

### Build command breakdown
```bash
npm run build
# Runs: vite build
# Output: dist/
```

---

## 2. SPA Routing / Fallback

Cloudflare Pages needs a `_redirects` file for SPA client-side routing.

**Create `public/_redirects`:**
```
/*    /index.html   200
```

This ensures all routes (e.g., `/employer`, `/auth`, `/my-profile`) serve `index.html` and let React Router handle routing.

> **Note**: The file goes in `public/` so Vite copies it to `dist/` at build time.

---

## 3. Environment Variables

### Required for all deployments

| Variable | Where to set | Notes |
|----------|--------------|-------|
| `VITE_SUPABASE_URL` | Pages env vars | Copy from Lovable Cloud |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Pages env vars | Copy from Lovable Cloud |
| `VITE_SUPABASE_PROJECT_ID` | Pages env vars | Copy from Lovable Cloud |
| `VITE_APP_BASE_URL` | Pages env vars | Your domain (e.g., `https://findmygig.com`) |
| `VITE_APP_ENV` | Pages env vars | `staging` or `production` |

### Production-only

| Variable | Value |
|----------|-------|
| `VITE_ANALYTICS_ENABLED` | `true` |
| `VITE_POSTHOG_KEY` | Your PostHog project key |
| `VITE_ERROR_TRACKING_ENABLED` | `true` |
| `VITE_SENTRY_DSN` | Your Sentry DSN |
| `VITE_EMAIL_ENABLED` | `true` |

### Staging-only

| Variable | Value |
|----------|-------|
| `VITE_APP_ENV` | `staging` |
| `VITE_ERROR_TRACKING_ENABLED` | `true` (optional) |
| `VITE_SENTRY_DSN` | Staging Sentry DSN |

### Demo mode (if needed)

| Variable | Value |
|----------|-------|
| `VITE_DEMO_MODE` | `true` |

---

## 4. Preview vs Production Branches

| Branch | Environment | Notes |
|--------|-------------|-------|
| `main` | Production | Custom domain, indexable |
| `develop` / `staging` | Preview | `*.pages.dev` subdomain, noindex |
| Feature branches | Preview | Auto-deployed for PRs |

### Configure in Cloudflare Pages:
- **Production branch**: `main`
- **Preview branches**: All other branches (automatic)

---

## 5. Staging / Noindex Concerns

### Option A: Conditional meta tag (recommended)

Already handled if `VITE_APP_ENV=staging`:
```tsx
// In index.html or App.tsx head management
{config.app.environment() !== 'production' && (
  <meta name="robots" content="noindex, nofollow" />
)}
```

### Option B: Separate robots.txt for staging

Create `public/robots-staging.txt`:
```
User-agent: *
Disallow: /
```

Use a build script or Cloudflare transform rule to swap it for preview deployments.

### Option C: Cloudflare Pages headers

Create `public/_headers`:
```
/*
  X-Robots-Tag: noindex, nofollow
```

Then use Cloudflare Pages environment-specific headers (preview only).

---

## 6. Headers Configuration

**Create `public/_headers`:**
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 7. Post-Deploy Verification Checklist

### Immediate checks

- [ ] Site loads at root URL (`/`)
- [ ] Client-side routing works (`/auth`, `/employer`, `/my-profile`)
- [ ] Direct URL access works (refresh on `/employer` doesn't 404)
- [ ] Supabase connection works (check Network tab for API calls)
- [ ] Auth flow works (signup → confirm → login)
- [ ] No console errors related to missing env vars

### Production-specific

- [ ] Custom domain DNS configured
- [ ] HTTPS working (automatic with Cloudflare)
- [ ] Analytics events firing (check PostHog dashboard)
- [ ] Error tracking working (trigger a test error, check Sentry)
- [ ] `robots.txt` allows indexing
- [ ] OG/social meta tags render correctly (use social debuggers)

### Staging-specific

- [ ] `X-Robots-Tag: noindex` header present (or meta tag)
- [ ] Not indexed by search engines
- [ ] Staging Sentry DSN used (not polluting prod)

---

## 8. Manual Configuration Required

| Item | Where | Action |
|------|-------|--------|
| Add `public/_redirects` | Codebase | Create file with SPA fallback rule |
| Add `public/_headers` | Codebase | Create file with security headers |
| Set env vars | Cloudflare Pages dashboard | Add all `VITE_*` variables |
| Set `NODE_VERSION` | Cloudflare Pages dashboard | `18` or `20` |
| Configure custom domain | Cloudflare Pages dashboard | Point DNS, enable SSL |
| Set production branch | Cloudflare Pages dashboard | `main` |

---

## 9. Code Assumptions Affecting Deployment

| Assumption | Location | Impact |
|------------|----------|--------|
| Vite outputs to `dist/` | `vite.config.ts` | Must match Pages output directory |
| `public/` files copied to root | Vite default | `_redirects`, `_headers`, `robots.txt` work |
| Env vars prefixed `VITE_` | `src/config/index.ts` | Only `VITE_*` vars are bundled client-side |
| Base path is `/` | `vite.config.ts` | No `base` config needed for root deployment |
| No SSR/SSG | React SPA | Needs `_redirects` fallback, no edge rendering |
| Edge functions run on Supabase | `supabase/functions/` | NOT deployed to Cloudflare; remain on Cloud |

---

## 10. What NOT to Deploy to Cloudflare

| Item | Reason |
|------|--------|
| `supabase/functions/` | Edge functions run on Lovable Cloud, auto-deployed |
| `.env` | Secrets; set in Cloudflare dashboard instead |
| `supabase/config.toml` | Supabase-specific, not used by Pages |
| `node_modules/` | Built fresh on each deploy |

---

## Quick Start Commands

```bash
# Local build test
npm run build
npx serve dist

# Verify SPA routing works locally
# Navigate to http://localhost:3000/employer and refresh
```

---

## Cloudflare Pages Dashboard Settings Summary

```
Project name: find-my-gig (or your choice)
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
Environment variables: (see section 3)
```
