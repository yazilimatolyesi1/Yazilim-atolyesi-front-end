# Son frontend denetimi

Tarih: 8 Ekim 2026 · Dal: `frontend-sprint-audit` (PR #4 düzeltmelerinin üzerinde) · Ölçüm: üretim derlemesi (`next start`), yerel Spring backend, 4 geçici örnek duyuru (ölçüm sonunda silindi), Playwright + axe-core 4.10, 390 / 768 / 1366 px.

## 1. Ne bulundu

Site, onaylı PDF tasarımına sadık, semantik ve erişilebilirlik açısından sağlam bir temel üzerinde. Sorunların çoğu "bozuk" değil, **tutarsızlık ve eksik bağlantı** türünde:

- Yeni duyuru detay sayfalarına ana sayfadan ulaşılamıyordu.
- Tasarım değerleri dağınık: 81 renk kodu, 9 CSS değişkeni, 20 font boyutu, 14 köşe yarıçapı.
- Paylaşım önizlemesi her duyuruda aynıydı; favicon yoktu.
- Yayında olmaması gereken tasarım arşivi (`/hero-tasarimlari`) indekslenebilir durumdaydı ve içinde "Beğendiğin numarayı söyle… aktaracağım" gibi iç talimat metni vardı.
- Footer'da panelden gelen blok, sayfa başlığı boyutunda görünüyordu.

## 2. Ne değişti

| Değişiklik | Dosya | Neden |
| --- | --- | --- |
| Ana sayfa duyuru kartı başlığı detay sayfasına bağlanıyor | `components/sections.tsx` | Detay sayfaları ana sayfadan erişilemiyordu (P0). |
| `/duyurular` listesine ekran okuyucu için gizli `h2` | `components/announcement-list.tsx` | axe `heading-order` ihlali (h1 → h3) (P0). |
| Arşiv sayfasına `noindex, nofollow` ve `main#main-content` | `app/hero-tasarimlari/page.tsx` | İç sayfa arama motorundan çıkar; axe `region` + `skip-link` ihlalleri (P0). Sayfa silinmedi (karar liderlerde). |
| Detay sayfasına duyuruya özel başlık, açıklama ve Open Graph | `app/duyurular/[slug]/page.tsx`, `lib/react-cache.d.ts` | WhatsApp/Instagram paylaşımında doğru önizleme. `React.cache` ile meta veri ve sayfa backend'i **bir kez** çağırır (P1). |
| Favicon (64 px) ve Apple simgesi (180 px) | `app/icon.png`, `app/apple-icon.png` | Sekmede/yer imlerinde kulüp logosu; tarayıcının `/favicon.ico` 404'ü biter (P1). |
| Footer iletişim bloğu footer ölçeğinde; telif yılı otomatik | `app/globals.css`, `components/sections.tsx` | "İletişim" başlığı footer'da dev görünüyordu; "© 2025" sabitti (P1). |
| Görev planı, 5 görev dosyası, 2 backend talebi | `frontend-team/`, `docs/ETKINLIK-ALANLARI-BACKEND.md` | Sprint planı ve backend devri. |
| E2E testi genişletildi | `tests/e2e/announcements.spec.ts` | Ana sayfa kartı → detay ve detay `<title>` kontrolü. |

## 3. Bilerek değiştirilmeyenler

- **`components/header.tsx`:** yerel `main` checkout'unda commit edilmemiş "Görevlerim" değişikliği var; çakışmamak için menü işi Kişi 4'e bırakıldı.
- **Renk ve tipografi token'ları:** büyük ve öğretici bir iş; Kişi 1'in ana görevi. Görünüm değişmesin diye tek PR'da yapılmalı.
- **Ana sayfa metinleri ve bölüm sırası:** içerik kararı kulüp liderlerinin. Hero metni panelden yönetiliyor.
- **`/hero-tasarimlari` sayfası ve `public/design-explorations`:** silinmedi, yalnızca indeks dışı bırakıldı.
- **Tailwind:** yalnızca arşiv sayfası ve temel sıfırlama için kullanılıyor; kaldırmak bu sprint için riskli.
- **Yönetim paneli (`components/admin/**`):** iç araç, bu sprintin kapsamı dışında.

## 4. Önce / sonra

| Ölçüt | Önce | Sonra |
| --- | --- | --- |
| axe ihlali (8 sayfa × mobil+masaüstü) | 3 kural, 2 sayfada, iki genişlikte de: `/duyurular` → `heading-order`; `/hero-tasarimlari` → `region`, `skip-link` | **0** |
| Yatay taşma (8 sayfa × 3 genişlik) | 0 | 0 |
| Ana sayfadan detay sayfasına bağlantı | Yok | Her kartta var |
| Duyuru detayı `<title>` | "Duyuru \| Yazılım Atölyesi" (hepsi aynı) | "{başlık} \| Yazılım Atölyesi" + açıklama + OG |
| Favicon | Yok (404) | 64 px + 180 px Apple |
| Playwright | 30 test geçti | 30 test geçti (detay testi genişletildi) |
| Ana sayfa LCP öğesi | `club-logo.png` 186 KB | Aynı (Kişi 5) |
| Farklı renk kodu / font boyutu | 81 / 20 | 81 / 20 (Kişi 1) |

Genel değerlendirme: görsel hiyerarşi, tutarlılık ve performans bu dalda bilerek **değişmedi**; bunlar ekip görevleri. Navigasyon, erişilebilirlik, SEO ve paylaşım tarafında ölçülebilir iyileşme var.

## 5. Kalan sorunlar

- Menüde "Duyurular" ana sayfa bölümüne gidiyor; detay sayfasında menü öğesi aktif değil (Kişi 4).
- Anonim ziyaretçide her sayfada konsola düşen `users/me` 401 isteği (`components/header.tsx`, `components/auth-form.tsx`) (P3).
- Genel 404 sayfasında menü yok; tüm sayfalar aynı genel iskeleti gösteriyor (Kişi 3, 5).
- Kartlardaki "Devamını oku" düğmelerinin adları ayırt edilemiyor (Kişi 3).
- Ana sayfa ve liste kartı iki ayrı kodla çiziliyor (Kişi 3).
- Mobil ana sayfa 5.550 px uzunluğunda; iç ekip süreçleri ana sayfada (Kişi 2, `UNKNOWN — VERIFY BEFORE IMPLEMENTATION`).
- OG görseli yok; `metadataBase` tanımlı olmadığı için görsel URL'leri mutlak üretilemiyor (Kişi 3, `CLUB_SITE_URL`).

## 6. Backend bağımlılıkları

`BACKEND DEPENDENCY — DO NOT IMPLEMENT IN THIS TASK`

- Kategori listesi ucu → `docs/DUYURU-KATEGORI-BACKEND.md`
- Etkinlik tarihi/yeri/kayıt bağlantısı → `docs/ETKINLIK-ALANLARI-BACKEND.md`

## 7. Kalan iş listesi

- **P0:** yok.
- **P1:** token sistemi ve buton durumları (1) · hero değer önerisi, sosyal ikonlar, Hakkımızda boşluğu (2) · tek kart bileşeni, breadcrumb, ilgili duyurular, sitemap/robots/metadataBase (3) · menü bağlantısı, kırılma noktaları, otomatik axe testi (4) · logo optimizasyonu, Lighthouse ölçümü (5).
- **P2:** bölüm sırası/mobil uzunluk, boş durum çağrısı (2) · 404 menüsü, "Devamını oku" adları, sonuç özeti (3) · dokunma hedefleri, 320 px/%200 (4) · geçişler, sayfa iskeletleri, dialog geçişi (5).
- **P3:** marka yazı tipi · Tailwind'i kaldırma · `users/me` 401 · yönetim paneli tasarımı · kullanılmayan `announcements` dizisi.

## 8. Gelecek iyileştirmeler ve önerilen sonraki sprint

1. Backend etkinlik alanları hazır olunca: kartta tarih/yer/kayıt, "Yaklaşan etkinlikler" görünümü, takvime ekleme.
2. Kategori ucu hazır olunca: dinamik kategori menüsü.
3. Topluluk kanıtı: etkinlik fotoğrafları ve yönetim ekibi bölümü (içerik liderlerden).
4. Genel OG görseli ve paylaşım kartı tasarımı.
5. Yönetim panelini Kişi 1'in token'larına taşıma.
