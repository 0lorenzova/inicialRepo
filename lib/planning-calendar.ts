import { envelopeLabel } from "./envelope-label";
import { planningItems, planningTone, plannedPaymentWarnings, proximityTones, validateScheduledAmount, type ScheduledAmount, type ProximityFilter, type PlanningEnvelope, type PlanningItem } from "./envelope-planning";
import { temporalDistance, getTemporalState, getEnvelopeGoal, DEFAULT_GOAL_THRESHOLDS } from "./envelope-goals";
import { validateRecurrence, recurrenceDueDate, contributionStep, recurrenceDates, type Recurrence } from "./finance-recurrence";
import type { LedgerMovement } from "./finance-ledger";

export const calendarScales = ["Día", "Semana", "Mes", "Año"] as const;
export type CalendarScale = typeof calendarScales[number];
export type CalendarEnvelope = PlanningEnvelope & { recurrence?: Recurrence; recurringContributionHistory?: {expectedDate:string;date:string;amount:number;frequency:Recurrence["frequency"]}[] };
export type CalendarEntry = { key: string; envelopeId: string; envelopeName: string; date: string; name: string; amount: number; item?: PlanningItem; recurrent?: boolean; virtual?: boolean; status?: "completed" | "omitted"; movementId?: string };
export function calendarEntryTone(entry: CalendarEntry, today: string): ProximityFilter {
  if(entry.status)return "white";
  return entry.item ? planningTone(entry.item) : getTemporalState(entry.date, today, DEFAULT_GOAL_THRESHOLDS).temporal?.tone ?? "white";
}

// A color represents all its members; a late member changes the representative,
// never creates a second indicator of the same color.
export function calendarIndicatorGroups(items:CalendarEntry[], today:string, reminders:CalendarEntry[] = []) {
  const represented=[...new Map([...items.filter(entry=>!entry.status),...reminders].map(entry=>[entry.key,entry])).values()];
  return proximityTones.flatMap(tone=>{
    const entries=represented.filter(entry=>calendarEntryTone(entry,today)===tone);
    if(!entries.length)return [];
    const lateLabel=plannedPaymentWarnings(entries.flatMap(entry=>entry.item?[entry.item]:[]));
    return [{tone,entries,late:Boolean(lateLabel),lateLabel,echo:reminders.length>0&&tone==="purple"&&!items.some(entry=>calendarEntryTone(entry,today)===tone)}];
  });
}

export function calendarOverdueEntries(entries: CalendarEntry[], today: string, before = today) {
  return entries.filter(entry => !entry.status && entry.date < today && entry.date < before && calendarEntryTone(entry, today) === "purple");
}

export const calendarProximityMeanings = {white:"Fuera del período de seguimiento",green:"Con tiempo disponible",yellow:"Se acerca la fecha límite",red:"Fecha límite de hoy o tiempo crítico",purple:"Fecha límite vencida"};

