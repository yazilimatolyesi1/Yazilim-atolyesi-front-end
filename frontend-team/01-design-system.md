# Kişi 1 — Tasarım sistemi ve görsel dil

## 1. Görev

Sitenin renk, yazı boyutu, köşe yarıçapı ve boşluk değerlerini tek bir token sistemine bağlamak. Bugün `app/globals.css` içinde 81 farklı renk kodu, 20 farklı font boyutu ve 14 farklı köşe yarıçapı var; buna karşılık yalnızca 9 CSS değişkeni tanımlı. Amaç sitenin **görünüşünü değiştirmeden** tutarlı hâle getirmek: sayfalar tek bir ürün gibi görünmeli. Diğer dört kişi senin token'larını kullanacak, bu yüzden token PR'ın 2. gün sonunda merge edilmeli.

## 2. Öğrenmen gerekenler (toplam 45–60 dk)

- [MDN — CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties): token'lar CSS değişkeni olarak tanımlanacağı için `var()` ve kalıtımı bilmen gerekiyor.
- [Material Design — Design tokens](https://m3.material.io/foundations/design-tokens/overview): ham değer (`#11153d`) ile anlamlı ad (`--club-surface`) arasındaki farkı bu sayfa iyi anlatıyor.
- [web.dev — Typography](https://web.dev/learn/css/typography): 20 boyutu 6–7 adımlık bir ölçeğe indirirken satır yüksekliği ve okunabilirlik için.
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/): her metin/zemin token çiftinin WCAG AA (4.5:1) eşiğini geçtiğini kontrol etmek için.

## 3. İnceleyeceğin dosyalar

- `app/globals.css`: `:root` (satır 12–30), `.club-button` / `.button-outline` / `.button-light` / `.text-button` / `.icon-button` (satır ~150–210), `.announcement-card` (~457), `.category-label` (~520), iki kez tanımlanmış `.about-panel` (~408 ve ~577).
- `tailwind.config.ts`: buradaki palet (`plum`, `coral`, `ink`) yalnızca arşiv sayfası `/hero-tasarimlari`'da kullanılıyor, sitenin paletiyle aynı değil.
- `components/admin/shared.tsx` içindeki `Badge`: renk tonu adları (green/red/purple) için örnek.

## 4. Görevler

- [ ] **P1** Renk envanteri çıkar: `grep -o -i -E '#[0-9a-f]{3,8}\b' app/globals.css | sort | uniq -c`. Benzer tonları birleştirerek 12–16 anlamlı token tanımla (`--club-bg`, `--club-surface`, `--club-surface-raised`, `--club-border`, `--club-text`, `--club-text-muted`, `--club-accent`, `--club-accent-strong`, `--club-success`, `--club-danger` …). Mevcut `--club-*` adlarını koru.
- [ ] **P1** Font boyutlarını ölçeğe bağla: `--text-xs:12px`, `--text-sm:14px`, `--text-base:16px`, `--text-lg:18px`, `--text-xl:22px`, `--text-2xl:28px`, `--text-3xl:34px`. 13/15/21/23/27/33 px gibi ara değerleri en yakın adıma taşı.
- [ ] **P1** Köşe yarıçapını 4 token'a indir (`--radius-sm:8px`, `--radius-md:12px`, `--radius-lg:16px`, `--radius-pill:999px`).
- [ ] **P1** Boşluk için 4'ün katı token'ları ekle (`--space-1:4px` … `--space-8:32px`); kart ve panel iç boşluklarında kullan.
- [ ] **P1** Buton varyantlarının hepsine aynı `:hover`, `:focus-visible`, `:disabled` ve `[aria-busy="true"]` görünümünü ver; dosyanın başına 5 satırlık "hangi buton ne zaman" yorumu yaz.
- [ ] **P2** `.about-panel` tekrarını tek kurala indir; aynı seçicinin başka tekrarını ara ve birleştir.
- [ ] **P2** `tailwind.config.ts` paletine "yalnızca arşiv sayfası kullanır, yeni kodda kullanma" yorumu ekle.

## 5. Bitti sayılması için

- `:root` dışında kalan farklı renk kodu sayısı ≤ 10 (yukarıdaki `grep` komutuyla ölç).
- `globals.css` içindeki tüm `font-size` ve `border-radius` değerleri `var(--…)` kullanıyor.
- 390, 768 ve 1366 px ekran görüntüleri öncekiyle gözle ayırt edilemiyor (önce/sonra görüntülerini PR'a ekle).
- Tüm metin/zemin token çiftleri WebAIM'de AA geçiyor.
- `npm run typecheck`, `npm run build` ve `npx playwright test` geçiyor.

## 6. Yapma

- Sayfa düzenini, bölüm sırasını veya metinleri değiştirme (Kişi 2 ve 3'ün işi).
- Yeni yazı tipi, kütüphane veya Tailwind sınıfı ekleme.
- `components/admin/dashboard.module.css` dosyasına dokunma; yönetim paneli bu sprintin dışında.
