"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ApiError, request } from "../lib/api";
import { FieldErrors } from "./admin/shared";
import { useRouter } from "next/navigation";

type Options = {
  interestAreas: { id: string; code: string; name: string }[];
  educationStatuses: string[];
  degreeLevels: string[];
  classLevels: string[];
  experienceLevels: string[];
};
type Setting = { key: string; value: string };
type Profile = {
  roles?: string[];
  email?: string;
  user?: { firstName: string; email: string };
  personal?: { firstName: string };
  membership?: { status: "PENDING" | "APPROVED" | "REJECTED" };
};
const labels: Record<string, string> = {
  ACTIVE_STUDENT: "Aktif öğrenci",
  GRADUATE: "Mezun",
  PROSPECTIVE_STUDENT: "Öğrenci adayı",
  ACADEMIC_STAFF: "Akademik personel",
  OTHER: "Diğer",
  HIGH_SCHOOL: "Lise",
  ASSOCIATE: "Ön lisans",
  BACHELOR: "Lisans",
  MASTER: "Yüksek lisans",
  DOCTORATE: "Doktora",
  PREPARATORY: "Hazırlık",
  YEAR_1: "1. sınıf",
  YEAR_2: "2. sınıf",
  YEAR_3: "3. sınıf",
  YEAR_4: "4. sınıf",
  YEAR_5: "5. sınıf",
  YEAR_6: "6. sınıf",
  BEGINNER: "Başlangıç",
  INTERMEDIATE: "Orta",
  ADVANCED: "İleri",
};
const optionElements = (values: string[]) =>
  values.map((value) => (
    <option value={value} key={value}>
      {labels[value] || value}
    </option>
  ));

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const register = mode === "register";
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(register);
  const [loadError, setLoadError] = useState("");
  const [educationStatus, setEducationStatus] = useState("ACTIVE_STUDENT");
  const [interests, setInterests] = useState<string[]>([]);
  const [session, setSession] = useState<Profile | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLDivElement>(null);
  const stepTitle = useRef<HTMLHeadingElement>(null);

  async function loadOptions() {
    setLoading(true);
    setLoadError("");
    try {
      const [opts, legal] = await Promise.all([
        request<Options>("membership/options"),
        request<Setting[]>("settings/public?prefix=legal."),
      ]);
      const texts = Object.fromEntries(
        legal.map((item) => [item.key, item.value]),
      );
      if (!texts["legal.kvkk.notice"] || !texts["legal.kvkk.version"])
        throw new Error("Başvuru metinleri henüz hazır değil.");
      setOptions(opts);
      setSettings(texts);
      const chosen = new URLSearchParams(window.location.search)
        .get("interest")
        ?.toLocaleLowerCase("tr-TR");
      const match = opts.interestAreas.find(
        (i) =>
          i.name.toLocaleLowerCase("tr-TR") === chosen ||
          i.code.toLocaleLowerCase("tr-TR") === chosen ||
          (chosen === "ui / ux" && /ui.?ux/i.test(i.code)),
      );
      if (match)
        setInterests((previous) => (previous.length ? previous : [match.id]));
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Başvuru seçenekleri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (register) {
      void loadOptions();
      return;
    }
    request<Profile>("users/me")
      .then((profile) => {
        setSession(profile);
        if (profile.roles?.some(role => role === "ADMIN" || role === "EDITOR")) router.replace("/yonetim");
      })
      .catch(() => {
        /* No existing session: show login. */
      });
    // Form mode is fixed by its route; option loading is retried explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register]);

  function changeStep(next: number) {
    setStep(next);
    setError(null);
    setTimeout(() => stepTitle.current?.focus(), 0);
  }
  function validate(index: number) {
    const inputs = form.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      `[data-step="${index}"] input, [data-step="${index}"] select, [data-step="${index}"] textarea`,
    );
    if (!inputs) return true;
    for (const input of Array.from(inputs)) {
      if (input.required && !input.value.trim() && input.type !== "checkbox")
        input.setCustomValidity("Bu alanı doldur.");
      else input.setCustomValidity("");
      if (!input.checkValidity()) {
        setStep(index);
        setTimeout(() => {
          const details = input.closest("details");
          if (details) details.open = true;
          input.focus();
          input.reportValidity();
        }, 0);
        return false;
      }
    }
    return true;
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (register && step < 2) {
      if (validate(step)) changeStep(step + 1);
      return;
    }
    if (register) {
      for (let i = 0; i < 3; i++) if (!validate(i)) return;
    } else if (!e.currentTarget.reportValidity()) return;
    if (
      register &&
      (!options || !settings["legal.kvkk.version"] || !interests.length)
    ) {
      setError(
        new ApiError(
          "Başvuru seçeneklerini yükle ve en az bir ilgi alanı seç.",
        ),
      );
      return;
    }
    const data = new FormData(e.currentTarget);
    const value = (key: string) => String(data.get(key) || "");
    const optional = (key: string) => value(key).trim() || null;
    setBusy(true);
    setError(null);
    try {
      if (register) {
        const payload = {
          account: {
            email: value("account.email"),
            password: value("account.password"),
          },
          personal: {
            firstName: value("personal.firstName"),
            lastName: value("personal.lastName"),
            phone: value("personal.phone"),
            birthDate: optional("personal.birthDate"),
            city: optional("personal.city"),
            biography: optional("personal.biography"),
            githubUrl: optional("personal.githubUrl"),
            linkedinUrl: optional("personal.linkedinUrl"),
            portfolioUrl: optional("personal.portfolioUrl"),
          },
          education: {
            institutionName: value("education.institutionName"),
            faculty: value("education.faculty"),
            department: value("education.department"),
            educationStatus,
            degreeLevel: value("education.degreeLevel"),
            classLevel: optional("education.classLevel"),
            schoolEmail: optional("education.schoolEmail"),
            studentNumber: optional("education.studentNumber"),
            expectedGraduationYear: optional("education.expectedGraduationYear")
              ? Number(value("education.expectedGraduationYear"))
              : null,
            campus: optional("education.campus"),
          },
          membership: {
            motivation: value("membership.motivation"),
            experienceLevel: value("membership.experienceLevel"),
            volunteerForEvents: data.has("membership.volunteerForEvents"),
            interestIds: interests,
          },
          declarations: {
            privacyNoticeVersion: settings["legal.kvkk.version"],
            privacyNoticeRead: data.has("declarations.privacyNoticeRead"),
            marketingConsent: data.has("declarations.marketingConsent"),
          },
        };
        await request("auth/register", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setDone(
          "Başvurun alındı. Üyeliğin yönetici değerlendirmesini bekliyor. Hesabına giriş yapabilirsin.",
        );
        form.current?.reset();
      } else {
        const result = await request<{
          user: { firstName: string; email: string };
        }>("auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: value("email"),
            password: value("password"),
          }),
        });
        const profile = await request<Profile>("users/me");
        setSession({ ...profile, user: result.user });
        if (profile.roles?.some(role => role === "ADMIN" || role === "EDITOR")) router.replace("/yonetim");
        setDone("Giriş başarılı.");
        form.current?.reset();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError("İşlem tamamlanamadı."),
      );
    } finally {
      setBusy(false);
      setTimeout(() => status.current?.focus(), 0);
    }
  }
  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await request("auth/logout", { method: "POST" });
      setSession(null);
      setDone(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError("Çıkış yapılamadı."),
      );
    } finally {
      setBusy(false);
    }
  }
  const password = (name: string) => (
    <label>
      Şifre
      <div className="password-control">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 8 : undefined}
          maxLength={72}
          pattern={register ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+" : undefined}
          title={
            register
              ? "8–72 karakter; büyük harf, küçük harf ve rakam."
              : undefined
          }
          aria-describedby="password-help"
        />
        <button
          type="button"
          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Gizle" : "Göster"}
        </button>
      </div>
      <small id="password-help">
        {register
          ? "8–72 karakter; büyük harf, küçük harf ve rakam içermelidir."
          : "Hesabının şifresini gir."}
      </small>
    </label>
  );
  return (
    <div className="auth-panel">
      <div ref={status} tabIndex={-1} role={error ? "alert" : "status"}>
        {error && (
          <div className="form-error">
            <p>{error.message}</p>
            <FieldErrors error={error} />
          </div>
        )}
        {done && (
          <div className="form-success">
            <h3>{register ? "Başvurun alındı." : "Tekrar hoş geldin."}</h3>
            <p>{done}</p>
            {register && (
              <a className="club-button" href="/giris-yap">
                Giriş Yap
              </a>
            )}
          </div>
        )}
      </div>
      {session && !register ? (
        <div className="session-panel">
          <h2>Oturumun açık.</h2>
          <p>
            {session.user?.firstName || session.personal?.firstName}{" "}
            {session.user?.email || session.email}
          </p>
          {session.membership && (
            <p>
              Üyelik durumu: {{ PENDING: "Onay bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi" }[session.membership.status]}
            </p>
          )}
          <p className="registration-hint">
            Kulüp duyurularını ve takım alanını ana sayfadan takip edebilirsin.
          </p>
          <div className="form-actions">
            <a href="/" className="club-button">
              Ana sayfaya dön
            </a>
            <button
              type="button"
              className="club-button button-outline"
              disabled={busy}
              onClick={logout}
            >
              {busy ? "Çıkılıyor…" : "Çıkış yap"}
            </button>
          </div>
        </div>
      ) : (
        !done && (
          <form
            className="club-form"
            ref={form}
            onSubmit={submit}
            noValidate={register}
            aria-busy={busy}
            onInput={(e) => {
              if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
              )
                e.target.setCustomValidity("");
            }}
          >
            {register ? (
              <>
                <ol className="form-stepper" aria-label="Başvuru adımları">
                  {["Hesap & Kişisel", "Eğitim", "Üyelik"].map((label, i) => (
                    <li
                      key={label}
                      aria-current={step === i ? "step" : undefined}
                    >
                      {i + 1}. {label}
                    </li>
                  ))}
                </ol>
                <h2 className="step-title" ref={stepTitle} tabIndex={-1}>
                  {
                    [
                      "Seni tanıyalım.",
                      "Eğitim bilgilerin.",
                      "Birlikte üretmeye başlayalım.",
                    ][step]
                  }
                </h2>
                <fieldset data-step="0" hidden={step !== 0}>
                  <legend className="sr-only">Hesap ve kişisel bilgiler</legend>
                  <div className="form-row">
                    <label>
                      Ad
                      <input
                        name="personal.firstName"
                        autoComplete="given-name"
                        required
                        maxLength={80}
                      />
                    </label>
                    <label>
                      Soyad
                      <input
                        name="personal.lastName"
                        autoComplete="family-name"
                        required
                        maxLength={80}
                      />
                    </label>
                  </div>
                  <label>
                    E-posta
                    <input
                      name="account.email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={190}
                      placeholder="ornek@mail.com"
                    />
                  </label>
                  {password("account.password")}
                  <label>
                    Telefon
                    <input
                      name="personal.phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      maxLength={30}
                      pattern={String.raw`[+]?[0-9 \(\)\-]{7,30}`}
                      placeholder="+90 5xx xxx xx xx"
                    />
                  </label>
                  <details>
                    <summary>Diğer kişisel bilgiler (isteğe bağlı)</summary>
                    <div className="form-row">
                      <label>
                        Doğum tarihi
                        <input name="personal.birthDate" type="date" />
                      </label>
                      <label>
                        Şehir
                        <input
                          name="personal.city"
                          autoComplete="address-level2"
                          maxLength={100}
                        />
                      </label>
                    </div>
                    <label>
                      Kısa biyografi
                      <textarea
                        name="personal.biography"
                        maxLength={1000}
                        rows={3}
                      />
                    </label>
                    <label>
                      GitHub
                      <input
                        name="personal.githubUrl"
                        type="url"
                        placeholder="https://github.com/"
                        maxLength={1000}
                      />
                    </label>
                    <label>
                      LinkedIn
                      <input
                        name="personal.linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/"
                        maxLength={1000}
                      />
                    </label>
                    <label>
                      Portfolyo
                      <input
                        name="personal.portfolioUrl"
                        type="url"
                        placeholder="https://"
                        maxLength={1000}
                      />
                    </label>
                  </details>
                </fieldset>
                <fieldset data-step="1" hidden={step !== 1}>
                  <legend className="sr-only">Eğitim bilgileri</legend>
                  <label>
                    Okul / kurum adı
                    <input
                      name="education.institutionName"
                      required
                      maxLength={200}
                      autoComplete="organization"
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Fakülte
                      <input
                        name="education.faculty"
                        required
                        maxLength={160}
                      />
                    </label>
                    <label>
                      Bölüm
                      <input
                        name="education.department"
                        required
                        maxLength={160}
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Eğitim durumu
                      <select
                        name="education.educationStatus"
                        value={educationStatus}
                        onChange={(e) => setEducationStatus(e.target.value)}
                      >
                        {optionElements(
                          options?.educationStatuses || [
                            "ACTIVE_STUDENT",
                            "GRADUATE",
                            "PROSPECTIVE_STUDENT",
                            "ACADEMIC_STAFF",
                            "OTHER",
                          ],
                        )}
                      </select>
                    </label>
                    <label>
                      Öğrenim seviyesi
                      <select
                        name="education.degreeLevel"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Seçiniz
                        </option>
                        {optionElements(
                          options?.degreeLevels || [
                            "HIGH_SCHOOL",
                            "ASSOCIATE",
                            "BACHELOR",
                            "MASTER",
                            "DOCTORATE",
                            "OTHER",
                          ],
                        )}
                      </select>
                    </label>
                  </div>
                  <label>
                    Sınıf{" "}
                    {educationStatus !== "ACTIVE_STUDENT" && "(isteğe bağlı)"}
                    <select
                      name="education.classLevel"
                      required={educationStatus === "ACTIVE_STUDENT"}
                      defaultValue=""
                    >
                      <option value="">Seçiniz</option>
                      {optionElements(
                        options?.classLevels || [
                          "PREPARATORY",
                          "YEAR_1",
                          "YEAR_2",
                          "YEAR_3",
                          "YEAR_4",
                          "YEAR_5",
                          "YEAR_6",
                        ],
                      )}
                    </select>
                  </label>
                  <details>
                    <summary>Diğer eğitim bilgileri (isteğe bağlı)</summary>
                    <label>
                      Okul e-posta adresi
                      <input
                        name="education.schoolEmail"
                        type="email"
                        maxLength={190}
                      />
                    </label>
                    <label>
                      Öğrenci numarası
                      <input name="education.studentNumber" maxLength={80} />
                    </label>
                    <div className="form-row">
                      <label>
                        Beklenen mezuniyet yılı
                        <input
                          name="education.expectedGraduationYear"
                          type="number"
                          min={2000}
                          max={2200}
                        />
                      </label>
                      <label>
                        Kampüs
                        <input name="education.campus" maxLength={120} />
                      </label>
                    </div>
                  </details>
                </fieldset>
                <fieldset data-step="2" hidden={step !== 2}>
                  <legend className="sr-only">Üyelik bilgileri</legend>
                  <p className="registration-hint">
                    Başvurun değerlendirmeye alınır; üyelik yönetici onayından
                    sonra etkinleşir.
                  </p>
                  <label>
                    Neden katılmak istiyorsun?
                    <textarea
                      name="membership.motivation"
                      rows={4}
                      minLength={20}
                      maxLength={2000}
                      required
                      placeholder="İlgi alanlarından ve birlikte üretmek istediklerinden bahset."
                    />
                    <small>20–2000 karakter.</small>
                  </label>
                  <label>
                    Teknik deneyimin
                    <select
                      name="membership.experienceLevel"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Seçiniz
                      </option>
                      {optionElements(
                        options?.experienceLevels || [
                          "BEGINNER",
                          "INTERMEDIATE",
                          "ADVANCED",
                        ],
                      )}
                    </select>
                  </label>
                  {loading ? (
                    <p className="form-loading" role="status">
                      İlgi alanları ve başvuru metinleri yükleniyor…
                    </p>
                  ) : loadError ? (
                    <div className="form-error" role="alert">
                      <p>{loadError}</p>
                      <button
                        type="button"
                        className="text-button"
                        onClick={loadOptions}
                      >
                        Seçenekleri tekrar yükle
                      </button>
                    </div>
                  ) : (
                    <>
                      <fieldset>
                        <legend>İlgi alanların — en az birini seç</legend>
                        <div className="interest-options">
                          {options?.interestAreas.map((item) => (
                            <label className="check-label" key={item.id}>
                              <input
                                type="checkbox"
                                checked={interests.includes(item.id)}
                                onChange={(e) =>
                                  setInterests((prev) =>
                                    e.target.checked
                                      ? [...prev, item.id].slice(0, 10)
                                      : prev.filter((x) => x !== item.id),
                                  )
                                }
                              />
                              {item.name}
                            </label>
                          ))}
                        </div>
                        {options?.interestAreas.length === 0 && (
                          <p className="empty-state">
                            Şu anda başvuruya açık ilgi alanı bulunmuyor.
                          </p>
                        )}
                      </fieldset>
                      <div
                        className="legal-text"
                        tabIndex={0}
                        aria-label="KVKK aydınlatma metni"
                      >
                        {settings["legal.kvkk.notice"]}
                      </div>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          name="declarations.privacyNoticeRead"
                          required
                        />
                        KVKK aydınlatma metnini okudum.
                      </label>
                      {settings["legal.marketing.notice"] && (
                        <label className="check-label">
                          <input
                            type="checkbox"
                            name="declarations.marketingConsent"
                          />
                          {settings["legal.marketing.notice"]} (isteğe bağlı)
                        </label>
                      )}
                    </>
                  )}
                  <label className="check-label">
                    <input
                      type="checkbox"
                      name="membership.volunteerForEvents"
                    />
                    Etkinliklerde gönüllü olmak istiyorum. (isteğe bağlı)
                  </label>
                </fieldset>
                <div className="form-actions">
                  {step > 0 && (
                    <button
                      type="button"
                      className="club-button button-outline"
                      disabled={busy}
                      onClick={() => changeStep(step - 1)}
                    >
                      Geri
                    </button>
                  )}
                  <button
                    className="club-button"
                    type="submit"
                    disabled={
                      busy ||
                      (step === 2 &&
                        (loading ||
                          !!loadError ||
                          !options?.interestAreas.length))
                    }
                  >
                    {busy
                      ? "Başvurun gönderiliyor…"
                      : step < 2
                        ? "Devam et"
                        : "Üye kaydı oluştur"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <label>
                  E-posta
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={190}
                    placeholder="ornek@mail.com"
                  />
                </label>
                {password("password")}
                <button
                  className="club-button auth-submit"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Giriş yapılıyor…" : "Giriş yap"}
                </button>
              </>
            )}
          </form>
        )
      )}
    </div>
  );
}
