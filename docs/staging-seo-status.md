# Staging SEO Status

## Strategy

Non-production environments are blocked from search engine indexing via a runtime `<meta name="robots" content="noindex, nofollow">` tag injected in `src/main.tsx`. The tag is **only added** when `VITE_APP_ENV` is NOT set to `"production"`.

## How It Works

| Environment | `VITE_APP_ENV` | Behavior |
|---|---|---|
| Local dev | unset / `"development"` | `noindex, nofollow` meta injected |
| Lovable preview | unset | `noindex, nofollow` meta injected |
| Staging deploy | `"staging"` | `noindex, nofollow` meta injected |
| **Production** | `"production"` | **No meta tag** — fully indexable |

The check runs once at app boot in `src/main.tsx` before React renders.

## Files Changed

| File | Change |
|---|---|
| `src/main.tsx` | Runtime noindex injection for non-production |
| `public/robots.txt` | Left permissive (production-ready); staging override via meta tag |
| `docs/staging-seo-status.md` | This file |

## robots.txt

The `public/robots.txt` remains permissive (`Allow: /`) because:
- It cannot be made environment-aware at build time in a static SPA
- The runtime `<meta>` tag handles staging blocking
- For production, the permissive robots.txt is correct

## What Still Needs Deployment Config

| Item | Notes |
|---|---|
| Set `VITE_APP_ENV=production` | Must be set in the production build environment for indexing to work |
| Custom domain canonical | Once a custom domain is connected, add `<link rel="canonical">` pointing to it |
| Sitemap | Not yet generated; needed for production SEO |
| Server-side robots.txt | If a reverse proxy is used, it can serve different robots.txt per environment (not needed for Lovable hosting) |
