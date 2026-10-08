import type { Announcement } from "./content";
import { mapAnnouncement } from "./announcement";
import type { ContentRecord } from "./admin-types";
export const apiBase = () =>
  (process.env.CLUB_API_URL || "http://localhost:8080/api/v1").replace(
    /\/$/,
    "",
  );
export async function getHomeAnnouncements(): Promise<{
  items: Announcement[];
  live: boolean;
}> {
  try {
    const res = await fetch(`${apiBase()}/announcements?size=3`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Content unavailable");
    const data = await res.json();
    if (!Array.isArray(data.content))
      throw new Error("Invalid content response");
    return { items: data.content.map(mapAnnouncement), live: true };
  } catch {
    return { items: [], live: false };
  }
}

/** Yayındaki duyuruyu slug ile okur. Kayıt yoksa null; bağlantı veya sunucu hatasında hata fırlatır. */
export async function getAnnouncement(slug: string): Promise<Announcement | null> {
  const response = await fetch(`${apiBase()}/announcements/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Announcement unavailable: ${response.status}`);
  return mapAnnouncement(await response.json());
}

export async function getPageContents(page: "HOME" | "ABOUT" | "CONTACT"): Promise<ContentRecord[] | null> {
  try {
    const response = await fetch(`${apiBase()}/pages/${page}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.contents) ? data.contents : null;
  } catch { return null; }
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${apiBase()}/settings/public`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return {};
    const data: { key: string; value: string }[] = await response.json();
    return Object.fromEntries(data.map(item => [item.key, item.value]));
  } catch { return {}; }
}
