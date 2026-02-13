// public/sw.js
const VERSION = "v2";
const CACHE_NAME = `nico-entrenos-${VERSION}`;
const RUNTIME_CACHE = `nico-entrenos-runtime-${VERSION}`;

// Archivos mínimos para que “abra” offline
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Borra caches viejas automáticamente
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("nico-entrenos-") && !k.includes(VERSION))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejamos GET del mismo origen
  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // 1) Navegación (HTML): network-first (clave para ver updates)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match("/");
      }
    })());
    return;
  }

  // 2) Assets estáticos: cache-first
  // (js/css/images y resources del build)
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      const res = await fetch(req);
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
      return res;
    })());
  }
});