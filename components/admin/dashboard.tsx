"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { request } from "../../lib/api";
import type { ContentRecord, MemberRecord, MessageRecord, PageResult, Profile } from "../../lib/admin-types";
import { Resources } from "./resources";
import { People } from "./people";
import { TeamBoard } from "./team-board";
import { Badge, date, ErrorNotice, names, useMutation, useOperation } from "./shared";
import s from "./dashboard.module.css";

const navigation = [
  { key: "overview", label: "Genel bakış", icon: "◫", description: "Kulübün gündemi, tek bir yerde." },
  { key: "teams", label: "Ekip görevleri", icon: "▦", description: "Ekipleri ayır, işleri paylaş ve birlikte ilerle." },
  { key: "members", label: "Üyelik başvuruları", icon: "♧", description: "Yeni üyeleri tanı, başvuruları değerlendir." },
  { key: "announcements", label: "Duyurular", icon: "⚑", description: "Kulübün haberlerini ve etkinliklerini paylaş." },
  { key: "contact-messages", label: "Gelen mesajlar", icon: "✉", description: "Soruları, fikirleri ve iş birliği taleplerini takip et." },
  { key: "contents", label: "Sayfa içerikleri", icon: "▤", description: "Sitenin metinlerini, görsellerini ve vitrinini düzenle." },
  { key: "settings", label: "Site ayarları", icon: "⚙", description: "İletişim bilgileri, sosyal bağlantılar ve başvuru metinleri." },
  { key: "users", label: "Kullanıcılar", icon: "♙", description: "Hesapların rollerini ve erişim durumlarını yönet." },
  { key: "account", label: "Hesap güvenliği", icon: "◇", description: "Yönetim hesabının şifresini güncelle." },
] as const;
type Tab = typeof navigation[number]["key"];

export function Dashboard({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<Tab>("overview");
  const router = useRouter();
  const logout = useMutation();
  const admin = profile.roles.includes("ADMIN");
  useEffect(() => {
    if (admin && window.location.hash === "#ekip-gorevleri") setTab("teams");
  }, [admin]);
  const current = navigation.find(n => n.key === tab)!;
  return <div className={s.shell}>
    <aside className={s.sidebar}>
      <a className={s.brand} href="/"><img src="/club-logo.png" width={42} height={42} alt="" /><span>Yazılım Atölyesi<small>YÖNETİM ALANI</small></span></a>
      <p className={s.navLabel}>ÇALIŞMA ALANI</p>
      <nav aria-label="Yönetim menüsü">{navigation.filter(n => admin || !["members", "users", "teams"].includes(n.key)).map(n => <button key={n.key} className={tab === n.key ? s.selected : ""} aria-current={tab === n.key ? "page" : undefined} onClick={() => { setTab(n.key); window.history.replaceState(null, "", n.key === "teams" ? "#ekip-gorevleri" : window.location.pathname); }}><span aria-hidden="true">{n.icon}</span>{n.label}{tab === n.key && <i aria-hidden="true" />}</button>)}</nav>
      <div className={s.sidebarBottom}><a href="/">↗ Siteyi görüntüle</a><div className={s.identity}><span className={s.avatar}>{profile.personal?.firstName?.[0] || "Y"}</span><div><strong>{profile.personal?.firstName || "Yönetici"}</strong><small>{admin ? "Yönetici" : "Editör"}</small></div><button title="Çıkış yap" aria-label="Çıkış yap" disabled={logout.busy} onClick={() => { void logout.run(async () => { await request("auth/logout", { method: "POST" }); router.replace("/giris-yap"); router.refresh(); }); }}>↪</button></div></div>
    </aside>
    <main id="main-content" className={s.main}>
      <div className={s.topbar}><span>Çalışma alanı <span aria-hidden="true">/</span> <strong>{current.label}</strong></span><span className={s.workspaceBadge}>Yazılım Atölyesi</span></div>
      <header className={s.pageHeading}><div><p className={s.eyebrow}>{tab === "overview" ? "HER ŞEY KONTROLÜNDE" : "KULÜP YÖNETİMİ"}</p><h1>{current.label}</h1><p>{current.description}</p></div><a className={s.secondary} href="/">Siteyi aç ↗</a></header>
      <ErrorNotice error={logout.error} />
      <section key={tab} aria-label={current.label}>
        {tab === "overview" && <Overview admin={admin} name={profile.personal?.firstName || ""} navigate={setTab} />}
        {(tab === "announcements" || tab === "contents" || tab === "settings") && <Resources kind={tab} />}
        {(tab === "members" || tab === "users" || tab === "contact-messages") && <People kind={tab} profile={profile} />}
        {tab === "account" && <Account />}
        {tab === "teams" && admin && <TeamBoard userId={profile.userId} />}
      </section>
      <footer className={s.footer}>Yazılım Atölyesi <span>Birlikte üretmek için.</span></footer>
    </main>
  </div>;
}

function Overview({ admin, name, navigate }: { admin: boolean; name: string; navigate: (tab: Tab) => void }) {
  const [data, setData] = useState<{ pending: PageResult<MemberRecord> | null; messages: PageResult<MessageRecord>; published: number; count: number } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setError(null);
    Promise.all([
      admin ? request<PageResult<MemberRecord>>("admin/members?membershipStatus=PENDING&size=5") : Promise.resolve(null),
      request<PageResult<MessageRecord>>("admin/contact-messages?status=NEW&size=5&sort=createdAt,desc"),
      request<PageResult<unknown>>("admin/announcements?status=PUBLISHED&size=1"),
      admin ? request<PageResult<unknown>>("admin/users?size=1").then(r => r.totalElements) : request<ContentRecord[]>("admin/contents").then(r => r.length),
    ]).then(([pending, messages, news, count]) => { if (active) setData({ pending, messages, published: news.totalElements, count }); }).catch(e => { if (active) setError(e); });
    return () => { active = false; };
  }, [admin, revision]);
  return <><div className={s.welcome}><div><span className={s.eyebrow}>MERHABA, {name.toLocaleUpperCase("tr-TR")}</span><h2>Birlikte büyüyen bir topluluk.</h2><p>Yeni başvuruları karşıla, duyurularını paylaş ve kulübün gündemini güncel tut.</p><button onClick={() => navigate("announcements")}>Duyuruları yönet <span aria-hidden="true">↗</span></button></div><div className={s.welcomeArt} aria-hidden="true"><span>&lt;/&gt;</span></div></div>
    {error ? <><ErrorNotice error={error} /><button className={s.secondary} onClick={() => setRevision(r => r + 1)}>Tekrar dene</button></> : <>
      <div className={s.stats}>
        {[
          ...(admin ? [{ title: "Bekleyen başvuru", value: data?.pending?.totalElements, tab: "members" as Tab, icon: "♧" }] : []),
          { title: "Yeni mesaj", value: data?.messages.totalElements, tab: "contact-messages" as Tab, icon: "✉" },
          { title: "Yayın durumundaki duyuru", value: data?.published, tab: "announcements" as Tab, icon: "⚑" },
          { title: admin ? "Toplam kullanıcı" : "İçerik bloğu", value: data?.count, tab: (admin ? "users" : "contents") as Tab, icon: "◫" },
        ].map(item => <button key={item.tab} onClick={() => navigate(item.tab)} className={s.stat}><span className={s.statIcon} aria-hidden="true">{item.icon}</span><span>{item.title}</span><strong>{item.value ?? "—"}</strong><small>Kayıtları görüntüle ↗</small></button>)}
      </div>
      {!data ? <p className={s.empty} role="status">Güncel bilgiler yükleniyor…</p> : <div className={s.overviewGrid}>
        {admin && <div className={s.card}><div className={s.cardHeading}><h2>Yeni başvurular</h2><button onClick={() => navigate("members")}>Tümünü gör →</button></div>{data.pending?.content.length ? data.pending.content.map(member => <button className={s.activity} key={member.userId} onClick={() => navigate("members")}><span className={s.avatar}>{member.firstName[0]}</span><span><strong>{member.firstName} {member.lastName}</strong><small>{member.institutionName || member.email}</small></span><Badge value="PENDING" /></button>) : <div className={s.empty}><h3>Başvurular güncel</h3><p>Değerlendirme bekleyen bir başvuru yok.</p></div>}</div>}
        <div className={s.card}><div className={s.cardHeading}><h2>Gelen kutusu</h2><button onClick={() => navigate("contact-messages")}>Tümünü gör →</button></div>{data.messages.content.length ? data.messages.content.map(message => <button className={s.activity} key={message.id} onClick={() => navigate("contact-messages")}><span className={s.mailIcon}>✉</span><span><strong>{message.subject}</strong><small>{message.name} · {date(message.createdAt)}</small></span><span className={s.dot} /></button>) : <div className={s.empty}><h3>Gelen kutun sakin</h3><p>Yeni mesajlar burada görünecek.</p></div>}</div>
      </div>}
    </>}
    <div className={s.quickLinks}><button onClick={() => navigate("contents")}><span>▤</span><div><strong>Siteni güncel tut</strong><small>Sayfa metinlerini ve görsellerini düzenle</small></div>↗</button><button onClick={() => navigate("settings")}><span>⚙</span><div><strong>Bağlantılarını tamamla</strong><small>İletişim ve sosyal medya ayarlarına git</small></div>↗</button></div>
  </>;
}

