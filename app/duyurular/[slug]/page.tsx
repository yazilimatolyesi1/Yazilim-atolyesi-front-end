import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { Footer } from "../../../components/sections";
import { Icon } from "../../../components/icon";
import { getAnnouncement } from "../../../lib/server-api";
import { mediaUrl } from "../../../lib/media";
export const metadata = { title: "Duyuru | Yazılım Atölyesi" };
export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Yalnızca backend 404'ü "bulunamadı" sayılır; bağlantı ve sunucu hataları ayrı gösterilir.
  const item = await getAnnouncement(slug).catch(() => undefined);
  if (item === null) notFound();
  return (
    <>
      <Header />
      <main id="main-content" className="announcement-page page-width">
        <Link href="/duyurular" className="back-link">
          ← Tüm duyurulara dön
        </Link>
        {item ? (
          <article className="announcement-detail">
            {mediaUrl(item.coverImageUrl) && (
              <img
                className="announcement-cover"
                src={mediaUrl(item.coverImageUrl)}
                alt={item.coverImageAltText || ""}
              />
            )}
            <div className="announcement-meta">
              <span>
                <Icon name="calendar" />
                {item.dateLabel}
              </span>
              <span className="category-label">{item.category}</span>
            </div>
            <h1>{item.title}</h1>
            {item.summary && <p className="announcement-summary">{item.summary}</p>}
            {item.content && <div className="announcement-content">{item.content}</div>}
          </article>
        ) : (
          <div className="empty-state" role="status">
            <h1>Duyuru yüklenemedi.</h1>
            <p>Sunucuya şu anda ulaşılamıyor. Lütfen biraz sonra tekrar dene.</p>
            {/* Tam sayfa isteği, sunucudaki okumayı yeniden çalıştırır. */}
            <a className="club-button" href={`/duyurular/${encodeURIComponent(slug)}`}>
              Tekrar dene
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
