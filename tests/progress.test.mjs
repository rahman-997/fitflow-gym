import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCompletedSessions } from "../lib/progress.ts";

const sessions = [{ id: "upper" }, { id: "engine" }, { id: "reset" }, { id: "full" }];

test("legacy progress counts only distinct sessions still present in the weekly plan", () => {
  const stored = ["upper", "upper", "removed-session", null, 17, "engine", "upper"];
  assert.deepEqual(normalizeCompletedSessions(stored, sessions), ["upper", "engine"]);
  assert.deepEqual(stored, ["upper", "upper", "removed-session", null, 17, "engine", "upper"]);
});

test("malformed legacy values never inflate weekly progress", () => {
  for (const value of [null, "upper", 7, {}, { upper: true }]) {
    assert.deepEqual(normalizeCompletedSessions(value, sessions), []);
  }
  const stored = [...sessions.map(s => s.id), ...Array(100).fill("upper"), "obsolete"];
  assert.equal(normalizeCompletedSessions(stored, sessions).length, 4);
});

test("empty and previously valid progress preserve selection order", () => {
  assert.deepEqual(normalizeCompletedSessions([], sessions), []);
  assert.deepEqual(normalizeCompletedSessions(["reset", "upper"], sessions), ["reset", "upper"]);
  assert.deepEqual(normalizeCompletedSessions(["upper"], []), []);
});
