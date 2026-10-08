# Kişi 5 — Hareket, performans ve son cila

## 1. Görev

Siteyi hızlı ve özenli hissettirmek. Bugün sitede hiç geçiş efekti yok: hover durumları anlık değişiyor. Ana sayfada en büyük içerik (LCP) 186 KB'lık bir PNG logo, aynı dosya 44 px'lik başlık logosunda da kullanılıyor. Bütün sayfalarda aynı genel yükleniyor iskeleti görünüyor. Hareket yalnızca bir amaca hizmet ediyorsa eklenir: durum değişikliğini göstermek veya geçişi yumuşatmak gibi.

## 2. Öğrenmen gerekenler (toplam 60 dk)

- [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp): ana sayfanın en büyük öğesi logo; neden ve nasıl küçültüleceğini anlatıyor.
- [Next.js — Image component](https://nextjs.org/docs/app/api-reference/components/image): boyutlandırılmış, modern formatlı görsel üretmenin Next yolu; kullanıp kullanmamaya bununla karar ver.
- [MDN — Using CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) ve [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): kısa, performanslı geçişler ve hareket istemeyen kullanıcılar için.
- [Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview): önce/sonra ölçümünü Chrome DevTools içinden almak için.
- [Next.js — loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading): sayfaya özgü yükleniyor iskeleti eklemek için.

## 3. İnceleyeceğin dosyalar

- `public/club-logo.png` (502×497, 186 KB), `components/brand.tsx` (44/64 px), `components/hero.tsx` (≤310 px, `fetchPriority="high"`).
- `app/loading.tsx` (iki gri kutu, her sayfa için aynı).
- `app/globals.css`: 8 adet `:hover` kuralı, 0 adet `transition`; satır ~1885'teki `prefers-reduced-motion` bloğu.
- `components/dialog.tsx` ve `.club-dialog` CSS'i (~satır 894).
- `docs/PLESK-YAYINLAMA.md`: yayın ortamı. Görsel optimizasyonu yayın sunucusunda da çalışmalı.

## 4. Görevler

- [ ] **P1** Önce ölç: üretim derlemesinde (`npm run build && npm run start:local`) `/`, `/duyurular` ve `/uye-kaydi` için Lighthouse (mobil) skorlarını ve LCP değerini PR açıklamasına yaz.
- [ ] **P1** Logo: başlık/footer için 128 px ve hero için 640 px'lik WebP sürümleri üret (veya `next/image` kullan). Ana sayfadaki toplam logo boyutu 40 KB'ın altına insin. `next/image` seçersen Plesk'te `next start` ile çalıştığını doğrula; emin değilsen önceden üretilmiş statik dosyaları tercih et.
- [ ] **P2** Butonlara, takım kartlarına, menü ve kart bağlantılarına 150–200 ms'lik `color`, `background-color`, `border-color`, `box-shadow` geçişi ekle. Kartlarda en fazla 2 px `translateY`. `transition: all` kullanma.
- [ ] **P2** `app/duyurular/loading.tsx` ve `app/duyurular/[slug]/loading.tsx` ekle: iskelet gerçek sayfanın düzenine (başlık, filtreler, 3 kart) benzesin; içerik gelince sayfa zıplamasın.
- [ ] **P2** `.club-dialog` açılışına 150 ms opaklık geçişi ekle; `prefers-reduced-motion` açıkken hiç hareket olmasın.
- [ ] **P3** 6–7. günlerde son tutarlılık turu: her sayfanın 390/1366 px ekran görüntüsünü al, göze batan hizalama ve boşluk farklarını sahiplerine bildir.

## 5. Bitti sayılması için

- Lighthouse mobil Performance ≥ 90, Best Practices ≥ 95 ve CLS < 0.1 (3 sayfa, üretim derlemesi).
- Ana sayfada indirilen toplam logo boyutu < 40 KB.
- Geçişlerin hepsi ≤ 200 ms; işletim sisteminde "hareketi azalt" açıkken hiç hareket yok.
- Sayfaya özgü iskeletlerden içeriğe geçerken düzen kayması yok.

## 6. Yapma

- Animasyon kütüphanesi (framer-motion vb.) ekleme; parallax ve kaydırmayı ele geçiren efektler kullanma.
- Renk, düzen veya metin değiştirme.
- `components/header.tsx`'e dokunma; değişiklik gerekiyorsa Kişi 4'e ilet.
