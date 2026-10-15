# KİŞİ 5 - KONTROL NOTU

## 1. Eşleştirme Tablosu (Arayüz alanı | İçerik anahtarı | Dinamik mi / Statik mi)

| Arayüz alanı | İçerik anahtarı | Dinamik mi / Statik mi | Açıklama |
|---|---|---|---|
| Hero başlığı | contentKey `home-hero` (HOME/HERO) | Dinamik | `page_contents` (HOME, HERO, home-hero).title |
| Hero alt başlık | contentKey `home-hero` (HOME/HERO) | Dinamik | `page_contents` (HOME, HERO, home-hero).subtitle |
| Hero gövdesi | contentKey `home-hero` (HOME/HERO) | Dinamik | `page_contents` (HOME, HERO, home-hero).body |
| Kulüp adı | club.name (lib/content.ts) | Statik | Sabit metin (fallback) |
| Üniversite | club.university (lib/content.ts) | Statik | Sabit metin (fallback) |
| Hakkımızda | contentKey `about-main` (ABOUT/TEXT) | Dinamik | `page_contents` (ABOUT, TEXT, about-main) |
| İletişim açıklaması | contentKey `contact-main` (CONTACT/CONTACT_INFO) | Dinamik | `page_contents` (CONTACT, CONTACT_INFO, contact-main) |
| E-posta (footer) | site_settings `contact.email` | Dinamik | `site_settings` (public) |
| Takım bölümü | lib/content.ts `teams` | Statik | Plan kapsamında statik bırakıldı |
| Çalışma akışı | lib/content.ts `steps` | Statik | Plan kapsamında statik bırakıldı |
| Kurallar | lib/content.ts `rules` | Statik | Plan kapsamında statik bırakıldı |
| Güncellemeler | lib/content.ts `updates` | Statik | Plan kapsamında statik bırakıldı |
| Dikeyler | lib/content.ts `pillars` | Statik | Plan kapsamında statik bırakıldı |

> Not: Var olmayan anahtar uydurulmadı. Eksik içerik durumunda fallback (statik) içerik kullanıldı.

## 2. Uygulanan Değişiklikler (kısaca)

- `components/contact-form.tsx`: alanlar `name/email/subject/message` ile eşleştirildi; çift gönderim engellendi; başarı mesajı "Mesaj alındı"; 400'de `FieldErrors` kullanıldı; 429 ve ağ hatası için uygun mesajlar; form verisi hata sonrası korunuyor.
- `features/site-content/*`: tipler, fixture'lar, adaptörler ve eşleştirme tablosu eklendi.
- `app/page.tsx`: `Promise.allSettled` ile paralel okuma, güvenli (düz metin) render ve `HomeAnnouncements` entegrasyonu yapıldı.
- `components/hero.tsx`, `components/public-blocks.tsx`: gelen metinler düz metin olarak render ediliyor; satır sonları için CSS'te `white-space: pre-line` destekleniyor.
- `components/home-announcements.tsx`: ana sayfa duyuru bölümü Kişi 4 sözleşmesine göre eklendi; eski `Announcements` kullanımı bununla değiştirildi (çift `id="duyurular"` giderildi).

## 3. Test Sonuçları

- `npx tsc --noEmit`: exit 0
- `npm run build`: exit 0
- `npx playwright test`: 34/34 geçti (content, errors, integration, team-board, admin)
- KİŞİ 5 E2E (`tests/e2e/content.spec.ts`): 6/6 geçti
  - İletişim formu başarı senaryosu
  - 400 alan hataları ve veri korunumu
  - 429 Too Many Requests
  - Güvenli render (HTML etiketleri düz metin)
  - İçerik hatasında graceful degradation
  - Mobil görünüm (390x844)

### SSR içerik testi hakkında not

Next.js server component'lerinin `fetch` çağrıları Node tarafında çalışır; Playwright `page.route` yalnızca tarayıcı isteklerini yakalar. Bu nedenle SSR içeriğini test edebilmek için `tests/e2e/support/mock-content-api.mjs` devreye alındı. Bu sunucu normalde istekleri gerçek backend'e (8080) iletir; test sırasında `/__control` uç noktası ile `pages/*` yanıtları `proxy | malicious | fail` modlarına alınabilir. `playwright.config.ts`, Next.js sunucusunu bu adrese (`CLUB_API_URL`) yönlendirir.
