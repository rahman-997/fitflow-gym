import test from "node:test";
import assert from "node:assert/strict";
import { buildKivyroTransfer } from "../lib/transfer.ts";

const exportFor = progressDate => buildKivyroTransfer({
  plan: { goal: "strength", days: 3 },
  completed: ["upper"],
  sessions: [{ id: "upper", title: "Upper Body", type: "Strength" }],
  progressDate,
  exportedAt: new Date("2026-11-25T12:00:00Z"),
});

test("rejects weeks earlier than the supported KIVYRO range", () => {
  for (const date of ["1999-12-27", "2000-01-01", "2000-01-02", "0000-01-01"]) {
    assert.throws(() => exportFor(date), /valid progress date/);
  }
});

test("rejects weeks later than the supported KIVYRO range", () => {
  for (const date of ["2101-01-03", "9999-12-31"]) {
    assert.throws(() => exportFor(date), /valid progress date/);
  }
});

test("accepts the first supported Monday and the final week crossing into 2101", () => {
  assert.equal(exportFor("2000-01-03").week, "2000-01-03");
  assert.equal(exportFor("2101-01-02").week, "2100-12-27");
});

test("preserves historical weeks and the original transfer shape", () => {
  assert.deepEqual(exportFor("2025-12-31"), {
    format: "fitflow-kivyro-transfer", version: 1,
    exportedAt: "2026-11-25T12:00:00.000Z", week: "2025-12-29",
    plan: { goal: "strength", days: 3 },
    completed: [{ id: "upper", title: "Upper Body", type: "Strength" }],
  });
});
