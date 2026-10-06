# Kişi 4 — Kontrol Sonuçları

Tarih: 2026-10-03 (son güncelleme: gerçek backend ile tam E2E doğrulaması)
Dal: `kisi-4/ortak-altyapi-testler` (yerel, push edilmedi)
Next.js: 16.3.4 · Node: `npm ci` ile kuruldu
Backend: `C:\yazilim_atolyesi_websitesi-main` · Spring Boot + PostgreSQL 17 · **8080'de açık**

## Yapılan İşler

| Alan | Durum |
| --- | --- |
| 300 ms debounce (`lib/use-debounced-value.ts`) | Tamamlandı |
| `AbortController` + eski cevap engelleme | Tamamlandı |
| Ortak hata/uyarı bileşenleri (`ErrorNotice`, `FieldErrors`) | Tamamlandı |
| 401 / 403 ayrımı | Tamamlandı |
| Proxy `GET /announcements/{slug}` | Tamamlandı |
| Modal: Escape, backdrop, busy, kirli kapatma onayı | Tamamlandı |
| Unsaved changes koruması (`ResourceEditor`) | Tamamlandı |
| Şifre sonrası isteğe bağlı çıkış | Tamamlandı |
| `useOperation`/`useUnsavedChanges` hazır yardımcılar | **Tamamlandı** — `useOperation` 5 ekranda gerçek bildirim akışına bağlandı |
| Ortak `<FieldErrors>` tüm formlarda | **Tamamlandı** — `auth-form`, `contact-form`, `resource-editor` |
| Modal odak geri dönüşü (Esc / backdrop) | Tamamlandı — `shared.tsx` unmount cleanup |
| Gerçek backend ile 22 test doğrulandı | Tamamlandı — 11 mock + 5 admin + 6 integration |

## Çalıştırılan Komutlar

Backend **8080'de açık** ve frontend `webServer` tarafından 3001'de otomatik
başlatılırken çalıştırıldı.

| Komut | Sonuç |
| --- | --- |
| `npm ci` | Başarılı. Uyarı: `1 high severity vulnerability` (incelenmedi) |
| `npm run typecheck` | **Başarılı** — `tsc --noEmit` temiz, exit 0 |
| `npm run build` | **Başarılı** — exit 0, 8 route üretildi |
| `npx playwright test errors.spec.ts` | **11/11 başarılı** (18.2 sn) |
| `npx playwright test admin.spec.ts` | **5/5 başarılı** (22.5 sn) — gerçek API |
| `npx playwright test integration.spec.ts` | **6/6 başarılı** (16.8 sn) — gerçek API |
| **Toplam** | **22/22 başarılı, 0 başarısız** |
| `npm run lint` | **Başarısız** (aşağıdaki Blokajlar) — önceden mevcut olan sorun |

### İstenen üç kritik akış

| Akış | Test | Sonuç |
| --- | --- | --- |
| İçerik kaydet / göster | `admin.spec.ts` "içerik ve site ayarı değişikliği ziyaretçiye yansır" | **PASS** — kaydet, `Sitede göster` kaldır, ziyaretçi sayfasında kaybolma |
| Başvuru incele | `admin.spec.ts` "başvuru kararı, kullanıcı rolü ve mesaj durumu panelden yönetilir" | **PASS** — REJECTED → APPROVED, satır durumu güncellendi |
| Mesaj durumu | `admin.spec.ts` (aynı test) | **PASS** — `NEW` → `READ`, tabloda "Okundu" |

### Hangi test mock, hangisi gerçek?

Bu ayrım önemlidir; iki dosya karıştırılırsa yanlış sonuç çıkar.

| Dosya | Tür | Backend gerekir mi |
| --- | --- | --- |
| `errors.spec.ts` | **Mock** — tüm yanıtlar `page.route` ile | Hayır* |
| `integration.spec.ts` | **Gerçek API** — başlıkta "No mocked successful API responses" | **Evet** |
| `admin.spec.ts` | **Gerçek API** | **Evet** |
| `team-board.spec.ts` | **Gerçek API** (oturum açılışı) | **Evet** |

