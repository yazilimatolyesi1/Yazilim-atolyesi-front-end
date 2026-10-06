import { expect, test, type Page } from "@playwright/test";

/**
 * Hata ve istek davranisi testleri. Buradaki HICBIR istek gercek backend'e gitmez;
 * tum yanitlar tarayicida `page.route` ile taklit edilir. Bu yuzden testler gunluk
 * backend calisirken de, calismazken de guvenle calisir ve hicbir veri yazmaz.
 *
 * Tek istisna: yonetim paneli sunucuda (SSR) render edildigi icin `/yonetim`
 * sayfasinin oturum el sikismasi `page.route` ile yakalanamaz. Panel testleri
 * gercek bir yonetici GIRISI yapar, sonrasinda testin dogruladigi HER yanit
 * tarayicida taklit edilir; tek yazma islemi auth kaydidir.
 *
 * Kapsam: debounce (~300 ms), eski istegin iptali, iptalin hata sayilmamasi,
 * eski cevabin listeyi ezmemesi, baglanti hatasi, 401/403 ayrimi, alan hatalari,
 * formun korunmasi, islem bildirimi, kirli modal uyarisi, Escape ile kapanma.
 */

const origin = process.env.UI_TEST_URL || "http://localhost:3001";
const backend = process.env.E2E_API_URL || "http://127.0.0.1:8080/api/v1";

const announcements = (items: { id: string; title: string; summary: string }[]) => ({
  content: items.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.id,
    summary: item.summary,
    content: "",
    category: "Duyuru",
    publishedAt: "2026-09-20T10:00:00Z",
  })),
  totalPages: 1,
});

const search = (page: Page) => page.getByRole("searchbox", { name: "Duyurularda ara" });
const errorNote = (page: Page) => page.locator(".content-note");

test("arama kutusu debounce uygular: bir dizi tuşta tek istek gider", async ({ page }) => {
  const queries: string[] = [];
  await page.route("**/api/club/announcements**", route => {
    queries.push(new URL(route.request().url()).searchParams.get("q") || "");
    return route.fulfill({ json: announcements([{ id: "1", title: "Sonuç", summary: "Özet" }]) });
  });
  await page.goto("/duyurular");
  await expect(page.getByRole("heading", { name: "Sonuç" })).toBeVisible();

  const before = queries.length;
  await search(page).pressSequentially("yazilim", { delay: 25 });
  await expect(page.getByRole("heading", { name: "Sonuç" })).toBeVisible();
  await page.waitForTimeout(700);

  const typed = queries.slice(before);
  // Son istek tam terimi taşımalı. Sayı 2'den küçük olmalı: 7 tuş için tek istek.
  // (Geliştirme sunucusunda StrictMode etkiyi iki kez çalıştırabildiği için 2 toleranslı.)
  expect(typed.at(-1)).toBe("yazilim");
  expect(typed.length).toBeLessThanOrEqual(2);
});

