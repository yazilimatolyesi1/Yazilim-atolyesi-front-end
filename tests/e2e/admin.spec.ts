import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import path from "node:path";
import { cleanupSql } from "./support/db";

test.describe.configure({ mode: "serial" });
const origin = process.env.UI_TEST_URL || "http://localhost:3001";
const backend = process.env.E2E_API_URL || "http://127.0.0.1:8080/api/v1";
for (const url of [origin, backend]) if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Yalnızca yerel test ortamı desteklenir.");
const run = `dashboard-${Date.now()}`;
const memberEmail = `${run}-member@example.test`;
const editorEmail = `${run}-editor@example.test`;
const password = "DashboardTest123!";
let memberId: string;
let editorId: string;
let messageId: string;
let admin: APIRequestContext;
let setting: Record<string, any>;
const cleanup: string[] = [];

async function login(page: Page, email: string, pass = password) {
  await page.goto("/giris-yap");
  await page.locator('.auth-panel [name="email"]').fill(email);
  await page.locator('[name="password"]').fill(pass);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
}
async function tab(page: Page, name: string) { await page.getByRole("navigation", { name: "Yönetim menüsü" }).getByRole("button", { name, exact: true }).click(); }

test.beforeAll(async ({ playwright }) => {
  const setup = await playwright.request.newContext();
  const auth = await setup.post(`${backend}/auth/login`, { data: { email: process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local", password: process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!" } });
  expect(auth.status()).toBe(200);
  admin = await playwright.request.newContext({ baseURL: `${backend}/`, extraHTTPHeaders: { Authorization: `Bearer ${(await auth.json()).accessToken}` } });
  const legal = await (await setup.get(`${backend}/settings/public?prefix=legal.`)).json();
  const options = await (await setup.get(`${backend}/membership/options`)).json();
  for (const email of [memberEmail, editorEmail]) {
    const response = await setup.post(`${backend}/auth/register`, { data: {
      account: { email, password }, personal: { firstName: "Panel", lastName: "Testi", phone: "+90 555 000 00 00" },
      education: { institutionName: "Test Üniversitesi", faculty: "Mühendislik", department: "Yazılım", educationStatus: "ACTIVE_STUDENT", degreeLevel: "BACHELOR", classLevel: "YEAR_2" },
      membership: { motivation: "Panel uçtan uca testi için oluşturulan örnek başvurudur.", experienceLevel: "BEGINNER", volunteerForEvents: true, interestIds: [options.interestAreas[0].id] },
      declarations: { privacyNoticeRead: true, privacyNoticeVersion: legal.find((s: { key: string }) => s.key === "legal.kvkk.version").value, marketingConsent: false },
    } });
    expect(response.status()).toBe(201);
    const user = await response.json();
    if (email === memberEmail) memberId = user.userId; else editorId = user.userId;
  }
  expect((await admin.patch(`admin/users/${editorId}/roles`, { data: { roles: ["EDITOR"] } })).ok()).toBeTruthy();
  const message = await setup.post(`${backend}/contact/messages`, { data: { name: "Panel Mesaj Testi", email: memberEmail, subject: run, message: "Yönetim panelinden okunacak test mesajı." } });
  expect(message.status()).toBe(201);
  messageId = (await message.json()).id;
  setting = (await (await admin.get("admin/settings")).json()).find((s: { key: string }) => s.key === "contact.email");
  await setup.dispose();
});

test.afterAll(async () => {
  if (setting) {
    const { key, value, type, description, publicSetting } = setting;
    expect((await admin.put(`admin/settings/${setting.id}`, { data: { key, value, type, description, publicSetting } })).ok()).toBeTruthy();
  }
  for (const endpoint of cleanup) {
    const response = await admin.delete(endpoint);
    expect([204, 404]).toContain(response.status());
  }
  if (messageId) expect([204, 404]).toContain((await admin.delete(`admin/contact-messages/${messageId}`)).status());
  cleanupSql([memberEmail, editorEmail]);
  await admin?.dispose();
});

test("ziyaretçi ve normal üye yönetim paneline erişemez", async ({ page, request, context }) => {
  await page.goto("/yonetim");
  await expect(page).toHaveURL(/giris-yap/);
  expect((await request.get("/api/club/admin/users")).status()).toBe(401);
  await login(page, memberEmail);
  await expect(page.getByText("Üyelik durumu: Onay bekliyor")).toBeVisible();
  await page.goto("/yonetim");
  await expect(page.getByRole("heading", { name: "Bu alana erişim yetkin yok" })).toBeVisible();
  expect((await context.request.get(`${origin}/api/club/admin/users`)).status()).toBe(403);
  expect((await context.request.post(`${origin}/api/club/admin/announcements`, { headers: { Origin: origin }, data: { title: "Yetkisiz" } })).status()).toBe(403);
});

