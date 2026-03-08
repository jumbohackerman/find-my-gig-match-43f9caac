import { test, expect } from "@playwright/test";

/**
 * Visual regression tests for the most fragile UI areas.
 * Uses Playwright's built-in toHaveScreenshot() which auto-generates
 * baseline screenshots on first run and compares on subsequent runs.
 *
 * Run: npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 * to regenerate baselines after intentional design changes.
 */

test.describe("Visual Regression", () => {

  // ── Auth page ───────────────────────────────────────────────────────────
  test("auth page – login form", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    // Wait for form to be visible
    await page.getByRole("button", { name: /zaloguj|log\s?in|sign\s?in/i }).waitFor();
    await expect(page).toHaveScreenshot("auth-login.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  test("auth page – signup form", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    // Switch to signup mode
    const signupLink = page.getByText(/załóż konto|zarejestruj|sign\s?up/i);
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForTimeout(400); // animation
    }
    await expect(page).toHaveScreenshot("auth-signup.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  // ── Browse / Swipe screen ──────────────────────────────────────────────
  // Note: unauthenticated users get redirected to /auth, so this captures
  // the redirect state. For authenticated swipe view, use signIn helper.
  test("browse screen – redirects or loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // allow redirects/animations
    await expect(page).toHaveScreenshot("browse-initial.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  // ── Employer dashboard ─────────────────────────────────────────────────
  test("employer dashboard – redirects or loads", async ({ page }) => {
    await page.goto("/employer");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("employer-dashboard.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  // ── Profile screen ─────────────────────────────────────────────────────
  test("profile screen – redirects or loads", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("profile-screen.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  // ── 404 page (always accessible) ──────────────────────────────────────
  test("404 page layout", async ({ page }) => {
    await page.goto("/nonexistent-route-xyz");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("404-page.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  // ── Responsive: auth page at mobile width ─────────────────────────────
  test("auth page – mobile 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /zaloguj|log\s?in|sign\s?in/i }).waitFor();
    await expect(page).toHaveScreenshot("auth-login-mobile.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });

  // ── Responsive: auth page at tablet width ─────────────────────────────
  test("auth page – tablet 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /zaloguj|log\s?in|sign\s?in/i }).waitFor();
    await expect(page).toHaveScreenshot("auth-login-tablet.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: true,
    });
  });
});