\* `errors.spec.ts` içindeki 7–11. testler (yönetim paneli) SSR el sıkışması için
gerçek bir yönetici **girişi** yapar; `/yonetim` sunucuda render edildiği için bu
istek `page.route` ile yakalanamaz. Giriş dışında testin doğruladığı **her yanıt**
tarayıcıda taklit edilir ve hiçbir test verisi yazılmaz.

`integration.spec.ts` mock kullanmaz; bu bir eksiklik değil, dosyanın amacı
gerçek uçtan uca akışı doğrulamaktır. Backend kapalıyken geçmesi beklenmez.

## Playwright Testleri

`tests/e2e/errors.spec.ts` — **11 test**, tamamı `page.route()` ile tarayıcıda
taklit edilmiş yanıtlarla çalışır. Veri yazmaz ve backend kapalıyken de koşar.
Sunucu `webServer` tarafından 3001 portunda otomatik başlatılır.

| # | Test | Sonuç |
| --- | --- | --- |
| 1 | Debounce: 7 tuş → tek istek, son istek tam terim | Geçti |
| 2 | İptal edilen istek (`AbortController`) hata üretmez, eski cevap listeyi ezmez | Geçti |
| 3 | Bağlantı hatası uyarısı + "Tekrar dene" ile düzelme | Geçti |
| 4 | Sunucu 500 hata mesajı gösterilir | Geçti |
| 5 | Alan hataları listelenir, form verisi korunur | Geçti |
| 6 | Çift tıklama tek gönderim yapar (düğme uçuşta kilitli) | Geçti |
| 7 | **401** → "Oturumun sona erdi." + "Tekrar giriş yap" bağlantısı | Geçti |
| 8 | **403** → "Bu işlem için yetkin yok." + tekrar giriş bağlantısı **yok** | Geçti |
| 9 | **İşlem bildirimi** `role="status"` olarak duyurulur | Geçti |
| 10 | **Kirli modal uyarısı**: Vazgeç → onay, iptalde pencere + veri korunur | Geçti |
| 11 | **Escape** pencereyi kapatır, odak tetikleyen düğmeye döner | Geçti |

Test 7 ve 8 birlikte 401/403 ayrımını kanıtlar: 401 yanıtında yetki metni hiç
görünmez, 403 yanıtında "Tekrar giriş yap" bağlantısı hiç oluşmaz.

Not: Test 5'te e-posta alanı HTML5 `type="email"` doğrulamasını geçecek
şekilde yazıldı; hata sunucudan gelmelidir. Test 6'da düğme `type="submit"`
ile seçildi çünkü gönderim sırasında erişilebilir adı "Gönderiliyor…"
olduğundan `getByRole(name)` hedefi kaybediyor.

## QA Denetimi (2026-09-29, salt okunur)

Her madde dosya/satır veya komut çıktısıyla doğrulandı. Kanıtı olmayan hiçbir
madde PASS sayılmadı.

