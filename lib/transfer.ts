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

function selectedMondayKey(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new TypeError("Choose a valid progress date.");
  const date = new Date(value + "T12:00:00.000Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError("Choose a valid progress date.");
  }
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/** Builds an opt-in, explicitly dated transfer; it never reads or deletes browser storage. */
export function buildKivyroTransfer(input: {
  plan: { goal: FitFlowGoal; days: number };
  completed: readonly string[];
  sessions: readonly FitFlowSession[];
  exportedAt: Date;
  progressDate: string;
}): KivyroProgressTransfer {
  if (!["strength", "conditioning", "mobility"].includes(input.plan.goal) ||
      !Number.isInteger(input.plan.days) || input.plan.days < 2 || input.plan.days > 5) {
    throw new TypeError("The selected training plan is invalid.");
  }

  const exportedAt = new Date(input.exportedAt.getTime());
  if (!Number.isFinite(exportedAt.getTime())) throw new TypeError("A valid export date is required.");
  const week = selectedMondayKey(input.progressDate);
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
    week,
    plan: { goal: input.plan.goal, days: input.plan.days },
    completed,
  };
}
