"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./brand";
import { Icon } from "./icon";
import { ApiError, request } from "../lib/api";

const links = [
  ["anasayfa", "Ana Sayfa"],
  ["hakkimizda", "Hakkımızda"],
  ["duyurular", "Duyurular"],
  ["takim", "Takım Alanı"],
  ["iletisim", "İletişim"],
];

type Profile = {
  roles?: string[];
  email?: string;
  user?: { firstName: string; email: string };
  personal?: { firstName: string };
  membership?: { status: "PENDING" | "APPROVED" | "REJECTED" };
};

export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("anasayfa");
  const [session, setSession] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let activeEffect = true;
    request<Profile>("users/me")
      .then((profile) => {
        if (activeEffect) setSession(profile);
      })
      .catch(() => {
        if (activeEffect) setSession(null);
      });

    return () => {
      activeEffect = false;
    };
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await request("auth/logout", { method: "POST" });
      setSession(null);
      router.refresh();
      router.push("/");
    } catch (err) {
      console.error("Çıkış yapılamadı:", err);
    } finally {
      setBusy(false);
    }
  };

  const displayName =
    session?.user?.firstName ||
    session?.personal?.firstName ||
    session?.email;

  const isAdminOrEditor = session?.roles?.some(
    (role) => role === "ADMIN" || role === "EDITOR"
  );

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <button
          ref={toggle}
          type="button"
          className="menu-toggle"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Kapat" : "Menü"}
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>

        <div
          id="site-navigation"
          className={`header-navigation${open ? " is-open" : ""}`}
        >
          <nav aria-label="Ana navigasyon">
            {links.map(([id, label]) => {
              const isCurrentPage =
                id === "duyurular" && pathname === "/duyurular";
              const isCurrentSection = active === id && pathname === "/";
              return (
                <a
                  key={id}
                  href={isCurrentPage ? "/duyurular" : `/#${id}`}
                  className={isCurrentPage || isCurrentSection ? "is-active" : ""}
                  onClick={() => {
                    setActive(id);
                    setOpen(false);
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {session ? (
              <>
                {/* User Profile Badge */}
                <div 
                  className="user-profile-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "0.375rem",
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#fff",
                  }}
                >
                  <Icon name="user" />
                  <span>{displayName}</span>
                </div>

                {/* Optional Admin Link */}
                {isAdminOrEditor && (
                  <a className="club-button button-outline" href="/yonetim">
                    Yönetim
                  </a>
                )}

                {/* Log Out Button */}
                <button
                  type="button"
                  className="club-button button-outline"
                  onClick={handleLogout}
                  disabled={busy}
                >
                  {busy ? "Çıkılıyor…" : "Çıkış Yap"}
                </button>
              </>
            ) : (
              <>
                {/* Logged Out Controls */}
                <a className="club-button button-outline" href="/giris-yap">
                  <Icon name="user" />
                  Giriş Yap
                </a>
                <a className="club-button" href="/uye-kaydi">
                  <Icon name="user" />
                  Üye Kaydı
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}