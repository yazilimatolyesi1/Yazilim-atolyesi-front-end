"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ApiError, isAborted, request } from "../../lib/api";
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "../../lib/use-debounced-value";
import styles from "./dashboard.module.css";

export const names: Record<string, string> = {
  ADMIN: "Yönetici", EDITOR: "Editör", MEMBER: "Üye", PENDING: "Onay bekliyor", APPROVED: "Onaylandı", REJECTED: "Reddedildi",
  DRAFT: "Taslak", PUBLISHED: "Yayında", ARCHIVED: "Arşivde", NEW: "Yeni", READ: "Okundu", REPLIED: "Yanıtlandı",
  ACTIVE: "Aktif", PASSIVE: "Pasif", SUSPENDED: "Askıya alındı", HOME: "Ana sayfa", ABOUT: "Hakkımızda", CONTACT: "İletişim",
  HERO: "Karşılama alanı", SLIDER: "Vitrin kartı", TEXT: "Metin", FEATURE: "Özellik", CONTACT_INFO: "İletişim bilgisi", CUSTOM: "Diğer içerik",
  BEGINNER: "Başlangıç", INTERMEDIATE: "Orta", ADVANCED: "İleri", TEXT_SETTING: "Metin", EMAIL: "E-posta", URL: "Bağlantı", PHONE: "Telefon", JSON: "JSON",
};
export function date(value?: string) { return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(value)) : "—"; }
export function Badge({ value }: { value: string }) { return <span className={styles.badge} data-tone={["APPROVED", "PUBLISHED", "ACTIVE", "READ"].includes(value) ? "green" : ["REJECTED", "SUSPENDED"].includes(value) ? "red" : "purple"}>{names[value] || value}</span>; }

export type FieldError = { field: string; message: string };
export type ErrorCopy = { title: string; hint?: string; relogin: boolean };

/** Oturum bitmesi (401) ile yetki eksikliği (403) ayrı gösterilir. */
export function describeError(error: unknown): ErrorCopy {
  if (isAborted(error)) return { title: "", relogin: false };
  if (!(error instanceof ApiError)) return { title: error instanceof Error ? error.message : "İşlem tamamlanamadı.", relogin: false };
  if (error.status === 401) return { title: "Oturumun sona erdi.", hint: "Yönetim alanına erişmek için tekrar giriş yap.", relogin: true };
  if (error.status === 403) return { title: "Bu işlem için yetkin yok.", hint: "Hesabının rolü bu alana erişime izin vermiyor. Menüde gizlenen alanlar da güvenlik sınırı değildir; rolü yönetici değiştirir.", relogin: false };
  if (error.status === 409) return { title: "Bu kayıt zaten var.", hint: error.message, relogin: false };
  if (error.status === 429) return { title: "Çok fazla istek gönderildi.", hint: error.message, relogin: false };
  if (error.status === 0) return { title: "Sunucuya ulaşılamıyor.", hint: error.message, relogin: false };
  return { title: error.message, relogin: false };
}

export function fieldErrors(error: unknown): FieldError[] {
  return error instanceof ApiError ? error.fieldErrors : [];
}
/** Bir alanın hata metnini döndürür; alan bazlı göstermek için kullanılır. */
export function fieldError(error: unknown, field: string): string {
  return fieldErrors(error).find(item => item.field === field)?.message || "";
}

export function FieldErrors({ error, field }: { error: unknown; field?: string }) {
  const list = field ? fieldErrors(error).filter(item => item.field === field) : fieldErrors(error);
  if (!list.length) return null;
  return <ul className={styles.fieldErrors} role="alert">{list.map((item, i) => <li key={`${item.field}-${i}`}>{item.message}</li>)}</ul>;
}

export function ErrorNotice({ error }: { error: unknown }) {
  if (!error) return null;
  if (isAborted(error)) return null;
  const copy = describeError(error);
  if (!copy.title) return null;
  return <div className={styles.error} role="alert"><strong>{copy.title}</strong>
    {copy.hint && <p>{copy.hint}</p>}
    <FieldErrors error={error} />
    {copy.relogin && <a href="/giris-yap">Tekrar giriş yap →</a>}
  </div>;
}

