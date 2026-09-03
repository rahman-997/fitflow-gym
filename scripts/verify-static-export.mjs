import { existsSync, readFileSync, statSync } from "node:fs";

const requiredFiles = [
  "out/index.html",
  "out/sw.js",
  "out/manifest.webmanifest",
  "out/favicon.svg",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing static export file: ${file}`);
  }
}

if (!existsSync("out/_next") || !statSync("out/_next").isDirectory()) {
  throw new Error("Missing Next.js static asset directory: out/_next");
}

const html = readFileSync("out/index.html", "utf8");
for (const marker of ["FitFlow", "manifest.webmanifest"]) {
  if (!html.includes(marker)) {
    throw new Error(`Static export is missing expected marker: ${marker}`);
  }
}

const manifest = JSON.parse(readFileSync("out/manifest.webmanifest", "utf8"));
if (!manifest.name || !manifest.start_url || !manifest.display) {
  throw new Error("PWA manifest is missing required product metadata");
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  throw new Error("PWA manifest must declare at least one install icon");
}

for (const icon of manifest.icons) {
  if (typeof icon?.src !== "string" || !icon.src.startsWith("/")) {
    throw new Error("PWA manifest contains an invalid icon path");
  }

  const exportedIcon = `out${icon.src}`;
  if (!existsSync(exportedIcon)) {
    throw new Error(`PWA manifest icon is missing from static export: ${exportedIcon}`);
  }
}

const sw = readFileSync("out/sw.js", "utf8");
new Function(sw);

for (const marker of [
  'addEventListener("install"',
  'addEventListener("activate"',
  'addEventListener("fetch"',
  'request.mode === "navigate"',
  'url.pathname.startsWith("/_next/static/")',
  'key.startsWith(CACHE_PREFIX)',
  "!response.ok",
  "Response.error()",
]) {
  if (!sw.includes(marker)) {
    throw new Error(`Service worker is missing required cache-safety behavior: ${marker}`);
  }
}

const homepageFallbacks = sw.match(/caches\.match\("\/"\)/g) ?? [];
if (homepageFallbacks.length !== 1) {
  throw new Error("The app-shell fallback must be limited to navigation requests only");
}

if (sw.includes('filter((key) => key !== CACHE_NAME)')) {
  throw new Error("Service worker must not delete unrelated origin caches");
}

const netlifyConfig = readFileSync("netlify.toml", "utf8");
const nextStaticBlock = netlifyConfig.match(/for = "\/_next\/static\/\*"[\s\S]*?Cache-Control = "([^"]+)"/);
if (!nextStaticBlock?.[1]?.includes("immutable")) {
  throw new Error("Content-hashed Next.js assets must remain immutable-cached");
}

const publicAssetsBlock = netlifyConfig.match(/for = "\/assets\/\*"[\s\S]*?Cache-Control = "([^"]+)"/);
if (!publicAssetsBlock?.[1] || publicAssetsBlock[1].includes("immutable")) {
  throw new Error("Unversioned public assets must remain refreshable across deployments");
}

const pageSource = readFileSync("app/page.tsx", "utf8");
if (!pageSource.includes('navigator.serviceWorker.register("/sw.js")')) {
  throw new Error("FitFlow does not register the exported service worker");
}

console.log("Static export and PWA cache-safety verification passed.");
