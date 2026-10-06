import { test, expect, type APIRequestContext, type Route } from "@playwright/test";
import { cleanupSql, sql, sqlEnabled, sqlSkipReason, sqlTarget } from "./support/db";

test.describe.configure({ mode: "serial" });
// Real local Spring/PostgreSQL only. No mocked successful API responses.
// Kesinti senaryosu istisnadir: gunluk backend'i DURDURMAZ, tarayicida
// taklit edilir (bkz. "servis kesintisi" testi).
const origin = process.env.UI_TEST_URL || "http://localhost:3001";
const backend = process.env.E2E_API_URL || "http://127.0.0.1:8080/api/v1";
for (const url of [origin, backend]) {
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
    throw new Error("Bu test yalnızca yerel geliştirme servislerinde çalıştırılır.");
  }
}
const run = `e2e-${Date.now()}`;
const email = `${run}@example.test`;
const password = "LocalTest123!";
let admin: APIRequestContext;
let registration: Record<string, any>;
const announcements: string[] = [];
const messages: string[] = [];

test.beforeAll(async ({ playwright }) => {
  console.warn(sqlEnabled
    ? `\n  [E2E] Ham SQL ACIK. Hedef: ${sqlTarget}\n`
    : `\n  [E2E] ${sqlSkipReason}\n        Kalici veri (PENDING basvuru, KVKK kaydi, mesaj satiri) dogrulanmadi.\n`);
  const auth = await playwright.request.newContext();
  const login = await auth.post(`${backend}/auth/login`, { data: {
    email: process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local",
    password: process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!",
  } });
  expect(login.status()).toBe(200);
  const { accessToken } = await login.json();
  admin = await playwright.request.newContext({
    baseURL: `${backend}/`, extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });
  await auth.dispose();
  for (let i = 0; i < 10; i++) {
    const response = await admin.post("admin/announcements", { data: {
      title: `${run} duyuru ${i}`, slug: `${run}-${i}`, summary: "Gerçek API test duyurusu.",
      content: "PostgreSQL üzerinden gelen uçtan uca test içeriği.", category: "Test",
      status: "PUBLISHED", pinned: true, featured: true, displayOrder: i,
    } });
    expect(response.status()).toBe(201);
    announcements.push((await response.json()).id);
  }
});

test.afterAll(async () => {
  if (admin) {
    for (const id of announcements) expect((await admin.delete(`admin/announcements/${id}`)).ok()).toBeTruthy();
    for (const id of messages) expect((await admin.delete(`admin/contact-messages/${id}`)).ok()).toBeTruthy();
    await admin.dispose();
  }
  // There is no user DELETE endpoint. Remove only this run's synthetic account.
  cleanupSql([email]);
});

