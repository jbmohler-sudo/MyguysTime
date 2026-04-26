const VERSION = new URL(self.location.href).searchParams.get("v") || "2026-04-24-1";
const CACHE_NAME = `my-guys-time-${VERSION}`;
const PRECACHE = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("my-guys-time-") && key != CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith("/api/")) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);

    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const clone = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    } catch (error) {
      if (cached) {
        return cached;
      }

      if (event.request.mode === "navigate") {
        const appShell = await caches.match("/index.html");
        if (appShell) {
          return appShell;
        }
      }

      return new Response(null, { status: 503, statusText: "Service Unavailable" });
    }
  })());
});