| Alan | Sonuç | Kanıt (özet) |
| --- | --- | --- |
| A1 Debounce hook ~300 ms | PASS | `lib/use-debounced-value.ts:5,11-21` |
| A2 Eski cevap ezmez | PASS | `announcement-list.tsx:22,30,36,44` + `errors.spec.ts` test 2 (gerçek `AbortController` iptali ile) |
| A3 AbortError kullanıcıya gösterilmez | PASS | `lib/api.ts:45`, `shared.tsx:48,85`, test 2 |
| A4 Takım ekranları da kullanıyor | PASS | `resources.tsx:16`, `people.tsx:15` → `shared.tsx:64` |
| B1 Ortak alan hatası bileşeni | **PASS (tamamlandı)** | `shared.tsx:40-44` `FieldErrors`; `resource-editor.tsx:70`, `auth-form.tsx:308`, `contact-form.tsx:56` artık ortak bileşeni kullanıyor, kopyalanmış `<ul>` kalmadı |
| B2 İşlem bildirimi | **PASS (tamamlandı)** | `useOperation` (`shared.tsx:91-94`) artık 5 ekranda gerçek akışa bağlı: `dashboard.tsx:93` (şifre), `resources.tsx:38,43` (sil/kaydet), `people.tsx:33,64,66` (karar/rol/durum/mesaj), `resource-editor.tsx:93` (görsel). `role="status"` sözleşmesi `errors.spec.ts` test 9 ile doğrulandı |
| B3 Kaydedilmemiş değişiklik koruması | PASS (kapsam belirtilmiş) | `shared.tsx:101-108`; test 10 uyarıyı, iptalde veri korunumunu ve onayla kapanmayı doğruluyor. Uygulama içi yönlendirme koruması kapsam dışı |
| B4 Modal odak yönetimi | **PASS (düzeltildi)** | `shared.tsx:111-127` unmount cleanup: `dialog.close()` + tetikleyici öğeye `focus()`. Test 11 ile kanıtlandı. `aria-modal` örtük (native `<dialog>` `showModal()`) |
| B5 Ortak yardımcı benimsenmiş, kopyalanmamış | PASS (bildirim/alan hatası) | `useOperation` ve `FieldErrors` artık tek kaynak; hiçbir ekranda kopyalanmış `notice`/`fieldErrors` listesi kalmadı. `team-board.tsx:146-151` içindeki `beforeunload` ve `components/dialog.tsx` hâlâ ayrı — aşağıdaki blokaj 3 |
| C1 401 / 403 farklı arayüz | PASS | `shared.tsx:24-25` + `errors.spec.ts` test 7 ve 8 (tarayıcıda doğrulandı) |
| C2 401 tekrar giriş, 403 çıkış yapmaz | PASS | `shared.tsx:24` `relogin:true`; test 7 (bağlantı var) / test 8 (bağlantı yok); `admin.spec.ts:75-77` |
| C3 Giriş `POST /auth/login` üzerinden proxy | PASS | `auth-form.tsx:230`, `route.ts:15,83-88`; token cookie'ye taşınıyor |
| C4 Oturum/rol `GET /users/me` | PASS | `auth-form.tsx:108,237`; `route.ts:8,56-61` |
| C5 Şifre değiştirme | PARTIAL | Uç nokta doğru (`dashboard.tsx:99`); veri korunuyor (`:100`); **alan hatası yok**; test yok |
| C6 Çıkış cookie'i siler | PASS | `route.ts:51-55,91` |
| C7 Takım bileşenleri panoya bağlı | PASS | `dashboard.tsx:47-50` |
| C8 Proxy kuralları | PARTIAL | Tüm kuralların çağıranı var; backend'e karşılıkları canlı 8080 yanıtlarıyla kısmen doğrulandı (401/403/409/400 origin). Backend kodu değiştirilmedi |
| C9 Token localStorage'da değil | PASS | `route.ts:86-88` `httpOnly`; `localStorage` sadece `team-board.tsx:17,30,33` |
| D1 Üç kritik akış için test | **PASS (koşuldu)** | `admin.spec.ts` 5/5: içerik kaydet/göster, başvuru incele, mesaj durumu, rol, şifre — `integration.spec.ts` 6/6 |
| D2 Hata senaryoları mock | PASS | `errors.spec.ts` 11 test `page.route`; `stop backend` testi kaldırıldı |
| D3 Mock / gerçek ayrımı | PASS | `errors.spec.ts` başlık notu, `integration.spec.ts:6-8` |
| D4 Günlük ortamı etkilemez | **Düzeltildi** | Ayrıntı aşağıda |
| D5 Minimal altyapı | PASS | `playwright.config.ts`: `workers: 1`, `testDir`, 2 reporter; global setup/teardown yok |
| D6 Sabit bekleme yok | PARTIAL | `errors.spec.ts` içinde yalnızca debounce penceresi (`waitForTimeout(700)`) ve iptal sırasının gözlenmesi için gerekli; diğer tüm bekleme `expect.poll` / web-first assertion |
| E1 Type check | PASS | `tsc --noEmit` → exit 0 |
| E2 Build | PASS | 8 route, exit 0 |
| E3 Lint | **FAIL** | `next lint` Next.js 16'da kaldırıldı |
| E4 Playwright | **PASS** | 22/22: 11 mock + 5 admin + 6 integration |
| F1 Build + type | PASS | exit 0 / exit 0 |
| F2 Kritik akışlar doğrulandı | **PASS** | gerçek backend ile: içerik, başvuru, mesaj durumu |
| F3 Hata sonrası veri kaybı yok | PASS | `errors.spec.ts` test 5 (form), test 10 (modal taslağı), `integration.spec.ts` kesinti testi, `admin.spec.ts` şifre testi |
| F4 Testler günlük ortamı bozmaz | **Düzeltildi** | aşağıda |

