import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "../../../components/header";
import { Footer } from "../../../components/sections";
import { Icon } from "../../../components/icon";
import { getAnnouncement } from "../../../lib/server-api";
import { mediaUrl } from "../../../lib/media";
type Props = { params: Promise<{ slug: string }> };
// Meta veri ve sayfa aynı istekte duyuruyu bir kez okur.
// Yalnızca backend 404'ü "bulunamadı" (null) sayılır; bağlantı ve sunucu hataları undefined olur.
const loadAnnouncement = cache((slug: string) => getAnnouncement(slug).catch(() => undefined));
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await loadAnnouncement((await params).slug);
  if (!item) return { title: "Duyuru | Yazılım Atölyesi" };
  return {
    title: `${item.title} | Yazılım Atölyesi`,
    description: item.summary,
    openGraph: { title: item.title, description: item.summary, type: "article", publishedTime: item.publishedAt },
  };
}
export default async function AnnouncementDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await loadAnnouncement(slug);
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
