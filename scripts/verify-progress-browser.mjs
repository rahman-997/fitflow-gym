import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:4191";
const out = "artifacts/progress-browser";
await mkdir(out, { recursive: true });
const results = [];
const errors = [];
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
try {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true, serviceWorkers: "block", reducedMotion: "reduce" });
    await context.addInitScript(() => localStorage.setItem("fitflow-week", JSON.stringify(["upper", "upper", "obsolete", 17, "engine"])));
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".week-progress > div:first-child > span")).toHaveText("2 of 4 complete");
      assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem("fitflow-week"))), ["upper", "upper", "obsolete", 17, "engine"]);
      if (width < 820) {
        const nav = page.getByRole("navigation", { name: "Primary navigation", includeHidden: true });
        await expect(nav).toBeHidden();
        await page.getByRole("button", { name: "Open navigation menu" }).click();
        await expect(nav).toBeVisible();
        await nav.getByRole("link", { name: "My Week", exact: true }).click();
        await expect(nav).toBeHidden();
      }
      await page.getByRole("button", { name: "Reveal My Plan" }).click();
      await page.locator("#transfer-progress-date").fill("2025-12-31");
      const downloading = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export for KIVYRO" }).click();
      const file = await downloading;
      const transfer = JSON.parse(await readFile(await file.path(), "utf8"));
      assert.equal(transfer.week, "2025-12-29");
      assert.deepEqual(transfer.completed.map(session => session.id), ["upper", "engine"]);
      await expect(page.getByText("Progress for the week of 2025-12-29 exported.", { exact: false })).toBeVisible();
      await page.locator(".session-card").nth(2).getByRole("button").click();
      await expect(page.locator(".week-progress > div:first-child > span")).toHaveText("3 of 4 complete");
      assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem("fitflow-week"))), ["upper", "engine", "reset"]);
      assert.ok(!(await page.locator(".week-progress").innerText()).includes("exported"));
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        nodes: [...document.querySelectorAll("body *")].flatMap(node => {
          const box = node.getBoundingClientRect();
          if (!box.width || !box.height || (box.right <= innerWidth + 1 && box.left >= -1)) return [];
          return [{ tag: node.tagName, class: typeof node.className === "string" ? node.className : "", left: box.left, right: box.right, width: box.width }];
        }).slice(0, 30),
      }));
      if (layout.scrollWidth > width) {
        console.error("FITFLOW_LAYOUT=" + JSON.stringify(layout));
        await page.screenshot({ path: `${out}/FAIL-${width}.png`, fullPage: true, animations: "disabled" });
      }
      assert.ok(layout.scrollWidth <= width, `${width}px horizontal overflow`);
      await page.locator("#my-week").screenshot({ path: `${out}/progress-${width}.png`, animations: "disabled" });
      results.push({ scenario: `${width}px progress/export/edit`, result: "PASS" });
    } finally { await context.close(); }
  }
  for (const scenario of ["malformed", "blocked-storage"]) {
    const context = await browser.newContext({ serviceWorkers: "block" });
    await context.addInitScript(scenario => {
      if (scenario === "malformed") localStorage.setItem("fitflow-week", "{broken progress");
      else Storage.prototype.setItem = function () { throw new DOMException("Unavailable", "QuotaExceededError"); };
    }, scenario);
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base, { waitUntil: "domcontentloaded" });
      if (scenario === "malformed") {
        await expect(page.getByText("Saved progress could not be read. Your stored data has been kept.")).toBeVisible();
        assert.equal(await page.evaluate(() => localStorage.getItem("fitflow-week")), "{broken progress");
      } else {
        await page.locator(".session-card").first().getByRole("button").click();
        await expect(page.getByText("Progress is available in this tab, but could not be saved on this device. Export it before closing.")).toBeVisible();
        await expect(page.locator(".week-progress > div:first-child > span")).toHaveText("1 of 4 complete");
      }
      results.push({ scenario, result: "PASS" });
    } finally { await context.close(); }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await writeFile(`${out}/results.json`, JSON.stringify({ results, errors }, null, 2));
}
console.log(`FitFlow progress browser: ${results.length} scenarios passed.`);
