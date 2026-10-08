import Link from "next/link";
export default function AnnouncementNotFound() {
  return (
    <main id="main-content" className="page-loading">
      <h1>Duyuru bulunamadı.</h1>
      <p>Aradığın duyuru kaldırılmış, adresi değişmiş veya henüz yayınlanmamış olabilir.</p>
      <Link className="club-button" href="/duyurular">
        Tüm duyurulara dön
      </Link>
    </main>
  );
}
