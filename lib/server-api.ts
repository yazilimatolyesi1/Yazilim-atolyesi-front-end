import type { ContentRecord } from "./admin-types";
import { mapAnnouncement } from "./announcement";
import { backendURLConfig } from "./backend-config";
import type { Announcement } from "./content";
export async function getHomeAnnouncements(): Promise<{
  items: Announcement[];
  live: boolean;
}> {
  try {
    const res = await fetch(`${backendURLConfig.baseUrl}/${backendURLConfig.apiPrefix}/announcements?size=3`, {
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
export async function getPageContents(page: "HOME" | "ABOUT" | "CONTACT"): Promise<ContentRecord[] | null> {
  try {
    const response = await fetch(`${backendURLConfig.baseUrl}/${backendURLConfig.apiPrefix}/pages/${page}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.contents) ? data.contents : null;
  } catch { return null; }
}
export async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${backendURLConfig.baseUrl}/${backendURLConfig.apiPrefix}/settings/public`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return {};
    const data: { key: string; value: string }[] = await response.json();
    return Object.fromEntries(data.map(item => [item.key, item.value]));
  } catch { return {}; }
}