test("gerçek duyurular: ana sayfa, arama, sayfalama, detay ve boş sonuç", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#duyurular")).toContainText(run);
  await page.getByRole("link", { name: "Tüm Duyurular", exact: true }).click();
  await page.getByRole("searchbox", { name: "Duyurularda ara" }).fill(run);
  await expect(page.locator(".announcement-card")).toHaveCount(9);
  await expect(page.getByRole("navigation", { name: "Duyuru sayfaları" })).toContainText("1 / 2");
  await page.getByRole("button", { name: "Sonraki", exact: true }).click();
  await expect(page.locator(".announcement-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Devamını oku", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("PostgreSQL üzerinden gelen");
  await page.getByRole("button", { name: "Pencereyi kapat" }).click();
  await page.getByRole("searchbox").fill(`${run}-yok`);
  await expect(page.getByRole("status")).toContainText("Aramana uygun duyuru bulunamadı.");
});

test("üyelik: kayıt, kalıcı veri, yanlış şifre, giriş, yenileme, onay ve çıkış", async ({ page, context }) => {
  await page.goto("/uye-kaydi");
  await page.locator('[name="personal.firstName"]').fill("Entegrasyon");
  await page.locator('[name="personal.lastName"]').fill("Testi");
  await page.locator('[name="account.email"]').fill(email);
  await page.locator('[name="account.password"]').fill(password);
  await page.locator('[name="personal.phone"]').fill("+90 555 000 00 00");
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await page.locator('[name="education.institutionName"]').fill("Test Üniversitesi");
  await page.locator('[name="education.faculty"]').fill("Mühendislik");
  await page.locator('[name="education.department"]').fill("Bilgisayar Mühendisliği");
  await page.locator('[name="education.degreeLevel"]').selectOption("BACHELOR");
  await page.locator('[name="education.classLevel"]').selectOption("YEAR_2");
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await page.locator('[name="membership.motivation"]').fill("Kulüp projelerinde birlikte öğrenmek ve geliştirmek istiyorum.");
  await page.locator('[name="membership.experienceLevel"]').selectOption("BEGINNER");
  await page.getByRole("checkbox", { name: "Backend Geliştirme", exact: true }).check();
  await page.getByRole("checkbox", { name: "KVKK aydınlatma metnini okudum." }).check();
  const registered = page.waitForResponse(r => r.url().endsWith("/api/club/auth/register") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Üye kaydı oluştur" }).click();
  const response = await registered;
  expect(response.status()).toBe(201);
  registration = response.request().postDataJSON();
  const user = await response.json();
  expect(user.membershipStatus).toBe("PENDING");
  await expect(page.getByRole("heading", { name: "Başvurun alındı." })).toBeVisible();
  // Veritabanı dogrulamasi ham SQL gerektirir ve varsayilan olarak kapalidir.
  if (sqlEnabled) {
    expect(sql(`SELECT count(*) FROM app_users u JOIN membership_applications m ON m.user_id=u.id WHERE u.email='${email}' AND m.status='PENDING';`)).toBe("1");
    expect(sql(`SELECT count(*) FROM user_consent_records c JOIN app_users u ON u.id=c.user_id WHERE u.email='${email}';`)).toBe("2");
  }
  await page.goto("/giris-yap");
  await page.locator('.auth-panel [name="email"]').fill(email);
  await page.locator('[name="password"]').fill("WrongTest123!");
  const wrongLogin = page.waitForResponse(r => r.url().endsWith("/api/club/auth/login"));
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  expect((await wrongLogin).status()).toBe(401);
  await expect(page.locator(".auth-panel .form-error")).toBeVisible();
  await expect(page.locator('.auth-panel [name="email"]')).toHaveValue(email);
  await page.locator('[name="password"]').fill(password);
  const loggedIn = page.waitForResponse(r => r.url().endsWith("/api/club/auth/login"));
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
  const login = await loggedIn;
  expect(login.status()).toBe(200);
  expect((await login.json()).accessToken).toBeUndefined();
  await expect(page.getByText("Üyelik durumu: Onay bekliyor")).toBeVisible();
  const cookie = (await context.cookies()).find(c => c.name === "club_session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.reload();
  await expect(page.getByText("Üyelik durumu: Onay bekliyor")).toBeVisible();
  const approved = await admin.patch(`admin/members/${user.userId}/review`, { data: { status: "APPROVED", reviewNote: "Otomatik yerel test" } });
  expect(approved.status()).toBe(200);
  await page.reload();
  await expect(page.getByText("Üyelik durumu: Onaylandı")).toBeVisible();
  const me = await context.request.get(`${origin}/api/club/users/me`);
  expect((await me.json()).roles).toContain("MEMBER");
  await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
  await expect(page.getByRole("button", { name: "Giriş yap", exact: true })).toBeVisible();
  expect((await context.cookies()).some(c => c.name === "club_session")).toBe(false);
  expect((await context.request.get(`${origin}/api/club/users/me`)).status()).toBe(401);
});

test("gerçek API hataları: tekrar kayıt, eski metin, alan doğrulama ve origin", async ({ request }) => {
  expect(registration).toBeDefined();
  const headers = { Origin: origin };
  const duplicate = await request.post("/api/club/auth/register", { headers, data: registration });
  expect(duplicate.status()).toBe(409);
  const stale = await request.post("/api/club/auth/register", { headers, data: {
    ...registration, account: { email: `stale-${email}`, password },
    declarations: { privacyNoticeRead: true, privacyNoticeVersion: "old-version", marketingConsent: false },
  } });
  expect(stale.status()).toBe(400);
  expect((await stale.json()).code).toBe("IS_KURALI_IHLALI");
  const invalid = await request.post("/api/club/contact/messages", { headers, data: { name: "", email: "invalid", subject: "", message: "x" } });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).fieldErrors.length).toBeGreaterThan(0);
  expect(invalid.headers()["x-request-id"]).toBeTruthy();
  expect((await request.post("/api/club/auth/login", { headers: { Origin: "https://untrusted.example" }, data: {} })).status()).toBe(403);
  expect((await request.get("/api/club/admin/users")).status()).toBe(401);
});

test("iletişim formu gerçek veritabanına yazılır", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mesaj gönder", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Ad soyad" }).fill("Entegrasyon Testi");
  await dialog.getByRole("textbox", { name: "E-posta" }).fill(email);
  await dialog.getByRole("textbox", { name: "Konu", exact: true }).fill(run);
  await dialog.getByRole("textbox", { name: "Mesajın", exact: true }).fill("Bu mesaj yerel uçtan uca test tarafından gönderilmiştir.");
  const sent = page.waitForResponse(r => r.url().endsWith("/api/club/contact/messages"));
  await dialog.getByRole("button", { name: "Mesaj gönder", exact: true }).click();
  expect((await sent).status()).toBe(201);
  await expect(dialog.getByRole("heading", { name: "Mesajın bize ulaştı." })).toBeVisible();
  const list = await admin.get(`admin/contact-messages?q=${run}`);
  const data = await list.json();
  for (const item of data.content) messages.push(item.id);
  expect(data.content).toHaveLength(1);
  expect(data.content[0].email).toBe(email);
  if (sqlEnabled) expect(sql(`SELECT count(*) FROM contact_messages WHERE email='${email}' AND subject='${run}';`)).toBe("1");
});

