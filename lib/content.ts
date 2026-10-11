export const club = {
  name: "Yazılım Atölyesi",
  university: "İstanbul Gedik Üniversitesi",
  intro:
    "Yazılım Atölyesi, teknolojiye ilgi duyan öğrencileri bir araya getirir; öğrenmeyi, üretmeyi ve paylaşmayı ilke edinir.",
  about:
    "İstanbul Gedik Üniversitesi bünyesinde faaliyet gösteren Yazılım Atölyesi, öğrencilerin teknoloji alanında kendilerini geliştirmeleri, üretmeleri ve topluma fayda sağlamaları için çalışır.",
  email: "yazilimatolyesi@gedik.edu.tr",
};
export type Announcement = {
  coverImageUrl?: string;
  coverImageAltText?: string;
  id: string;
  slug?: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  day: string;
  month: string;
  dateLabel: string;
  publishedAt?: string;
};
// Existing frontend content; fallback only when the service is unavailable.
export const announcements: Announcement[] = [
  {
    id: "web",
    day: "24",
    month: "MAY",
    title: "Web Geliştirme Atölyesi",
    summary: "HTML, CSS ve modern web teknolojileriyle uygulamalı eğitim.",
    dateLabel: "24 Mayıs 2025, Cumartesi",
    category: "Atölye",
  },
  {
    id: "python",
    day: "05",
    month: "HAZ",
    title: "Python ile Veri Analizi",
    summary: "Veri analizine giriş ve Python ile pratik uygulamalar.",
    dateLabel: "5 Haziran 2025, Perşembe",
    category: "Eğitim",
  },
  {
    id: "hackathon",
    day: "15–16",
    month: "HAZ",
    title: "Hackathon 2025",
    summary:
      "48 saatlik yazılım maratonu. Takımını kur, fikrini gerçeğe dönüştür.",
    dateLabel: "15–16 Haziran 2025",
    category: "Etkinlik",
  },
];
export const pillars = [
  {
    icon: "code",
    title: "Teknik Gelişim",
    text: "Atölyeler, eğitimler ve mentor desteği ile yeteneklerini geliştir.",
  },
  {
    icon: "people",
    title: "Topluluk ve Ağ",
    text: "Aynı tutkuyu paylaşan arkadaşlarınla güçlü bir ağ kur.",
  },
  {
    icon: "project",
    title: "Gerçek Projeler",
    text: "Takım projeleri ve açık kaynakla dünyaya değer kat.",
  },
  {
    icon: "trophy",
    title: "Fırsatlar",
    text: "Etkinlikler, yarışmalar ve kariyer fırsatlarını yakala.",
  },
] as const;
// Descriptions and working rules transcribed from the approved PDF.
export const teams = [
  {
    title: "Frontend",
    text: "Arayüzler • Responsive yapı",
    description:
      "Figma tasarımını temiz ve hızlı bir kullanıcı arayüzüne dönüştür.",
  },
  {
    title: "Backend",
    text: "API • Veritabanı • Güvenlik",
    description:
      "Servisleri düzenli, güvenli ve kolay sürdürülebilir şekilde kur.",
  },
  {
    title: "UI / UX",
    text: "Akış • Tasarım sistemi",
    description:
      "Kullanıcıyı yormayan, tutarlı ve anlaşılır deneyimler tasarla.",
  },
];
export const steps = [
  {
    title: "Planla",
    text: "Görevi ve gereksinimleri başlamadan önce netleştir.",
  },
  {
    title: "Geliştir",
    text: "Kendi görevini tamamla ve değişiklikleri düzenli tut.",
  },
  {
    title: "Kontrol Et",
    text: "Kodunu test et, eksikleri düzelt ve geri bildirim al.",
  },
  { title: "Teslim Et", text: "Son kontrolü yap ve hazır sürümü paylaş." },
];
export const rules = [
  "Görevi almadan önce kapsamı netleştir.",
  "Kod ve tasarım değişikliklerini açıklayıcı tut.",
  "Birleştirmeden önce mutlaka kontrol et.",
  "Takıldığın yerde ekiple iletişim kur.",
];
export const updates = [
  "Günlük ilerlemeyi kısa şekilde paylaş.",
  "Blokajları bekletmeden ekibe bildir.",
  "Tasarım değiştiğinde ilgili kişiyi haberdar et.",
  "Hazır olan işleri açıkça işaretle.",
];
