import { createServer } from "node:http";

const UPSTREAM = process.env.MOCK_UPSTREAM || "http://127.0.0.1:8080/api/v1";
const PORT = Number(process.env.MOCK_CONTENT_PORT || 9099);

/**
 * E2E icerik API'si. Normal istekleri gercek backend'e (8080) iletir; test
 * suresince `/__control` uzerinden hangi sayfanin nasil davranacagi ayarlanir.
 * Boylece Next.js server component'inin yaptigi SSR fetch'i de test edilebilir;
 * `page.route` yalnizca tarayici isteklerini yakalar, Node fetch'ini yakalayamaz.
 */
const control = { mode: "proxy" }; // proxy | malicious | fail

const MALICIOUS_HTML = '<script>alert("xss")</script><b>Kalın Metin</b>Normal metin';

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

// Multipart / ikili govdeleri bozmadan iletmek icin ham bayt dizisi dondurur.
function readBuffer(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function proxy(req, res, path) {
  const headers = { ...req.headers };
  delete headers["host"];
  delete headers["connection"];
  delete headers["content-length"];
  delete headers["transfer-encoding"];
  // undici `expect: 100-continue` basligini desteklemez.
  delete headers["expect"];
  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await readBuffer(req);
  }
  try {
    const upstream = await fetch(`${UPSTREAM}/${path}`, { ...init, signal: AbortSignal.timeout(15000) });
    const buffer = Buffer.from(await upstream.arrayBuffer());
    const responseHeaders = {};
    for (const [key, value] of upstream.headers) {
      // undici gzip/brotli'yi cozer; bu basliklari iletmek bozulmaya yol acar.
      if (["content-encoding", "content-length", "transfer-encoding", "connection"].includes(key)) continue;
      responseHeaders[key] = value;
    }
    const cookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
    if (cookies.length > 0) responseHeaders["set-cookie"] = cookies;
    res.writeHead(upstream.status, responseHeaders);
    res.end(buffer);
  } catch (error) {
    console.error("[mock-content-api] proxy error:", error);
    json(res, 503, { message: "Sunucuya şu anda ulaşılamıyor." });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname.replace(/^\/api\/v1\//, "").replace(/^\//, "");

  if (url.pathname === "/__health") return json(res, 200, { ok: true, mode: control.mode });
  if (url.pathname === "/__control" && req.method === "POST") {
    const body = await readBody(req);
    try { Object.assign(control, JSON.parse(body || "{}")); } catch { /* ignore */ }
    return json(res, 200, control);
  }

  // Icerik sayfalari test moduna gore davranir.
  if (path.startsWith("pages/")) {
    if (control.mode === "fail") return json(res, 500, { message: "Beklenmeyen bir hata oluştu." });
    if (control.mode === "malicious") {
      const page = path.split("/")[1];
      const contentKey = page === "HOME" ? "home-hero" : page === "ABOUT" ? "about-main" : "contact-main";
      return json(res, 200, {
        contents: [{
          id: `${page.toLowerCase()}-xss-test`,
          page,
          contentType: page === "HOME" ? "HERO" : page === "CONTACT" ? "CONTACT_INFO" : "TEXT",
          contentKey,
          title: MALICIOUS_HTML,
          subtitle: MALICIOUS_HTML,
          body: MALICIOUS_HTML,
          displayOrder: 10,
          active: true,
        }],
      });
    }
  }

  return proxy(req, res, `${path}${url.search}`);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-content-api] http://127.0.0.1:${PORT} -> ${UPSTREAM}`);
});
