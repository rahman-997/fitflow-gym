import test from "node:test";
import assert from "node:assert/strict";
import { buildKivyroTransfer } from "../lib/transfer.ts";

const sessions = [
  { id: "upper", title: "Upper Body", type: "Strength" },
  { id: "engine", title: "Cardio Engine", type: "Conditioning" },
  { id: "reset", title: "Mobility Reset", type: "Recovery" },
  { id: "full", title: "Full Body", type: "Strength" },
];

test("exports only valid completed sessions with the selected plan", () => {
  const transfer = buildKivyroTransfer({
    plan: { goal: "strength", days: 3 },
    completed: ["upper", "reset", "upper", "unknown"],
    sessions,
    progressDate: "2026-11-04",
    exportedAt: new Date(2026, 10, 4, 12),
  });
  assert.deepEqual(transfer, {
    format: "fitflow-kivyro-transfer",
    version: 1,
    exportedAt: new Date(2026, 10, 4, 12).toISOString(),
    week: "2026-11-02",
    plan: { goal: "strength", days: 3 },
    completed: [
      { id: "upper", title: "Upper Body", type: "Strength" },
      { id: "reset", title: "Mobility Reset", type: "Recovery" },
    ],
  });
});

test("uses the selected week instead of the export date and leaves empty progress empty", () => {
  const transfer = buildKivyroTransfer({
    plan: { goal: "mobility", days: 2 },
    completed: [],
    sessions,
    progressDate: "2026-11-04",
    exportedAt: new Date(2026, 10, 1, 23),
  });
  assert.equal(transfer.week, "2026-11-02");
  assert.deepEqual(transfer.completed, []);
});

test("rejects invalid plans and dates", () => {
  assert.throws(() => buildKivyroTransfer({
    plan: { goal: "strength", days: 1 },
    completed: [],
    sessions,
    progressDate: "2026-11-04",
    exportedAt: new Date(2026, 10, 4),
  }), /plan is invalid/);
  assert.throws(() => buildKivyroTransfer({
    plan: { goal: "strength", days: 3 },
    completed: [],
    sessions,
    progressDate: "2026-11-04",
    exportedAt: new Date("invalid"),
  }), /valid export date/);
});

test("preserves historical check-in weeks across later exports", () => {
  const transfer = buildKivyroTransfer({
    plan: { goal: "strength", days: 3 }, completed: ["upper"], sessions,
    progressDate: "2025-12-31", exportedAt: new Date("2026-11-07T12:00:00Z"),
  });
  assert.equal(transfer.week, "2025-12-29");
  assert.equal(transfer.exportedAt, "2026-11-07T12:00:00.000Z");
});

test("requires an explicit real calendar date", () => {
  for (const progressDate of ["", "2026-02-30", "2026-13-01", "11/07/2026", "2026-11-04T00:00:00Z"]) {
    assert.throws(() => buildKivyroTransfer({
      plan: { goal: "strength", days: 3 }, completed: ["upper"], sessions,
      progressDate, exportedAt: new Date("2026-11-07T12:00:00Z"),
    }), /valid progress date/);
  }
});

test("normalizes Sunday and leap day without shifting the selected calendar date", () => {
  for (const [progressDate, monday] of [["2026-11-01", "2026-10-26"], ["2024-02-29", "2024-02-26"]]) {
    const transfer = buildKivyroTransfer({
      plan: { goal: "mobility", days: 2 }, completed: [], sessions,
      progressDate, exportedAt: new Date("2026-11-07T12:00:00Z"),
    });
    assert.equal(transfer.week, monday);
  }
});
