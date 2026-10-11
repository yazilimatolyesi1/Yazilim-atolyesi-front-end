import { Suspense } from "react";
import { Header } from "../../components/header";
import { Footer } from "../../components/sections";
import { AnnouncementList } from "../../components/announcement-list";
export const metadata = { title: "Duyurular | Yazılım Atölyesi" };
export default function AnnouncementsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="announcement-page page-width">
        <a href="/" className="back-link">
          ← Ana sayfaya dön
        </a>
        <h1>Duyurular</h1>
        {/* Liste URL'deki arama/kategori/sayfa bilgisini okur; bu kısım tarayıcıda tamamlanır. */}
        <Suspense fallback={<p className="form-loading" role="status">Duyurular yükleniyor…</p>}>
          <AnnouncementList />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
