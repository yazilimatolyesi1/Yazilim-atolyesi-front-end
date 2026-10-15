import { type Announcement } from "../lib/content";
import { AnnouncementCard } from "./sections";
import { Icon } from "./icon";

export function HomeAnnouncements({ items, live = true }: { items: Announcement[]; live?: boolean }) {
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
