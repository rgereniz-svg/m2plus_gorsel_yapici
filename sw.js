/* Kapak Stüdyosu — çevrimdışı çalışma katmanı.
   Uygulama dosyaları ağ-önce (yeni sürüm hemen gelir, çevrimdışıysa önbellekten),
   font ve simgeler önbellek-önce (değişmiyorlar, hız için). */
const V = "kapak-v18";
const SHELL = [
  "./",
  "./kapak_studyosu.html",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const external = /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.hostname);
  if (url.origin !== location.origin && !external) return;

  /* uygulama dosyaları (html/js/json): ağ önce — eski sürüm asla yapışıp kalmasın */
  const appFile = url.origin === location.origin
    && (req.mode === "navigate" || /\.(html|js|json)$/.test(url.pathname) || url.pathname.endsWith("/"));

  if (appFile) {
    e.respondWith((async () => {
      const cache = await caches.open(V);
      try {
        const res = await fetch(req, { cache: "no-store" });
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: true });
        return hit || new Response("Çevrimdışı", { status: 503, statusText: "offline" });
      }
    })());
    return;
  }

  /* font, simge, görsel: önbellek önce, arkada tazele */
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    return hit || (await net) || new Response("Çevrimdışı", { status: 503, statusText: "offline" });
  })());
});