export function useRemote<T>(path: string, options: { debounceMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  // Arama kutusu her tuşta yol değiştirir; istek ~300 ms bekletilir.
  const settled = useDebouncedValue(path, options.debounceMs ?? SEARCH_DEBOUNCE_MS);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    request<T>(settled, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(e => { if (!controller.signal.aborted && !isAborted(e)) setError(e); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    // Yeni istek başlamadan önce eskisi iptal edilir; eski cevap listeyi ezmeyebilir.
    return () => { controller.abort(); };
  }, [settled, revision]);
  return { data, loading, error, refresh: () => setRevision(x => x + 1) };
}

export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await action(); } catch (e) { if (!isAborted(e)) setError(e); } finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, run };
}

/** İşlem bildirimi: başarı ve hata mesajını tek yerde tutar. */
export function useOperation() {
  const [notice, setNotice] = useState("");
  return { notice, setNotice, clear: () => setNotice(""), node: notice ? <p className={styles.success} role="status">{notice}</p> : null };
}

/**
 * Kaydedilmemiş değişiklik uyarısı. Sekme kapatılırken tarayıcı uyarısı çıkar;
 * bileşen içi kapanış için confirmClose() kullanılır. Kapsamlı navigation guard
 * (tüm tarayıcı geçmişini bloke eden) bu haftanın kapsamı dışındadır.
 */
export function useUnsavedChanges(dirty: boolean, message = "Kaydedilmemiş değişiklikler var. Çıkılsın mı?") {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return () => !dirty || window.confirm(message);
}

export function Modal({ title, children, onClose, busy = false, dirty = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; dirty?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    // showModal() öncesi odak hangi düğmedeydi? Kapanışta odağın geri verileceği
    // yer budur. Kısayol veya ekran okuyucu ile açılan pencerede odak gövdede
    // olabilir; bu durumda geri verilecek hedef yoktur.
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // StrictMode etkiyi iki kez çalıştırır; showModal() zaten açık pencereye
    // çağrıldığında InvalidStateError fırlatır.
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      // React unmount'ta <dialog> düğümünü DOM'dan söker; detached bir dialog'a
      // close() çağrıslamak odağı geri vermez. Bu yüzden odak doğrudan hedefe
      // verilir (close() bir süre sonra normalde yapar bunu).
      if (dialog?.open) dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  const close = () => {
    if (busy) return;
    // Kaydedilmemiş değişiklik varsa kapanış onaylanır; iptal edilirse pencere açık kalır.
    if (dirty && !window.confirm("Kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?")) return;
    onClose();
  };
  return <dialog ref={ref} className={styles.modal} aria-label={title}
    onCancel={e => { e.preventDefault(); close(); }}
    onClick={e => { if (e.target === ref.current) close(); }}>
    <header className={styles.modalHeader}><div><span className={styles.eyebrow}>YAZILIM ATÖLYESİ</span><h2>{title}</h2></div><button type="button" className={styles.iconButton} aria-label="Pencereyi kapat" disabled={busy} onClick={close}>×</button></header>
    {children}
  </dialog>;
}

export function ListState({ loading, error, empty, retry }: { loading: boolean; error: unknown; empty: boolean; retry: () => void }) {
  if (loading) return <div className={styles.empty} role="status">Veriler yükleniyor…</div>;
  if (error) return <><ErrorNotice error={error} /><button className={styles.secondary} onClick={retry}>Tekrar dene</button></>;
  if (empty) return <div className={styles.empty}><span aria-hidden="true">◇</span><h3>Henüz bir kayıt yok</h3><p>Yeni kayıtlar burada görünecek. Filtre kullanıyorsan değiştirmeyi deneyebilirsin.</p></div>;
  return null;
}
export function Pagination({ page, pages, total, setPage }: { page: number; pages: number; total: number; setPage: (value: number) => void }) {
  return <div className={styles.pagination}><span>{total} kayıt · Sayfa {page + 1} / {Math.max(1, pages)}</span><div><button disabled={page === 0} onClick={() => setPage(page - 1)}>← Önceki</button><button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Sonraki →</button></div></div>;
}
export function Options({ values }: { values: string[] }) { return <>{values.map(value => <option value={value} key={value}>{names[value] || value}</option>)}</>; }
