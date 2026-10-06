"use client";
import { useState } from "react";
import { request } from "../../lib/api";
import type { MemberDetail, MemberRecord, MessageRecord, PageResult, Profile, Role, UserRecord } from "../../lib/admin-types";
import { Badge, date, ErrorNotice, ListState, Modal, names, Options, Pagination, useMutation, useOperation, useRemote } from "./shared";
import s from "./dashboard.module.css";

export function People({ kind, profile }: { kind: "members" | "users" | "contact-messages"; profile: Profile }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<MemberRecord | UserRecord | MessageRecord | null>(null);
  const operation = useOperation();
  const members = kind === "members", users = kind === "users";
  const remote = useRemote<PageResult<MemberRecord | UserRecord | MessageRecord>>(`admin/${kind}?page=${page}&size=10&q=${encodeURIComponent(query)}${filter ? `&${members ? "membershipStatus" : "status"}=${filter}` : ""}`);
  return <>
    <div className={s.toolbar}><label className={s.search}>Ara<input type="search" placeholder={members || users ? "Ad veya e-posta ara…" : "Gönderen veya konu ara…"} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label>
      <label>Durum<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="">Tümü</option><Options values={members ? ["PENDING", "APPROVED", "REJECTED"] : users ? ["ACTIVE", "PASSIVE", "SUSPENDED"] : ["NEW", "READ", "REPLIED", "ARCHIVED"]} /></select></label>
      <button className={s.secondary} onClick={remote.refresh}>Yenile ↻</button>
    </div>
    {operation.node}
    <div className={s.card}><ListState loading={remote.loading} error={remote.error} empty={!remote.data?.content.length} retry={remote.refresh} />
      {!remote.loading && !remote.error && !!remote.data?.content.length && <div className={s.tableScroll}><table><thead><tr><th>{members || users ? "Kişi" : "Gönderen"}</th><th>{members ? "Eğitim" : users ? "Roller" : "Konu"}</th><th>Durum</th><th>Tarih</th><th><span className="sr-only">İşlem</span></th></tr></thead><tbody>{remote.data.content.map(item => {
        const member = item as MemberRecord, user = item as UserRecord, message = item as MessageRecord;
        return <tr key={members ? member.userId : user.id}><td><strong>{members || users ? `${user.firstName} ${user.lastName}` : message.name}</strong><small>{item.email}</small></td>
          <td>{members ? <>{member.institutionName || "—"}<small>{member.department}</small></> : users ? user.roles.map(role => names[role]).join(", ") || "Rol verilmedi" : message.subject}</td>
          <td><Badge value={members ? member.membershipStatus : user.status} /></td><td>{date(members ? member.appliedAt : user.createdAt)}</td>
          <td><button className={s.tableButton} onClick={() => { setSelected(item); operation.clear(); }}>{members ? "İncele" : users ? "Yönet" : "Mesajı aç"} →</button></td>
        </tr>;
      })}</tbody></table></div>}
      {remote.data && !remote.loading && !remote.error && <Pagination page={page} pages={remote.data.totalPages} total={remote.data.totalElements} setPage={setPage} />}
    </div>
    {selected && (members ? <MemberReview userId={(selected as MemberRecord).userId} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); operation.setNotice("Başvuru kararı kaydedildi."); remote.refresh(); }} /> : users ? <UserEditor user={selected as UserRecord} own={profile.userId === (selected as UserRecord).id} onClose={() => setSelected(null)} onSaved={() => { remote.refresh(); }} /> : <MessageEditor message={selected as MessageRecord} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); operation.setNotice("Mesaj güncellendi."); if (remote.data?.content.length === 1 && page > 0) setPage(page - 1); else remote.refresh(); }} />)}
  </>;
}

