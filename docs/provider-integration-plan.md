# Provider & Integration Plan

> Living document — describes the config and integration abstraction layer.

## Overview

```
src/config/
├── index.ts           # Typed config accessors (single env reader)
└── integrations.ts    # Integration boundary definitions

src/providers/
└── registry.ts        # Runtime provider swap (mock ↔ real)

src/services/
├── interfaces.ts      # External service contracts
└── noop.ts            # No-op implementations for dev/demo
```

## Config Layer (`src/config/index.ts`)

Centralizes all `import.meta.env` access. **No other file** (except the
auto-generated `supabase/client.ts`) should read `import.meta.env` directly.

### Namespaces

| Namespace       | Vars                                               | Purpose                        |
|----------------|----------------------------------------------------|--------------------------------|
| `config.supabase`     | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | DB + auth client            |
| `config.analytics`    | `VITE_ANALYTICS_ENABLED`, `VITE_POSTHOG_KEY`     | PostHog / GA4                  |
| `config.errorTracking`| `VITE_ERROR_TRACKING_ENABLED`, `VITE_SENTRY_DSN` | Sentry                        |
| `config.ai`           | `VITE_AI_ENABLED`, `VITE_AI_DEFAULT_MODEL`       | AI features toggle             |
| `config.storage`      | `VITE_STORAGE_CV_BUCKET`, `VITE_STORAGE_MAX_UPLOAD_SIZE` | File upload config     |
| `config.email`        | `VITE_EMAIL_ENABLED`, `VITE_EMAIL_FROM`          | Email UI toggle                |
| `config.app`          | `VITE_APP_ENV`, `VITE_DEMO_MODE`, `VITE_APP_BASE_URL` | App-level settings       |

### Usage

```typescript
import config from "@/config";

if (config.analytics.enabled()) {
  getProvider("analytics").track("page_view", { path: "/jobs" });
}
```

## Integration Boundaries (`src/config/integrations.ts`)

Each integration is defined with:
- **layer**: `client` | `edge-function` | `both`
- **status**: `active` | `noop` | `planned`
- **requiredSecrets**: backend-only secrets (Supabase vault)
- **clientEnvVars**: VITE_ vars for frontend

### Current Integrations

| Integration         | Layer          | Status   | Provider Key     |
|---------------------|---------------|----------|------------------|
| Lovable Cloud       | both          | active   | (built-in)       |
| Analytics           | client        | noop     | `analytics`      |
| Error Tracking      | client        | noop     | `errorTracking`  |
| Email               | edge-function | noop     | `email`          |
| AI Services         | edge-function | noop     | `ai`             |
| File Storage        | both          | active   | `storage`        |

## Provider Registry (`src/providers/registry.ts`)

Runtime swap layer. All data access and external service calls go through
`getProvider(key)`. Current state:

- **Data repos**: mock implementations (demo mode)
- **Services**: no-op implementations

### Activation Sequence

To activate an integration:

1. Set the relevant env vars (VITE_ for client, secrets for edge functions)
2. Create the real implementation (e.g., `src/repositories/supabase/jobs.ts`)
3. Call `registerProvider("jobs", supabaseJobRepo)` in app init
4. The rest of the app continues using `getProvider("jobs")` unchanged

## Secret Management

| Secret                       | Where          | Auto-provisioned? |
|------------------------------|---------------|-------------------|
| `SUPABASE_URL`               | Edge functions | Yes (Cloud)       |
| `SUPABASE_SERVICE_ROLE_KEY`  | Edge functions | Yes (Cloud)       |
| `SUPABASE_DB_URL`            | Edge functions | Yes (Cloud)       |
| `LOVABLE_API_KEY`            | Edge functions | Yes (Cloud)       |
| `RESEND_API_KEY`             | Edge functions | No — add manually |
| `VITE_POSTHOG_KEY`           | Client         | No — add manually |
| `VITE_SENTRY_DSN`            | Client         | No — add manually |

## Adding a New Integration

1. Add entry to `src/config/integrations.ts`
2. Add config accessors to `src/config/index.ts`
3. Define interface in `src/services/interfaces.ts`
4. Add no-op implementation to `src/services/noop.ts`
5. Register in `src/providers/registry.ts`
6. Update `.env.example`
7. If edge-function-only, create the function in `supabase/functions/`

## Route Guard Alignment

Page components check feature availability via config:

```typescript
// In a page component
import config from "@/config";

// Feature-gated UI
{config.ai.enabled() && <AIMatchExplanation />}
```

Backend authorization is handled by RLS policies (see `docs/rls-plan.md`).
Route guards in React Router check auth state via `useAuth()`, not env vars.