### E2E güvenlik düzeltmeleri (2026-09-29)

1. **Günlük backend artık durdurulmuyor.** `integration.spec.ts` içindeki
   `docker compose stop backend` çağrısı kaldırıldı. Kesinti senaryosu artık
   tarayıcıda `page.route` ile taklit ediliyor: proxy'nin 503'ü ve gerçek
   bağlantı hatası (`route.abort`) ayrı ayrı doğrulanıyor, sonra taklit
   kaldırılıp servisin geri geldiği doğrulanıyor. Taklit edilen kısım
   geçici bir spec ile **koşularak doğrulandı** (1/1 geçti), sonra o spec silindi.
2. **Ham SQL varsayılan olarak kapalı.** `tests/e2e/support/db.ts` yeni bir
   yardımcıdır; tüm `docker compose exec psql` çağrıları burada toplandı.
   `E2E_ALLOW_SQL=1` verilmedikçe hiçbir sorgu çalışmaz. Kapalıyken `afterAll`
   hangi sentetik hesabın kaldığını ve temizleme komutunu uyarı olarak basar.
   Hedef komut, açıldığında koşu başında yazdırılır.
3. **Canlı site ayarı artık değiştirilmiyor.** `admin.spec.ts` içindeki
   `contact.email` değişikliği ayrı bir teste ayrıldı, `test.skip` ile
   varsayılan olarak atlanıyor (`E2E_ALLOW_SETTING_MUTATION=1` gerekir) ve
   ayar `try/finally` ile **testin içinde** geri alınıyor — koşu sonuna
   bırakılmıyor.
4. **`webServer` eklendi.** `playwright.config.ts` içinde olmadığı için
   Playwright uygulamayı kendisi başlatmıyordu ve `errors.spec.ts`
   `net::ERR_CONNECTION_REFUSED at http://localhost:3001/duyurular` ile
   düşüyordu. Artık `command: npm run start:local`, `url: http://localhost:3001`,
   `reuseExistingServer: !process.env.CI`. Bu **yalnızca frontend** sorununu
   çözer; `integration.spec.ts`, `admin.spec.ts` ve `team-board.spec.ts`
   gerçek backend ister ve `webServer` onu sağlamaz.

### Gerçek koşuda bulunan ve düzeltilen iki gerçek hata (2026-10-03)

Bu iki hata yalnızca testler gerçek backend'e bağlandığında ortaya çıktı; ikisi de
testin kendisi değil, **uygulama/test altyapısı** hatasıydı.

