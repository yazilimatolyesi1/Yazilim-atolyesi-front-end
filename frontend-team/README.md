# Frontend sprinti: denetim ve bir haftalık plan

Tarih: 8 Ekim 2026 · Kapsam: yalnızca frontend (`app/`, `components/`, `lib/`, `public/`, `tests/`). İncelenen sürüm: `main` (`fcff4dc`) + PR #4 düzeltmeleri (`3e3e9f2`).

Kişi görev dosyaları: [01 Tasarım sistemi](01-design-system.md) · [02 Ana sayfa](02-homepage-conversion.md) · [03 Bilgi mimarisi](03-information-architecture.md) · [04 Responsive ve erişilebilirlik](04-responsive-accessibility.md) · [05 Hareket ve performans](05-motion-performance.md) · [Son denetim](FINAL-AUDIT.md)

## 1. Ürün anlayışı

| Konu | Bulgu |
| --- | --- |
| Site türü | Üniversite öğrenci kulübü sitesi: tanıtım, duyurular, üyelik başvurusu, iletişim; yöneticiler için içerik paneli (`/yonetim`). |
| Birincil kitle | Kulübü keşfeden İstanbul Gedik Üniversitesi öğrencileri. |
| İkincil kitle | Mevcut üyeler (giriş), kulüp yöneticileri/editörleri, iş birliği için yazan dış paydaşlar. |
| Kullanıcı hedefleri | Kulübü 10 saniyede anlamak · duyuruları takip etmek · başvuru yapmak · iletişime geçmek. |
| Kulüp hedefleri | Üye kazanmak (ana sayfada 5 ayrı "Üye Kaydı" çağrısı var), etkinlikleri duyurmak, güven vermek. |
| Temel yolculuklar | Ana sayfa → Kulübe Katıl → 3 adımlı başvuru · Duyurular → arama/kategori → detay · Takım kartı → ilgi alanı seçili başvuru · Footer → Mesaj gönder. |
| En önemli sayfalar | `/`, `/uye-kaydi`, `/duyurular`, `/duyurular/[slug]`, `/giris-yap`. |
| İlk 10 saniyede anlaşılmalı | Kim: Gedik Üniversitesi yazılım kulübü · Ne sunuyor: atölye, proje, topluluk · Ne yapmalı: Katıl / Duyuruları gör. |
| Bilinmeyenler | Gerçek üye/etkinlik sayıları, "2010'dan beri" bilgisi, "Çalışma Akışı" bölümünün ziyaretçiye mi ekibe mi yönelik olduğu, yayın alan adı, marka yazı tipi, `/hero-tasarimlari` sayfasının silinip silinmeyeceği. Hepsi: `UNKNOWN — VERIFY BEFORE IMPLEMENTATION`. |

**Güçlü yönler (korunmalı):** onaylı PDF tasarımına sadık koyu lacivert + magenta kimlik; semantik HTML, "İçeriğe geç" bağlantısı, native `<dialog>`; adımlı ve erişilebilir formlar (`fieldset`, `role=status/alert`, alan hataları); 390/768/1366 px'te yatay taşma yok; görünür odak halkaları; liste/detayda gerçek yükleniyor-boş-hata durumları; aracı API ile HttpOnly oturum; 30 Playwright testi.

**Zayıf yönler:** dağınık tasarım değerleri; ana sayfa kartlarından detaya gidilemiyordu; paylaşım önizlemeleri tek tip; yer tutucu sosyal ikonlar; ana sayfada iç ekip süreçleri; mobil ana sayfa 5.550 px; 186 KB logo her yerde; hiç geçiş efekti yok.

## 2. Kıyaslama: farklar

Kategori: üniversite yazılım kulüpleri ve öğrenci geliştirici toplulukları. Bu kategorideki iyi siteler yaklaşan etkinliği tarih/yer/kayıt ile öne çıkarır, tek bir net katılım çağrısı kullanır, gerçek topluluk kanıtı (fotoğraf, sayılar, sosyal hesaplar) gösterir ve WhatsApp/Instagram'da paylaşıldığında düzgün önizleme verir.