test("geçersiz oturum temizlenir", async ({ page, context }) => {
  await context.addCookies([{ name: "club_session", value: "invalid-token", url: origin, httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/giris-yap");
  await expect(page.getByRole("button", { name: "Giriş yap", exact: true })).toBeVisible();
  await expect.poll(async () => (await context.cookies()).some(c => c.name === "club_session")).toBe(false);
});

const outageBody = { message: "Sunucuya şu anda ulaşılamıyor. Lütfen daha sonra tekrar dene." };

test("servis kesintisi: form korunur, örnek veri gösterilmez, tekrar denemeyle düzelir", async ({ page }) => {
  // Kesinti ARTIK gercek backend'i durdurmaz. Proxy'nin backend'e ulasamasi
  // taklit edilerek 503 ve 502 uzerinden ayni kullanici deneyimi dogrulanir;
  // boylece gunluk stack ve diger gelistiriciler etkilenmez.
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const outage = (route: Route) => route.fulfill({ status: 503, json: outageBody });
  await page.route("**/api/club/**", outage);

  await page.goto("/duyurular");
  await expect(page.locator(".content-note")).toContainText("Sunucuya şu anda ulaşılamıyor.");
  await expect(page.locator(".announcement-card")).toHaveCount(0);

  await page.goto("/");
  await page.getByRole("button", { name: "Mesaj gönder", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Ad soyad" }).fill("Kesinti Testi");
  await dialog.getByRole("textbox", { name: "E-posta" }).fill(email);
  await dialog.getByRole("textbox", { name: "Konu", exact: true }).fill(`${run}-kesinti`);
  await dialog.getByRole("textbox", { name: "Mesajın", exact: true }).fill("Bağlantı kesildiğinde bu mesaj formda korunmalıdır.");

  const failed = page.waitForResponse(r => r.url().endsWith("/api/club/contact/messages"));
  await dialog.getByRole("button", { name: "Mesaj gönder", exact: true }).click();
  expect((await failed).status()).toBe(503);
  await expect(dialog.getByRole("alert")).toContainText("Sunucuya şu anda ulaşılamıyor.");
  await expect(dialog.getByRole("textbox", { name: "Konu", exact: true })).toHaveValue(`${run}-kesinti`);
  await expect(dialog.getByRole("textbox", { name: "Mesajın", exact: true })).toHaveValue("Bağlantı kesildiğinde bu mesaj formda korunmalıdır.");
  await expect(dialog.getByRole("heading", { name: "Mesajın bize ulaştı." })).toHaveCount(0);

  // Gercek baglanti hatasi (proxy yanit vermiyor) farkli bir mesaj gosterir.
  await page.unroute("**/api/club/**");
  await page.route("**/api/club/**", route => route.abort("connectionfailed"));
  await page.goto("/duyurular");
  await expect(page.locator(".content-note")).toContainText("Bağlantı kurulamadı");
  await expect(page.locator(".announcement-card")).toHaveCount(0);

  // Servis geri gelince ayni form, ayni verilerle tekrar gonderilir.
  await page.unroute("**/api/club/**");
  await page.goto("/");
  await page.getByRole("button", { name: "Mesaj gönder", exact: true }).first().click();
  const form = page.getByRole("dialog");
  await form.getByRole("textbox", { name: "Konu", exact: true }).fill(`${run}-kesinti`);
  await form.getByRole("textbox", { name: "Ad soyad" }).fill("Kesinti Testi");
  await form.getByRole("textbox", { name: "E-posta" }).fill(email);
  await form.getByRole("textbox", { name: "Mesajın", exact: true }).fill("Bağlantı kesildiğinde bu mesaj formda korunmalıdır.");
  const restored = page.waitForResponse(r => r.url().endsWith("/api/club/contact/messages"));
  await form.getByRole("button", { name: "Mesaj gönder", exact: true }).click();
  const response = await restored;
  expect(response.status()).toBe(201);
  messages.push((await response.json()).id);
  await expect(form.getByRole("heading", { name: "Mesajın bize ulaştı." })).toBeVisible();
});