1. **`Modal` odağı geri vermiyordu (erişilebilirlik hatası).**
   `Modal`, `onCancel` (Escape) ve backdrop tıklamasında `dialog.close()` çağırmadan
   doğrudan `onClose()` çağırıyordu; React bileşeni unmount edip `<dialog>` düğümünü
   DOM'dan söktüğü için tarayıcının odak geri verme mekanizması hiç çalışmıyordu.
   Klavye kullanıcısı Escape'ten sonra odaksız bir sayfada kalıyordu.
   Düzeltme: `shared.tsx` `Modal` useEffect cleanup'ında `dialog.close()` ve
   `showModal()` öncesi kaydedilen tetikleyici öğeye `focus()`.
   Doğrulama: `errors.spec.ts` test 11 (önce FAIL, düzeltmeden sonra PASS).
2. **Yanlış satıra işlem uygulanıyordu (test altyapısı hatası).**
   `admin.spec.ts` arama kutusunu doldurup hemen `.first()` ile "İncele →"
   tıklıyordu. Arama debounce'lu olduğu için filtre uygulanmadan tıklandığında
   **diğer sentetik hesabın** satırı açılıyordu. İki hesap da aynı motivasyon
   metnini taşıdığı için `dialog` içerik kontrolü bunu yakalamıyor, test sessizce
   yanlış kaydı reddedip onaylıyordu.
   Düzeltme: tüm liste işlemleri `page.getByRole("row").filter({ hasText: <e-posta> })`
   ile satıra bağlandı, `toHaveCount(1)` ile bekleniyor ve dialog'da e-posta
   doğrulanıyor. `integration.spec.ts` kesinti testindeki ana sayfa SSR iddiası da
   kaldırıldı (SSR fetch `page.route` ile yakalanmıyor); aynı senaryo artık
   `/duyurular` üzerinden doğrulanıyor.

### Ortak yardımcıların benimsenmesi (2026-10-03)

`useOperation` ve `FieldErrors` daha önce yardımcı olarak yazılmış ama hiçbir ekran
kullanmıyordu; her ekran kendi `notice` durumunu ve kendi hata `<ul>` listesini
tutuyordu. Bu turda beş ekran gerçek bildirim akışına bağlandı:

| Ekran | `useOperation` kullanımı |
| --- | --- |
| `dashboard.tsx` (`Account`) | Şifre güncelleme başarısı — `operation.clear()` + `setNotice("Şifren güncellendi.")` |
| `resources.tsx` | "Kayıt silindi." / "Değişiklikler kaydedildi." + yeni kayıt açılırken `clear()` |
| `people.tsx` (`People`) | "Başvuru kararı kaydedildi." / "Mesaj güncellendi." + satır açılırken `clear()` |
| `people.tsx` (`UserEditor`) | "Roller güncellendi." / "Hesap durumu güncellendi." |
| `resource-editor.tsx` | "Görsel yüklendi." (daha önce hiçbir geri bildirim yoktu) |

`<FieldErrors error={error} />` ile değiştirilen kopyalanmış listeler:
`auth-form.tsx` (giriş + üyelik başvurusu) ve `contact-form.tsx`.
Artık hiçbir yerde `error.fieldErrors.map(...)` ile elle `<ul>` çizilmiyor.

Doğrulama: `npm run typecheck` exit 0 · `npm run build` exit 0 ·
22/22 Playwright testi PASS (`errors.spec.ts` 11, `admin.spec.ts` 5,
`integration.spec.ts` 6). `errors.spec.ts` test 5 alan hatası listesinin
`contact-form` üzerinde hâlâ göründüğünü, test 9 ise `role="status"` işlem
bildirimini doğruluyor.

## Blokajlar

