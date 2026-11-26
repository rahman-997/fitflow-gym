import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { inflateSync } from "node:zlib";
import test from "node:test";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

// Fully validates a PNG: signature, every chunk CRC, IEND, and that the
// decompressed pixel data has exactly the size the header promises.
export function validatePng(buf) {
  assert.ok(buf.subarray(0, 8).equals(SIGNATURE), "missing PNG signature");
  let pos = 8;
  let header = null;
  const idat = [];
  let sawEnd = false;
  while (pos < buf.length) {
    assert.ok(pos + 12 <= buf.length, "truncated chunk header");
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    assert.ok(pos + 12 + len <= buf.length, `truncated ${type} chunk`);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    assert.equal(buf.readUInt32BE(pos + 8 + len), crc32(buf.subarray(pos + 4, pos + 8 + len)), `bad CRC in ${type}`);
    if (type === "IHDR") header = { w: body.readUInt32BE(0), h: body.readUInt32BE(4), depth: body[8], color: body[9], interlace: body[12] };
    if (type === "IDAT") idat.push(body);
    pos += 12 + len;
    if (type === "IEND") { sawEnd = true; break; }
  }
  assert.ok(header, "missing IHDR");
  assert.ok(sawEnd, "missing IEND (file is truncated)");
  const raw = inflateSync(Buffer.concat(idat));
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.color];
  if (header.interlace === 0 && channels) {
    const rowBytes = Math.ceil((header.w * channels * header.depth) / 8) + 1;
    assert.equal(raw.length, rowBytes * header.h, "pixel data size does not match header");
  }
  return header;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test("every raster asset under public/ is a complete, decodable PNG", () => {
  const files = walk("public").filter((f) => [".png"].includes(extname(f).toLowerCase()));
  assert.ok(files.length > 0);
  for (const f of files) assert.doesNotThrow(() => validatePng(readFileSync(f)), f);
});

test("manifest icons and page metadata images exist and decode", () => {
  const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
  const layout = readFileSync("app/layout.tsx", "utf8");
  const refs = new Set(manifest.icons.map((i) => i.src).filter((s) => s.endsWith(".png")));
  for (const m of layout.matchAll(/["'](\/[^"']+\.png)["']/g)) refs.add(m[1]);
  assert.ok(refs.size >= 3);
  for (const ref of refs) {
    const file = join("public", ref);
    assert.ok(existsSync(file), `${ref} is referenced but missing`);
    validatePng(readFileSync(file));
  }
});

test("source never references a missing or corrupt raster asset", () => {
  const src = [readFileSync("app/page.tsx", "utf8"), readFileSync("app/globals.css", "utf8")].join("\n");
  for (const m of src.matchAll(/["'(](\/[\w./-]+\.(?:png|jpe?g|webp|gif))/g)) {
    const file = join("public", m[1]);
    assert.ok(existsSync(file), `${m[1]} referenced in source but missing`);
    if (file.endsWith(".png")) validatePng(readFileSync(file));
  }
});

test("detector rejects a truncated PNG", () => {
  const good = readFileSync("public/icon-192.png");
  assert.doesNotThrow(() => validatePng(good));
  assert.throws(() => validatePng(good.subarray(0, Math.floor(good.length / 2))));
  const flipped = Buffer.from(good);
  flipped[Math.floor(good.length / 2)] ^= 0xff;
  assert.throws(() => validatePng(flipped));
});
