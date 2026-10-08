# Etkinlik alanları backend talebi

BACKEND DEPENDENCY — DO NOT IMPLEMENT IN THIS TASK. Bu dosya backend ekibine iletilecek talebi içerir; frontend ekibi backend koduna dokunmaz.

## Neden gerekli

Kulüp duyurularının önemli bir kısmı etkinlik (atölye, eğitim, toplantı). Duyuru modeli şu an yalnızca `publishedAt` (yayın tarihi) taşıyor. Kartlarda ve detay sayfasında etkinliğin **ne zaman ve nerede** olduğu gösterilemiyor; ziyaretçi bunu yalnızca serbest metin içinden okuyabiliyor. Yaklaşan ve geçmiş etkinlikler de ayrılamıyor.

## İstenen alanlar (`AnnouncementRequest` / `AnnouncementResponse`)

| Alan | Tip | Zorunlu | Açıklama |
| --- | --- | --- | --- |
| `eventStartsAt` | ISO-8601 Instant | Hayır | Etkinlik başlangıcı. Boşsa duyuru etkinlik değildir. |
| `eventEndsAt` | ISO-8601 Instant | Hayır | `eventStartsAt` sonrası olmalı. |
| `location` | string (≤ 200) | Hayır | "Kartal Kampüsü, B Blok 204" veya "Çevrim içi". |
| `registrationUrl` | URL (≤ 500) | Hayır | Yalnızca `http`/`https`. |

## Liste filtresi

`GET /api/v1/announcements?eventFrom=<Instant>&eventTo=<Instant>`: etkinlik tarihine göre filtre; `sort=eventStartsAt,asc` desteklenmeli. Mevcut `q`, `category`, `page`, `size` parametreleri değişmeden çalışmalı.

## Kabul kontrolü

- Alanları boş bırakılan mevcut duyurular eskisi gibi döner (geri uyumlu).
- `eventEndsAt < eventStartsAt` isteği mevcut `ApiError` biçiminde 400 ve alan hatası döner.
- `registrationUrl` için `javascript:` gibi şemalar reddedilir.
- Yönetim panelinin göndereceği alanlar Flyway migration ile eklenir; mevcut veriler korunur.

## Frontend tarafında yapılacaklar (uç hazır olduğunda)

- Kart ve detay sayfasında tarih/saat (`Europe/Istanbul`), yer ve "Kayıt ol" bağlantısı gösterilecek.
- Duyurular sayfasına "Yaklaşan etkinlikler" görünümü eklenecek.
- Yönetim panelindeki duyuru formuna bu alanlar eklenecek.
