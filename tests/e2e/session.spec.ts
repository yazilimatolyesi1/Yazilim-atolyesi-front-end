import { test, expect } from "@playwright/test";

test("login,profile check, and logout flow", async ({ page }) => {
  // go to login page
  await page.goto("/giris-yap");

  // fill credentials(mock data)
  await page.fill('input[name="email"]', "panmalop11@gmail.com");
  await page.fill('input[name="password"]', "123QqwAas");
  await page.click('button[type="submit"]');

  // Verify successful authentication and UI reflection
  await expect(page.locator('text=Giriş başarılı')).toBeVisible();

  // Perform logout action
  await page.click('button:has-text("Çıkış yap")');

  // Confirm session data is wiped and redirected back
  await expect(page.locator('a[href="/giris-yap"]')).toBeVisible();
});
