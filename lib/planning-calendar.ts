import { planningItems, planningTone, type ProximityFilter, type PlanningEnvelope, type PlanningItem } from "./envelope-planning";
import { temporalDistance, getTemporalState, DEFAULT_GOAL_THRESHOLDS } from "./envelope-goals";
import { validateRecurrence, recurrenceDueDate, type Recurrence } from "./finance-recurrence";

export const calendarScales = ["Día", "Semana", "Mes", "Año"] as const;
export type CalendarScale = typeof calendarScales[number];
export type CalendarEnvelope = PlanningEnvelope & { recurrence?: Recurrence };
export type CalendarEntry = { key: string; envelopeId: string; envelopeName: string; date: string; name: string; amount: number; item?: PlanningItem };
export function calendarEntryTone(entry: CalendarEntry, today: string): ProximityFilter {
  return entry.item ? planningTone(entry.item) : getTemporalState(entry.date, today, DEFAULT_GOAL_THRESHOLDS).temporal?.tone ?? "white";
}

export function calendarOverdueEntries(entries: CalendarEntry[], today: string, before = today) {
  return entries.filter(entry => entry.date < today && entry.date < before && calendarEntryTone(entry, today) === "purple");
}

export function calendarDotDescription(items: CalendarEntry[], tone: ProximityFilter, today: string, privateMode: boolean, reminder = false) {
  const meanings = {white:"Fuera del período de seguimiento",green:"Con tiempo disponible",yellow:"Se acerca la fecha límite",red:"Fecha límite de hoy o tiempo crítico",purple:"Fecha límite vencida"};
  const matches = items.filter(entry => calendarEntryTone(entry, today) === tone);
  const details = matches.slice(0, 4).map(entry => {
    const date = new Intl.DateTimeFormat("es-CR", {timeZone:"America/Costa_Rica",dateStyle:"short"}).format(new Date(`${entry.date}T12:00:00Z`));
    return `${privateMode ? "Responsabilidad" : `${entry.name} · ${entry.envelopeName}`} (${date})`;
  });
  return `${reminder ? "Aviso de atrasados; conservan su fecha original. " : ""}${meanings[tone]}. ${matches.length} ${matches.length === 1 ? "pendiente" : "pendientes"}${details.length ? `: ${details.join("; ")}` : ""}${matches.length > 4 ? `; y ${matches.length - 4} más` : ""}.`;
}
const dateOf = (value: string) => { temporalDistance(value,value); return new Date(`${value}T12:00:00Z`); };
const format = (value: Date) => value.getUTCFullYear()<1 ? "0001-01-01" : value.getUTCFullYear()>9999 ? "9999-12-31" : value.toISOString().slice(0,10);
export function calendarRange(value: string, scale: CalendarScale) {
  const start = dateOf(value), end = dateOf(value);
  if (scale === "Semana") { start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7)); end.setTime(start.getTime()); end.setUTCDate(end.getUTCDate()+6); }
  if (scale === "Mes") { start.setUTCDate(1); end.setUTCMonth(end.getUTCMonth()+1,0); }
  if (scale === "Año") { start.setUTCMonth(0,1); end.setUTCMonth(11,31); }
  return { from:format(start), to:format(end) };
}
export function shiftCalendar(value: string, scale: CalendarScale, direction: -1|1) {
  const date = dateOf(value);
  if (scale === "Día" || scale === "Semana") date.setUTCDate(date.getUTCDate()+direction*(scale==="Semana"?7:1));
  else { date.setUTCDate(1); if(scale==="Mes") date.setUTCMonth(date.getUTCMonth()+direction); else date.setUTCFullYear(date.getUTCFullYear()+direction); }
  if (date.getUTCFullYear()<1 || date.getUTCFullYear()>9999) return value;
  return format(date);
}
export function calendarDays(value: string) {
  const range=calendarRange(value,"Mes"), start=dateOf(range.from), count=dateOf(range.to).getUTCDate();
  return { offset:(start.getUTCDay()+6)%7, dates:Array.from({length:count},(_,i)=>`${value.slice(0,7)}-${String(i+1).padStart(2,"0")}`) };
}
// Projection only: no copied schedules, generated payments or hypothetical recurrences.
export function calendarEntries(envelopes: CalendarEnvelope[], today: string): CalendarEntry[] {
  const entries:CalendarEntry[]=[];
  for (const envelope of envelopes.filter(e=>!e.archived)) {
    for (const item of planningItems(envelope,today)) {
      if (!item.deadline || item.payment) continue;
      try { dateOf(item.deadline); } catch { continue; }
      entries.push({key:`${envelope.id}:${item.kind}:${item.id}`,envelopeId:envelope.id,envelopeName:envelope.name,date:item.deadline,name:item.name,amount:item.amount,item});
    }
    if (envelope.recurrence) {
      try {
        validateRecurrence(envelope.recurrence);
        const date = recurrenceDueDate(envelope.recurrence);
        dateOf(date);
        entries.push({key:`${envelope.id}:contribution`,envelopeId:envelope.id,envelopeName:envelope.name,date,name:`Aporte a ${envelope.name}`,amount:envelope.recurrence.amount});
      } catch { /* Malformed legacy schedules remain available in their editor. */ }
    }
  }
  return entries.sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}
