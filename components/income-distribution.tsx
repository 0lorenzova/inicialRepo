"use client";
import { envelopeLabel } from "@/lib/envelope-label";
import { useId, useState } from "react";
import { fundingKey, fundingOptions, incomeDistribution, type FundingSelection } from "@/lib/income-distribution";
import { planningTone, planningCoverage, proximityTones, proximityLabels, type ProximityFilter, type PlanningEnvelope } from "@/lib/envelope-planning";
import { PlanningCalendar } from "./planning-calendar";
import { uiCopyEs } from "@/lib/ui-copy";
import type { CalendarScale, CalendarEntry } from "@/lib/planning-calendar";
import { useTemporalDisplay, TemporalDot, TemporalBadge } from "./temporal-indicator";
import styles from "./income-distribution.module.css";

const dateLabel = (value?: string) => {
  if (!value) return "Sin fecha límite";
  try { return new Intl.DateTimeFormat("es-CR", {timeZone:"UTC",day:"numeric",month:"short",year:"numeric"}).format(new Date(`${value}T12:00:00Z`)); }
  catch { return "Revisa la fecha de esta obligación"; }
};

export function IncomeDistribution({ envelopes, today, amount, manual, selections, onManual, onSelections, display }: {
  envelopes: (PlanningEnvelope & { icon: string })[]; today: string; amount: number;
  manual: Record<string, string>; selections: FundingSelection[];
  onManual: (manual: Record<string, string>) => void; onSelections: (selections: FundingSelection[]) => void; display: (amount: number) => string;
}) {
  const {visible:showProximity,privateMode}=useTemporalDisplay();
  const [calendar,setCalendar]=useState<{date:string;scale:CalendarScale}>({date:today,scale:"Mes"});
  const [filters,setFilters]=useState<Record<string,ProximityFilter|undefined>>({});
  const [view, setView] = useState<"envelopes" | "agenda" | "calendar">("envelopes");
  const [expanded, setExpanded] = useState<string[]>([]);
  const id = useId(), options = fundingOptions(envelopes, today);
  const plan = incomeDistribution(envelopes, today, amount, manual, selections);
  const activeEnvelopes = envelopes.filter(envelope => !envelope.archived);
  const allExpanded = activeEnvelopes.length > 0 && activeEnvelopes.every(envelope => expanded.includes(envelope.id));
  const selectedKeys = new Set(selections.map(fundingKey));
  const toggle = (choice: FundingSelection) => onSelections(selectedKeys.has(fundingKey(choice)) ? selections.filter(item => fundingKey(item) !== fundingKey(choice)) : [...selections, choice]);
  const renderOption = (option: typeof options[number], showEnvelope: boolean) => <label className={styles.obligation} key={fundingKey(option.selection)}>
    <input type="checkbox" checked={selectedKeys.has(fundingKey(option.selection))} onChange={() => toggle(option.selection)} aria-label={`Asignar para ${option.item.name} · ${option.envelopeName}`}/>
    <span className={styles.description}><strong>{option.item.name}</strong>{showEnvelope && <small>{envelopeLabel(option.envelopeName)}</small>}<span>{display(option.item.amount)}{option.item.kind === "goal" && <small> · Meta</small>}</span><small>{dateLabel(option.item.deadline)}</small>{showProximity&&!privateMode&&!option.item.coverageHidden&&<small>{option.item.covered?"Cubierto · aún no pagado":`Faltan ${display(option.item.shortfall??option.item.amount)} para cubrirlo`}</small>}</span>
    <TemporalBadge covered={option.item.coverageHidden?undefined:option.item.covered} tone={planningTone(option.item)} date={option.item.deadline} today={today}/>
  </label>;
  const calendarOption=(entry:CalendarEntry)=>options.find(option=>option.envelopeId===entry.envelopeId&&option.item.id===entry.item?.id&&option.item.kind===entry.item?.kind);
  return <section className={styles.distribution} aria-label="Distribución provisional del ingreso">
    <p className="flow-intro">Selecciona obligaciones para asignar su monto al sobre. El saldo actual del sobre no se descuenta de esta selección. Los pagos se registran por separado.</p>
    <div className={styles.tabs} role="group" aria-label="Vista de distribución"><button type="button" className="secondary" aria-pressed={view === "envelopes"} onClick={() => setView("envelopes")}>Por sobres</button><button type="button" className="secondary" aria-pressed={view === "agenda"} onClick={() => setView("agenda")}>Cronograma de pagos</button><button type="button" className="secondary" aria-pressed={view==="calendar"} onClick={()=>setView("calendar")}>Ver Calendario</button></div>
    {view === "envelopes" && activeEnvelopes.length > 0 && <button type="button" className="secondary" onClick={() => {setExpanded(allExpanded ? [] : activeEnvelopes.map(envelope => envelope.id));setFilters({});}}>{allExpanded ? "Contraer todos" : "Expandir todos"}</button>}
    {view==="calendar"?<><PlanningCalendar embedded envelopes={envelopes} today={today} date={calendar.date} scale={calendar.scale} onChange={(date,scale)=>setCalendar({date,scale})} display={display} privateMode={privateMode} selection={{isSelected:entry=>{const option=calendarOption(entry);return !!option&&selectedKeys.has(fundingKey(option.selection));},onToggle:entry=>{const option=calendarOption(entry);if(option)toggle(option.selection);}}}/>{options.some(option=>!option.item.deadline)&&<section><h3>Sin fecha límite</h3>{options.filter(option=>!option.item.deadline).map(option=>renderOption(option,true))}</section>}</>:view === "agenda" ? <div className={styles.items}>{options.length ? options.map(option => renderOption(option, true)) : <p className="empty-state">No hay metas ni pagos pendientes. Puedes asignar montos desde Por sobres.</p>}</div> : activeEnvelopes.map(envelope => {
      const items = options.filter(option => option.envelopeId === envelope.id), open = expanded.includes(envelope.id);
      const subtotal = plan.allocations.find(allocation => allocation.id === envelope.id)?.amount ?? 0;
      return <section className={styles.envelope} key={envelope.id}><button type="button" className={styles.heading} aria-expanded={open} aria-controls={`${id}-${envelope.id}`} onClick={() => {setFilters(current=>({...current,[envelope.id]:undefined}));setExpanded(open&&!filters[envelope.id] ? expanded.filter(value => value !== envelope.id) : [...new Set([...expanded,envelope.id])]);}}><span>{envelope.icon} {envelopeLabel(envelope.name)}</span><span aria-hidden="true">{open ? "⌃" : "⌄"}</span></button>
        {showProximity&&items.length>0&&<div className={styles.indicators} role="group" aria-label={`Proximidad de ${envelope.name}`}>{proximityTones.filter(tone=>items.some(option=>planningTone(option.item)===tone)).map(tone=>{const matching=items.filter(option=>planningTone(option.item)===tone);return <button type="button" key={tone} aria-label={`${proximityLabels[tone]}: ${matching.length} obligaciones de ${envelope.name}`} aria-pressed={open&&filters[envelope.id]===tone} onClick={()=>{setExpanded(current=>[...new Set([...current,envelope.id])]);setFilters(current=>({...current,[envelope.id]:tone}));}}><TemporalDot tone={tone} alert={matching.length>0} covered={planningCoverage(matching.map(option=>option.item))}/><small>{matching.length}</small></button>;})}</div>}
        <p className={styles.subtotal}>{items.length} {items.length===1?"obligación":"obligaciones"} · Asignar {display(subtotal)}</p>
        {open && <div className={styles.items} id={`${id}-${envelope.id}`}>{items.length ? items.filter(option=>!showProximity||!filters[envelope.id]||planningTone(option.item)===filters[envelope.id]).map(option => renderOption(option, false)) : <p className="empty-state">Este sobre no tiene metas ni pagos pendientes.</p>}</div>}
        <label className={styles.manual}><span>Asignación adicional<small>Se suma a los elementos seleccionados</small></span><span className={styles.amount}>₡<input aria-label={`Asignación adicional a ${envelope.name}`} type="number" min="0" step="1" max={amount} placeholder="0" value={manual[envelope.id] ?? ""} onChange={event => onManual({...manual, [envelope.id]:event.target.value})}/></span></label>
      </section>;
    })}
    {!!plan.stale.length && <div className="form-error"><p>Selecciones por revisar:</p>{plan.stale.map(choice => <button type="button" className="secondary" key={fundingKey(choice)} onClick={()=>onSelections(selections.filter(item=>fundingKey(item)!==fundingKey(choice)))}>Quitar {choice.name}</button>)}</div>}
    {Object.keys(manual).filter(key => Number(manual[key]) > 0 && !envelopes.some(envelope => envelope.id === key && !envelope.archived)).map(key => <button type="button" className="secondary" key={key} onClick={()=>{const next={...manual};delete next[key];onManual(next);}}>Quitar asignación de sobre no disponible</button>)}
    <div className={styles.summary} aria-live="polite"><span>Ingreso<b>{display(amount)}</b></span><span>Obligaciones seleccionadas<b>{display(plan.selected)}</b></span><span>Total a asignar<b>{display(plan.total)}</b></span><span>{uiCopyEs.money.availableToAssign}<b>{display(plan.remaining)}</b></span></div>
    {!!plan.errors.length && <p role="alert" className="form-error">{plan.errors.join(" ")}</p>}
    <small>La selección es provisional hasta confirmar. No marca obligaciones como pagadas.</small>
  </section>;
}
