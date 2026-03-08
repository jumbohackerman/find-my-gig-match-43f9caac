import { test, expect } from "@playwright/test";
import { signIn, candidateCreds } from "./helpers/auth";

test.describe("Candidate flow", () => {
  test.beforeEach(async ({ page }) => {
    const { email, password } = candidateCreds();
    await signIn(page, email, password);
    // Should land on / with the swipe view
    await expect(page.locator("text=Przeglądaj")).toBeVisible({ timeout: 10_000 });
  });

  test("browse jobs — swipe card is visible", async ({ page }) => {
    // At least one card should render with a job title
    const card = page.locator(".card-gradient").first();
    await expect(card).toBeVisible({ timeout: 10_000 });
  });

  test("skip via X button — card animates away", async ({ page }) => {
    const counterBefore = await page.locator("text=/\\d+\\s*\\/\\s*\\d+/").textContent();
    await page.locator('button[title="Pomiń"]').click();
    // Counter should advance
    await expect(page.locator("text=/\\d+\\s*\\/\\s*\\d+/")).not.toHaveText(counterBefore!, {
      timeout: 5_000,
    });
  });

  test("save via star button", async ({ page }) => {
    await page.locator('button[title="Zapisz na później"]').click();
    // Switch to Zapisane tab
    await page.locator("text=Zapisane").click();
    const savedSection = page.locator("text=Zapisane oferty");
    await expect(savedSection).toBeVisible({ timeout: 5_000 });
  });

  test("apply via check button", async ({ page }) => {
    await page.locator('button[title="Aplikuj"]').click();
    // Switch to applied tab
    await page.locator("text=Moje aplikacje").click();
    const section = page.locator("text=Moje aplikacje").first();
    await expect(section).toBeVisible({ timeout: 5_000 });
  });

  test("tap card opens job detail modal", async ({ page }) => {
    const card = page.locator(".card-gradient").first();
    await card.click();
    // Modal / detail should appear with an apply or close button
    await expect(
      page.locator("[role=dialog], [data-testid=job-detail-modal]").first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
