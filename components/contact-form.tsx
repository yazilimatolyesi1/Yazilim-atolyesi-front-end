"use client";
import { FormEvent, useRef, useState } from "react";
import { ApiError, request } from "../lib/api";
import { FieldErrors } from "./admin/shared";
export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const status = useRef<HTMLDivElement>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError(null);
    try {
      await request("contact/messages", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSent(true);
      form.reset();
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError("Mesaj gönderilemedi."),
      );
    } finally {
      setBusy(false);
      setTimeout(() => status.current?.focus(), 0);
    }
  }
  return (
    <div>
      <p className="form-intro">
        Kulüp, etkinlikler veya ekiplerimiz hakkında merak ettiklerini bize
        gönder.
      </p>
      <div ref={status} tabIndex={-1} role={error ? "alert" : "status"}>
        {sent && (
          <div className="form-success">
            <h3>Mesajın bize ulaştı.</h3>
            <p>En kısa zamanda dönüş yapacağız.</p>
            <button
              type="button"
              className="text-button"
              onClick={() => setSent(false)}
            >
              Yeni mesaj yaz
            </button>
          </div>
        )}
        {error && (
          <div className="form-error">
            <p>{error.message}</p>
            <FieldErrors error={error} />
          </div>
        )}
      </div>
      {!sent && (
        <form className="club-form" onSubmit={submit} aria-busy={busy}>
          <div className="form-row">
            <label>
              Ad soyad
              <input
                name="name"
                autoComplete="name"
                maxLength={160}
                required
                placeholder="Adın ve soyadın"
              />
            </label>
            <label>
              E-posta
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={190}
                required
                placeholder="ornek@mail.com"
              />
            </label>
          </div>
          <label>
            Konu
            <input
              name="subject"
              maxLength={200}
              required
              placeholder="Mesajının konusu"
            />
          </label>
          <label>
            Mesajın
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={10000}
              rows={5}
              placeholder="Bize ne anlatmak istersin?"
            />
          </label>
          <button className="club-button" disabled={busy} type="submit">
            {busy ? "Gönderiliyor…" : "Mesaj gönder"}
          </button>
        </form>
      )}
    </div>
  );
}
