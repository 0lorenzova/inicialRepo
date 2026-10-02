export type GoalThresholds = { green: number; yellow: number; red: number };
export type GoalSettings = {
  goal?: number;
  goalEnabled?: boolean;
  goalDate?: string;
  goalTimingEnabled?: boolean;
  goalProgressVisible?: boolean;
  goalDisplay?: "percentage" | "reached" | "surplus";
  goalThresholds?: GoalThresholds;
};

// Suggested initial values, copied into each goal's editable configuration.
export const DEFAULT_GOAL_THRESHOLDS: GoalThresholds = { green: 60, yellow: 20, red: 5 };

function civilDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) {
    throw new Error("La fecha límite de la meta no es válida.");
  }
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("La fecha límite de la meta no es válida.");
  }
  return date.getTime();
}

export function validateGoalSettings(settings: GoalSettings): void {
  const enabled = settings.goalEnabled ?? Boolean(settings.goal && settings.goal > 0);
  if (enabled && (!Number.isSafeInteger(settings.goal) || (settings.goal ?? 0) <= 0)) {
    throw new Error("Ingresa un monto objetivo entero mayor que cero.");
  }
  if (settings.goalDate) civilDate(settings.goalDate);
  if (settings.goalDisplay && !["percentage", "reached", "surplus"].includes(settings.goalDisplay)) {
    throw new Error("Selecciona cómo quieres mostrar la meta alcanzada.");
  }
  const thresholds = settings.goalThresholds;
  if (thresholds && (!Object.values(thresholds).every(value => Number.isSafeInteger(value) && value >= 0)
    || !(thresholds.green > thresholds.yellow && thresholds.yellow > thresholds.red))) {
    throw new Error("Los días deben seguir este orden: verde mayor que amarillo, amarillo mayor que rojo; rojo puede ser cero.");
  }
}

export type GoalTemporalState = {
  tone: "green" | "yellow" | "red";
  label: string;
  explanation: string;
};

export type EnvelopeGoal = {
  active: boolean;
  showProgress: boolean;
  amount: number;
  percentage: number;
  fillPercentage: number;
  reached: boolean;
  surplus: number;
  daysRemaining: number | null;
  temporal: GoalTemporalState | null;
};

export function getEnvelopeGoal(envelope: GoalSettings & { balance: number }, todayDate: string): EnvelopeGoal {
  const inactive: EnvelopeGoal = { active: false, showProgress: false, amount: 0, percentage: 0, fillPercentage: 0, reached: false, surplus: 0, daysRemaining: null, temporal: null };
  const enabled = envelope.goalEnabled ?? Boolean(envelope.goal && envelope.goal > 0);
  if (!enabled || !Number.isSafeInteger(envelope.goal) || (envelope.goal ?? 0) <= 0) return inactive;
  const amount = envelope.goal!;
  const balance = Number.isFinite(envelope.balance) ? envelope.balance : 0;
  const percentage = balance / amount * 100;
  const result: EnvelopeGoal = {
    active: true, showProgress: envelope.goalProgressVisible !== false, amount, percentage, fillPercentage: Math.max(0, Math.min(100, percentage)),
    reached: balance >= amount, surplus: Math.max(0, balance - amount), daysRemaining: null, temporal: null,
  };
  if (!envelope.goalDate || envelope.goalTimingEnabled === false) return result;
  try {
    validateGoalSettings(envelope);
    const days = Math.round((civilDate(envelope.goalDate) - civilDate(todayDate)) / 86_400_000);
    result.daysRemaining = days;
    const thresholds = envelope.goalThresholds ?? DEFAULT_GOAL_THRESHOLDS;
    // Time and money are intentionally independent: reaching the amount does
    // not hide a deadline, and a deadline never modifies the financial balance.
    if (days < 0) result.temporal = { tone: "red", label: "Fecha límite vencida", explanation: `La fecha límite pasó hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}.` };
    else if (days === 0) result.temporal = { tone: "red", label: "Fecha límite alcanzada", explanation: "La fecha límite de esta meta es hoy." };
    else if (days <= thresholds.red) result.temporal = { tone: "red", label: "Tiempo crítico", explanation: `Faltan ${days} ${days === 1 ? "día" : "días"} para la fecha límite.` };
    else if (days <= thresholds.yellow) result.temporal = { tone: "yellow", label: "Queda poco tiempo", explanation: `Faltan ${days} días para la fecha límite.` };
    else if (days <= thresholds.green) result.temporal = { tone: "green", label: "Estás a tiempo", explanation: `Faltan ${days} días para la fecha límite.` };
  } catch {
    // Old or malformed optional planning settings must never hide the balance
    // or break financial screens. Saving the form gives a specific error.
  }
  return result;
}
