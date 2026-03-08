# E2E Smoke Test Plan

## Setup

```bash
npx playwright install chromium
npx playwright test
```

### Environment variables

| Variable | Purpose |
|---|---|
| `E2E_BASE_URL` | Override base URL (default: `http://localhost:5173`) |
| `E2E_CANDIDATE_EMAIL` | Candidate test account email |
| `E2E_CANDIDATE_PASSWORD` | Candidate test account password |
| `E2E_EMPLOYER_EMAIL` | Employer test account email |
| `E2E_EMPLOYER_PASSWORD` | Employer test account password |

## Flows covered

### Auth & role guards (`auth-guards.spec.ts`)
- Guest → redirected to `/auth` from `/`, `/employer`, `/my-profile`
- Candidate → cannot access `/employer` or `/profiles`
- Employer → cannot access `/my-profile`
- Navbar reflects role (candidate sees "Mój profil", employer sees "Panel pracodawcy")

### Candidate flow (`candidate-flow.spec.ts`)
- Browse jobs (card visible)
- Skip via X button (counter advances)
- Save via star button (appears in Zapisane tab)
- Apply via check button (appears in Moje aplikacje tab)
- Tap card → opens job detail modal

### Employer flow (`employer-flow.spec.ts`)
- Dashboard loads at `/employer`
- Profiles/talent page loads at `/profiles`
- Navbar shows employer-specific links, hides candidate links

## Known gaps

- **Live data dependency**: Tests require seeded test accounts in the database. Without real credentials, auth-dependent tests will fail.
- **Shortlist / AI generate**: Not yet testable without seeded applications.
- **Messaging**: Chat panel tests deferred until messages feature is fully wired.
- **Swipe gesture tests**: Playwright drag simulation for framer-motion is unreliable; button-based actions are tested instead.
