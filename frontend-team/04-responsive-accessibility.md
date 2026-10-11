# Kişi 4 — Responsive, erişilebilirlik ve mobil deneyim

## 1. Görev

Sitenin her ekran boyutunda ve yalnızca klavyeyle ya da ekran okuyucuyla kullanılabilir olmasını sağlamak; bunu otomatik testle kalıcı hâle getirmek. Başlangıç noktası iyi: 390/768/1366 px'te yatay taşma yok, odak halkaları görünüyor, mobil menü Escape ile kapanıyor. Senin işin mevcut durumu korumak, kalan boşlukları kapatmak ve menüyü sahiplenmek.

## 2. Öğrenmen gerekenler (toplam 60 dk)

- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/): AA seviyesindeki kuralları filtreleyerek oku; özellikle 1.4.10 (Reflow), 2.4.7 (Focus Visible), 2.5.3 (Label in Name), 2.5.8 (Target Size).
- [WAI-ARIA — Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): mobil menü bu kalıpla çalışıyor (`aria-expanded`, `aria-controls`).
- [Playwright — Accessibility testing](https://playwright.dev/docs/accessibility-testing): projede zaten Playwright var; axe taramasını teste çevirmenin resmi yolu.
- [MDN — Responsive design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design): medya sorgularını sadeleştirirken neden "içerik kırıldığı yerde" kırılma noktası koyduğumuzu anlatıyor.

## 3. İnceleyeceğin dosyalar

- `components/header.tsx`: menü bağlantıları (`links` dizisi), aktif durum, mobil menü.
- `app/globals.css` medya sorguları: satır ~1375 (1150px), ~1443 ve ~1915 (iki ayrı 1100px bloğu), ~1921 (760px), ~1627 ve ~1927 (iki ayrı 600px bloğu), ~1941 (360px), ~1885 (`prefers-reduced-motion`).
- `components/dialog.tsx`, `components/auth-form.tsx` (adımlı form), `components/sections.tsx` → `Team` (kartlardaki `aria-label`).
- `tests/e2e/errors.spec.ts`: erişilebilirlik odaklı mevcut test örnekleri.

## 4. Görevler

- [ ] **P1** Menüde "Duyurular" bugün ana sayfa bölümüne (`/#duyurular`) gidiyor. Bunu `/duyurular` sayfasına yönlendir ve `/duyurular/*` altında da aktif göster (`pathname.startsWith("/duyurular")`). Başlamadan önce `header.tsx`'teki commit edilmemiş "Görevlerim" değişikliğinin `main`'e girdiğini kontrol et.
- [ ] **P1** `@axe-core/playwright` paketini geliştirme bağımlılığı olarak ekle. `tests/e2e/accessibility.spec.ts` dosyası `/`, `/duyurular`, bir duyuru detayı, `/giris-yap` ve `/uye-kaydi` sayfalarını 390 ve 1366 px'te tarasın; serious/critical ihlalde test kırılsın.
- [ ] **P1** Kırılma noktalarını sadeleştir: iki ayrı 1100px ve iki ayrı 600px bloğunu birleştir. Kullanılan genişlikleri dosyanın başında tek bir yorumda belgele.
- [ ] **P1** Yalnızca klavyeyle tam tur at: menü, başvuru formunun 3 adımı, iletişim penceresi, duyuru filtreleri. Bulduğun her sorunu düzelt veya sahibine bildir.
- [ ] **P2** 320 px genişlikte ve %200 yakınlaştırmada yatay kaydırma olmadığını doğrula (WCAG 1.4.10).
- [ ] **P2** Dokunma hedefleri en az 24×24 px olsun (footer bağlantıları, kategori etiketi, sosyal ikonlar).
- [ ] **P2** Takım kartlarındaki `aria-label` görünür "Bu alanda katıl" metnini içermiyor; görünür metinle uyumlu hâle getir (WCAG 2.5.3).
- [ ] **P2** 390 px'te "Kulübün sundukları" 2×2 ızgarası metni sıkıştırıyor; 420 px altında tek sütuna geçir.

## 5. Bitti sayılması için

- `accessibility.spec.ts` repoda; 5 sayfa × 2 genişlikte serious/critical ihlal 0.
- 320, 390, 768, 1024, 1366 ve 1440 px'te yatay taşma yok.
- Menüde "Duyurular" detay sayfasında da aktif görünüyor.
- Klavye turu kontrol listesi PR açıklamasında; her adım işaretli.
- Tüm Playwright testleri geçiyor.

## 6. Yapma

- Renk ve token değerlerini değiştirme; kontrast sorunu bulursan Kişi 1'e bildir.
- Bölüm sırası veya metin değiştirme (Kişi 2/3).
- Animasyon ekleme (Kişi 5).
