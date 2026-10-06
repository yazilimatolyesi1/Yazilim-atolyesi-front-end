"use client";
import { useEffect, useState } from "react";
import { isAborted, request } from "../lib/api";
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "../lib/use-debounced-value";
import type { Announcement } from "../lib/content";
import { mapAnnouncement, type ApiAnnouncement } from "../lib/announcement";
import { Icon } from "./icon";
import { Dialog } from "./dialog";
import { mediaUrl } from "../lib/media";

export function AnnouncementList() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [retry, setRetry] = useState(0);
  // Arama kutusu anında güncellenir; istek ~300 ms bekletilir.
  const settledQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    request<{ content: ApiAnnouncement[]; totalPages: number }>(
      `announcements?page=${page}&size=9&q=${encodeURIComponent(settledQuery)}`,
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
  }, [page, settledQuery, retry]);
  return (
    <>
      <div className="list-tools">
        <label>
          Duyurularda ara
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Başlık veya konu"
          />
        </label>
        {error && (
          <button
            type="button"
            className="club-button button-outline"
            onClick={() => {
              setPage(0);
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
                  <h3>{item.title}</h3>
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
          {query
            ? "Aramana uygun duyuru bulunamadı."
            : "Henüz yayınlanmış duyuru bulunmuyor."}
          {query && (
            <button
              type="button"
              className="text-button"
              onClick={() => setQuery("")}
            >
              Aramayı temizle
            </button>
          )}
        </p>
      )}
      {totalPages > 1 && (
        <nav className="pagination" aria-label="Duyuru sayfaları">
          <button
            className="club-button button-outline"
            disabled={page === 0 || loading}
            onClick={() => setPage((x) => x - 1)}
          >
            Önceki
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            className="club-button button-outline"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((x) => x + 1)}
          >
            Sonraki
          </button>
        </nav>
      )}
    </>
  );
}
