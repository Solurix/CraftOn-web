import { expect, test } from "@playwright/test";

// Browser E2E smoke: a real signup + onboarding flows through the web app to the
// running API and back (auth → typed client → onboarding → pending state). The
// full admin-gated cycle is covered deterministically by the API-level
// test_full_cycle; this proves the PWA wiring works in a browser.
//
// Requires a running crafton-api (NEXT_PUBLIC_API_BASE_URL) and fake auth mode.

test.use({ locale: "en-US" });

test("contractor can sign up and onboard", async ({ page, context }) => {
  // Render the UI in English for stable selectors.
  await context.addCookies([
    { name: "NEXT_LOCALE", value: "en", url: "http://localhost:3000" },
  ]);

  const phone = `+8190${Date.now().toString().slice(-9)}`;

  await page.goto("/login");
  await page.getByPlaceholder("+8190…").fill(phone);
  await page.getByRole("button", { name: "Send verification code" }).click();
  await page.getByPlaceholder("123456").fill("123456");
  await page.getByRole("button", { name: "Log in" }).click();

  // First login → role selection.
  await expect(page.getByText("Choose your role")).toBeVisible();
  await page.getByRole("textbox").first().fill("E2E Builder");
  await page.getByRole("button", { name: "Sign up as a contractor" }).click();

  // Contractor onboarding form.
  await expect(page.getByText("Contractor profile")).toBeVisible();
  const inputs = page.getByRole("textbox");
  await inputs.nth(0).fill("E2E建設"); // company name
  await inputs.nth(1).fill("Tanaka"); // contact person
  // prefecture is prefilled with Tokyo
  await page.getByRole("button", { name: "Submit" }).click();

  // Onboarded but not yet approved → pending-review state.
  await expect(
    page.getByText("Under review. Please wait for approval."),
  ).toBeVisible();
});