export function calendarDotDescription(items: CalendarEntry[], tone: ProximityFilter, today: string, privateMode: boolean, reminder = false) {
  const matches = items.filter(entry => calendarEntryTone(entry, today) === tone);
  const details = matches.slice(0, 4).map(entry => {
    const date = new Intl.DateTimeFormat("es-CR", {timeZone:"America/Costa_Rica",dateStyle:"short"}).format(new Date(`${entry.date}T12:00:00Z`));
    const state=entry.status==="completed"?" · Realizado":entry.status==="omitted"?" · Omitido":"";
    return `${privateMode ? "Responsabilidad" : `${entry.name} · ${envelopeLabel(entry.envelopeName)}`} (${date})${state}${entry.recurrent?" · Recurrente":""}${entry.virtual?" · Previsión":""}${!privateMode&&!entry.item?.coverageHidden&&entry.item?.covered!==undefined?entry.item.covered?" · Cubierto; aún no pagado":" · Sin cobertura completa":""}`;
  });
  const counts:[string,number][]=[["pendiente",matches.filter(entry=>!entry.status).length],["realizado",matches.filter(entry=>entry.status==="completed").length],["omitido",matches.filter(entry=>entry.status==="omitted").length]];
  const states=counts.filter(([,count])=>count>0).map(([name,count])=>`${count} ${count===1?name:name==="realizado"?"realizados":name==="omitido"?"omitidos":"pendientes"}`).join(", ");
  return `${reminder ? "Aviso de atrasados; conservan su fecha original. " : ""}${calendarProximityMeanings[tone]}. ${states}${details.length ? `: ${details.join("; ")}` : ""}${matches.length > 4 ? `; y ${matches.length - 4} más` : ""}.`;
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
/** Relative labels compare complete calendar periods, including ISO weeks across years. */
export function calendarRelativeLabel(value:string,today:string,scale:CalendarScale="Semana") {
  const target=calendarRange(value,scale).from,current=calendarRange(today,scale).from;
  const difference=scale==="Año"?Number(target.slice(0,4))-Number(current.slice(0,4)):
    scale==="Mes"?(Number(target.slice(0,4))-Number(current.slice(0,4)))*12+Number(target.slice(5,7))-Number(current.slice(5,7)):
    Math.round((dateOf(target).getTime()-dateOf(current).getTime())/86400000)/(scale==="Semana"?7:1);
  if(!difference)return scale==="Día"?"Hoy":scale==="Semana"?"Esta semana":scale==="Mes"?"Este mes":"Este año";
  if(scale==="Día"&&Math.abs(difference)===1)return difference<0?"Ayer":"Mañana";
  const unit=scale==="Semana"?"semana":scale==="Mes"?"mes":scale==="Año"?"año":"día";
  if(difference===-1)return unit==="semana"?"La semana pasada":`El ${unit} pasado`;
  if(difference===1)return unit==="semana"?"La próxima semana":`El próximo ${unit}`;
  const plural=unit==="mes"?"meses":`${unit}s`;
  return difference<0?`Hace ${-difference} ${plural}`:`Faltan ${difference} ${plural}`;
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
export function calendarEntries(envelopes: CalendarEnvelope[], today: string, window?: {from:string;to:string}, movements: LedgerMovement[] = [], includeHistory = false): CalendarEntry[] {
  const entries:CalendarEntry[]=[];
  for (const envelope of envelopes.filter(e=>!e.archived)) {
    const includeDate=(date:string)=>!window||(date>=window.from&&date<=window.to);
    for (const item of planningItems(envelope,today)) {
      if(item.kind==="goal"&&getEnvelopeGoal(envelope,today).reached)continue;
      if(item.kind==="scheduled"&&includeHistory) {
        for(const payment of item.payments??[]) {
          const paidDate=payment.date.slice(0,10);
          if(!validCalendarDate(paidDate)||!includeDate(paidDate))continue;
          entries.push({key:`${envelope.id}:paid:${payment.movementId}`,envelopeId:envelope.id,envelopeName:envelope.name,date:paidDate,name:`Pago: ${item.name}`,amount:payment.amount,item,status:"completed",movementId:payment.movementId,recurrent:item.recurrent});
        }
        if(item.omitted) {
          const omittedAt=envelope.scheduledAmounts?.find(value=>value.id===item.id)?.omittedAt?.slice(0,10);
          if(omittedAt&&validCalendarDate(omittedAt)&&includeDate(omittedAt))entries.push({key:`${envelope.id}:omitted:${item.id}`,envelopeId:envelope.id,envelopeName:envelope.name,date:omittedAt,name:`Omitido: ${item.name}`,amount:item.remainingAmount??item.amount,item,status:"omitted",recurrent:item.recurrent});
        }
      }
      if (!item.deadline || item.payment || item.omitted) continue;
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
          if (future<=today || future===date || future===recurrence.nextDate) continue;
          entries.push({key:`${envelope.id}:contribution:${future}`,envelopeId:envelope.id,envelopeName:envelope.name,date:future,name:`Aporte a ${envelope.name}`,amount:recurrence.amount,recurrent:true,virtual:true});
        }
      } catch { /* Malformed legacy schedules remain available in their editor. */ }
    }
    if(includeHistory)for(const history of Array.isArray(envelope.recurringContributionHistory)?envelope.recurringContributionHistory:[]) {
      if(validCalendarDate(history.date)&&includeDate(history.date))entries.push({key:`${envelope.id}:contribution-omitted:${history.expectedDate}`,envelopeId:envelope.id,envelopeName:envelope.name,date:history.date,name:`Aporte omitido a ${envelope.name}`,amount:history.amount,status:"omitted",recurrent:true});
    }
    const knownOmissions=new Set((Array.isArray(envelope.recurringContributionHistory)?envelope.recurringContributionHistory:[]).map(item=>item.expectedDate));
    if(includeHistory)for(const skippedDate of Array.isArray(envelope.recurrence?.skippedDates)?envelope.recurrence.skippedDates:[]) {
      if(!knownOmissions.has(skippedDate)&&validCalendarDate(skippedDate)&&includeDate(skippedDate))entries.push({key:`${envelope.id}:contribution-omitted:${skippedDate}`,envelopeId:envelope.id,envelopeName:envelope.name,date:skippedDate,name:`Aporte omitido a ${envelope.name}`,amount:envelope.recurrence!.amount,status:"omitted",recurrent:true});
    }
    if(includeHistory)for(const movement of movements) {
      if(movement.type!=="Asignación"||!movement.reference?.startsWith("Aporte recurrente · "))continue;
      const allocation=movement.allocations.find(value=>value.envelopeId===envelope.id);
      const performedDate=movement.date.slice(0,10);
      if(allocation&&validCalendarDate(performedDate)&&includeDate(performedDate))entries.push({key:`${envelope.id}:contribution-done:${movement.id}`,envelopeId:envelope.id,envelopeName:envelope.name,date:performedDate,name:`Aporte realizado a ${envelope.name}`,amount:allocation.amount,status:"completed",movementId:movement.id,recurrent:true});
    }
    if (window) entries.push(...projectScheduled(envelope,today,window));
  }
  return entries.sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}

function validCalendarDate(value:string):boolean {
  try { dateOf(value); return true; } catch { return false; }
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
