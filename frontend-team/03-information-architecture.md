# Kişi 3 — Bilgi mimarisi ve içerik sayfaları

## 1. Görev

Ziyaretçinin duyuruları bulmasını, okumasını ve ilgili içeriğe geçmesini kolaylaştırmak. Duyuru kartı, duyuru listesi, duyuru detay sayfası, 404 sayfası, site haritası ve robots dosyası senin sorumluluğunda. Bugün aynı duyuru kartı iki ayrı yerde iki farklı kodla çiziliyor. Detay sayfasında da konum bilgisi ve ilgili içerik yok.

## 2. Öğrenmen gerekenler (toplam 60 dk)

- [Next.js — Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating): `Link` bileşeni ve sayfalar arası geçiş; kart ve breadcrumb bağlantılarında kullanacaksın.
- [Next.js — sitemap.ts](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) ve [robots.ts](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots): iki dosyayı kodla üretmenin resmi yolu.
- [WAI-ARIA — Breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/): breadcrumb'ın erişilebilir HTML yapısı (`nav`, `aria-label`, `aria-current`).
- [NN/g — Empty states](https://www.nngroup.com/articles/empty-state-interface-design/): sonuç yok ve 404 ekranlarında kullanıcıya bir sonraki adımı göstermek için.

> Not: Bu projede Next.js 16 var. Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili sayfayı da oku (`AGENTS.md` kuralı).

## 3. İnceleyeceğin dosyalar

- `components/sections.tsx` → `AnnouncementCard` (ana sayfa kartı) ve `components/announcement-list.tsx` (liste kartı; aynı HTML ikinci kez yazılmış).
- `app/duyurular/page.tsx`, `app/duyurular/[slug]/page.tsx`, `app/duyurular/[slug]/not-found.tsx`.
- `app/not-found.tsx` (menüsüz), `app/error.tsx`, `app/layout.tsx` (site geneli meta veri).
- `lib/server-api.ts` (`getAnnouncement`, `apiBase`), `.env.example` (`CLUB_SITE_URL`).
- `tests/e2e/announcements.spec.ts`: duyuru testleri; yeni testlerini buraya ekle.

## 4. Görevler

- [ ] **P1** Kartı tek bileşene indir: `components/announcement-card.tsx` oluştur, hem ana sayfa hem liste aynı bileşeni kullansın ("Devamını oku" penceresi bir prop ile açılıp kapansın). 2. gün PR olarak merge et; `sections.tsx` sonrasında Kişi 2'nindir.
- [ ] **P1** Detay sayfasındaki "← Tüm duyurulara dön" bağlantısını breadcrumb ile değiştir: Ana sayfa › Duyurular › {başlık}.
- [ ] **P1** Detay sayfasının altına aynı kategoriden en yeni 3 duyuruyu ekle (`/announcements?category=…&size=4`, mevcut duyuru hariç). Liste boşsa bölümü gösterme.
- [ ] **P1** `app/sitemap.ts` ve `app/robots.ts` ekle: sitemap ana sayfa, `/duyurular`, `/uye-kaydi` ve tüm yayındaki duyuruları içersin; robots `/yonetim`, `/api/` ve `/hero-tasarimlari` yollarını engellesin. Adres için `CLUB_SITE_URL` kullan, `app/layout.tsx`'e `metadataBase` ekle.
- [ ] **P2** `app/not-found.tsx` sayfasına Header/Footer ve "Duyurular" ile "Üye Kaydı" bağlantılarını ekle.
- [ ] **P2** Her kartta aynı "Devamını oku" adı var; ekran okuyucu için ayırt et: `Devamını oku<span className="sr-only">: {başlık}</span>`.
- [ ] **P2** Duyurular sayfasında sonuç özeti göster: "4 duyuru · Kategori: Etkinlik" (API yanıtındaki `totalElements` alanı).
- [ ] **P3** `lib/content.ts` içindeki kullanılmayan `announcements` dizisini sil.

## 5. Bitti sayılması için

- Ana sayfadaki ve listedeki kartlar aynı bileşenden geliyor; ikisi de detay sayfasına gidiyor.
- Detay sayfasında breadcrumb ve (varsa) ilgili duyurular görünüyor.
- `/sitemap.xml` yayındaki tüm duyuruları listeliyor; `/robots.txt` `/yonetim` yolunu engelliyor.
- `/duyurular` ve detay sayfasında axe ihlali 0.
- `tests/e2e/announcements.spec.ts` içine breadcrumb ve ilgili duyuru testi eklendi; tüm testler geçiyor.

## 6. Yapma

- `components/header.tsx` menüsünü değiştirme; "Duyurular" menü bağlantısı Kişi 4'ün görevi.
- Kart renklerini ve yazı boyutlarını yeniden tasarlama (Kişi 1).
- Backend'den kategori listesi veya etkinlik alanı bekleyen bir arayüz yapma; bunlar `docs/*-BACKEND.md` talepleri.
