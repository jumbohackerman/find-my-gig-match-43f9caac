import { test, expect } from "@playwright/test";
import { signIn, candidateCreds, employerCreds } from "./helpers/auth";

test.describe("Auth & role guards", () => {
  test("guest is redirected to /auth from protected routes", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/auth/);
    expect(page.url()).toContain("/auth");
  });

  test("guest is redirected from /employer", async ({ page }) => {
    await page.goto("/employer");
    await page.waitForURL(/\/auth/);
  });

  test("guest is redirected from /my-profile", async ({ page }) => {
    await page.goto("/my-profile");
    await page.waitForURL(/\/auth/);
  });

  test("candidate cannot access /employer (redirected to /)", async ({ page }) => {
    const { email, password } = candidateCreds();
    await signIn(page, email, password);
    await page.goto("/employer");
    // RoleGate redirects candidate to /
    await page.waitForURL((url) => !url.pathname.includes("/employer"), {
      timeout: 10_000,
    });
    expect(page.url()).not.toContain("/employer");
  });

  test("candidate cannot access /profiles (redirected to /)", async ({ page }) => {
    const { email, password } = candidateCreds();
    await signIn(page, email, password);
    await page.goto("/profiles");
    await page.waitForURL((url) => !url.pathname.includes("/profiles"), {
      timeout: 10_000,
    });
  });

  test("employer cannot access /my-profile (redirected to /employer)", async ({ page }) => {
    const { email, password } = employerCreds();
    await signIn(page, email, password);
    await page.goto("/my-profile");
    await page.waitForURL((url) => !url.pathname.includes("/my-profile"), {
      timeout: 10_000,
    });
  });

  test("candidate navbar shows 'Mój profil' link", async ({ page }) => {
    const { email, password } = candidateCreds();
    await signIn(page, email, password);
    await expect(page.locator("header")).toContainText(/Mój profil/);
  });

  test("employer navbar shows 'Panel pracodawcy' link", async ({ page }) => {
    const { email, password } = employerCreds();
    await signIn(page, email, password);
    await expect(page.locator("header")).toContainText(/Panel pracodawcy/);
  });
});
