// Tercio Suite: funciona sin conexión.
// Al publicar cambios, sube el número de versión para que los móviles descarguen la nueva.
const VERSION = "tercio-suite-v3";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg?v=1",
  "./icon-192.png?v=1",
  "./icon-512.png?v=1",
  "./icon-maskable.png?v=1",
  "./apple-touch-icon.png?v=1"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Página: primero la red (para tener siempre lo último) y, sin cobertura, la copia guardada.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copia)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Iconos propios y tipografías de Google: copia guardada y, si no hay, la red.
  const propio = url.origin === self.location.origin;
  const fuentes = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (propio || fuentes) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") { const copia = res.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
        return res;
      }))
    );
  }
});
