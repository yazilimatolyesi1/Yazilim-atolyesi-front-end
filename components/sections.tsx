import {
  club,
  pillars,
  teams,
  steps,
  rules,
  updates,
  type Announcement,
} from "../lib/content";
import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icon";
import { Dialog } from "./dialog";
import { ContactForm } from "./contact-form";
import type { ContentRecord } from "../lib/admin-types";
import { getPageContents, getPublicSettings } from "../lib/server-api";
import { PublicBlocks } from "./public-blocks";
import { mediaUrl, safeLink } from "../lib/media";

export function Pillars() {
  return (
    <section
      className="club-pillars page-width"
      aria-label="Kulübün sundukları"
    >
      {pillars.map((item) => (
        <article key={item.title}>
          <Icon name={item.icon} />
          <div>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
export function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <article className="announcement-card">
      {mediaUrl(item.coverImageUrl) && <img className="announcement-cover" src={mediaUrl(item.coverImageUrl)} alt={item.coverImageAltText || ""} loading="lazy" />}
      <div className="announcement-main">
        <div className="announcement-date">
          <strong>{item.day}</strong>
          <span>{item.month}</span>
        </div>
        <div>
          <h3>
            {item.slug ? (
              <Link href={`/duyurular/${encodeURIComponent(item.slug)}`} className="card-title-link">
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </h3>
          <p>{item.summary}</p>
        </div>
      </div>
      <div className="announcement-meta">
        <span>
          <Icon name="calendar" />
          {item.dateLabel}
        </span>
        <span className="category-label">{item.category}</span>
      </div>
    </article>
  );
}
export function Announcements({ items, live = true }: { items: Announcement[]; live?: boolean }) {
  return (
    <section id="duyurular" className="announcement-panel">
      <div className="panel-heading">
        <h2>
          <Icon name="flag" />
          Duyurular
        </h2>
        <a href="/duyurular">Tüm Duyurular</a>
      </div>
      <div className="announcement-grid">
        {items.map((item) => (
          <AnnouncementCard key={item.id} item={item} />
        ))}
      </div>
      {!live && (
        <p className="content-note" role="status">
          Duyurular şu anda yüklenemiyor. Lütfen daha sonra tekrar dene.
        </p>
      )}
      {live && !items.length && (
        <p className="empty-state">Henüz yayınlanmış duyuru bulunmuyor.</p>
      )}
    </section>
  );
}
export function About({ blocks }: { blocks?: ContentRecord[] | null }) {
  if (blocks?.length === 0) return null;
  if (blocks) return <section id="hakkimizda" className="about-panel"><PublicBlocks blocks={blocks} /></section>;
  return (
    <section id="hakkimizda" className="about-panel">
      <h2 className="panel-title">
        <Icon name="trophy" />
        Hakkımızda
      </h2>
      <p>{club.about}</p>
      <Dialog
        label="Devamını Oku"
        title="Merak edenler için bir çalışma alanı."
        className="club-button button-outline"
      >
        <p>{club.about}</p>
        <div className="about-values">
          <span>2010’dan beri</span>
          <span>Gönüllü topluluk</span>
          <span>Açık ve kapsayıcı</span>
        </div>
        <a className="club-button" href="/uye-kaydi">
          Kulübe Katıl
        </a>
      </Dialog>
    </section>
  );
}
export function Join() {
  return (
    <aside className="join-panel">
      <h2>Aramıza Katıl!</h2>
      <p>
        Yeni arkadaşlıklar kur, yeteneklerini keşfet ve birlikte daha fazlasını
        başaralım.
      </p>
      <a href="/uye-kaydi" className="club-button button-light">
        <Icon name="user" />
        Üye Kaydı Yap
      </a>
      <div className="community-label">
        <span aria-hidden="true">● ● ● ●</span> Gönüllü topluluk
      </div>
    </aside>
  );
}
export function Team() {
  return (
    <section id="takim" className="team-section lower-width">
      <h2>Takım Alanı</h2>
      <p className="section-intro">
        Birlikte üretmek, paylaşmak ve projeyi adım adım geliştirmek için.
      </p>
      <div className="team-grid">
        {teams.map((t) => (
          <a
            className="team-card"
            key={t.title}
            href={`/uye-kaydi?interest=${encodeURIComponent(t.title)}`}
            aria-label={`${t.title} — İlgi alanını seç ve kulübe katıl`}
          >
            <h3>{t.title}</h3>
            <p>{t.text}</p>
            <p>{t.description}</p>
            <span className="team-card-action">Bu alanda katıl <span aria-hidden="true">↗</span></span>
          </a>
        ))}
      </div>
      <p className="sr-only">
        Hangi alanda üreteceksin? İlgi alanını seç, takım arkadaşlarınla
        birlikte büyüyen projelere katkı sun.
      </p>
    </section>
  );
}
export function Workflow() {
  return (
    <section className="workflow-section lower-width">
      <h2>Çalışma Akışı</h2>
      <p className="section-intro">
        Fikirden teslimata kadar herkesin takip edebileceği basit ve şeffaf bir
        akış.
      </p>
      <ol className="workflow-grid">
        {steps.map((s, i) => (
          <li key={s.title}>
            <div>
              <span>{i + 1}</span>
              <h3>{s.title}</h3>
            </div>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="rules-grid">
        <section>
          <h3>Takım Kuralları</h3>
          <ol>
            {rules.map((rule, i) => (
              <li key={rule}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{rule}</p>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h3>İletişim &amp; Güncellemeler</h3>
          <ul>
            {updates.map((update) => (
              <li key={update}>{update}</li>
            ))}
          </ul>
          <span className="accent-rule" aria-hidden="true" />
        </section>
      </div>
    </section>
  );
}
export function Contact() {
  return <ContactForm />;
}
export async function Footer() {
  const [settings, contact] = await Promise.all([getPublicSettings(), getPageContents("CONTACT")]);
  const email = settings["contact.email"] ?? club.email;
  const phone = settings["contact.phone"] ?? "+90 216 452 20 00";
  const address = settings["contact.address"] ?? "İstanbul Gedik Üniversitesi, Kartal Kampüsü, İstanbul";
  return (
    <footer id="iletisim" className="site-footer lower-width">
      <div className="footer-brand">
        <Brand footer />
        <p>
          © {new Date().getFullYear()} Yazılım Atölyesi – Gönüllü Yazılım Kulübü.
          <br />
          Tüm hakları saklıdır.
        </p>
      </div>
      <nav aria-label="Hızlı linkler">
        <h2>Hızlı Linkler</h2>
        <a href="/#anasayfa">› Ana Sayfa</a>
        <a href="/#hakkimizda">› Hakkımızda</a>
        <a href="/#duyurular">› Duyurular</a>
        <a href="/#takim">› Takım Alanı</a>
        <a href="/#iletisim">› İletişim</a>
      </nav>
      <div className="footer-contact">
        <h2>Bize Ulaşın</h2>
        <p>
          <Icon name="pin" />
          {address}
        </p>
        {contact && <PublicBlocks blocks={contact} />}
        <a href={`mailto:${email}`}>
          <Icon name="mail" />
          {email}
        </a>
        <a href={`tel:${phone.replace(/[^+0-9]/g, "")}`}>
          <Icon name="phone" />
          {phone}
        </a>
        <Dialog
          label="Mesaj gönder"
          title="Bir fikrin mi var? Konuşalım."
          className="footer-message"
        >
          <ContactForm />
        </Dialog>
      </div>
      <div className="footer-social">
        <h2>Bizi Takip Edin</h2>
        <div className="social-links">
          {(["github", "linkedin", "instagram", "youtube"] as const).map(
            (name) => safeLink(settings[`social.${name}`]) ? <a key={name} className="social-link" href={safeLink(settings[`social.${name}`])} target="_blank" rel="noopener noreferrer"><Icon name={name} /><span className="sr-only">{name}</span></a> : (
              <Dialog
                key={name}
                label={
                  <>
                    <Icon name={name} />
                    <span className="sr-only">{name}</span>
                  </>
                }
                title="Sosyal medya"
                className="social-link"
              >
                <p>
                  Bu kanalın bağlantısı henüz paylaşılmadı. Güncel bağlantılar
                  için bizimle iletişime geçebilirsin.
                </p>
                <a className="club-button" href={`mailto:${email}`}>
                  Bize ulaşın
                </a>
              </Dialog>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
