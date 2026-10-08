import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="page-loading">
      <h1>Sayfa bulunamadı.</h1>
      <p>Aradığın sayfa kaldırılmış veya adresi değişmiş olabilir.</p>
      <Link className="club-button" href="/">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
