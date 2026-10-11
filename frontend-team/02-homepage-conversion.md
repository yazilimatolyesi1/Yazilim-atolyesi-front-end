# Kişi 2 — Ana sayfa ve katılım deneyimi

## 1. Görev

Ana sayfaya ilk kez gelen bir öğrencinin 10 saniye içinde üç şeyi anlamasını sağlamak: bu kulüp ne, bana ne kazandırır, şimdi ne yapmalıyım. Hero metnini, çağrı butonlarını, Hakkımızda/Katıl panellerini ve footer'daki güven unsurlarını sen sahiplenirsin. Metinlerin bir kısmı koddan değil, yönetim panelindeki **Sayfa içerikleri** ve **Site ayarları** bölümlerinden gelir. Önce verinin nereden geldiğini bul, sonra değiştir.

## 2. Öğrenmen gerekenler (toplam 45 dk)

- [NN/g — Homepage usability guidelines](https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/): bir ana sayfanın ilk ekranda neyi anlatması gerektiğini kısa maddelerle veriyor.
- [NN/g — Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): birincil ve ikincil butonu, başlık ve açıklamayı boyut ve renkle ayırmayı öğretiyor.
- [GOV.UK — Writing for the web](https://www.gov.uk/guidance/content-design/writing-for-gov-uk): kısa, net, eylem odaklı metin yazmak için; hero cümlesinde kullanacaksın.

## 3. İnceleyeceğin dosyalar

- `app/page.tsx`: bölüm sırası ve panelden gelen `HOME` / `ABOUT` blokları.
- `components/hero.tsx`: başlık, iki çağrı butonu, logo.
- `components/sections.tsx`: `Pillars`, `Announcements`, `About`, `Join`, `Team`, `Workflow`, `Footer` (sosyal ikonlar ~satır 255).
- `components/public-blocks.tsx`, `lib/content.ts`: yedek metinler.
- Yönetim paneli (`/yonetim`): **Sayfa içerikleri** (hero ve Hakkımızda metni) ve **Site ayarları** (`social.*` bağlantıları).

## 4. Görevler

- [ ] **P1** Hero için 2–3 alternatif değer önerisi yaz (tek cümle + tek açıklama) ve kulüp liderlerine seçtir. Seçilen metni panelden gir; koddaki yedek metni (`club.intro`) de aynı mesajla uyumlu hâle getir.
- [ ] **P1** İkincil çağrı "Etkinlikleri Keşfet" bugün `#duyurular` bölümüne gidiyor; bölümün adı "Duyurular". Etiket ile hedefi tutarlı yap (örn. "Duyuruları gör" → `/duyurular`).
- [ ] **P1** Sosyal ikonlar: bağlantısı olmayan ikon "bağlantı paylaşılmadı" penceresi açıyor. Bağlantısı olmayan ikonu hiç gösterme; hiç bağlantı yoksa "Bizi Takip Edin" başlığını da gizle. Gerçek hesap adreslerini liderlerden alıp **Site ayarları**'na ekletin.
- [ ] **P1** Hakkımızda paneli: panelden gelen metin kısa olduğunda yanında büyük boş alan kalıyor. Paneli içeriğe göre hizala veya yedek içerikteki "Devamını Oku" ve değer rozetlerini panel içeriğiyle de göster.
- [ ] **P2** Duyuru yokken gösterilen "Henüz yayınlanmış duyuru bulunmuyor." metninin altına üye kaydına giden kısa bir çağrı ekle.
- [ ] **P2** "Çalışma Akışı", "Takım Kuralları" ve "İletişim & Güncellemeler" bölümleri ekibe yönelik süreç metni. Liderlerle karar verin: alta taşınsın mı, tek "Nasıl çalışıyoruz?" bölümünde birleşsin mi? (`UNKNOWN — VERIFY BEFORE IMPLEMENTATION`)
- [ ] **P2** Güven unsuru: üye ya da etkinlik sayısı yalnızca liderlerin doğruladığı sayılarla ve **Site ayarları**'ndan okunarak gösterilsin. Doğrulanmamış sayı yazma.

## 5. Bitti sayılması için

- 1366×768 ve 390×844 ekranlarda kaydırmadan önce görünen alan: kulübün adı, tek cümlelik vaat ve "Kulübe Katıl" butonu.
- Ana sayfadaki her buton ve bağlantı var olan bir sayfaya veya bölüme gidiyor; yer tutucu pencere açan ikon kalmadı.
- Hakkımızda ve Katıl panelleri arasında 120 px'ten büyük boş alan yok.
- Mobil ana sayfa yüksekliği bugünkü 5.550 px'ten kısa (bölüm kararı alındıysa).
- `npx playwright test` geçiyor.

## 6. Yapma

- `components/header.tsx` menüsünü değiştirme (Kişi 4).
- Renk, font boyutu ve köşe değerlerini doğrudan yazma; Kişi 1'in token'larını kullan.
- Animasyon ekleme (Kişi 5); backend'e yeni alan isteme.
