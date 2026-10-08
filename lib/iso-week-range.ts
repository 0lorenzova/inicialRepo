import { movementDay } from "./finance-history";
import { isoWeek } from "./iso-week";
import { calendarRange } from "./planning-calendar";

export function isoWeekRange(value: string) {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : movementDay(value);
  const range = calendarRange(day, "Semana");
  const format = (date: string) => new Intl.DateTimeFormat("es-CR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
  return { ...range, ...isoWeek(day), label: `Del ${format(range.from)} al ${format(range.to)}` };
}
