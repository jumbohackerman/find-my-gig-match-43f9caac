# Consent Logging Status

## Current State

A lightweight `logConsent()` function in `src/lib/consent.ts` serves as the single hook point for all consent events. It currently logs to the dev console only — no backend calls yet.

## Integration Point

The cookie banner (`src/components/CookieBanner.tsx`) calls `logConsent()` on every accept action:

```ts
logConsent({ type: "cookies", level: "all" });    // or "essential"
```

## Where to Connect Backend Later

In `src/lib/consent.ts`, replace the stub comment block with:

1. **Database insert** — create a `consent_log` table and insert directly
2. **Edge function** — call a `log-consent` edge function for server-side timestamping
3. **Third-party** — forward to a consent management platform

The `ConsentEvent` interface is extensible (`type`, `level`, `timestamp`).

## Files Changed

| File | Change |
|---|---|
| `src/lib/consent.ts` | New — consent logging stub with typed interface |
| `src/components/CookieBanner.tsx` | Calls `logConsent()` on accept |
| `docs/consent-logging-status.md` | This file |

## Still Needs Backend Support

| Item | Notes |
|---|---|
| `consent_log` table | Schema: `id`, `user_id` (nullable for anonymous), `type`, `level`, `user_agent`, `created_at` |
| RLS policy | Allow inserts for both authenticated and anonymous users |
| Retention policy | Define how long consent records are kept (GDPR) |
| Consent withdrawal | UI + backend to revoke/update consent |
| Marketing/analytics consent | Additional `logConsent()` calls when those features are added |
