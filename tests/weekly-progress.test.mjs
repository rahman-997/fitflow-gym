import test from "node:test";
import assert from "node:assert/strict";
import {
  WEEKLY_PROGRESS_KEY,
  localWeekStart,
  parseLegacyProgress,
  parseWeeklyProgress,
  serializeWeeklyProgress,
} from "../lib/weekly-progress.mjs";

const ids = ["upper", "engine", "reset", "full"];

test("local weeks start on Monday even across year boundaries", () => {
  assert.equal(localWeekStart(new Date(2027, 0, 1)), "2026-12-28");
  assert.equal(localWeekStart(new Date(2027, 0, 4)), "2027-01-04");
  assert.equal(localWeekStart(new Date(2026, 10, 22)), "2026-11-16");
});

test("saved progress is scoped to the current local week", () => {
  const monday = new Date(2026, 10, 16);
  const nextMonday = new Date(2026, 10, 23);
  const saved = serializeWeeklyProgress(["upper", "full"], ids, monday);
  assert.deepEqual(parseWeeklyProgress(saved, ids, monday), ["upper", "full"]);
  assert.deepEqual(parseWeeklyProgress(saved, ids, nextMonday), []);
});

test("unknown or duplicate session IDs never inflate weekly progress", () => {
  const today = new Date(2026, 10, 17);
  const saved = serializeWeeklyProgress(["upper", "upper", "fake", 1, "engine"], ids, today);
  assert.deepEqual(parseWeeklyProgress(saved, ids, today), ["upper", "engine"]);
  assert.equal(parseWeeklyProgress(saved, ids, today).length / ids.length <= 1, true);
});

test("corrupt or malformed storage data safely resets", () => {
  const today = new Date(2026, 10, 17);
  for (const raw of ["broken", "null", "[]", '{"version":1,"week":"2026-11-16","sessions":"bad"}']) {
    assert.deepEqual(parseWeeklyProgress(raw, ids, today), []);
  }
});

test("legacy progress migrates safely and retains only known sessions", () => {
  assert.equal(WEEKLY_PROGRESS_KEY, "fitflow-week-v2");
  assert.deepEqual(parseLegacyProgress('["upper","upper","unknown","engine"]', ids), ["upper", "engine"]);
  assert.deepEqual(parseLegacyProgress("invalid", ids), []);
});
