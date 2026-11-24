/**
 * Week boundaries are local Monday-to-Sunday calendar weeks.
 * No account, analytics, network, or third-party storage is used.
 */

export const WEEKLY_PROGRESS_KEY = "fitflow-week-v2";

export function localWeekStart(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("Expected a valid Date");
  }
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const year = String(monday.getFullYear());
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * @param {unknown} candidate
 * @param {readonly string[]} validIds
 * @returns {string[]}
 */
function cleanSessions(candidate, validIds) {
  if (!Array.isArray(candidate)) return [];
  const allowed = new Set(validIds);
  return [...new Set(candidate.filter((id) => typeof id === "string" && allowed.has(id)))];
}

/**
 * @param {string | null} raw
 * @param {readonly string[]} validIds
 * @param {Date} [today]
 * @returns {string[]}
 */
export function parseWeeklyProgress(raw, validIds, today = new Date()) {
  if (!raw) return [];
  try {
    const record = JSON.parse(raw);
    if (!record || typeof record !== "object" || Array.isArray(record)) return [];
    if (record.version !== 1 || record.week !== localWeekStart(today)) return [];
    return cleanSessions(record.sessions, validIds);
  } catch {
    return [];
  }
}

/**
 * Migrate old unscoped progress once, without deleting legacy local data.
 * @param {string | null} raw
 * @param {readonly string[]} validIds
 * @returns {string[]}
 */
export function parseLegacyProgress(raw, validIds) {
  if (!raw) return [];
  try {
    return cleanSessions(JSON.parse(raw), validIds);
  } catch {
    return [];
  }
}

/**
 * @param {unknown} sessions
 * @param {readonly string[]} validIds
 * @param {Date} [today]
 */
export function serializeWeeklyProgress(sessions, validIds, today = new Date()) {
  return JSON.stringify({
    version: 1,
    week: localWeekStart(today),
    sessions: cleanSessions(sessions, validIds),
  });
}