function MemberReview({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const remote = useRemote<MemberDetail>(`admin/members/${userId}`);
  const action = useMutation();
  const [decision, setDecision] = useState("APPROVED");
  const person = remote.data;
  return <Modal title="Üyelik başvurusu" onClose={onClose} busy={action.busy}>
    <ListState loading={remote.loading} error={remote.error} empty={false} retry={remote.refresh} />
    {person && !remote.loading && !remote.error && <><div className={s.detail}><div className={s.person}><div className={s.avatar}>{person.personal?.firstName?.[0] || "Ü"}</div><div><h3>{person.personal?.firstName} {person.personal?.lastName}</h3><p>{person.email}</p></div><Badge value={person.membership?.status || "PENDING"} /></div>
      <dl className={s.definition}><div><dt>Telefon</dt><dd>{person.personal?.phone || "—"}</dd></div><div><dt>Şehir</dt><dd>{person.personal?.city || "—"}</dd></div><div><dt>Okul</dt><dd>{person.education?.institutionName || "—"}</dd></div><div><dt>Bölüm</dt><dd>{person.education?.department || "—"}</dd></div><div><dt>Deneyim</dt><dd>{names[person.membership?.experienceLevel || ""] || "—"}</dd></div><div><dt>Etkinlik gönüllüsü</dt><dd>{person.membership?.volunteerForEvents ? "Evet" : "Hayır"}</dd></div></dl>
      <h4>Katılma motivasyonu</h4><p className={s.prose}>{person.membership?.motivation || "—"}</p><h4>İlgi alanları</h4><p>{person.membership?.interests.map(i => i.name).join(", ") || "—"}</p>
      {person.membership?.reviewNote && <><h4>Önceki değerlendirme</h4><p>{person.membership.reviewNote}</p></>}
      <details><summary>İzin geçmişi</summary>{person.consentRecords.map((c, i) => <p key={i}>{c.type === "MARKETING_COMMUNICATION" ? "İletişim izni" : "KVKK okundu beyanı"}: {c.accepted ? "Evet" : "Hayır"} · Sürüm {c.documentVersion} · {date(c.recordedAt)}</p>)}</details>
    </div><form className={s.form} onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void action.run(async () => { await request(`admin/members/${userId}/review`, { method: "PATCH", body: JSON.stringify({ status: decision, reviewNote: String(form.get("reviewNote") || "") }) }); onSaved(); }); }}>
      <ErrorNotice error={action.error} /><label>Karar<select aria-label="Karar" value={decision} onChange={e => setDecision(e.target.value)}><Options values={["APPROVED", "REJECTED"]} /></select></label><label>Değerlendirme notu{decision === "REJECTED" ? " (zorunlu)" : " (isteğe bağlı)"}<textarea name="reviewNote" required={decision === "REJECTED"} maxLength={1000} rows={3} /></label>
      <footer className={s.formActions}><button type="button" className={s.secondary} onClick={onClose} disabled={action.busy}>Kapat</button><button className={s.primary} disabled={action.busy}>{action.busy ? "Kaydediliyor…" : "Kararı kaydet"}</button></footer>
    </form></>}
  </Modal>;
}

function UserEditor({ user, own, onClose, onSaved }: { user: UserRecord; own: boolean; onClose: () => void; onSaved: () => void }) {
  const [roles, setRoles] = useState<Role[]>(user.roles);
  const [status, setStatus] = useState(user.status);
  const operation = useOperation();
  const action = useMutation();
  return <Modal title="Kullanıcı yönetimi" onClose={onClose} busy={action.busy}><div className={s.form}><h3>{user.firstName} {user.lastName}</h3><p>{user.email}</p><ErrorNotice error={action.error} />{operation.node}
    {own && <p className={s.hint}>Kendi yönetici erişimini kaybetmemek için bu panelden kendi rolünü ve hesap durumunu değiştiremezsin.</p>}
    <fieldset disabled={own || action.busy}><legend>Roller</legend><div className={s.checks}>{(["ADMIN", "EDITOR", "MEMBER"] as Role[]).map(role => <label key={role}><input type="checkbox" checked={roles.includes(role)} onChange={e => setRoles(previous => e.target.checked ? [...previous, role] : previous.filter(r => r !== role))} />{names[role]}</label>)}</div>
      <button className={s.secondary} onClick={() => { void action.run(async () => { await request(`admin/users/${user.id}/roles`, { method: "PATCH", body: JSON.stringify({ roles }) }); operation.setNotice("Roller güncellendi."); onSaved(); }); }}>Rolleri kaydet</button>
      <label>Hesap durumu<select aria-label="Hesap durumu" value={status} onChange={e => setStatus(e.target.value)}><Options values={["ACTIVE", "PASSIVE", "SUSPENDED"]} /></select></label>
      <button className={s.secondary} onClick={() => { void action.run(async () => { await request(`admin/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); operation.setNotice("Hesap durumu güncellendi."); onSaved(); }); }}>Durumu kaydet</button>
    </fieldset><footer className={s.formActions}><button className={s.primary} disabled={action.busy} onClick={onClose}>Tamam</button></footer>
  </div></Modal>;
}

function MessageEditor({ message, onClose, onSaved }: { message: MessageRecord; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(message.status);
  const action = useMutation();
  return <Modal title={message.subject} onClose={onClose} busy={action.busy}><div className={s.form}><p><strong>{message.name}</strong> · {message.email}</p><p className={s.muted}>{date(message.createdAt)}{message.phone && ` · ${message.phone}`}</p><p className={s.messageBody}>{message.message}</p><ErrorNotice error={action.error} />
    <label>Mesaj durumu<select aria-label="Mesaj durumu" value={status} onChange={e => setStatus(e.target.value)}><Options values={["NEW", "READ", "REPLIED", "ARCHIVED"]} /></select></label><p className={s.muted}>Bu işlem yalnızca takip durumunu günceller; e-posta göndermez.</p>
    <footer className={s.formActions}><button className={s.dangerText} disabled={action.busy} onClick={() => { if (!window.confirm("Bu mesaj kalıcı olarak silinsin mi?")) return; void action.run(async () => { await request(`admin/contact-messages/${message.id}`, { method: "DELETE" }); onSaved(); }); }}>Mesajı sil</button><button className={s.primary} disabled={action.busy} onClick={() => { void action.run(async () => { await request(`admin/contact-messages/${message.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); onSaved(); }); }}>{action.busy ? "Kaydediliyor…" : "Durumu kaydet"}</button></footer>
  </div></Modal>;
}
