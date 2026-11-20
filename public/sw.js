const CACHE_PREFIX = "fitflow-";
const SHELL_CACHE = "fitflow-shell-v6";
const RUNTIME_CACHE = "fitflow-runtime-v6";
const MAX_RUNTIME_ENTRIES = 80;
const ACTIVE_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE]);
const STATIC_ASSET = /\.(?:css|js|mjs|png|jpe?g|webp|svg|ico|woff2?|webmanifest)$/i;
const CORE_ASSETS = ["/", "/favicon.svg"];
// Explicitly known public resources; never cache an arbitrary user-controlled
// path merely because it ends with .svg, .png, .css, or .js.
const PUBLIC_ASSETS = new Set([
  "/favicon.svg", "/icon-192.png", "/icon-512.png",
  "/manifest.webmanifest", "/og.png",
  "/assets/fitflow-hero.png", "/assets/fitflow-programs-grid.png",
]);

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

  if (PUBLIC_ASSETS.has(url.pathname) && STATIC_ASSET.test(url.pathname)) event.respondWith(networkFirstRequest(request));
});

async function networkFirstNavigation(request) {
  try {
    // Navigation HTML can be session-specific. Offline fallback uses only the
    // credential-free shell pre-cached during install.
    const response = await fetch(request);
    return response;
  } catch {
    // Restrict offline navigation to the validated shell cache. CacheStorage.match()
// searches every cache in this origin, including unrelated/private caches.
const shell = await caches.open(SHELL_CACHE);
return (await shell.match("/")) || Response.error();
  }
}

async function networkFirstRequest(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    const runtime = await caches.open(RUNTIME_CACHE);
return (await runtime.match(request)) || Response.error();
  }
}

async function cacheFirstAsset(request) {
  // Never use the origin-wide CacheStorage.match for immutable chunks.
const runtime = await caches.open(RUNTIME_CACHE);
const cached = await runtime.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await cacheResponse(RUNTIME_CACHE, request, response);
  return response;
}

async function cacheResponse(cacheName, request, response) {
  // Cache Storage can replay a user-specific representation while offline.
  // Do not persist content keyed on cookies, auth headers, or wildcard Vary.
  const vary = (response.headers.get("vary") || "")
    .split(",").map((header) => header.trim().toLowerCase());
  const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const url = new URL(request.url);
  const publicOfflineShell = cacheName === SHELL_CACHE && request.credentials === "omit" &&
    url.origin === self.location.origin && url.pathname === "/" && !url.search;
  if (vary.some((header) => header === "*" || header === "cookie" || header === "authorization")) return;
  if (!response.ok || response.type === "opaque" ||
      /(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(response.headers.get("cache-control") || "") ||
      response.headers.has("set-cookie") || response.headers.has("content-disposition") ||
      (!publicOfflineShell && (contentType === "text/html" || contentType === "application/xhtml+xml"))) return;
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
