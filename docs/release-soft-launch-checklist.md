# Release & Soft-Launch Checklist

**Status**: Active  
**Last updated**: 2026-03-09  

This document outlines the readiness state and necessary steps for staging deployment and the initial soft-launch of the JobSwipe application. It is structured to separate critical blockers from deferred enhancements.

---

## 1. Must-Have (Launch Blockers)

These items **must** be resolved before any external users (even beta testers) are invited.

### Security & Compliance
- [ ] **RLS Enforcement**: All critical tables (`profiles`, `candidates`, `jobs`, `applications`) must have strict Row Level Security policies active.
- [ ] **Storage Security**: `cvs` bucket must have RLS active preventing employers from reading CVs of candidates who haven't applied.
- [ ] **Environment Secrets**: Ensure production Supabase keys and Lovable AI keys are securely stored in Cloudflare Pages and Supabase Edge Functions.
- [ ] **Legal Pages**: Basic Terms of Service, Privacy Policy, and Cookie Banner (`CookieBanner.tsx`) must be active and compliant.

### Technical & Infrastructure
- [ ] **Provider Cutover**: Complete the migration from mock providers to Supabase for all critical flows in `src/providers/registry.ts`.
- [ ] **Missing Supabase Repositories**: Implement actual Supabase database tables and repository logic for `saved_jobs`, `swipe_events`, `notifications`, and `user_preferences`.
- [ ] **CI/CD Pipeline**: GitHub Actions (`.github/workflows/ci.yml`) must be passing reliably.
- [ ] **SPA Routing**: Cloudflare Pages routing (`_redirects`) must be configured to support React Router.

### Product Core Flows
- [ ] **Candidate Flow**: Sign up, complete profile, upload CV, swipe on jobs, apply.
- [ ] **Employer Flow**: Sign up, post job, view applicants, update applicant status.

---

## 2. Feature-Flagged Items

These features are merged but controlled via feature flags (`src/config/flags.ts`). Decisions needed for soft-launch:

- **AI Match Scoring** (`ENABLE_AI_SCORING`): *Recommendation: ON*. Core value proposition. Requires Lovable AI gateway enabled and edge function deployed.
- **Demo Mode** (`ENABLE_DEMO_MODE`): *Recommendation: OFF*. Must ensure no demo data leaks into the live production environment.
- **Real-time Messaging** (`ENABLE_REALTIME_CHAT`): *Recommendation: ON*. Requires Supabase Realtime enabled on the `messages` table.

---

## 3. Rollbackable Items

If issues occur during soft-launch, these components have documented rollback paths:

- **Frontend Deployments**: Cloudflare Pages supports instantaneous rollbacks to previous deployments via the dashboard.
- **Match Scoring Engine**: If the AI engine fails or hallucinates, we can gracefully degrade to basic keyword matching or manual review by toggling the AI flag.
- **Edge Functions**: Deploy previous versions or bypass them by falling back to client-side logic where feasible.

*Note: Database migrations (especially destructive ones) are NOT easily rollbackable. Ensure `docs/migration-discipline.md` rollback guidelines are followed.*

---

## 4. Intentionally Postponed (Post-Launch)

These items are documented but intentionally deferred until after the initial soft-launch phase to accelerate time-to-market:

- **Advanced Analytics**: Granular event taxonomy (PostHog/GA4) tracking beyond basic page views.
- **Complex Notifications**: Push notifications and advanced email digests (currently relying on basic in-app notifications).
- **Automated Storage Cleanup**: The `cleanup-storage` edge function for GDPR account deletion (handling via manual admin process initially).
- **Payment Gateway Integration**: Stripe integration for employer job posting fees (soft-launch is free).
- **Semantic Vector Search**: `pgvector` candidate embeddings for semantic search.