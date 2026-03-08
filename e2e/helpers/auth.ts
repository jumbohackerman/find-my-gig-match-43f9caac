import { type Page } from "@playwright/test";

/**
 * Sign in via the /auth page.
 * Requires E2E_CANDIDATE_EMAIL / E2E_CANDIDATE_PASSWORD (or employer variants) env vars.
 */
export async function signIn(
  page: Page,
  email: string,
  password: string
) {
  await page.goto("/auth");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/hasło|password/i).fill(password);
  await page.getByRole("button", { name: /zaloguj|log\s?in|sign\s?in/i }).click();
  // Wait for redirect away from /auth
  await page.waitForURL((url) => !url.pathname.includes("/auth"), {
    timeout: 15_000,
  });
}

export function candidateCreds() {
  return {
    email: process.env.E2E_CANDIDATE_EMAIL || "candidate@test.local",
    password: process.env.E2E_CANDIDATE_PASSWORD || "test1234",
  };
}

export function employerCreds() {
  return {
    email: process.env.E2E_EMPLOYER_EMAIL || "employer@test.local",
    password: process.env.E2E_EMPLOYER_PASSWORD || "test1234",
  };
}
