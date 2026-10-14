import { envelopeLabel } from "./envelope-label";
import { planningItems, planningTone, validateScheduledAmount, type ScheduledAmount, type ProximityFilter, type PlanningEnvelope, type PlanningItem } from "./envelope-planning";
import { temporalDistance, getTemporalState, DEFAULT_GOAL_THRESHOLDS } from "./envelope-goals";
import { validateRecurrence, recurrenceDueDate, contributionStep, recurrenceDates, type Recurrence } from "./finance-recurrence";

export const calendarScales = ["Día", "Semana", "Mes", "Año"] as const;
export type CalendarScale = typeof calendarScales[number];
export type CalendarEnvelope = PlanningEnvelope & { recurrence?: Recurrence };
export type CalendarEntry = { key: string; envelopeId: string; envelopeName: string; date: string; name: string; amount: number; item?: PlanningItem; recurrent?: boolean; virtual?: boolean };
export function calendarEntryTone(entry: CalendarEntry, today: string): ProximityFilter {
  return entry.item ? planningTone(entry.item) : getTemporalState(entry.date, today, DEFAULT_GOAL_THRESHOLDS).temporal?.tone ?? "white";
}

export function calendarOverdueEntries(entries: CalendarEntry[], today: string, before = today) {
  return entries.filter(entry => entry.date < today && entry.date < before && calendarEntryTone(entry, today) === "purple");
}

export const calendarProximityMeanings = {white:"Fuera del período de seguimiento",green:"Con tiempo disponible",yellow:"Se acerca la fecha límite",red:"Fecha límite de hoy o tiempo crítico",purple:"Fecha límite vencida"};

export function calendarDotDescription(items: CalendarEntry[], tone: ProximityFilter, today: string, privateMode: boolean, reminder = false) {
  const matches = items.filter(entry => calendarEntryTone(entry, today) === tone);
  const details = matches.slice(0, 4).map(entry => {
    const date = new Intl.DateTimeFormat("es-CR", {timeZone:"America/Costa_Rica",dateStyle:"short"}).format(new Date(`${entry.date}T12:00:00Z`));
    return `${privateMode ? "Responsabilidad" : `${entry.name} · ${envelopeLabel(entry.envelopeName)}`} (${date})${entry.recurrent?" · Recurrente":""}${entry.virtual?" · Previsión":""}${!privateMode&&!entry.item?.coverageHidden&&entry.item?.covered!==undefined?entry.item.covered?" · Cubierto; aún no pagado":" · Sin cobertura completa":""}`;
  });
  return `${reminder ? "Aviso de atrasados; conservan su fecha original. " : ""}${calendarProximityMeanings[tone]}. ${matches.length} ${matches.length === 1 ? "pendiente" : "pendientes"}${details.length ? `: ${details.join("; ")}` : ""}${matches.length > 4 ? `; y ${matches.length - 4} más` : ""}.`;
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
// Actual records remain actionable. Virtual occurrences exist only in this projection.
export function calendarEntries(envelopes: CalendarEnvelope[], today: string, window?: {from:string;to:string}): CalendarEntry[] {
  const entries:CalendarEntry[]=[];
  for (const envelope of envelopes.filter(e=>!e.archived)) {
    for (const item of planningItems(envelope,today)) {
      if (!item.deadline || item.payment) continue;
      try { dateOf(item.deadline); } catch { continue; }
      const recurrent=item.kind==="scheduled" && Boolean(envelope.scheduledAmounts?.find(p=>p.id===item.id)?.repetition);
      entries.push({key:`${envelope.id}:${item.kind}:${item.id}`,envelopeId:envelope.id,envelopeName:envelope.name,date:item.deadline,name:item.name,amount:item.amount,item,recurrent});
    }
    if (envelope.recurrence) {
      try {
        validateRecurrence(envelope.recurrence);
        const date = recurrenceDueDate(envelope.recurrence);
        dateOf(date);
        const recurrence=envelope.recurrence;
        if (!recurrence.endDate || date<=recurrence.endDate) entries.push({key:`${envelope.id}:contribution`,envelopeId:envelope.id,envelopeName:envelope.name,date,name:`Aporte a ${envelope.name}`,amount:recurrence.amount,recurrent:true});
        if (window) for (const future of recurrenceDates(recurrence.nextDate,window.from,window.to,contributionStep(recurrence),recurrence.anchorDay,recurrence.endDate)) {
          if (future<=today || future===date) continue;
          entries.push({key:`${envelope.id}:contribution:${future}`,envelopeId:envelope.id,envelopeName:envelope.name,date:future,name:`Aporte a ${envelope.name}`,amount:recurrence.amount,recurrent:true,virtual:true});
        }
      } catch { /* Malformed legacy schedules remain available in their editor. */ }
    }
    if (window) entries.push(...projectScheduled(envelope,today,window));
  }
  return entries.sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}

// Stable occurrence identity preserves an individually edited date or cancellation.
function occurrenceDate(item: ScheduledAmount): string {
  const prefix=`scheduled:${item.repetition?.seriesId}:`;
  return item.occurrenceDate ?? (item.id.startsWith(prefix)?item.id.slice(prefix.length):item.deadline);
}

function projectScheduled(envelope:CalendarEnvelope,today:string,window:{from:string;to:string}):CalendarEntry[] {
  const series=new Map<string,ScheduledAmount[]>(), result:CalendarEntry[]=[];
  for (const item of envelope.scheduledAmounts??[]) if (item.repetition) {
    const rows=series.get(item.repetition.seriesId)??[]; rows.push(item); series.set(item.repetition.seriesId,rows);
  }
  for (const [seriesId,rows] of series) {
    rows.sort((a,b)=>occurrenceDate(a).localeCompare(occurrenceDate(b))||a.id.localeCompare(b.id));
    const storedDates=new Set(rows.flatMap(item=>[occurrenceDate(item),item.deadline]));
    for (let index=0;index<rows.length;index++) {
      const seed=rows[index], repeat=seed.repetition!;
      if (!seed.active) continue;
      const nextRecorded=rows[index+1] && occurrenceDate(rows[index+1]);
      try {
        validateScheduledAmount(seed);
        const step={unit:["monthly","yearly"].includes(repeat.frequency)?"months" as const:"days" as const,amount:repeat.frequency==="yearly"?12:repeat.frequency==="weekly"?7:1};
        for (const date of recurrenceDates(occurrenceDate(seed),window.from,window.to,step,repeat.anchorDay,repeat.endDate)) {
          if (nextRecorded && date>=nextRecorded) break;
          if (date<=today || storedDates.has(date)) continue;
          const id=`virtual:${seriesId}:${date}`;
          const item:PlanningItem={id,kind:"scheduled",recurrent:true,name:seed.name,amount:seed.amount,deadline:date,greenDays:(seed.thresholds??DEFAULT_GOAL_THRESHOLDS).green,temporal:getTemporalState(date,today,seed.thresholds??DEFAULT_GOAL_THRESHOLDS).temporal,timingEnabled:seed.timingEnabled};
          result.push({key:`${envelope.id}:${id}`,envelopeId:envelope.id,envelopeName:envelope.name,date,name:item.name,amount:item.amount,item,recurrent:true,virtual:true});
        }
      } catch { /* Invalid legacy schedules stay in their editor, never create transactions. */ }
    }
  }
  return result;
}
