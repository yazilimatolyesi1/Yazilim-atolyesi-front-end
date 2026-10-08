# Duyuru kategorileri backend talebi

Bu dosya backend ekibine iletilecek talebi içerir. Frontend ekibi backend koduna dokunmaz; aşağıdaki uç hazır olduğunda frontend tarafı buna geçirilecektir.

## Mevcut durum

- `/duyurular` sayfasındaki kategori filtresi `GET /api/v1/announcements?category=<ad>` parametresini kullanır.
- Backend kategoriyi serbest metin olarak saklar ve filtrede büyük/küçük harf duyarsız tam eşleşme yapar (`AnnouncementSpecifications.filtered`).
- Yönetim panelinde kategori serbest metin alanıdır (`Örn. Eğitim`).
- Kategorileri listeleyen bir uç olmadığı için frontend seçenekleri sabit tutuyor: `Genel`, `Etkinlik`, `Proje`, `Eğitim` (`components/announcement-list.tsx`).

**Sorun:** Yönetici bu dört ad dışında bir kategori yazarsa (ör. `Atölye`, `Duyuru`) o duyurular filtre menüsünde seçilemez. Sabit listede olup hiç kullanılmayan bir kategori seçildiğinde ise boş sonuç döner.

## İstenen uç

```
GET /api/v1/announcements/categories
```

- Kimlik doğrulama gerektirmez (herkese açık duyuru listesiyle aynı erişim).
- Yalnızca **yayındaki** duyuruları (`PUBLISHED` ve `publishedAt <= now`) hesaba katar.
- Boş/whitespace kategori dönmez. Aynı kategorinin farklı yazımları (`Eğitim` / `eğitim`) tek kayıt olarak döner; gösterim için en sık kullanılan yazım tercih edilir.
- Ada göre (`tr` sıralaması) sıralı döner.
- `/{slug}` eşlemesiyle çakışmaması için yol, mevcut `@GetMapping("/{slug}")` tanımından önce eşleşmelidir veya ayrı bir sabit yol olarak tanımlanmalıdır.

### Yanıt

```json
[
  { "name": "Eğitim", "count": 4 },
  { "name": "Etkinlik", "count": 7 }
]
```

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `name` | string | Filtrede `category` parametresine aynen verilecek ad |
| `count` | number | Bu kategorideki yayındaki duyuru sayısı |

Hata biçimi mevcut `ApiError` sözleşmesiyle aynıdır.

## Kabul kontrolü

- Taslak veya arşivlenmiş duyurunun kategorisi listede görünmez.
- Yayın tarihi gelecekte olan duyurunun kategorisi listede görünmez.
- Dönen her `name` değeriyle `GET /announcements?category=<name>` en az bir kayıt döndürür.
- `GET /announcements/categories` isteği slug detayı olarak yorumlanıp 404 dönmez.

## Frontend tarafında yapılacaklar (uç hazır olduğunda)

- Sabit `CATEGORIES` listesi kaldırılıp seçenekler bu uçtan okunacak.
- Aracı API (`app/api/club/[...path]/route.ts`) bu yolu mevcut `announcements/[^/]+` kalıbıyla zaten geçiriyor; izin listesinde değişiklik gerekmez.
