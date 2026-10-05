import { movementDay } from "./finance-history";

/** ISO weeks start on Monday; the first week contains January 4. */
export function isoWeek(value: string): { week: number; year: number } {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : movementDay(value);
  const date = new Date(`${day}T12:00:00Z`);
  if (!day || !Number.isFinite(date.getTime())) throw new Error("Selecciona una fecha válida.");
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  const first = Date.UTC(year, 0, 1, 12);
  return { year, week: Math.ceil(((date.getTime() - first) / 86400000 + 1) / 7) };
}
