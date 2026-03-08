# Feature Flags — Status

## ✅ Implemented

Lightweight config-driven feature flags in `src/config/flags.ts`.

## Flag Registry

| Flag | Default | Env Override | Purpose |
|---|---|---|---|
| `moderation` | `true` | `VITE_FLAG_MODERATION` | Show report buttons and moderation UI |
| `messages` | `true` | `VITE_FLAG_MESSAGES` | Enable in-app messaging (employer ↔ candidate) |
| `analyticsPlaceholders` | `false` | `VITE_FLAG_ANALYTICS_PLACEHOLDERS` | Render analytics event logging and dashboard placeholders |
| `stagingHelpers` | `false` | `VITE_FLAG_STAGING_HELPERS` | Show staging/debug helpers (reset buttons, debug info) |
| `seedDemo` | `false` | `VITE_FLAG_SEED_DEMO` | Enable seed / demo data utilities |
| `matchBreakdown` | `true` | `VITE_FLAG_MATCH_BREAKDOWN` | Show match-score breakdown details |
| `recentlyViewed` | `true` | `VITE_FLAG_RECENTLY_VIEWED` | Enable recently-viewed tracking |

## Usage

```tsx
import { flag } from "@/config/flags";

// In a component
{flag("moderation") && <ReportButton ... />}

// Guard a hook side-effect
if (flag("recentlyViewed")) trackView(job);
```

## Runtime overrides (dev console)

```js
__flags.setFlag("seedDemo", true)   // enable seed tools
__flags.allFlags()                  // inspect all current values
__flags.resetFlags()                // clear overrides
```

## Resolution priority

1. Runtime override (`setFlag()`) — highest
2. Environment variable (`VITE_FLAG_*`)
3. Hardcoded default — lowest

## Files

| File | Role |
|---|---|
| `src/config/flags.ts` | Flag definitions, reader, runtime override API |
| `docs/feature-flags-status.md` | This document |

## Safe Usage Guidelines

1. **Never use flags for security** — flags are client-side and trivially bypassed; use RLS/backend checks for authorization
2. **Keep flags few** — each flag adds a testing dimension; prefer removing flags over adding new ones
3. **Default to safe** — risky/incomplete features default to `false`
4. **Document every flag** — update this table when adding or removing a flag
5. **Clean up** — when a feature is fully shipped, remove the flag and hardcode the behavior
