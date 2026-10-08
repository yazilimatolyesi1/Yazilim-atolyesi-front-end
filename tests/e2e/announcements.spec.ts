import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Duyuru listesi URL durumu ve duyuru detay sayfası.
 * İlk test liste isteklerini tarayıcıda taklit eder; ikincisi yerel Spring backend'inde
 * tek bir test duyurusu oluşturur ve test sonunda API üzerinden siler.
 */
test.describe.configure({ mode: "serial" });
const origin = process.env.UI_TEST_URL || "http://localhost:3001";
const backend = process.env.E2E_API_URL || "http://127.0.0.1:8080/api/v1";
for (const url of [origin, backend]) if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) throw new Error("Yalnızca yerel test ortamı desteklenir.");

const run = `detay-${Date.now()}`;
let admin: APIRequestContext | undefined;
let announcementId: string | undefined;

test.afterAll(async () => {
  if (admin) {
    if (announcementId) expect((await admin.delete(`admin/announcements/${announcementId}`)).ok()).toBeTruthy();
    await admin.dispose();
  }
});

test("arama, kategori ve sayfa URL'de tutulur; geri tuşu önceki listeyi açar", async ({ page }) => {
  await page.route("**/api/club/announcements**", route => {
    const params = new URL(route.request().url()).searchParams;
    const title = `Sonuç ${params.get("q") || "-"} ${params.get("category") || "-"} ${params.get("page")}`;
    return route.fulfill({ json: {
      content: [{ id: title, title, slug: "taklit", summary: "Özet", content: "", category: "Etkinlik", publishedAt: "2026-09-20T10:00:00Z" }],
      totalPages: 3,
    } });
  });
  const search = page.getByRole("searchbox", { name: "Duyurularda ara" });
  const category = page.getByRole("combobox", { name: "Kategori" });

  // Paylaşılan bağlantı aynı listeyi açar.
  await page.goto("/duyurular?q=atolye&category=Etkinlik&page=1");
  await expect(search).toHaveValue("atolye");
  await expect(category).toHaveValue("Etkinlik");
  await expect(page.getByRole("heading", { name: "Sonuç atolye Etkinlik 1" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Duyuru sayfaları" })).toContainText("2 / 3");

  // Kategori değişimi sayfayı başa alır ve geçmişe yeni kayıt ekler.
  await category.selectOption("Eğitim");
  await expect(page).toHaveURL(/\/duyurular\?q=atolye&category=E%C4%9Fitim$/);
  await expect(page.getByRole("heading", { name: "Sonuç atolye Eğitim 0" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/duyurular\?q=atolye&category=Etkinlik&page=1$/);
  await expect(category).toHaveValue("Etkinlik");
  await expect(page.getByRole("heading", { name: "Sonuç atolye Etkinlik 1" })).toBeVisible();

  // Arama yazımı geçmişi doldurmaz; bekletilmiş değer URL'ye yazılır.
  await search.fill("");
  await expect(page).toHaveURL(/\/duyurular\?category=Etkinlik$/);
  await expect(search).toHaveValue("");
  await page.getByRole("button", { name: "Sonraki", exact: true }).click();
  await expect(page).toHaveURL(/\/duyurular\?category=Etkinlik&page=1$/);
  await expect(page.getByRole("heading", { name: "Sonuç - Etkinlik 1" })).toBeVisible();
});

test("gerçek duyuru: listeden detaya gidilir, kategori filtresi çalışır, olmayan duyuru bulunamadı gösterir", async ({ page, playwright }) => {
  const auth = await playwright.request.newContext();
  const login = await auth.post(`${backend}/auth/login`, { data: {
    email: process.env.E2E_ADMIN_EMAIL || "admin@yazilimatolyesi.local",
    password: process.env.E2E_ADMIN_PASSWORD || "ChangeMe123!",
  } });
  expect(login.status()).toBe(200);
  const { accessToken } = await login.json();
  await auth.dispose();
  admin = await playwright.request.newContext({
    baseURL: `${backend}/`, extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });
  const created = await admin.post("admin/announcements", { data: {
    title: `${run} başlık`, slug: run, summary: "Detay sayfası test özeti.",
    content: "Detay sayfasında gösterilen\nçok satırlı test içeriği.", category: "Etkinlik",
    status: "PUBLISHED", pinned: false, featured: false, displayOrder: 0,
  } });
  expect(created.status()).toBe(201);
  announcementId = (await created.json()).id;

  await page.goto(`/duyurular?q=${run}`);
  await page.getByRole("link", { name: `${run} başlık`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/duyurular/${run}$`));
  await expect(page.getByRole("heading", { level: 1, name: `${run} başlık` })).toBeVisible();
  await expect(page.locator(".announcement-summary")).toHaveText("Detay sayfası test özeti.");
  await expect(page.locator(".announcement-content")).toContainText("çok satırlı test içeriği.");
  await page.getByRole("link", { name: "← Tüm duyurulara dön" }).click();
  await expect(page).toHaveURL(/\/duyurular$/);

  // Backend kategoriyi büyük/küçük harf duyarsız eşleştirir.
  await page.goto(`/duyurular?q=${run}&category=etkinlik`);
  await expect(page.locator(".announcement-card")).toHaveCount(1);
  await page.goto(`/duyurular?q=${run}&category=Proje`);
  await expect(page.getByRole("status")).toContainText("Aramana uygun duyuru bulunamadı.");

  await page.goto(`/duyurular/${run}-yok`);
  await expect(page.getByRole("heading", { name: "Duyuru bulunamadı." })).toBeVisible();
  await page.getByRole("link", { name: "Tüm duyurulara dön" }).click();
  await expect(page).toHaveURL(/\/duyurular$/);
});
