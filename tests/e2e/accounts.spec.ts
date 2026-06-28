import { expect, test } from "@playwright/test";

// Verifies "remember logged-in accounts on a device": after onboarding, the
// account is remembered; after logout it appears under "Recent accounts" and a
// single tap logs back in with no phone/OTP typing (fake auth mode).

test.use({ locale: "en-US" });

test("remembers the account and re-logs-in with one tap", async ({ page, context }) => {
  await context.addCookies([
    { name: "NEXT_LOCALE", value: "en", url: "http://localhost:3000" },
  ]);
  const phone = `+8190${Date.now().toString().slice(-9)}`;
  const name = "Remembered Builder";

  // Sign up + onboard a contractor.
  await page.goto("/login");
  await page.getByPlaceholder("+8190…").fill(phone);
  await page.getByRole("button", { name: "Send verification code" }).click();
  await page.getByPlaceholder("123456").fill("123456");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Choose your role")).toBeVisible();
  await page.getByRole("textbox").first().fill(name);
  await page.getByRole("button", { name: "Sign up as a contractor" }).click();
  await expect(page.getByText("Contractor profile")).toBeVisible();
  const inputs = page.getByRole("textbox");
  await inputs.nth(0).fill("Remembered Co");
  await inputs.nth(1).fill("Tanaka");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Under review. Please wait for approval.")).toBeVisible();

  // Log out via the account menu (items are ARIA menuitems).
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  // The login page now offers the remembered account — no phone retyping.
  await expect(page.getByText("Recent accounts")).toBeVisible();
  // Anchor on the name start so the "Remove <name>" button isn't also matched.
  const recent = page.getByRole("button", { name: new RegExp("^" + name) });
  await expect(recent).toBeVisible();
  await recent.click();

  // Logged back in (still pending) without entering a phone number or code.
  await expect(page.getByText("Under review. Please wait for approval.")).toBeVisible();
});
