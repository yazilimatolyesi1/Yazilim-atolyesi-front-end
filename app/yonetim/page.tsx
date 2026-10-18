import { backendURLConfig } from "@/lib/backend-config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "../../components/admin/dashboard";
import type { Profile } from "../../lib/admin-types";

export const metadata = {
  title: "Yönetim | Yazılım Atölyesi",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = (await cookies()).get("club_session")?.value;
  if (!token) redirect("/giris-yap");
  let response: Response;
  try {
    response = await fetch(
      `${backendURLConfig.baseUrl}/${backendURLConfig.apiPrefix}/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return (
      <main
        id="main-content"
        className="page-width"
        style={{ paddingBlock: 80 }}
      >
        <h1>Yönetim paneline ulaşılamıyor</h1>
        <p>Sunucu bağlantısını kontrol edip tekrar dene.</p>
        <a className="club-button" href="/yonetim">
          Tekrar dene
        </a>
      </main>
    );
  }
  if (response.status === 401) redirect("/giris-yap");
  if (!response.ok) throw new Error("Profil yüklenemedi.");
  const profile: Profile = await response.json();
  if (!profile.roles.some((role) => role === "ADMIN" || role === "EDITOR")) {
    return (
      <main
        id="main-content"
        className="page-width"
        style={{ paddingBlock: 80 }}
      >
        <h1>Bu alana erişim yetkin yok</h1>
        <p>Yönetim paneli yalnızca yönetici ve editör hesaplarına açıktır.</p>
        <a className="club-button" href="/">
          Ana sayfaya dön
        </a>
      </main>
    );
  }
  return <Dashboard profile={profile} />;
}
