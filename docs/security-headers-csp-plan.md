# Production Security Headers & CSP Plan

**Status**: Planning (not yet deployed)  
**Last updated**: 2026-03-09  
**Mandatory references**: `docs/security-prelaunch.md`, `docs/cloudflare-pages-checklist.md`

This document defines the planned HTTP security headers and Content Security Policy for the production deployment on Cloudflare Pages. No implementation is required now — this plan is the reference when headers are configured at launch.

---

## 1. Deployment Method

Security headers will be configured via a `public/_headers` file committed to the repository. Cloudflare Pages reads this file at build time and applies the headers globally. This is the preferred approach over Transform Rules as it is version-controlled alongside the application.

```
# public/_headers  (not yet active — see this doc before enabling)
/*
  Content-Security-Policy: <see Section 2>
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: <see Section 4>
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Cross-Origin-Embedder-Policy: unsafe-none
  Cross-Origin-Opener-Policy: same-origin-allow-popups
```

> **SPA Note**: These rules must be applied to `/*` — not just `/index.html` — because Cloudflare Pages serves every React Router path from the same `index.html`. A `_redirects` file handling `/* /index.html 200` must also be present for client-side routing to work.

---

## 2. Content-Security-Policy (CSP)

### 2.1 Rationale

The app is a Vite/React SPA served from Cloudflare Pages. All runtime JS is bundled at build time; no `eval` or dynamic code injection is used. Supabase is the only external API. The Lovable AI Gateway is called via Edge Functions (server-side), not directly from the browser.

### 2.2 Proposed Policy (Baseline — Soft Launch)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.supabase.co https://zbugeresoizxjotxhrgb.supabase.co;
  font-src 'self';
  connect-src 'self'
    https://zbugeresoizxjotxhrgb.supabase.co
    wss://zbugeresoizxjotxhrgb.supabase.co;
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

### 2.3 Policy Directive Explanations

| Directive | Value | Reason |
|---|---|---|
| `default-src` | `'self'` | Deny-all baseline; all specific overrides below |
| `script-src` | `'self'` | Vite bundles all JS; no CDN scripts needed at baseline |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind/shadcn injects inline styles at runtime |
| `img-src` | `'self' data: blob: *.supabase.co` | Avatars/CVs served from Supabase Storage |
| `font-src` | `'self'` | Fonts bundled locally; update if Google Fonts added |
| `connect-src` | `'self' supabase project + wss://` | REST + Realtime WebSocket connections to Supabase |
| `media-src` | `'self' blob:` | Allows blob URL previews (e.g., CV preview) |
| `object-src` | `'none'` | Block Flash/plugins |
| `base-uri` | `'self'` | Prevents base tag injection attacks |
| `form-action` | `'self'` | Prevents form-hijacking to external origins |
| `frame-ancestors` | `'none'` | See Section 3 |
| `upgrade-insecure-requests` | _(present)_ | Force HTTPS for all sub-resources |

### 2.4 `style-src: 'unsafe-inline'` — Accepted Risk

Tailwind CSS with shadcn/ui applies inline styles dynamically. Removing `'unsafe-inline'` would break the UI without a nonce-based solution (not feasible in a static SPA without a server). This is an **accepted and documented risk** for the SPA architecture. Re-evaluate if a nonce injection layer is added via Cloudflare Workers in the future.

---

## 3. Framing Policy

### X-Frame-Options
```
X-Frame-Options: DENY
```
The app does not need to be embedded in iframes by any third party. This is the strictest setting and is applied globally.

### frame-ancestors (CSP equivalent)
```
frame-ancestors 'none';
```
Included in the CSP directive above. In modern browsers, `frame-ancestors` in CSP supersedes `X-Frame-Options`. Both are specified for maximum compatibility with older browsers.

---

## 4. Additional Headers

### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
Sends the full URL only for same-origin requests; only the origin for cross-origin HTTPS requests. Does not leak paths to third parties (e.g., job IDs in URLs going to analytics or email providers).

### Permissions-Policy
```
Permissions-Policy:
  camera=(),
  microphone=(),
  geolocation=(),
  payment=(),
  usb=(),
  accelerometer=(),
  gyroscope=()
```
Disables browser features not used by this application. Update `payment=()` only when Stripe integration is added.

### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```
- `max-age=63072000` = 2 years (HSTS preload list minimum requirement).
- `includeSubDomains` — covers all subdomains.
- `preload` — intent to register on the HSTS preload list.
- **Warning**: Only activate this after confirming all subdomains are HTTPS. Do NOT enable until the domain is fully operational on Cloudflare.

### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
Prevents browsers from MIME-sniffing responses away from the declared content type. Always enabled.

### Cross-Origin Headers
```
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Embedder-Policy: unsafe-none
```
`same-origin-allow-popups` allows OAuth popups (e.g., future Google Sign-In) while keeping the opener isolated. `unsafe-none` on COEP avoids breaking Supabase Storage signed URL flows that use cross-origin resources.

---

## 5. SPA / Cloudflare Pages Specific Considerations

- **`_redirects` file**: `/* /index.html 200` must be present alongside `_headers` for React Router to handle all routes. Both files live in `public/`.
- **Asset caching**: Add cache headers for hashed static assets separately:
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- **CSP and source maps**: If source maps are deployed to production (not recommended), ensure `connect-src` allows the source map host. Recommendation: disable source maps for production builds.
- **Report-Only mode**: Before enforcing the CSP in production, consider deploying with `Content-Security-Policy-Report-Only` first and configuring a `report-uri` endpoint (e.g., Sentry CSP reporting) to catch violations without breaking users.

---

## 6. Third-Party Integrations That Will Require CSP Updates

The following planned integrations will require additions to the CSP directives before they can be enabled:

| Integration | CSP Directives to Update | Notes |
|---|---|---|
| **Google Sign-In (OAuth)** | `connect-src += accounts.google.com`, `frame-src += accounts.google.com` | Requires popup-based flow; `same-origin-allow-popups` on COOP already covers this |
| **PostHog / GA4 Analytics** | `script-src += posthog.com \| googletagmanager.com`, `connect-src += posthog.com \| google-analytics.com` | Adds third-party scripts; evaluate vs `'self'` proxy approach |
| **Stripe (Payments)** | `script-src += js.stripe.com`, `frame-src += js.stripe.com`, `connect-src += api.stripe.com` | Stripe explicitly requires all three |
| **Sentry (Error Tracking)** | `connect-src += o*.ingest.sentry.io`, `worker-src += blob:` | Sentry's web worker transport |
| **Google Fonts** | `font-src += fonts.gstatic.com`, `style-src += fonts.googleapis.com` | Preferred alternative: self-host fonts at build time |
| **Resend Email (transactional)** | No browser-side CSP changes | Resend is called server-side from Edge Functions only |
| **Lovable AI Gateway** | No browser-side CSP changes | Called server-side from `process-cv` Edge Function only |

---

## 7. Implementation Order (When Ready)

1. Add `public/_redirects` for SPA routing (prerequisite).
2. Deploy `public/_headers` with `Content-Security-Policy-Report-Only` first.
3. Monitor violations via Sentry CSP report endpoint for 1–2 weeks in staging.
4. Promote to enforced `Content-Security-Policy` once clean.
5. Enable `Strict-Transport-Security` only after HTTPS stability is confirmed.
6. Submit domain to HSTS preload list (https://hstspreload.org) as final step.
