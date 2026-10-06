"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { request } from "../../lib/api";
import type { AnnouncementRecord, ContentRecord, SettingRecord } from "../../lib/admin-types";
import { mediaUrl } from "../../lib/media";
import { ErrorNotice, FieldErrors, Modal, Options, useMutation, useOperation, useUnsavedChanges } from "./shared";
import s from "./dashboard.module.css";

export type ResourceKind = "announcements" | "contents" | "settings";
export type EditorValue = Partial<AnnouncementRecord & ContentRecord & SettingRecord>;
const labels = { announcements: "Duyuru", contents: "Sayfa içeriği", settings: "Site ayarı" };
function localDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
/** Formun o anki metin alanlarını sıralı bir dizeye çevirir; ilk durumla karşılaştırmak için. */
function snapshot(form: HTMLFormElement) {
  return Array.from(new FormData(form).entries())
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => `${key}=${value as string}`)
    .sort()
    .join("|");
}
export function ResourceEditor({ kind, value = {}, onClose, onSaved }: { kind: ResourceKind; value?: EditorValue; onClose: () => void; onSaved: () => void }) {
  const action = useMutation();
  const upload = useMutation();
  const operation = useOperation();
  const [image, setImage] = useState(value.coverImageUrl || value.imageUrl || "");
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const initial = useRef("");
  const confirmClose = useUnsavedChanges(dirty);
  const isAnnouncement = kind === "announcements";
  const isContent = kind === "contents";
  // Başlangıç değerleri DOM'a yazıldıktan sonra okunur.
  useEffect(() => { if (formRef.current) initial.current = snapshot(formRef.current); }, []);
  // Kaydedilmemiş değişiklik uyarısı: kapatma, Vazgeç, Escape ve dış tıklama bu yoldan geçer.
  const guardedClose = () => { if (confirmClose()) onClose(); };
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) || "");
    const check = (key: string) => form.has(key);
    await action.run(async () => {
      let payload: Record<string, unknown>;
      if (isAnnouncement) payload = {
        title: text("title"), slug: text("slug"), summary: text("summary"), content: text("content"), category: text("category"),
        status: text("status"), pinned: check("pinned"), featured: check("featured"), displayOrder: Number(text("displayOrder")),
        publishedAt: text("publishedAt") ? new Date(text("publishedAt")).toISOString() : null,
        coverImageUrl: image, coverImageAltText: text("imageAltText"),
      };
      else if (isContent) {
        let metadata: unknown = null;
        try { metadata = text("metadata").trim() ? JSON.parse(text("metadata")) : null; }
        catch { throw new Error("Ek veri alanında geçerli bir JSON değeri kullan."); }
        payload = {
          page: text("page"), type: text("type"), key: text("key"), title: text("title"), subtitle: text("subtitle"), body: text("body"),
          imageUrl: image, imageAltText: text("imageAltText"), linkLabel: text("linkLabel"), linkUrl: text("linkUrl"), metadata,
          displayOrder: Number(text("displayOrder")), active: check("active"), featured: check("featured"),
        };
      } else payload = { key: text("key"), value: text("value"), type: text("type"), description: text("description"), publicSetting: check("publicSetting") };
      await request(`admin/${kind}${value.id ? `/${value.id}` : ""}`, { method: value.id ? "PUT" : "POST", body: JSON.stringify(payload) });
      setDirty(false);
      onSaved();
    });
  }
  return <Modal title={`${labels[kind]} ${value.id ? "düzenle" : "oluştur"}`} onClose={guardedClose} busy={action.busy || upload.busy}>
    <form className={s.form} ref={formRef} onSubmit={save} onChange={e => setDirty(snapshot(e.currentTarget) !== initial.current || image !== (value.coverImageUrl || value.imageUrl || ""))}>
      <ErrorNotice error={action.error} />
      <FieldErrors error={action.error} field="title" />
      <fieldset disabled={action.busy || upload.busy}>
        {isContent && <div className={s.formGrid}><label>Sayfa<select aria-label="Sayfa" name="page" defaultValue={value.page || "HOME"}><Options values={["HOME", "ABOUT", "CONTACT"]} /></select></label><label>İçerik türü<select aria-label="Tür" name="type" defaultValue={value.type || "TEXT"}><Options values={["HERO", "SLIDER", "TEXT", "FEATURE", "CONTACT_INFO", "CUSTOM"]} /></select></label></div>}
        {kind !== "announcements" && <label>Anahtar<input name="key" required maxLength={100} pattern={isContent ? "[a-z0-9]+(?:-[a-z0-9]+)*" : "[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*"} defaultValue={value.key || ""} placeholder={isContent ? "ornek-icerik" : "contact.email"} /></label>}
        {kind !== "settings" ? <>
          <label>Başlık<input name="title" required maxLength={200} defaultValue={value.title || ""} /></label>
          {isAnnouncement ? <>
            <div className={s.formGrid}><label>Kategori<input name="category" maxLength={100} defaultValue={value.category || ""} placeholder="Örn. Eğitim" /></label><label>Bağlantı adı (isteğe bağlı)<input name="slug" maxLength={220} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={value.slug || ""} placeholder="Başlıktan otomatik oluşturulur" /></label></div>
            <label>Özet<textarea aria-label="Özet" name="summary" rows={2} maxLength={500} defaultValue={value.summary || ""} /></label>
          </> : <label>Alt başlık<input name="subtitle" maxLength={300} defaultValue={value.subtitle || ""} /></label>}
          <label>İçerik<textarea aria-label="İçerik" name={isAnnouncement ? "content" : "body"} required={isAnnouncement} rows={7} maxLength={100000} defaultValue={isAnnouncement ? value.content || "" : value.body || ""} /></label>
          <div className={s.imageBox}>
            <div><h3>Görsel</h3><p>JPEG, PNG, WebP veya GIF · En fazla 5 MB</p></div>
            {mediaUrl(image) && <img src={mediaUrl(image)} alt="Seçilen görsel önizlemesi" className={s.preview} />}
            <label>Görsel yükle<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              void upload.run(async () => {
                if (file.size > 5 * 1024 * 1024) throw new Error("Görsel en fazla 5 MB olabilir.");
                const form = new FormData(); form.append("file", file); form.append("purpose", isAnnouncement ? "ANNOUNCEMENT" : "PAGE_CONTENT");
                const result = await request<{ url: string }>("admin/media/images", { method: "POST", body: form });
                setImage(result.url);
                operation.setNotice("Görsel yüklendi.");
              });
            }} /></label>
            <ErrorNotice error={upload.error} />
            {upload.busy && <p role="status">Görsel yükleniyor…</p>}
            {operation.node}
            <label>Görsel adresi<input value={image} maxLength={1000} onChange={e => setImage(e.target.value)} placeholder="Görsel yükle veya https:// adresi gir" /></label>
            <label>Görsel açıklaması<input name="imageAltText" maxLength={300} defaultValue={value.coverImageAltText || value.imageAltText || ""} /></label>
          </div>
          {isContent && <><div className={s.formGrid}><label>Buton yazısı<input name="linkLabel" maxLength={100} defaultValue={value.linkLabel || ""} /></label><label>Buton bağlantısı<input name="linkUrl" maxLength={1000} defaultValue={value.linkUrl || ""} placeholder="/uye-kaydi veya https://…" /></label></div><details><summary>Gelişmiş seçenekler</summary><label>Ek veri (JSON)<textarea aria-label="Ek veri (JSON)" name="metadata" rows={3} defaultValue={value.metadata ? JSON.stringify(value.metadata, null, 2) : ""} /></label></details></>}
          <div className={s.formGrid}>{isAnnouncement && <label>Durum<select aria-label="Durum" name="status" defaultValue={value.status || "DRAFT"}><Options values={["DRAFT", "PUBLISHED", "ARCHIVED"]} /></select></label>}<label>Sıra<input name="displayOrder" type="number" min={0} max={100000} defaultValue={value.displayOrder || 0} required /></label></div>
          {isAnnouncement && <label>Yayın tarihi (isteğe bağlı)<input aria-label="Yayın tarihi (isteğe bağlı)" type="datetime-local" name="publishedAt" defaultValue={localDate(value.publishedAt)} /><small>Boş bırakılırsa yayına alındığı an kullanılır. İleri tarihli duyuru o tarihte görünür.</small></label>}
          <div className={s.checks}><label><input type="checkbox" name="featured" defaultChecked={value.featured} />Öne çıkar</label>{isAnnouncement ? <label><input type="checkbox" name="pinned" defaultChecked={value.pinned} />Sabitle</label> : <label><input type="checkbox" name="active" defaultChecked={value.active ?? true} />Sitede göster</label>}</div>
        </> : <>
          <label>Açıklama<input name="description" maxLength={300} defaultValue={value.description || ""} /></label>
          <label>Tür<select aria-label="Tür" name="type" defaultValue={value.type || "TEXT"}><Options values={["TEXT", "EMAIL", "URL", "PHONE", "JSON"]} /></select></label>
          <label>Değer<textarea aria-label="Değer" name="value" rows={6} maxLength={100000} defaultValue={value.value || ""} /></label>
          <div className={s.checks}><label><input type="checkbox" name="publicSetting" defaultChecked={value.publicSetting ?? true} />Herkese açık</label></div>
          <p className={s.muted}>Herkese açık ayarlar ziyaretçilere gönderilir. KVKK metnini değiştirirken ilgili sürüm ayarını da güncelle.</p>
        </>}
      </fieldset>
      <footer className={s.formActions}><button type="button" className={s.secondary} disabled={action.busy || upload.busy} onClick={guardedClose}>Vazgeç</button><button className={s.primary} disabled={action.busy || upload.busy}>{action.busy ? "Kaydediliyor…" : "Kaydet"}</button></footer>
    </form>
  </Modal>;
}