| Alan | Mevcut proje | Uluslararası standart | Fark | Öncelik |
| --- | --- | --- | --- | --- |
| Duyuru keşfi | Ana sayfa kartları detaya gitmiyordu; menüdeki "Duyurular" ana sayfa bölümüne gidiyor | Her kart tıklanır; menü tam listeye gider | Kart bağlantısı eklendi; menü kaldı | P0 ✅ / P1 |
| Etkinlik bilgisi | Yalnızca yayın tarihi | Etkinlik tarihi, yer, kayıt bağlantısı; yaklaşan/geçmiş | Veri modeli yok | P1 (backend) |
| Paylaşım önizlemesi | Detay sayfası başlığı sabit, OG görseli yok | Sayfaya özel başlık/açıklama/görsel | Detay meta verisi eklendi; genel OG görseli yok | P1 |
| Değer önerisi | Panelden gelen hero metni genel | Tek cümlelik net vaat + 2 çağrı | İçerik zayıf | P1 |
| Güven unsurları | Sayı yok; sosyal ikonlar "paylaşılmadı" penceresi açıyor | Gerçek hesaplar, fotoğraf, doğrulanmış sayılar | Yer tutucu hissi | P1 |
| Tasarım sistemi | 81 renk kodu, 9 CSS değişkeni, 20 font boyutu, 14 köşe yarıçapı | Token tabanlı tek sistem | Tutarsızlık riski | P1 |
| Hareket | 0 geçiş; hover anlık | 150–200 ms amaçlı geçişler, azaltılmış hareket desteği | Cilasız his | P2 |
| Erişilebilirlik | axe: `/duyurular` başlık sırası + arşiv sayfasında 2 ihlal | WCAG 2.2 AA, otomatik tarama | İhlaller giderildi; otomasyon yok | P0 ✅ / P1 |
| Performans | LCP öğesi 186 KB PNG; 44 px'lik logoda da aynı dosya; favicon yoktu | Boyutlandırılmış WebP/AVIF, favicon | Favicon eklendi; logo kaldı | P1 |
| SEO | sitemap/robots yok; arşiv sayfası indekslenebilirdi | sitemap, robots, canonical | Arşiv `noindex` yapıldı | P0 ✅ / P1 |
| Durum ekranları | Liste/detay iyi; genel 404'te menü yok; tüm sayfalarda aynı iskelet | Sayfaya özgü iskelet, 404'te gezinme | Kısmi | P2 |
| Footer | Panelden gelen "İletişim" bloğu dev başlık; © 2025 | Tutarlı hiyerarşi, güncel yıl | Düzeltildi | P1 ✅ |
| Mobil | Taşma yok, menü Escape ile kapanıyor; ana sayfa çok uzun | Önemli içerik önce, kısa akış | Uzunluk | P2 |

## 3. İş listesi

✅ = bu dalda uygulandı. Kalanların sahibi parantez içinde.

**P0 — hemen:** ✅ ana sayfa duyuru kartlarından detaya bağlantı · ✅ `/duyurular` başlık sırası (axe) · ✅ `/hero-tasarimlari` için `noindex` ve landmark.

**P1 — yüksek etki:** ✅ detay sayfası meta verisi (başlık, açıklama, OG) · ✅ favicon · ✅ footer iletişim bloğu ve telif yılı · tasarım token'ları (1) · buton durumları (1) · hero değer önerisi ve çağrılar (2) · yer tutucu sosyal ikonlar (2) · Hakkımızda boşluğu (2) · tek duyuru kartı bileşeni (3) · breadcrumb ve ilgili duyurular (3) · sitemap/robots/metadataBase (3) · menüde "Duyurular" → `/duyurular` (4) · kırılma noktalarını sadeleştirme (4) · otomatik axe testi (4) · logo optimizasyonu (5) · Lighthouse ölçümü (5).

**P2 — zaman kalırsa:** ana sayfa bölüm sırası ve mobil uzunluk (2) · boş durum çağrısı (2) · global 404'e menü (3) · "Devamını oku" adlarının ayrışması (3) · sonuç sayısı özeti (3) · dokunma hedefleri ve 320 px/200% yakınlaştırma (4) · amaçlı geçişler (5) · sayfaya özgü iskeletler (5) · dialog açılış geçişi (5).

**P3 — bu sprintte değil:** marka yazı tipi · Tailwind'in kaldırılması · anonim ziyaretçide `users/me` 401 isteği · yönetim paneli tasarımı · `lib/content.ts` içindeki kullanılmayan `announcements` dizisi · etkinlik takvimi görünümü.

## 4. Sahiplik matrisi