test("yönetici girişi, duyuru oluşturma, görsel, yayınlama, düzenleme ve silme", async ({ page, context }) => {
  await login(page, process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local", process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!");
  await expect(page).toHaveURL(/yonetim/);
  await expect(page.getByRole("heading", { name: "Genel bakış", exact: true })).toBeVisible();
  await expect(page.getByText("Güncel bilgiler yükleniyor…")).toHaveCount(0);
  await page.screenshot({ path: ".e2e-results/dashboard-desktop.png", fullPage: true });
  await tab(page, "Duyurular");
  await page.getByRole("button", { name: "+ Duyuru oluştur", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Başlık", { exact: true }).fill(run);
  await dialog.getByLabel("Özet", { exact: true }).fill("Panelden yayınlanan test duyurusu.");
  await dialog.getByLabel("İçerik", { exact: true }).fill("Panel ve gerçek API arasında uçtan uca doğrulanan duyuru içeriği.");
  await dialog.getByLabel("Durum", { exact: true }).selectOption("PUBLISHED");
  const upload = page.waitForResponse(r => r.url().endsWith("/api/club/admin/media/images") && r.request().method() === "POST");
  await dialog.getByLabel("Görsel yükle", { exact: true }).setInputFiles(path.resolve(__dirname, "../../public/club-logo.png"));
  const uploaded = await upload;
  expect(uploaded.status()).toBe(201);
  const media = await uploaded.json();
  await expect(dialog.getByLabel("Görsel adresi", { exact: true })).not.toHaveValue("");
  await dialog.getByLabel("Görsel açıklaması", { exact: true }).fill("Panel test görseli");
  const created = page.waitForResponse(r => r.url().endsWith("/api/club/admin/announcements") && r.request().method() === "POST");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const news = await response.json();
  cleanup.push(`admin/announcements/${news.id}`, `admin/media/images/${media.id}`);
  await expect(dialog).toHaveCount(0);
  const publicPage = await context.newPage();
  await publicPage.goto("/duyurular");
  await publicPage.getByRole("searchbox").fill(run);
  await expect(publicPage.locator(".announcement-card")).toHaveCount(1);
  const image = publicPage.getByRole("img", { name: "Panel test görseli" });
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("searchbox").fill(run);
  const announcementRow = page.getByRole("row").filter({ hasText: run });
  await expect(announcementRow).toHaveCount(1);
  await announcementRow.getByRole("button", { name: "Düzenle", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Başlık", { exact: true }).fill(`${run} güncellendi`);
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await publicPage.reload();
  await publicPage.getByRole("searchbox").fill(run);
  await expect(publicPage.locator(".announcement-card")).toContainText(`${run} güncellendi`);
  page.once("dialog", d => d.accept());
  await announcementRow.getByRole("button", { name: "Sil", exact: true }).first().click();
  await expect(page.getByText("Kayıt silindi.")).toBeVisible();
  await publicPage.reload();
  await publicPage.getByRole("searchbox").fill(run);
  await expect(publicPage.getByText("Aramana uygun duyuru bulunamadı.")).toBeVisible();
  await publicPage.close();
});

test("başvuru kararı, kullanıcı rolü ve mesaj durumu panelden yönetilir", async ({ page }) => {
  await login(page, process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local", process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!");
  await expect(page).toHaveURL(/yonetim/);
  await tab(page, "Üyelik başvuruları");
  await page.getByRole("searchbox").fill(memberEmail);
  // Arama debounce'ludur; filtre uygulanmadan satıra tıklamak yanlış kayda
  // (diğer sentetik hesap) işlem uygular. Bu yüzden satır önce beklenir ve
  // tüm işlemler o satırla sınırlandırılır.
  const application = page.getByRole("row").filter({ hasText: memberEmail });
  await expect(application).toHaveCount(1);
  await application.getByRole("button", { name: "İncele →", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(memberEmail);
  await expect(dialog).toContainText("Panel uçtan uca testi");
  await dialog.getByLabel("Karar", { exact: true }).selectOption("REJECTED");
  await dialog.getByRole("textbox", { name: "Değerlendirme notu" }).fill("Test başvurusunun bilgileri eksik.");
  await dialog.getByRole("button", { name: "Kararı kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(application).toContainText("Reddedildi");
  await application.getByRole("button", { name: "İncele →", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(memberEmail);
  await dialog.getByLabel("Karar", { exact: true }).selectOption("APPROVED");
  await dialog.getByRole("button", { name: "Kararı kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(application).toContainText("Onaylandı");
  await tab(page, "Kullanıcılar");
  await page.getByRole("searchbox").fill(memberEmail);
  const memberRow = page.getByRole("row").filter({ hasText: memberEmail });
  await expect(memberRow).toHaveCount(1);
  await memberRow.getByRole("button", { name: "Yönet →", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Editör", exact: true }).check();
  await dialog.getByRole("button", { name: "Rolleri kaydet" }).click();
  await expect(dialog.getByText("Roller güncellendi.")).toBeVisible();
  await dialog.getByLabel("Hesap durumu", { exact: true }).selectOption("SUSPENDED");
  await dialog.getByRole("button", { name: "Durumu kaydet" }).click();
  await expect(dialog.getByText("Hesap durumu güncellendi.")).toBeVisible();
  await dialog.getByRole("button", { name: "Tamam", exact: true }).click();
  const user = (await (await admin.get(`admin/users?q=${memberEmail}`)).json()).content[0];
  expect(user.roles).toContain("EDITOR"); expect(user.status).toBe("SUSPENDED");
  await tab(page, "Gelen mesajlar");
  await page.getByRole("searchbox").fill(run);
  const messageRow = page.getByRole("row").filter({ hasText: run });
  await expect(messageRow).toHaveCount(1);
  await messageRow.getByRole("button", { name: "Mesajı aç →", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Yönetim panelinden okunacak test mesajı.");
  await dialog.getByLabel("Mesaj durumu", { exact: true }).selectOption("READ");
  await dialog.getByRole("button", { name: "Durumu kaydet" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(messageRow).toContainText("Okundu");
});

test("içerik ve site ayarı değişikliği ziyaretçiye yansır", async ({ page, context }) => {
  await login(page, process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local", process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!");
  await expect(page).toHaveURL(/yonetim/);
  await tab(page, "Sayfa içerikleri");
  await page.getByRole("button", { name: "+ İçerik oluştur", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Anahtar", { exact: true }).fill(run);
  await dialog.getByLabel("Başlık", { exact: true }).fill(`${run} içerik`);
  await dialog.getByLabel("İçerik", { exact: true }).fill("Panelden gelen güncel ana sayfa metni.");
  const created = page.waitForResponse(r => r.url().endsWith("/api/club/admin/contents") && r.request().method() === "POST");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  cleanup.push(`admin/contents/${(await response.json()).id}`);
  await expect(dialog).toHaveCount(0);
  const publicPage = await context.newPage();
  await publicPage.goto("/");
  await expect(publicPage.getByText("Panelden gelen güncel ana sayfa metni.")).toBeVisible();
  await page.getByRole("searchbox").fill(run);
  const contentRow = page.getByRole("row").filter({ hasText: run });
  await expect(contentRow).toHaveCount(1);
  await contentRow.getByRole("button", { name: "Düzenle", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: "Sitede göster", exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await publicPage.reload();
  await expect(publicPage.getByText("Panelden gelen güncel ana sayfa metni.")).toHaveCount(0);
  await tab(page, "Site ayarları");
  await page.getByRole("searchbox").fill("contact.email");
  const settingRow = page.getByRole("row").filter({ hasText: "contact.email" });
  await expect(settingRow).toHaveCount(1);
  await settingRow.getByRole("button", { name: "Düzenle", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Değer", { exact: true }).fill(`${run}@example.test`);
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await publicPage.reload();
  await expect(publicPage.locator(`.footer-contact a[href="mailto:${run}@example.test"]`)).toBeVisible();
  await publicPage.close();
});

test("editör yetkileri, mobil panel, origin denetimi ve şifre değişimi", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, editorEmail);
  await expect(page).toHaveURL(/yonetim/);
  const nav = page.getByRole("navigation", { name: "Yönetim menüsü" });
  await expect(nav.getByRole("button", { name: "Kullanıcılar", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Üyelik başvuruları", exact: true })).toHaveCount(0);
  expect((await context.request.get(`${origin}/api/club/admin/users`)).status()).toBe(403);
  expect((await context.request.patch(`${origin}/api/club/admin/members/${memberId}/review`, { headers: { Origin: origin }, data: { status: "APPROVED" } })).status()).toBe(403);
  expect((await context.request.delete(`${origin}/api/club/admin/contact-messages/${messageId}`, { headers: { Origin: "https://foreign.example" } })).status()).toBe(403);
  await expect(page.getByText("Güncel bilgiler yükleniyor…")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: ".e2e-results/dashboard-mobile.png", fullPage: true });
  await tab(page, "Hesap güvenliği");
  await page.getByLabel("Mevcut şifre", { exact: true }).fill(password);
  await page.getByLabel("Yeni şifre", { exact: true }).fill("UpdatedDashboard123!");
  await page.getByLabel("Yeni şifre tekrar", { exact: true }).fill("UpdatedDashboard123!");
  await page.getByRole("button", { name: "Şifreyi güncelle" }).click();
  await expect(page.getByText("Şifren güncellendi.")).toBeVisible();
  await page.getByRole("button", { name: "Çıkış yap", exact: true }).click();
  await expect(page).toHaveURL(/giris-yap/);
  await login(page, editorEmail, "UpdatedDashboard123!");
  await expect(page).toHaveURL(/yonetim/);
});
