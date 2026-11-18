const CACHE_PREFIX = "fitflow-";
const SHELL_CACHE = "fitflow-shell-v5";
const RUNTIME_CACHE = "fitflow-runtime-v5";
const MAX_RUNTIME_ENTRIES = 80;
const ACTIVE_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE]);
const STATIC_ASSET = /\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|woff2?|webmanifest)$/i;
const CORE_ASSETS = ["/", "/favicon.svg"];

self.addEventListener("install", (event) => {
  // Never bypass the privacy filter when pre-caching the shell. Do not send
  // session cookies even if the worker registers during an authenticated visit.
  event.waitUntil(Promise.all(CORE_ASSETS.map(async (asset) => {
    const request = new Request(new URL(asset, self.location.origin), {
      credentials: "omit",
      cache: "no-store",
    });
    const response = await fetch(request);
    await cacheResponse(SHELL_CACHE, request, response);
  })));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && !ACTIVE_CACHES.has(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never persist query-string variants, authorization requests, or private responses.
  if (url.search || request.headers.has("authorization") || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    if (url.pathname !== "/" && url.pathname !== "/index.html") return;
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  if (STATIC_ASSET.test(url.pathname)) event.respondWith(networkFirstRequest(request));
});

async function networkFirstNavigation(request) {
  try {
    // Navigation HTML can be session-specific. Offline fallback uses only the
    // credential-free shell pre-cached during install.
    const response = await fetch(request);
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match("/")) || Response.error();
  }
}

async function networkFirstRequest(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    return (await caches.match(request)) || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await cacheResponse(RUNTIME_CACHE, request, response);
  return response;
}

async function cacheResponse(cacheName, request, response) {
  // A public-looking URL can still return user-specific content. Do not let
  // Vary: Cookie/Authorization, HTML fallbacks, or downloads persist offline.
  const vary = response.headers.get("vary") || "";
  const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!response.ok || response.type === "opaque" ||
      /(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(response.headers.get("cache-control") || "") ||
      response.headers.has("set-cookie") || response.headers.has("content-disposition") ||
      /(?:^|,)\s*(?:cookie|authorization|\*)\s*(?:,|$)/i.test(vary) ||
      contentType === "text/html" || contentType === "application/xhtml+xml") return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  if (cacheName === RUNTIME_CACHE) await trimCache(cacheName, MAX_RUNTIME_ENTRIES);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;
  if (overflow <= 0) return;
  await Promise.all(keys.slice(0, overflow).map((request) => cache.delete(request)));
}