| Bileşen / alan | Sahibi | Destek |
| --- | --- | --- |
| `app/globals.css` `:root` token'ları, buton/rozet/girdi stilleri | Kişi 1 | Herkes (yalnızca kullanır) |
| `app/globals.css` medya sorguları (dosya sonu) | Kişi 4 | Kişi 1 |
| `components/header.tsx` | Kişi 4 | Kişi 3 (menü kararı), Kişi 5 |
| `components/hero.tsx`, `components/sections.tsx` (Pillars, About, Join, Team, Workflow, Footer) | Kişi 2 | Kişi 1 |
| Duyuru kartı, `components/announcement-list.tsx`, `app/duyurular/**` | Kişi 3 | Kişi 2 |
| `app/not-found.tsx`, `app/error.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx` meta verisi | Kişi 3 | Kişi 5 |
| `app/loading.tsx`, yeni `loading.tsx` dosyaları, `public/` görselleri, `components/brand.tsx` | Kişi 5 | Kişi 2 |
| `components/dialog.tsx` | Kişi 4 | Kişi 5 (yalnızca CSS geçişi) |
| `components/auth-form.tsx`, `components/contact-form.tsx` | Kişi 4 (erişilebilirlik kontrolü) | Kişi 1 |
| `components/admin/**`, `app/yonetim/**` | Bu sprintte kimse | — |

## 5. Bir haftalık takvim

| Gün | Kişi 1 | Kişi 2 | Kişi 3 | Kişi 4 | Kişi 5 |
| --- | --- | --- | --- | --- | --- |
| 1 Denetim | Renk/boyut envanteri | İçerik soruları liderlere | Kart/sayfa haritası | Klavye + axe turu | Lighthouse ölçümü |
| 2 Çekirdek | Token PR'ı (gün sonu merge) | Hero metin seçenekleri | Kart bileşeni PR'ı | Menü bağlantısı | Logo görselleri |
| 3 Ana iş | Buton/girdi durumları | Sosyal ikon, Hakkımızda | Breadcrumb, ilgili duyurular | Kırılma noktaları | Geçişler |
| 4 Entegrasyon | Diğer PR'larda token kontrolü | Hero + bölüm sırası | sitemap/robots | axe test dosyası | İskeletler |
| 5 Cila | Kalan renk kodları | Boş durum, metinler | 404, "Devamını oku" | Dokunma hedefleri | Dialog geçişi |
| 6 Test | Görsel karşılaştırma | Mobil gözden geçirme | Detay/arama testleri | 320 px, %200 zoom | Lighthouse tekrar |
| 7 Son kontrol | Token tablosu yorumu | Ekran görüntüleri | Testler | Erişilebilirlik notu | `FINAL-AUDIT.md` güncelleme |

## 6. Paralel çalışma kuralları

- **Dallar:** `sprint/k1-tokens`, `sprint/k2-homepage`, `sprint/k3-content`, `sprint/k4-a11y`, `sprint/k5-polish`. Hepsi güncel `main`'den açılır. Küçük PR'lar, her PR'da `npm run typecheck`, `npm run build`, `npx playwright test`.
- **Birleştirme sırası:** Kişi 1 token PR'ı (2. gün) → Kişi 3 kart bileşeni (2. gün) → Kişi 4 menü (3. gün) → Kişi 2 ana sayfa → Kişi 5 cila. Önce birleşen PR'dan sonra diğerleri `main`'i kendi dalına alır.
- **Çakışma noktaları:** `app/globals.css` (herkes): yalnızca kendi bölümüne yaz, yeni kuralları ilgili bileşen bloğunun altına ekle, renk/boyut için Kişi 1'in token'larını kullan. `components/sections.tsx`: Kişi 3 kartı 2. gün dışarı alır, sonra dosya Kişi 2'nindir. `components/header.tsx`: yerel `main` checkout'unda commit edilmemiş "Görevlerim" değişikliği var; Kişi 4 başlamadan önce bu değişikliğin merge edilmesini bekler.
- Aynı bileşeni iki kişi yeniden tasarlamaz; ihtiyaç varsa sahibine issue/mesajla iletilir.

## 7. Backend bağımlılıkları

`BACKEND DEPENDENCY — DO NOT IMPLEMENT IN THIS TASK`

- Duyuru kategori listesi ucu → [`docs/DUYURU-KATEGORI-BACKEND.md`](../docs/DUYURU-KATEGORI-BACKEND.md)
- Etkinlik tarihi, yeri, kayıt bağlantısı → [`docs/ETKINLIK-ALANLARI-BACKEND.md`](../docs/ETKINLIK-ALANLARI-BACKEND.md)

Backend gerektirmeyenler: sosyal bağlantılar (`social.github` vb.) ve olası istatistikler yönetim panelindeki **Site ayarları** bölümünden herkese açık ayar olarak eklenebilir.