test("iptal edilen istek hata üretmez ve eski cevap listeyi ezmez", async ({ page }) => {
  // q=y isteği uzun süre bekletilir; bu arada kullanıcı "ya" yazar ve yeni istek atılır.
  await page.route("**/api/club/announcements**", async route => {
    const q = new URL(route.request().url()).searchParams.get("q") || "";
    if (q === "y") {
      await new Promise(resolve => setTimeout(resolve, 2500));
      return route.abort();
    }
    return route.fulfill({ json: announcements([{ id: q || "ilk", title: `Sonuç ${q || "ilk"}`, summary: "Özet" }]) });
  });
  await page.goto("/duyurular");
  await expect(page.getByRole("heading", { name: "Sonuç ilk" })).toBeVisible();

  await search(page).pressSequentially("y", { delay: 20 });
  await search(page).pressSequentially("a", { delay: 20 });
  await expect(page.getByRole("heading", { name: "Sonuç ya" })).toBeVisible();

  // Bekletilen istek bu sırada iptal edilir; hata mesajı çıkmamalı ve
  // "Sonuç y" liste yerine geçmemeli.
  await page.waitForTimeout(3000);
  await expect(page.getByRole("heading", { name: "Sonuç ya" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sonuç y", exact: true })).toHaveCount(0);
  await expect(errorNote(page)).toHaveCount(0);
  await expect(page.locator(".form-loading")).toHaveCount(0);
});

test("baglantı hatası uyarı verir ve tekrar denemeyle düzelir", async ({ page }) => {
  let broken = true;
  await page.route("**/api/club/announcements**", route =>
    broken
      ? route.abort("connectionfailed")
      : route.fulfill({ json: announcements([{ id: "1", title: "Yeniden çalıştı", summary: "Özet" }]) }),
  );
  await page.goto("/duyurular");
  await expect(errorNote(page)).toContainText("Bağlantı kurulamadı");
  await expect(page.getByRole("button", { name: "Tekrar dene" })).toBeVisible();

  broken = false;
  await page.getByRole("button", { name: "Tekrar dene" }).click();
  await expect(page.getByRole("heading", { name: "Yeniden çalıştı" })).toBeVisible();
  await expect(errorNote(page)).toHaveCount(0);
});

test("sunucu 500 dönerse hata gösterilir", async ({ page }) => {
  await page.route("**/api/club/announcements**", route =>
    route.fulfill({ status: 500, json: { message: "Beklenmeyen bir hata oluştu." } }),
  );
  await page.goto("/duyurular");
  await expect(errorNote(page)).toContainText("Beklenmeyen bir hata oluştu.");
});

test("alan hataları listelenir ve form verisi korunur", async ({ page }) => {
  await page.route("**/api/club/contact/messages", route =>
    route.fulfill({
      status: 400,
      json: {
        message: "Girdiğin bilgiler geçersiz.",
        fieldErrors: [
          { field: "email", message: "E-posta geçerli bir adres değil." },
          { field: "message", message: "Mesaj en az 10 karakter olmalı." },
        ],
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Mesaj gönder" }).first().click();

  const form = page.locator(".club-form");
  await form.getByLabel("Ad soyad").fill("Test Kişi");
  // type=email tarayıcı doğrulamasını geçmeli; hata sunucudan gelmelidir.
  await form.getByLabel("E-posta").fill("gecersiz@ornek.test");
  await form.getByLabel("Konu").fill("Konu başlığı");
  await form.getByLabel("Mesajın").fill("Bu mesaj yeterince uzun bir metin.");
  await form.getByRole("button", { name: "Mesaj gönder" }).click();

  const failure = page.locator(".form-error");
  await expect(failure).toContainText("E-posta geçerli bir adres değil.");
  await expect(failure).toContainText("Mesaj en az 10 karakter olmalı.");

  // Hata sonrası kullanıcının yazdıkları korunur.
  await expect(form.getByLabel("Ad soyad")).toHaveValue("Test Kişi");
  await expect(form.getByLabel("E-posta")).toHaveValue("gecersiz@ornek.test");
  await expect(form.getByLabel("Konu")).toHaveValue("Konu başlığı");
  await expect(form.getByLabel("Mesajın")).toHaveValue("Bu mesaj yeterince uzun bir metin.");
});

test("form gönderimi çift tıklama ile iki kez gönderilmez", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/club/contact/messages", async route => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 1500));
    return route.fulfill({ json: { id: "x" } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mesaj gönder" }).first().click();
  const form = page.locator(".club-form");
  await form.getByLabel("Ad soyad").fill("Test Kişi");
  await form.getByLabel("E-posta").fill("test@example.test");
  await form.getByLabel("Konu").fill("Konu");
  await form.getByLabel("Mesajın").fill("Bu mesaj yeterince uzun bir metin.");

  // Erişilebilir ad gönderim sırasında "Gönderiliyor…" olur; bu yüzden
  // düğme type niteliğiyle seçilir.
  const submit = form.locator('button[type="submit"]');
  const responded = page.waitForResponse(r => r.url().includes("/api/club/contact/messages"));
  await submit.click();

  // Gönderim sırasında düğme kilitlenir; ikinci tıklama yeni istek oluşturmamalı.
  await expect(submit).toBeDisabled();
  await submit.dispatchEvent("click");

  await responded;
  await page.waitForTimeout(400);
  expect(calls).toBe(1);
});

/* ------------------------------------------------------------------ */
/* Yönetim paneli: 401/403 ayrımı, işlem bildirimi, kirli modal, Esc */
/* ------------------------------------------------------------------ */

const emptyPage = { content: [], totalPages: 0, totalElements: 0, page: 0, size: 10 };

/** SSR el sıkışması için gerçek yönetici oturumu açar; sonrası tamamen taklit edilebilir. */
async function openAdmin(
  context: import("@playwright/test").BrowserContext,
  request: import("@playwright/test").APIRequestContext,
) {
  const auth = await request.post(`${backend}/auth/login`, {
    data: {
      email: process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local",
      password: process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!",
    },
  });
  expect(auth.status(), "Gerçek backend 8080'de açık olmalı (bkz. docker compose up -d)").toBe(200);
  await context.addCookies([
    { name: "club_session", value: (await auth.json()).accessToken, url: origin, httpOnly: true, sameSite: "Lax" },
  ]);
}

/** Paneldeki tüm liste/tekil istekleri taklit eder; yazma istekleri `writes`e gider. */
async function mockAdminApi(page: Page, status: number, message: string, writes?: (route: import("@playwright/test").Route) => Promise<void> | void) {
  await page.route("**/api/club/admin/**", async route => {
    if (route.request().method() !== "GET") return void (await writes?.(route) ?? route.fulfill({ status, json: { message } }));
    return void route.fulfill({ status, json: { message } });
  });
}

test("401 oturum bitişi olarak gösterilir ve tekrar giriş bağlantısı sunulur", async ({ page, context, request }) => {
  await openAdmin(context, request);
  await mockAdminApi(page, 401, "Oturum süresi doldu.");
  await page.goto("/yonetim");

  const alert = page.getByRole("alert").filter({ hasText: "Oturumun sona erdi." });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Yönetim alanına erişmek için tekrar giriş yap");
  await expect(alert.getByRole("link", { name: /Tekrar giriş yap/ })).toHaveAttribute("href", "/giris-yap");
  // 403 metni gösterilmemeli: oturum bitişi ile yetki eksikliği ayrımı.
  await expect(page.getByText("Bu işlem için yetkin yok.")).toHaveCount(0);
});

test("403 yetki eksikliği olarak gösterilir ve tekrar giriş bağlantısı sunulmaz", async ({ page, context, request }) => {
  await openAdmin(context, request);
  await mockAdminApi(page, 403, "Erişim reddedildi.");
  await page.goto("/yonetim");

  const alert = page.getByRole("alert").filter({ hasText: "Bu işlem için yetkin yok." });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("rolü bu alana erişime izin vermiyor");
  await expect(alert.getByRole("link", { name: /Tekrar giriş yap/ })).toHaveCount(0);
  await expect(page.getByText("Oturumun sona erdi.")).toHaveCount(0);
});

test("başarılı kayıt role=status işlem bildirimi gösterir", async ({ page, context, request }) => {
  await openAdmin(context, request);
  let saved = 0;
  await page.route("**/api/club/admin/**", async route => {
    const method = route.request().method();
    if (method === "GET") return void route.fulfill({ json: emptyPage });
    saved += 1;
    return void route.fulfill({ status: 201, json: { id: "yeni-duyuru" } });
  });
  await page.goto("/yonetim");
  await page.getByRole("navigation", { name: "Yönetim menüsü" }).getByRole("button", { name: "Duyurular", exact: true }).click();

  const create = page.getByRole("button", { name: "+ Duyuru oluştur", exact: true });
  await create.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Başlık", { exact: true }).fill("Taklit edilen duyuru");
  await dialog.getByLabel("İçerik", { exact: true }).fill("Bu kayıt gerçek backend'e yazılmaz.");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();

  // İşlem bildirimi ekran okuyucular için role=status olarak duyurulmalı.
  await expect(page.getByRole("status").filter({ hasText: "Değişiklikler kaydedildi." })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(saved).toBe(1);
  await expect(create).toBeVisible();
});

test("kaydedilmemiş değişiklik varken kapatma onay ister, iptal edilirse pencere açık kalır", async ({ page, context, request }) => {
  await openAdmin(context, request);
  await page.route("**/api/club/admin/**", route => route.fulfill({ json: emptyPage }));
  await page.goto("/yonetim");
  await page.getByRole("navigation", { name: "Yönetim menüsü" }).getByRole("button", { name: "Duyurular", exact: true }).click();

  await page.getByRole("button", { name: "+ Duyuru oluştur", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Başlık", { exact: true }).fill("Yarım kalmış taslak");

  const prompts: string[] = [];
  let accept = false;
  page.on("dialog", async d => { prompts.push(d.message()); await (accept ? d.accept() : d.dismiss()); });
  await dialog.getByRole("button", { name: "Vazgeç" }).click();

  await expect.poll(() => prompts.length).toBe(1);
  expect(prompts[0]).toContain("Kaydedilmemiş değişiklikler var");
  // Onay reddedildiği için veri kaybı olmaz, pencere ve yazılan metin yerinde kalır.
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Başlık", { exact: true })).toHaveValue("Yarım kalmış taslak");

  // Onaylanırsa bu kez pencere kapanır.
  accept = true;
  await dialog.getByRole("button", { name: "Vazgeç" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Escape pencereyi kapatır ve odağı tetikleyen düğmeye geri verir", async ({ page, context, request }) => {
  await openAdmin(context, request);
  await page.route("**/api/club/admin/**", route => route.fulfill({ json: emptyPage }));
  await page.goto("/yonetim");
  await page.getByRole("navigation", { name: "Yönetim menüsü" }).getByRole("button", { name: "Duyurular", exact: true }).click();

  const create = page.getByRole("button", { name: "+ Duyuru oluştur", exact: true });
  await create.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  // Değişiklik yok; Escape doğrudan kapatır, onay penceresi açılmaz.
  const prompts: string[] = [];
  page.on("dialog", d => { prompts.push(d.message()); void d.dismiss(); });

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(prompts).toEqual([]);
  await expect(create).toBeFocused();
});
