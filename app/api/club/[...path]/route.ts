import { NextRequest, NextResponse } from "next/server";
import { apiBase } from "../../../../lib/server-api";

// Explicit method/path permissions; Spring checks the current user's roles.
const id = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const routes: Record<string, RegExp[]> = {
  GET: [
    /^(announcements|membership\/options|settings\/public|users\/me)$/,
    // Duyuru detayı slug ile gelir; UUID değil slug.
    /^announcements\/[^/]+$/,
    /^pages\/(HOME|ABOUT|CONTACT)$/,
    new RegExp(`^media/images/${id}$`),
    new RegExp(`^admin/(announcements|contents|settings|contact-messages|members|users)(/${id})?$`),
  ],
  POST: [/^(auth\/(login|register|logout)|contact\/messages)$/, /^admin\/(announcements|contents|settings|media\/images)$/],
  PUT: [new RegExp(`^admin/(announcements|contents|settings)/${id}$`)],
  PATCH: [
    /^users\/me\/password$/,
    new RegExp(`^admin/(announcements|contents)/${id}/priority$`),
    new RegExp(`^admin/members/${id}/review$`),
    new RegExp(`^admin/users/${id}/(roles|status)$`),
    new RegExp(`^admin/contact-messages/${id}/status$`),
  ],
  DELETE: [new RegExp(`^admin/(announcements|contents|settings|contact-messages|media/images)/${id}$`)],
};
const cookieName = "club_session";
const noCache = { "Cache-Control": "no-store" };
const fail = (message: string, status: number) => NextResponse.json({ message }, { status, headers: noCache });

async function readBody(req: NextRequest, limit: number) {
  if (Number(req.headers.get("content-length")) > limit) throw new RangeError();
  if (!req.body) return undefined;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new RangeError(); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const path = (await ctx.params).path.join("/");
  if (!routes[req.method]?.some(pattern => pattern.test(path))) return fail("İşlem bulunamadı.", 404);
  const siteOrigin = process.env.CLUB_SITE_URL ? new URL(process.env.CLUB_SITE_URL).origin : req.nextUrl.origin;
  if (req.method !== "GET" && req.headers.get("origin") !== siteOrigin) return fail("İstek kaynağı doğrulanamadı.", 403);
  if (path === "auth/logout") {
    const response = NextResponse.json({ message: "Çıkış yapıldı." }, { headers: noCache });
    response.cookies.delete(cookieName);
    return response;
  }
  const protectedPath = path.startsWith("admin/") || path.startsWith("users/me");
  const headers: Record<string, string> = {};
  if (protectedPath) {
    const token = req.cookies.get(cookieName)?.value;
    if (!token) return fail("Oturum açman gerekiyor.", 401);
    headers.Authorization = `Bearer ${token}`;
  }
  const upload = path === "admin/media/images" && req.method === "POST";
  if (req.method !== "GET" && req.method !== "DELETE") {
    const contentType = req.headers.get("content-type") || "";
    if (upload ? !contentType.startsWith("multipart/form-data;") : !contentType.startsWith("application/json")) return fail("İstek içeriği desteklenmiyor.", 415);
    headers["Content-Type"] = contentType;
  }
  try {
    const body = req.method === "GET" ? undefined : await readBody(req, upload ? 6 * 1024 * 1024 : 512 * 1024);
    const upstream = await fetch(`${apiBase()}/${path}${req.nextUrl.search}`, {
      method: req.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    let response: NextResponse;
    if (upstream.status === 204) {
      response = new NextResponse(null, { status: 204, headers: noCache });
    } else if (path.startsWith("media/images/") && upstream.ok) {
      response = new NextResponse(upstream.body, {
        headers: { ...noCache, "Content-Type": upstream.headers.get("content-type") || "application/octet-stream", "X-Content-Type-Options": "nosniff" },
      });
    } else {
      const data = await upstream.json();
      if (path === "auth/login" && upstream.ok) {
        if (typeof data.accessToken !== "string" || !Number.isFinite(Date.parse(data.expiresAt))) throw new Error("Invalid auth response");
        response = NextResponse.json({ user: data.user, expiresAt: data.expiresAt }, { headers: noCache });
        response.cookies.set(cookieName, data.accessToken, {
          httpOnly: true, sameSite: "lax", secure: new URL(siteOrigin).protocol === "https:", path: "/", expires: new Date(data.expiresAt),
        });
      } else response = NextResponse.json(data, { status: upstream.status, headers: noCache });
    }
    if (protectedPath && upstream.status === 401) response.cookies.delete(cookieName);
    for (const name of ["X-Request-Id", "Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining"]) {
      const value = upstream.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    return response;
  } catch (error) {
    if (error instanceof RangeError) return fail("Gönderilen içerik çok büyük.", 413);
    return fail("Sunucuya şu anda ulaşılamıyor. Lütfen daha sonra tekrar dene.", 503);
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
