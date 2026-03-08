import { test, expect } from "@playwright/test";
import { signIn, employerCreds } from "./helpers/auth";

test.describe("Employer flow", () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = employerCreds();
    await signIn(page, email, password);
  });

  test("employer dashboard loads", async ({ page }) => {
    await page.goto("/employer");
    // Should see the employer dashboard content
    await expect(page.locator("text=/Panel|Dashboard|Rekrutacja/i").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("employer can navigate to profiles/talent search", async ({ page }) => {
    await page.goto("/profiles");
    await expect(page.locator("body")).not.toContainText("404", { timeout: 10_000 });
  });

  test("employer navbar shows correct links", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toContainText(/Panel pracodawcy/);
    await expect(header).toContainText(/Znajdź talent/);
    // Should NOT show candidate-only link
    await expect(header).not.toContainText(/Mój profil/);
  });
});