1. **`npm run lint` çalışmıyor.** `package.json` hâlâ `next lint` çağırıyor;
   komut Next.js 16'da kaldırıldı. Hata: `Invalid project directory provided,
   no such directory: ...\lint`. Doğrulama için ESLint + `eslint-config-next`
   kurulup `eslint .` script'i kullanılmalı. **Bu, değişikliklerden önce
   mevcut olan bir sorundur.**
2. `npm ci` uyarısındaki yüksek riskli bağımlılık incelenmedi.
3. **`components/dialog.tsx` ikinci bir modal uygulaması.** `shared.tsx` içindeki
   `Modal` bu turda düzeltildi (odak geri dönüşü), ancak `dialog.tsx` hâlâ ayrı
   bir uygulama olarak duruyor ve iki yaklaşımın tekilleştirilmesi gerekiyor.
4. **Arka plan fetch'inde istek iptali koruması yok.** `app/page.tsx` /
   `app/duyurular/page.tsx` SSR fetch'leri `AbortController` kullanmıyor;
   bu yüzden "eski cevap listeyi ezmez" garantisi yalnızca istemci listelerinde
   geçerli. Kapsam dışı bırakıldı, dokümana yazıldı.

### Çözülen blokajlar

| Önceki blokaj | Durum |
| --- | --- |
| "Gerçek backend testleri çalıştırılamadı" | **Çözüldü** — backend `C:\yazilim_atolyesi_websitesi-main` altında bulundu ve 8080'de açıldı. 22/22 geçti. |
| "Yönetim 401/403 ekranı tarayıcıda doğrulanmadı" | **Çözüldü** — `errors.spec.ts` test 7 ve 8 |
| "`Modal` odağı geri vermiyor" | **Çözüldü** — `shared.tsx` cleanup + test 11 |
| "`useOperation` ölü kod" | **Çözüldü** — 5 ekranda gerçek akışa bağlandı |
| "Alan hatası listesi kopyalanmış" | **Çözüldü** — `auth-form` ve `contact-form` ortak `FieldErrors` kullanıyor |
| "Sabit bekleme süreleri" (D6 FAIL) | **Kısmen çözüldü** — yalnızca debounce gözlemi için gerekli `waitForTimeout` kaldı |

## Dikkat Edilmesi Gerekenler

- `tests/e2e/integration.spec.ts` içindeki `docker compose stop backend`
  çağrısı **kaldırıldı**; kesinti artık tarayıcıda taklit ediliyor. Artık
  günlük backend'i düşüren hiçbir test yok.
- Ham SQL ve canlı ayar değişikliği **varsayılan olarak kapalıdır**. Ham SQL
  kapalıyken sentetik test hesapları temizlenemez; `afterAll` hangilerinin
  kaldığını uyarı olarak bildirir.
- Mevcut `tests/e2e/admin.spec.ts`, şifre değişiminden sonra otomatik
  çıkış bekliyordu. Ürün kararı gereği çıkış artık **isteğe bağlı** bir
  butona çevrildi (`Bu tarayıcıdan çıkış yap`); mevcut test sözleşmesi
  korunarak geçiyor.
- `.gitattributes` ile satır sonları LF'a sabitlendi. `core.autocrlf=true`
  olduğu için bu olmadan dosyalar sürekli "değişmiş" görünüyordu.

## Yarım Kalan / Sonraki Adımlar

Bu turda istenen pürüzler kapandı; aşağıdakiler **kapsam dışı bırakılan** ve
bilinçli olarak dokümana yazılan maddelerdir (blokaj değil, bilinen sınır):

- `useUnsavedChanges` `ResourceEditor` ve `team-board.tsx` tarafından kullanılıyor;
  `team-board.tsx` kendi `beforeunload` korumasını da içeriyor, ortak yardımcıya
  taşınabilir. Uygulama içi yönlendirme (route change) koruması hiçbir yerde yok —
  bu, `useUnsavedChanges` dokümantasyonunda açıkça kapsam dışı olarak yazılı.
- `FieldErrors` ilk hatalı alana odak taşımıyor (yalnızca listeler).
- `Modal` için `showModal()` çağrısı `dialog.open` kontrolüyle korundu
  (StrictMode etkiyi iki kez çalıştırıp `InvalidStateError` fırlatıyordu).
  Odak geri dönüşü de eklendi; ancak bileşen zaten modal olan bir `<dialog>`'ın
  içinde ikinci bir `<dialog>` açma senaryosu hâlâ bir risk olarak duruyor.
- `components/auth-form.tsx` ve `components/contact-form.tsx` artık
  `./admin/shared` içinden `FieldErrors` import ediyor. Bu, public sayfaların
  paketine `admin/dashboard.module.css` dosyasını da dahil ediyor. `.fieldErrors`
  sınıfı yalnızca `margin` / `padding-left` / `font-size: 12px` tanımladığı için
  `.form-error` kutusu içinde görsel olarak bozulma yok (renk miras alınır), ama
  paket boyutu açısından bilinçli bir takas yapıldı: mantık tek yerde, stil
  yalnızca boşluk. Tamamen ayırmak istenirse `FieldErrors` ortak bir
  `components/field-errors.tsx` dosyasına taşınmalı.
- `tsconfig.json` hâlâ `"target": "es5"`. Bu bir hata değil — typecheck ve
  build geçiyor — ama kullanılan ES2022+ API'leriyle (`AbortSignal.timeout`,
  `Array.prototype.at`) çelişiyor.
- **Backend kaynağına dokunulmadı.** `C:\yazilim_atolyesi_websitesi-main`
  altında hiçbir dosya düzenlenmedi; yalnızca `docker compose up -d postgres`
  ve `.\mvnw.cmd spring-boot:run` ile çalıştırıldı. Bu klasör bir Git deposu
  **değil** (`.git` yok), dolayısıyla `git status` ile "temiz" denetimi
  yapılamaz; kanıt, yapılan işlemlerin dökümüdür (yalnızca `up`/`run`).
- **Sentetik veri temizlendi.** `app_users`, `contact_messages` ve
  `announcements` tablolarında `dashboard-%` / `integration-%` / `e2e-%`
  kalıntısı yok (sorguyla doğrulandı, sonuç `0`).

## Nasıl Çalıştırılır

```bash
# 1) Backend (ayrı terminal) — kaynak kod değiştirilmez
cd C:\yazilim_atolyesi_websitesi-main
docker compose up -d postgres
.\mvnw.cmd spring-boot:run          # Java 21 gerekir, 8080'de ayağa kalkar

