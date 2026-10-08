import Link from "next/link";

const designs = [
  ["01", "Orbit / Kulüp çekirdeği", "Mevcut PDF’ye en yakın; merkezde logo, neon orbitler ve teknoloji atmosferi."],
  ["02", "Grid / Kod üretimi", "Kod paneli ve düzenli grid yapısıyla daha ürün odaklı görünüm."],
  ["03", "Terminal / Build", "Terminal ekranı üzerinden gerçek yazılım üretme hissi."],
  ["04", "Circuit / Ağ", "Topluluk ve bağlantı fikrini devre çizgileriyle anlatan kompozisyon."],
  ["05", "Poster / Cesur", "Daha editorial, yüksek kontrastlı ve genç bir afiş yaklaşımı."],
  ["06", "Constellation / Ağ", "Üyeleri ve ekipleri bir ağ olarak gösteren modern yaklaşım."],
  ["07", "Glass / Platform", "Daha sakin, premium ve ürün platformu hissi veren cam kartlar."],
  ["08", "Terminal Grid / Sistem", "Grid, terminal ve kısa sloganları birlikte kullanan teknik görünüm."],
  ["09", "Spectrum / Enerji", "Yaratıcılığı ve farklı ekipleri renkli bir akışla anlatan seçenek."],
  ["10", "Monogram / Marka", "Logo ve kulüp adını en güçlü marka odağına alan sade seçenek."],
] as const;

// Onaylanmamış tasarım arşivi; arama motorlarında görünmez.
export const metadata = { title: "Hero Tasarım Seçenekleri | Yazılım Atölyesi", robots: { index: false, follow: false } };

export default function HeroDesignsPage() {
  return <main id="main-content" className="min-h-screen bg-[#03061f] px-5 py-10 text-white lg:px-10"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end"><div><Link href="/" className="text-sm font-bold text-white/50 hover:text-white">← Ana sayfa</Link><p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-coral">Seçim ekranı</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Hero tasarım seçenekleri</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Aşağıdaki 10 konsepti karşılaştır. Beğendiğin numarayı söyle; seçilen tasarımı son hero bölümüne inline SVG ve CSS olarak aktaracağım.</p></div><span className="rounded-full border border-plum/50 px-4 py-2 text-xs font-bold text-white/60">10 konsept / SVG</span></div><div className="mt-10 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{designs.map(([number, title, description]) => <article key={number} className="overflow-hidden rounded-2xl border border-plum/40 bg-[#10143d] transition hover:-translate-y-1 hover:border-coral"><div className="bg-black"><img src={`/hero-designs/${number}-${["orbit","grid","terminal","circuit","poster","constellation","glass","terminal-grid","spectrum","monogram"][Number(number)-1]}.svg`} alt={`${number} ${title} hero tasarımı`} className="block aspect-video w-full object-cover" /></div><div className="p-5"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.2em] text-coral">{number}</span><span className="rounded-full bg-plum/20 px-3 py-1 text-[10px] font-bold text-white/55">SVG</span></div><h2 className="mt-3 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{description}</p></div></article>)}</div></div></main>;
}
