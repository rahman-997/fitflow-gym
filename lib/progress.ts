/** Read legacy progress without changing the user's stored data. */
export function normalizeCompletedSessions(value: unknown, sessions: readonly { id: string }[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(sessions.map(session => session.id));
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item)))];
}
