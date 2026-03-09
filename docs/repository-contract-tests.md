# Repository Contract Tests

This document outlines the contract testing strategy for repositories in the project, ensuring consistency between our mock (in-memory/demo) implementations and our live (Supabase) implementations.

## Overview
We employ the Repository Pattern to decouple our UI and domain logic from the persistence layer. To safely switch between Mock and Supabase data providers without breaking the app, we enforce strict **Contract Tests**. 

These tests verify:
1. **Identical Method Signatures:** Both implementations must implement the exact same TypeScript interface (e.g., `JobRepository`).
2. **Consistent Return Data Shapes:** They must return the exact same domain models (e.g., arrays instead of nulls for list queries).
3. **Consistent Edge-Case Handling:** They should react to missing data similarly (e.g., returning `null` for `getById` when not found, or throwing an Error on `update` if the entity doesn't exist).
4. **No UI Leakage:** Repositories only deal with domain models, unaware of React state or UI representations.

## Repositories Covered
The following repositories are currently covered by the contract test suite (`src/test/contracts/repositories.test.ts`):
- Jobs (`JobRepository`)
- Applications (`ApplicationRepository`)
- Candidates (`CandidateRepository`)
- Profiles (`ProfileRepository`)
- Messages (`MessageRepository`)
- Saved Jobs (`SavedJobRepository`)
- Swipe Events (`SwipeEventRepository`)
- Notifications (`NotificationRepository`)
- Preferences (`PreferencesRepository`)

## Contract Mismatches Addressed
During the alignment, the following guidelines were formalized to ensure no mismatches remain:
- **Empty Lists:** Both mock and Supabase implementations *must* return `[]` instead of `null` or `undefined` for `list*` and `get*Ids` methods.
- **Not Found Returns:** Both implementations *must* return `null` instead of throwing errors when `getById` or `getByUserId` lookups fail.
- **Updates on Missing Data:** Both implementations *must* throw an Error when attempting to `update` a record that does not exist.
- **Type Compliance:** Both sets of repositories are structurally typed to the identical interfaces defined in `src/repositories/interfaces.ts`. 

## Remaining Alignment Needs (Before Live Cutover)
Before completely switching off mock data in production, the following edge cases should be monitored:
1. **Mock Seed Data References:** The mock candidate and job repositories currently rely heavily on statically imported data (`src/data/seekers.ts`, `src/data/jobs.ts`). Ensure Supabase is properly seeded with equivalent initial states if demo mode is entirely disabled.
2. **Realtime Subscriptions:** The `subscribe` methods in Mock implementations currently return a no-op `() => {}` function. In Supabase, these establish active WebSockets. Cutover requires ensuring components properly invoke these cleanup functions to avoid memory leaks with real WebSockets.
3. **Error Handling Specificity:** Supabase implementations log and throw errors mapping directly to database constraints (e.g., RLS violations, unique constraint violations). The mock implementations are more permissive. UI error boundaries may need tuning if they encounter strict DB constraint errors not surfaced by the mock layer.
