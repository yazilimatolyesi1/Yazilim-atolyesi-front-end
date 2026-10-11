# Kişi 6 — Kalite güvencesi, test otomasyonu ve birleştirme

## 1. Görev

Beş kişinin PR'larının siteyi bozmadan ve doğru sırayla `main`'e girmesini sağlamak. Bugün repoda CI yok; 30 Playwright testi yalnızca yerelde, Desktop Chrome'da koşuyor ve çoğu çalışan bir Spring backend'i istiyor. Kişi 1'in "görünüş değişmesin" kuralını ölçen bir görsel test de yok. Kod yazdığın yerler `.github/`, `playwright.config.ts`, `tests/visual/` ve `tests/mock-api/`.

## 2. Öğrenmen gerekenler (toplam 60 dk)

- [GitHub Actions — Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs): her PR'da kendiliğinden çalışan derleme iş akışı.
- [Playwright — CI](https://playwright.dev/docs/ci-intro): CI'da tarayıcı kurulumu ve hata ekran görüntüleri.
- [Playwright — Görsel karşılaştırma](https://playwright.dev/docs/test-snapshots): `toHaveScreenshot` ve baseline'ın neden işletim sistemine bağlı olduğu.
- [Playwright — Projeler](https://playwright.dev/docs/test-projects): aynı testleri Firefox ve mobil Safari'de koşturmak.

## 3. İnceleyeceğin dosyalar

- `playwright.config.ts`: tek proje (Desktop Chrome), `webServer` = `npm run start:local`.
- `tests/e2e/`: `admin.spec.ts`, `integration.spec.ts` ve `announcements.spec.ts` içindeki "gerçek duyuru" testi gerçek backend ister. `page.route` sunucu tarafı (SSR) istekleri yakalamaz.
- `lib/server-api.ts`: SSR'ın okuduğu uçlar (`announcements`, `announcements/{slug}`, `pages/*`, `settings/public`).
- `package.json`: `lint` betiği `next lint` çağırıyor; Next.js 16'da bu komut yok.
- Diğer beş kartın "Bitti sayılması için" bölümleri: PR inceleme listen.

## 4. Görevler

- [ ] **P1** 1. gün: backend isteyen testlerin adına `@backend` ekle; kalanların `--grep-invert @backend` ile backend'siz geçtiğini doğrula.
- [ ] **P1** `.github/workflows/ci.yml`: her PR'da `npm ci`, `npm run typecheck`, `npm run build`. 2. gün sabah, Kişi 1'in token PR'ından önce merge et.
- [ ] **P1** `tests/mock-api/`: SSR uçlarını ve duyuru aramasını sabit JSON ile cevaplayan küçük Node sunucusu (`users/me` → 401). CI'da `CLUB_API_URL` buna yönlenir ve `@backend` dışındaki testler koşar.
- [ ] **P1** `tests/visual/pages.spec.ts`: `/`, `/duyurular`, bir duyuru detayı, `/uye-kaydi`, `/giris-yap` × 390 ve 1366 px. Baseline token PR'ından **önceki** `main`'den, Linux'ta üretilir; Kişi 1'in PR'ı 0 farkla geçmeli.
- [ ] **P1** `.github/pull_request_template.md` (kart, ekran görüntüsü, test kutuları). Her sprint PR'ını aynı gün kartındaki "Bitti" maddelerine göre incele.
- [ ] **P2** `firefox` ve `mobile-safari` projeleri ekle; farkları sahiplerine issue olarak aç.
- [ ] **P2** Kişi 4'ün `accessibility.spec.ts` dosyasını merge olunca CI'a bağla.
- [ ] **P3** ESLint `integration/api-foundation` dalında kuruluyor; merge olunca `lint`'i CI'a ekle.

## 5. Bitti sayılması için

- Her sprint PR'ında CI çalışıyor, backend'siz 10 dakikanın altında bitiyor; kırmızı PR merge edilmedi.
- 5 sayfa × 2 genişlik görsel baseline `main`'de; görünümü değiştiren PR baseline'ı bilerek güncelliyor.
- Birleştirme sırasına (README §6) uyuldu; her sprint PR'ında 24 saat içinde inceleme yorumu var.
- 7. gün test özeti (geçen / atlanan / neden) `FINAL-AUDIT.md` için Kişi 5'e iletildi.

## 6. Yapma

- Bileşen, stil veya metin değiştirme; hatayı sahibine bildir (README §4).
- CI'da gerçek backend'e veya veritabanına bağlanma; `E2E_ALLOW_SQL=1` açma.
- Baseline'ı Windows/macOS'ta üretme; yazı tipi farkı yüzünden CI'da hep kırılır.
- Başkasının PR'ını düzeltme veya merge etme; merge'ü kulüp lideri yapar.
