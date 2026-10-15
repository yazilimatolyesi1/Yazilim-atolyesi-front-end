import { expect, test } from "@playwright/test";

// Server component'lerin fetch'i Node icinden gider; `page.route` bunu yakalayamaz.
// Bu yuzden SSR icerigi tests/e2e/support/mock-content-api.mjs uzerinden kontrol edilir.
const MOCK_API = "http://127.0.0.1:9099";

async function setContentMode(mode: "proxy" | "malicious" | "fail") {
  await fetch(`${MOCK_API}/__control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
}

test.describe("Kisi 5 - İletişim ve sayfa içerikleri", () => {
  test.beforeEach(async () => {
    await setContentMode("proxy");
  });

  test("İletişim formu başarı senaryosu - 'Mesaj alındı' mesajı gösterilir", async ({ page }) => {
    await page.route("**/api/club/contact/messages", async (route) => {
      await route.fulfill({ status: 200, json: { id: "msg-123", message: "Mesaj alındı" } });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Mesaj gönder" }).first().click();
    const form = page.locator(".club-form");
    await form.getByLabel("Ad soyad").fill("Test Kullanıcı");
    await form.getByLabel("E-posta").fill("test@example.com");
    await form.getByLabel("Konu").fill("Test konusu");
    await form.getByLabel("Mesajın").fill("Bu bir test mesajıdır, en az on karakter olmalı.");
    await form.getByRole("button", { name: "Mesaj gönder" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Mesaj alındı" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mesaj alındı" })).toBeVisible();
    await expect(form).toHaveCount(0);
  });

  test("İletişim formu 400 alan hataları - hatalar alan altında gösterilir ve veriler korunur", async ({ page }) => {
    await page.route("**/api/club/contact/messages", async (route) => {
      await route.fulfill({ status: 400, json: { message: "Girdiğiniz bilgiler geçersiz.", fieldErrors: [{ field: "email", message: "E-posta geçerli bir adres değil." }, { field: "message", message: "Mesaj en az 10 karakter olmalı." }] } });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Mesaj gönder" }).first().click();
    const form = page.locator(".club-form");
    await form.getByLabel("Ad soyad").fill("Test Kullanıcı");
    // type=email ve minLength tarayıcı doğrulamasını geçmeli; hata sunucudan gelmeli.
    await form.getByLabel("E-posta").fill("gecersiz@ornek.test");
    await form.getByLabel("Konu").fill("Test konusu");
    await form.getByLabel("Mesajın").fill("Sunucu bu mesajı da geçersiz sayacak.");
    await form.getByRole("button", { name: "Mesaj gönder" }).click();
    const errorContainer = page.locator(".form-error");
    await expect(errorContainer).toContainText("E-posta geçerli bir adres değil.");
    await expect(errorContainer).toContainText("Mesaj en az 10 karakter olmalı.");
    await expect(form.getByLabel("Ad soyad")).toHaveValue("Test Kullanıcı");
    await expect(form.getByLabel("E-posta")).toHaveValue("gecersiz@ornek.test");
    await expect(form.getByLabel("Konu")).toHaveValue("Test konusu");
    await expect(form.getByLabel("Mesajın")).toHaveValue("Sunucu bu mesajı da geçersiz sayacak.");
  });

  test("İletişim formu 429 Too Many Requests", async ({ page }) => {
    await page.route("**/api/club/contact/messages", async (route) => {
      await route.fulfill({ status: 429, json: { message: "Çok fazla istek gönderdiniz, lütfen biraz bekleyip tekrar deneyin." } });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Mesaj gönder" }).first().click();
    const form = page.locator(".club-form");
    await form.getByLabel("Ad soyad").fill("Test Kullanıcı");
    await form.getByLabel("E-posta").fill("test@example.com");
    await form.getByLabel("Konu").fill("Test konusu");
    await form.getByLabel("Mesajın").fill("Bu mesaj on karakterden daha uzun olmalı.");
    await form.getByRole("button", { name: "Mesaj gönder" }).click();
    await expect(page.locator(".form-error")).toContainText("Çok fazla istek gönderdiniz");
    await expect(form.getByLabel("Ad soyad")).toHaveValue("Test Kullanıcı");
    await expect(form.getByLabel("E-posta")).toHaveValue("test@example.com");
    await expect(form.getByLabel("Mesajın")).toHaveValue("Bu mesaj on karakterden daha uzun olmalı.");
  });

  test("Güvenli render - HTML etiketleri düz metin olarak gösterilir", async ({ page }) => {
    const maliciousHtml = '<script>alert("xss")</script><b>Kalın Metin</b>Normal metin';
    let dialogOpened = false;
    page.on("dialog", async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });

    await setContentMode("malicious");
    await page.goto("/");

    await expect(page.getByText(maliciousHtml).first()).toBeVisible();
    await expect(page.locator("b", { hasText: "Kalın Metin" })).toHaveCount(0);
    await expect(page.locator("script:has-text('alert(\"xss\")')")).toHaveCount(0);
    expect(dialogOpened).toBe(false);
  });

  test("İçerik hatasında sayfanın çökmemesi - Graceful degradation", async ({ page }) => {
    await setContentMode("fail");
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByText("Sayfa yüklenemedi")).toHaveCount(0);
  });

  test("Mobil görünüm - 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator("#iletisim")).toBeAttached();
    await expect(page.locator("#duyurular")).toBeAttached();
    await expect(page.locator("#hakkimizda")).toBeAttached();
    await expect(page.locator("#takim")).toBeAttached();
  });
});