# 2) Frontend doğrulama
npm ci
npm run typecheck
npm run build

# 3) Testler (sırayla çalıştırın; iki webServer çakışırsa EADDRINUSE olur)
set E2E_ALLOW_SQL=1
npx playwright test errors.spec.ts
npx playwright test admin.spec.ts
npx playwright test integration.spec.ts
```

`webServer` Playwright'ı `npm run start:local` ile 3001 portunda kendisi başlatır
(`reuseExistingServer: !process.env.CI`). Frontend `webServer` ile kalkar ama
**backend `webServer` ile kalkmaz**; 8080'de Spring + PostgreSQL ayrıca
başlatılmalıdır.

### İsteğe bağlı ortam değişkenleri (varsayılan: KAPALI)

| Değişken | Etki |
| --- | --- |
| `E2E_ALLOW_SQL=1` | `docker exec <postgres> psql` ile ham SQL çalışır (sentetik hesap temizliği). Veritabanının silinebilir olduğundan emin olmadan açmayın. |
| `E2E_COMPOSE_PROJECT=<proje>` | SQL'yi yalnızca bu tek kullanımlık compose projesine yönlendirir. Verilmezse çalışan postgres konteyneri `com.docker.compose.service=postgres` etiketinden bulunur (proje adı `up` anındaki dizin adına göre değiştiği için). |
| `E2E_ALLOW_SETTING_MUTATION=1` | `contact.email` ayarını geçici değiştiren testi çalıştırır. Test, ayarı `try/finally` ile geri alır. |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Gerçek API testlerinde kullanılan yönetici hesabı. |
