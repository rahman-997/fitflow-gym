export type FitFlowGoal = "strength" | "conditioning" | "mobility";

export type FitFlowSession = {
  id: string;
  title: string;
  type: string;
};

export type KivyroProgressTransfer = {
  format: "fitflow-kivyro-transfer";
  version: 1;
  exportedAt: string;
  week: string;
  plan: { goal: FitFlowGoal; days: number };
  completed: FitFlowSession[];
};

function localMondayKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new TypeError("A valid export date is required.");
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
}

/** Builds an opt-in, current-week-only transfer; it never reads or deletes browser storage. */
export function buildKivyroTransfer(input: {
  plan: { goal: FitFlowGoal; days: number };
  completed: readonly string[];
  sessions: readonly FitFlowSession[];
  exportedAt: Date;
}): KivyroProgressTransfer {
  if (!["strength", "conditioning", "mobility"].includes(input.plan.goal) ||
      !Number.isInteger(input.plan.days) || input.plan.days < 2 || input.plan.days > 5) {
    throw new TypeError("The selected training plan is invalid.");
  }

  const exportedAt = new Date(input.exportedAt);
  const allowedSessions = new Map(input.sessions.map((session) => [session.id, session]));
  const seen = new Set<string>();
  const completed = input.completed.flatMap((id) => {
    const session = allowedSessions.get(id);
    if (!session || seen.has(id)) return [];
    seen.add(id);
    return [{ id: session.id, title: session.title, type: session.type }];
  });

  return {
    format: "fitflow-kivyro-transfer",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    week: localMondayKey(exportedAt),
    plan: { goal: input.plan.goal, days: input.plan.days },
    completed,
  };
}
