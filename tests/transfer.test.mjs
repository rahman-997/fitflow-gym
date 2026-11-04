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

test("uses the export device's local Monday and leaves empty progress empty", () => {
  const transfer = buildKivyroTransfer({
    plan: { goal: "mobility", days: 2 },
    completed: [],
    sessions,
    exportedAt: new Date(2026, 10, 1, 23),
  });
  assert.equal(transfer.week, "2026-10-26");
  assert.deepEqual(transfer.completed, []);
});

test("rejects invalid plans and dates", () => {
  assert.throws(() => buildKivyroTransfer({
    plan: { goal: "strength", days: 1 },
    completed: [],
    sessions,
    exportedAt: new Date(2026, 10, 4),
  }), /plan is invalid/);
  assert.throws(() => buildKivyroTransfer({
    plan: { goal: "strength", days: 3 },
    completed: [],
    sessions,
    exportedAt: new Date("invalid"),
  }), /valid export date/);
});
