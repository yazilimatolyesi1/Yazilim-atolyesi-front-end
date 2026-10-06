"use client";
import { useState } from "react";
import { request } from "../../lib/api";
import type { AnnouncementRecord, ContentRecord, PageResult, SettingRecord } from "../../lib/admin-types";
import { Badge, date, ErrorNotice, ListState, names, Options, Pagination, useMutation, useOperation, useRemote } from "./shared";
import { ResourceEditor, type EditorValue, type ResourceKind } from "./resource-editor";
import s from "./dashboard.module.css";

export function Resources({ kind }: { kind: ResourceKind }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<EditorValue | null>(null);
  const operation = useOperation();
  const isNews = kind === "announcements";
  const remote = useRemote<PageResult<AnnouncementRecord> | ContentRecord[] | SettingRecord[]>(`admin/${kind}${isNews ? `?page=${page}&size=10&q=${encodeURIComponent(query)}${filter ? `&status=${filter}` : ""}` : kind === "contents" && filter ? `?page=${filter}` : ""}`);
  const action = useMutation();
  const result = remote.data && !Array.isArray(remote.data) ? remote.data : null;
  const items: EditorValue[] = (Array.isArray(remote.data) ? remote.data : result?.content || []).filter(item => isNews || JSON.stringify(item).toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")));
  const title = kind === "announcements" ? "Duyuru" : kind === "contents" ? "İçerik" : "Ayar";
  return <>
    <div className={s.toolbar}><label className={s.search}>Ara<input type="search" aria-label={`${title} ara`} placeholder={isNews ? "Başlık veya içerik ara…" : "Kayıtlarda ara…"} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label>
      {kind !== "settings" && <label>Filtre<select aria-label={`${title} filtresi`} value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="">Tümü</option><Options values={isNews ? ["DRAFT", "PUBLISHED", "ARCHIVED"] : ["HOME", "ABOUT", "CONTACT"]} /></select></label>}
      <button className={s.primary} onClick={() => { setEditing({}); operation.clear(); }}>+ {title} oluştur</button>
    </div>
    {kind === "contents" && <p className={s.hint}>Aktif içerikler seçtiğin bölümde görünür. Küçük sıra numarası önce gösterilir.</p>}
    {kind === "settings" && <p className={s.hint}>İletişim için contact.email, contact.phone, contact.address; sosyal bağlantılar için social.github, social.linkedin, social.instagram, social.youtube kullanılır.</p>}
    {operation.node}
    <ErrorNotice error={action.error} />
    <div className={s.card}>
      <ListState loading={remote.loading} error={remote.error} empty={!items.length} retry={remote.refresh} />
      {!remote.loading && !remote.error && items.length > 0 && <div className={s.tableScroll}><table><thead><tr><th>{kind === "settings" ? "Ayar" : "Başlık"}</th><th>{isNews ? "Durum" : kind === "contents" ? "Sayfa / tür" : "Görünürlük"}</th><th>{isNews ? "Yayın" : kind === "contents" ? "Sıra" : "Tür"}</th><th><span className="sr-only">İşlemler</span></th></tr></thead><tbody>{items.map(item => <tr key={item.id}>
        <td><strong>{item.title || item.description || item.key}</strong><small>{kind === "settings" ? item.key : isNews ? item.category || "Genel" : item.key}</small>{item.featured && <small className={s.accent}>Öne çıkan</small>}</td>
        <td>{isNews ? <Badge value={item.status!} /> : kind === "contents" ? <><span>{names[item.page!]}</span><small>{names[item.type!]} · {item.active ? "Aktif" : "Gizli"}</small></> : <Badge value={item.publicSetting ? "Herkese açık" : "Özel"} />}</td>
        <td>{isNews ? date(item.publishedAt) : kind === "contents" ? item.displayOrder : names[item.type!] || item.type}</td>
        <td><div className={s.rowActions}><button onClick={() => { setEditing(item); operation.clear(); }}>Düzenle</button><button className={s.dangerText} disabled={action.busy} onClick={() => {
          if (!window.confirm(`“${item.title || item.key}” kalıcı olarak silinsin mi?`)) return;
          void action.run(async () => { await request(`admin/${kind}/${item.id}`, { method: "DELETE" }); operation.setNotice("Kayıt silindi."); if (items.length === 1 && page > 0) setPage(page - 1); else remote.refresh(); });
        }}>Sil</button></div></td>
      </tr>)}</tbody></table></div>}
      {isNews && result && !remote.loading && !remote.error && <Pagination page={page} pages={result.totalPages} total={result.totalElements} setPage={setPage} />}
    </div>
    {editing && <ResourceEditor kind={kind} value={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); operation.setNotice("Değişiklikler kaydedildi."); remote.refresh(); }} />}
  </>;
}
