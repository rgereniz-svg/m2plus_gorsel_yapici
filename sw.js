/* Kapak — çevrimdışı kabuk. Her güncellemede V değişmeli. */
const V = "kapak-sade-2026-10-31a";
const CORE = ["./", "./index.html", "./kapak_studyosu.html", "./manifest.json",
              "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const html = r.mode === "navigate" || /\.html$/.test(new URL(r.url).pathname);
  if (html) {   /* sayfa: önce ağ (güncel sürüm), yoksa önbellek */
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match("./kapak_studyosu.html"))));
    return;
  }
  /* diğerleri (font, ikon): önce önbellek */
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
    if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
    return res; })));
});
