# Visual Regression Status

## Approach

Playwright's built-in `toHaveScreenshot()` — generates baseline PNGs on first run, pixel-compares on subsequent runs. No external service needed.

**File:** `e2e/visual-regression.spec.ts`

## Usage

```bash
# First run — generate baselines
npx playwright test e2e/visual-regression.spec.ts --update-snapshots

# Subsequent runs — compare against baselines
npx playwright test e2e/visual-regression.spec.ts

# Update after intentional design changes
npx playwright test e2e/visual-regression.spec.ts --update-snapshots
```

Baselines are stored in `e2e/visual-regression.spec.ts-snapshots/` (auto-created by Playwright).

## Protected Screens / States

| Test | Screen | Viewport | Notes |
|---|---|---|---|
| `auth-login.png` | Auth – login form | Desktop | Form layout, branding, inputs |
| `auth-signup.png` | Auth – signup form | Desktop | Signup variant with name field |
| `browse-initial.png` | Browse / swipe | Desktop | Redirects to /auth if unauthenticated |
| `employer-dashboard.png` | Employer panel | Desktop | Redirects to /auth if unauthenticated |
| `profile-screen.png` | My Profile | Desktop | Redirects to /auth if unauthenticated |
| `404-page.png` | Not Found | Desktop | Always accessible, branded layout |
| `auth-login-mobile.png` | Auth – login | 375×812 | Mobile responsive check |
| `auth-login-tablet.png` | Auth – login | 768×1024 | Tablet responsive check |

## Configuration

- `maxDiffPixelRatio: 0.02` — allows up to 2% pixel difference (accounts for font rendering variance across CI environments)
- `fullPage: true` — captures the entire scrollable page
- Playwright config: `screenshot: "only-on-failure"` for regular e2e; visual tests use explicit `toHaveScreenshot()`

## Limitations

| Limitation | Notes |
|---|---|
| Authenticated views | Browse, employer, and profile tests capture the auth redirect; to test logged-in views, use `signIn()` helper with test credentials |
| Modal states | Modals require authenticated context + data to open; covered by redirect-state screenshots for now |
| Dynamic content | Time-based text (e.g., "2 min ago") can cause false diffs; mitigate with `maxDiffPixelRatio` |
| CI font rendering | Pixel differences across OS; threshold set at 2% to accommodate |
| Animations | `waitForTimeout` used to let framer-motion settle; fragile if animations change duration |

## Future Improvements

- Add authenticated visual tests using `signIn()` helper + test accounts
- Add modal-open states (job detail, candidate profile) once test data seeding is stable
- Consider `toHaveScreenshot({ mask })` to exclude dynamic areas (timestamps, avatars)
- Add dark mode variants if theme switching is implemented
