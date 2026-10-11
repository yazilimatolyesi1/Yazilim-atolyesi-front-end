import type { Announcement } from "./content";
export type ApiAnnouncement = {
  coverImageUrl?: string;
  coverImageAltText?: string;
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  publishedAt: string | null;
};
export function mapAnnouncement(item: ApiAnnouncement): Announcement {
  const date = item.publishedAt ? new Date(item.publishedAt) : null;
  return {
    coverImageUrl: item.coverImageUrl,
    coverImageAltText: item.coverImageAltText,
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    content: item.content,
    category: item.category || "Duyuru",
    day: date
      ? new Intl.DateTimeFormat("tr-TR", {
          day: "2-digit",
          timeZone: "Europe/Istanbul",
        }).format(date)
      : "—",
    month: date
      ? new Intl.DateTimeFormat("tr-TR", {
          month: "short",
          timeZone: "Europe/Istanbul",
        })
          .format(date)
          .toLocaleUpperCase("tr-TR")
      : "",
    dateLabel: date
      ? `Yayın: ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "Europe/Istanbul" }).format(date)}`
      : "Yayın tarihi belirtilmedi",
    publishedAt: item.publishedAt || undefined,
  };
}
