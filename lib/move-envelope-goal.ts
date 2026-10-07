import { validateGoalSettings, type GoalSettings } from "./envelope-goals";
import { validateRecurrence, type Recurrence } from "./finance-recurrence";

type GoalEnvelope = GoalSettings & { id:string; name:string; balance:number; archived?:boolean; recurrence?:Recurrence };
const fields = ["goalId","goalName","goal","goalEnabled","goalDate","goalTimingEnabled","goalProgressVisible","goalDisplay","goalThresholds"] as const;
const signature = (value:GoalSettings) => JSON.stringify(fields.map(field=>field==="goalThresholds" ? [value.goalThresholds?.green,value.goalThresholds?.yellow,value.goalThresholds?.red] : value[field]));
const recurrenceSignature = (value?:Recurrence) => value ? JSON.stringify([value.amount,value.frequency,value.nextDate,value.snoozedUntil,value.intervalDays]) : "";

export function moveEnvelopeGoal<T extends GoalEnvelope>(envelopes:T[], original:T, targetId:string, newId:string, moveContribution=false):T[] {
  if (original.id===targetId) throw new Error("Selecciona otro sobre como destino.");
  const source=envelopes.find(e=>e.id===original.id&&!e.archived), target=envelopes.find(e=>e.id===targetId&&!e.archived);
  if (!source||!target) throw new Error("Ambos sobres deben estar activos.");
  if (!(source.goalEnabled??Boolean(source.goal)) || !source.goal) throw new Error("La meta ya no está activa en este sobre.");
  if(signature(source)!==signature(original)) throw new Error("La meta cambió. Vuelve a abrirla antes de trasladarla.");
  if(target.goal || target.goalName || target.goalDate || target.goalId) throw new Error("El destino ya contiene una meta guardada, aunque esté desactivada. Selecciona otro sobre para conservarla.");
  validateGoalSettings(source);
  if(!newId && !source.goalId) throw new Error("No se pudo identificar la meta.");
  if(moveContribution) {
    if(!source.recurrence || recurrenceSignature(source.recurrence)!==recurrenceSignature(original.recurrence)) throw new Error("El aporte recurrente cambió. Vuelve a abrir la meta.");
    if(target.recurrence) throw new Error("El destino ya tiene un aporte recurrente. Consérvalo o elige otro sobre.");
    validateRecurrence(source.recurrence);
  }
  const patch:GoalSettings={};
  for(const field of fields) Object.assign(patch,{[field]:source[field]});
  patch.goalId=source.goalId||newId;
  // Resolve an implicit name before moving, so its visible identity does not change.
  patch.goalName=source.goalName?.trim()||`Meta de ${source.name}`;
  return envelopes.map(envelope=>{
    if(envelope.id===source.id) { const next={...envelope}; for(const field of fields) delete next[field]; if(moveContribution) delete next.recurrence; return next; }
    if(envelope.id===target.id) return {...envelope,...patch,...(moveContribution?{recurrence:source.recurrence}:{})};
    return envelope;
  });
}