function Account() {
  const action = useMutation();
  const end = useMutation();
  const operation = useOperation();
  const router = useRouter();
  return <div className={s.card}><form className={s.form} onSubmit={e => {
    e.preventDefault(); const form = e.currentTarget; const fields = new FormData(form);
    operation.clear();
    void action.run(async () => {
      if (fields.get("newPassword") !== fields.get("confirmation")) throw new Error("Yeni şifreler eşleşmiyor.");
      await request("users/me/password", { method: "PATCH", body: JSON.stringify({ currentPassword: fields.get("currentPassword"), newPassword: fields.get("newPassword") }) });
      form.reset(); operation.setNotice("Şifren güncellendi.");
    });
  }}><h2>Şifreni değiştir</h2><ErrorNotice error={action.error} /><ErrorNotice error={end.error} />{operation.notice && <>{operation.node}
    <p className={s.hint}>Şifre değişince hesabın bu backend'de geçersiz kılınmaz; bu yüzden çıkış yapmayı sen seçersin. Diğer cihazlardaki oturumlar yeni şifreyle açılmaya devam eder.</p>
    <button type="button" className={s.secondary} disabled={end.busy} onClick={() => { void end.run(async () => { await request("auth/logout", { method: "POST" }); router.replace("/giris-yap"); router.refresh(); }); }}>{end.busy ? "Çıkılıyor…" : "Bu tarayıcıdan çıkış yap"}</button></>}<fieldset disabled={action.busy}>
    <label>Mevcut şifre<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
    <label>Yeni şifre<input aria-label="Yeni şifre" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+" required /><small>8–72 karakter; büyük harf, küçük harf ve rakam.</small></label>
    <label>Yeni şifre tekrar<input name="confirmation" type="password" autoComplete="new-password" required /></label>
    </fieldset><footer className={s.formActions}><button className={s.primary} disabled={action.busy}>{action.busy ? "Güncelleniyor…" : "Şifreyi güncelle"}</button></footer></form></div>;
}
