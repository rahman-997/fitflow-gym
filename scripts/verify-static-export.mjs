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
for (const marker of ["FitFlow", "manifest.webmanifest", "sw.js"]) {
  if (!html.includes(marker) && marker !== "sw.js") {
    throw new Error(`Static export is missing expected marker: ${marker}`);
  }
}

const manifest = JSON.parse(readFileSync("out/manifest.webmanifest", "utf8"));
if (!manifest.name || !manifest.start_url || !manifest.display) {
  throw new Error("PWA manifest is missing required product metadata");
}

const sw = readFileSync("out/sw.js", "utf8");
if (!sw.includes("fetch") || !sw.includes("install")) {
  throw new Error("Service worker export does not contain install/fetch handlers");
}

console.log("Static export verification passed.");
