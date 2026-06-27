// シャーレ暗号解読 PWA Service Worker
// 方針：ナビゲーションは network-first（最新を取りつつオフライン時はキャッシュ）、
// 同一オリジンの静的資産（JS/CSS/画像など）は stale-while-revalidate でキャッシュ。
const VERSION = "v2";
const CACHE = "schale-cipher-" + VERSION;
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./favicon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // ページ遷移：network-first → 失敗時はキャッシュ済みの index.html
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone(); // 本体消費前に同期でクローン
          caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  // 同一オリジンの静的資産：stale-while-revalidate
  if (sameOrigin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const fetchP = fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone(); // 本体消費前に同期でクローン
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
        return cached || fetchP;
      })
    );
  }
  // クロスオリジンはそのままネットワーク（介入しない）
});
