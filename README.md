# JobSwipe — Tinder-style Job Matching Platform

A mobile-first job matching app where candidates swipe through offers and employers manage their talent pipeline. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Architecture

```
src/
├── domain/        # Business models, scoring engine — zero framework deps
├── repositories/  # Data access contracts + mock implementations
├── providers/     # Runtime registry — swap mock ↔ Supabase ↔ any backend
├── services/      # External service interfaces (analytics, email, AI, storage)
├── hooks/         # React hooks consuming the provider layer
├── pages/         # Route-level page components
├── components/    # Reusable UI components
├── config/        # Centralized env-var access + integration config
└── lib/           # Utility functions, legacy façades
```

**Key design principles:**
- Domain models own the truth — no Supabase types leak into UI
- Provider registry enables runtime backend swapping
- Role-aware route guards enforce candidate/employer separation
- All environment variables accessed via `src/config/index.ts`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Backend | Supabase (Postgres + Auth + RLS + Storage) |
| Hosting | Cloudflare Pages (planned) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Email | Resend (planned) |
| Analytics | PostHog or GA4 (planned) |
| Error Tracking | Sentry (planned) |
| AI | Lovable AI / pgvector (planned) |

## Getting Started

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd jobswipe

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env
# Fill in your Supabase project URL and anon key

# 4. Start dev server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest tests |
| `npm run preview` | Preview production build |

## User Flows

### Candidate
1. Sign up → email verification → profile setup
2. Swipe through jobs (skip / save / apply)
3. Track application statuses in "My Applications" tab
4. Manage saved jobs
5. Edit profile with skills, experience, CV upload

### Employer
1. Sign up as employer → employer dashboard
2. Post job listings
3. View applications with AI match scores
4. Generate AI shortlists
5. Advance candidates through status pipeline
6. In-app messaging with candidates

## Environment Variables

See [`.env.example`](.env.example) for the full template. Key groups:

- **Supabase** — auto-provisioned by Lovable Cloud
- **App** — base URL, environment mode
- **Analytics** — PostHog/GA4 toggle and keys
- **Error Tracking** — Sentry DSN
- **AI** — model selection and feature toggle
- **Storage** — bucket names and upload limits
- **Email** — Resend configuration

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — System architecture overview
- [`docs/match-scoring-plan.md`](docs/match-scoring-plan.md) — Match scoring engine design
- [`docs/provider-integration-plan.md`](docs/provider-integration-plan.md) — Provider abstraction roadmap
- [`docs/cleanup-notes.md`](docs/cleanup-notes.md) — Technical debt and security notes
- [`docs/production-readiness-report.md`](docs/production-readiness-report.md) — Deployment readiness audit
- [`docs/security-prelaunch.md`](docs/security-prelaunch.md) — Security risks, safe-to-expose values, and remediation steps

## License

Private — all rights reserved.

## Self-hosting

JobSwipe is a standard React + Vite + Supabase application. You can run your own instance on your own Supabase project and any static host.

### Prerequisites
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- Your own [Supabase project](https://supabase.com/dashboard)

### Setup
1. Clone the repo
2. `cp .env.example .env` and fill in all values
3. `npm install`
4. `supabase login`
5. `supabase link --project-ref YOUR_PROJECT_ID`
6. `supabase db push` (applies all migrations in `supabase/migrations/`)
7. `supabase functions deploy` (deploys all edge functions in `supabase/functions/`)
8. Set edge function secrets:
   ```bash
   supabase secrets set \
     AI_API_KEY=... \
     AI_MODEL=... \
     AI_API_URL=... \
     RESEND_API_KEY=... \
     RESEND_FROM_EMAIL=... \
     ALLOWED_ORIGIN=https://your-domain.com
   ```
9. `npm run dev` (local) or `npm run build` then deploy `dist/` to Cloudflare Pages / Vercel / Netlify.

### Switching AI provider
The platform is provider-agnostic. Change `AI_API_KEY`, `AI_MODEL`, and `AI_API_URL` secrets in Supabase to point at any OpenAI-compatible endpoint (Anthropic, OpenAI, OpenRouter, Groq, etc.). The prompts are defined as top-level constants at the top of each edge function file (`supabase/functions/run-shortlist/index.ts`, `supabase/functions/process-cv/index.ts`) — edit them in place.

### Switching email provider
Edge function `supabase/functions/send-email/index.ts` uses Resend by default. Replace the fetch call and headers to use SendGrid, Postmark, AWS SES, or any HTTP email API. Templates are defined as constants at the top of the file.
