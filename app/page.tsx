import { Header } from "../components/header";
import { Hero } from "../components/hero";
import {
  About,
  Footer,
  Join,
  Pillars,
  Team,
  Workflow,
} from "../components/sections";
import { getHomeAnnouncements, getPageContents, getPublicSettings } from "../lib/server-api";
import { PublicBlocks } from "../components/public-blocks";
import { adaptPageContents, adaptPublicSettings, withFallbackContent } from "../features/site-content/adapters";
import { HomeAnnouncements } from "../components/home-announcements";

export default async function Home() {
  const [announcementsResult, homeResult, aboutResult, settingsResult] = await Promise.allSettled([
    getHomeAnnouncements(),
    getPageContents("HOME"),
    getPageContents("ABOUT"),
    getPublicSettings(),
  ]);

  const announcements = announcementsResult.status === "fulfilled" ? announcementsResult.value : { items: [], live: false };
  const homeBlocks = homeResult.status === "fulfilled" ? adaptPageContents(homeResult.value) : [];
  const aboutBlocks = aboutResult.status === "fulfilled" ? adaptPageContents(aboutResult.value) : [];
  const settings = settingsResult.status === "fulfilled" ? adaptPublicSettings(settingsResult.value) : {};

  const content = withFallbackContent({ home: homeBlocks, about: aboutBlocks, settings });
  const hero = content.home.find(block => block.contentType === "HERO");
  const other = content.home.filter(block => block.id !== hero?.id);
  return (
    <>
      <Header />
      <main id="main-content">
        {(hero) && <Hero block={hero as any} />}
        {other.length > 0 && <section className="managed-blocks page-width" aria-label="Kulüpten güncellemeler"><PublicBlocks blocks={other as any} /></section>}
        <Pillars />
        <div className="overview-grid page-width">
          <HomeAnnouncements items={announcements.items} live={announcements.live} />
          <About blocks={content.about as any} />
          <Join />
        </div>
        <Team />
        <Workflow />
      </main>
      <Footer />
    </>
  );
}
