"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isAborted, request } from "../lib/api";
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "../lib/use-debounced-value";
import type { Announcement } from "../lib/content";
import { mapAnnouncement, type ApiAnnouncement } from "../lib/announcement";
import { Icon } from "./icon";
import { Dialog } from "./dialog";
import { mediaUrl } from "../lib/media";

// Backend kategoriyi serbest metin tutar ve büyük/küçük harf duyarsız eşleştirir.
const CATEGORIES = ["Genel", "Etkinlik", "Proje", "Eğitim"];

type ListState = { q: string; category: string; page: number };

export function AnnouncementList() {
  // Arama, kategori ve sayfa URL'de tutulur; geri/ileri ve paylaşılan bağlantı aynı listeyi açar.
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 0;
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [input, setInput] = useState(query);
  const [retry, setRetry] = useState(0);
  // Arama kutusu anında güncellenir; URL ve istek ~300 ms bekletilir.
  const settledInput = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const writtenQuery = useRef(query);
  const navigate = (next: Partial<ListState>, replace = false) => {
    const state = { q: query, category, page, ...next };
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.category) params.set("category", state.category);
    if (state.page > 0) params.set("page", String(state.page));
    writtenQuery.current = state.q;
    const url = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    // Native History API Next yönlendiricisiyle eşleşir; sayfa sunucudan yeniden istenmez.
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  };
  useEffect(() => {
    // Geri/ileri ile gelen arama kutuya yazılır; kendi yazdığımız değer yazmaya devam edeni ezmez.
    if (query === writtenQuery.current) return;
    writtenQuery.current = query;
    setInput(query);
  }, [query]);
  useEffect(() => {
    // Yalnızca bekletilmiş arama değiştiğinde çalışır; sayfa ve kategori değişimi aramayı yeniden yazmaz.
    const q = settledInput.trim();
    if (q !== query) navigate({ q, page: 0 }, true);
  }, [settledInput]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const categoryFilter = category ? `&category=${encodeURIComponent(category)}` : "";
    request<{ content: ApiAnnouncement[]; totalPages: number }>(
      `announcements?page=${page}&size=9&q=${encodeURIComponent(query)}${categoryFilter}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setItems(data.content.map(mapAnnouncement));
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        // İptal edilen istek hata sayılmaz; eski cevap listeyi ezmeyebilir.
        if (controller.signal.aborted || isAborted(err)) return;
        setError(err.message);
        setItems([]);
        setTotalPages(1);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => { controller.abort(); };
  }, [page, query, category, retry]);
  const filtered = Boolean(query || category);
  return (
    <>
      <div className="list-tools">
        <label>
          Duyurularda ara
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Başlık veya konu"
          />
        </label>
        <label className="category-filter">
          Kategori
          <select
            value={category}
            onChange={(e) => navigate({ category: e.target.value, page: 0 })}
          >
            <option value="">Tümü</option>
            {CATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            {category && !CATEGORIES.includes(category) && (
              <option value={category}>{category}</option>
            )}
          </select>
        </label>
        {error && (
          <button
            type="button"
            className="club-button button-outline"
            onClick={() => {
              navigate({ page: 0 }, true);
              setRetry((x) => x + 1);
            }}
          >
            Tekrar dene
          </button>
        )}
      </div>
      {error && (
        <p className="content-note" role="status">
          {error}
        </p>
      )}
      {loading ? (
        <p className="form-loading" role="status">
          Duyurular yükleniyor…
        </p>
      ) : error ? null : items.length ? (
        <div className="announcement-grid">
          {items.map((item) => (
            <article className="announcement-card" key={item.id}>
              {mediaUrl(item.coverImageUrl) && <img className="announcement-cover" src={mediaUrl(item.coverImageUrl)} alt={item.coverImageAltText || ""} loading="lazy" />}
              <div className="announcement-main">
                <div className="announcement-date">
                  <strong>{item.day}</strong>
                  <span>{item.month}</span>
                </div>
                <div>
                  <h3>
                    {item.slug ? (
                      <Link href={`/duyurular/${encodeURIComponent(item.slug)}`} className="card-title-link">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </h3>
                  <p>{item.summary}</p>
                </div>
              </div>
              <div className="announcement-meta">
                <span>
                  <Icon name="calendar" />
                  {item.dateLabel}
                </span>
                <span className="category-label">{item.category}</span>
              </div>
              {item.content && (
                <Dialog label="Devamını oku" title={item.title}>
                  <p className="announcement-content">{item.content}</p>
                </Dialog>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state" role="status">
          {filtered
            ? "Aramana uygun duyuru bulunamadı."
            : "Henüz yayınlanmış duyuru bulunmuyor."}
          {filtered && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setInput("");
                navigate({ q: "", category: "", page: 0 });
              }}
            >
              Aramayı temizle
            </button>
          )}
        </p>
      )}
      {totalPages > 1 && (
        <nav className="pagination" aria-label="Duyuru sayfaları">
          <button
            type="button"
            className="club-button button-outline"
            disabled={page === 0 || loading}
            onClick={() => navigate({ page: page - 1 })}
          >
            Önceki
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="club-button button-outline"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => navigate({ page: page + 1 })}
          >
            Sonraki
          </button>
        </nav>
      )}
    </>
  );
}
