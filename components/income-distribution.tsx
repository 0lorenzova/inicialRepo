"use client";
import { useId, useState } from "react";
import { fundingKey, fundingOptions, incomeDistribution, type FundingSelection } from "@/lib/income-distribution";
import { planningTone, type PlanningEnvelope } from "@/lib/envelope-planning";
import { TemporalBadge } from "./temporal-indicator";
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
  const [view, setView] = useState<"envelopes" | "agenda">("envelopes");
  const [expanded, setExpanded] = useState<string[]>([]);
  const id = useId(), options = fundingOptions(envelopes, today);
  const plan = incomeDistribution(envelopes, today, amount, manual, selections);
  const selectedKeys = new Set(selections.map(fundingKey));
  const toggle = (choice: FundingSelection) => onSelections(selectedKeys.has(fundingKey(choice)) ? selections.filter(item => fundingKey(item) !== fundingKey(choice)) : [...selections, choice]);
  const renderOption = (option: typeof options[number], showEnvelope: boolean) => <label className={styles.obligation} key={fundingKey(option.selection)}>
    <input type="checkbox" checked={selectedKeys.has(fundingKey(option.selection))} onChange={() => toggle(option.selection)} aria-label={`Asignar para ${option.item.name} · ${option.envelopeName}`}/>
    <span className={styles.description}><strong>{option.item.name}</strong>{showEnvelope && <small>{option.envelopeName}</small>}<span>{display(option.item.amount)}{option.item.kind === "goal" && <small> · Meta</small>}</span><small>{dateLabel(option.item.deadline)}</small></span>
    <TemporalBadge tone={planningTone(option.item)} date={option.item.deadline} today={today}/>
  </label>;
  return <section className={styles.distribution} aria-label="Distribución provisional del ingreso">
    <p className="flow-intro">Selecciona obligaciones para asignar su monto al sobre. El saldo actual del sobre no se descuenta de esta selección. Los pagos se registran por separado.</p>
    <div className={styles.tabs} role="group" aria-label="Vista de distribución"><button type="button" className="secondary" aria-pressed={view === "envelopes"} onClick={() => setView("envelopes")}>Por sobres</button><button type="button" className="secondary" aria-pressed={view === "agenda"} onClick={() => setView("agenda")}>Cronograma de pagos</button></div>
    {view === "agenda" ? <div className={styles.items}>{options.length ? options.map(option => renderOption(option, true)) : <p className="empty-state">No hay metas ni pagos pendientes. Puedes asignar montos desde Por sobres.</p>}</div> : envelopes.filter(envelope => !envelope.archived).map(envelope => {
      const items = options.filter(option => option.envelopeId === envelope.id), open = expanded.includes(envelope.id);
      const subtotal = plan.allocations.find(allocation => allocation.id === envelope.id)?.amount ?? 0;
      return <section className={styles.envelope} key={envelope.id}><button type="button" className={styles.heading} aria-expanded={open} aria-controls={`${id}-${envelope.id}`} onClick={() => setExpanded(open ? expanded.filter(value => value !== envelope.id) : [...expanded, envelope.id])}><span>{envelope.icon} {envelope.name}<small>{items.length} obligaciones · Asignar {display(subtotal)}</small></span><span aria-hidden="true">{open ? "⌃" : "⌄"}</span></button>
        {open && <div className={styles.items} id={`${id}-${envelope.id}`}>{items.length ? items.map(option => renderOption(option, false)) : <p className="empty-state">Este sobre no tiene metas ni pagos pendientes.</p>}</div>}
        <label className={styles.manual}><span>Asignación adicional<small>Se suma a los elementos seleccionados</small></span><span className={styles.amount}>₡<input aria-label={`Asignación adicional a ${envelope.name}`} type="number" min="0" step="1" max={amount} placeholder="0" value={manual[envelope.id] ?? ""} onChange={event => onManual({...manual, [envelope.id]:event.target.value})}/></span></label>
      </section>;
    })}
    {!!plan.stale.length && <div className="form-error"><p>Selecciones por revisar:</p>{plan.stale.map(choice => <button type="button" className="secondary" key={fundingKey(choice)} onClick={()=>onSelections(selections.filter(item=>fundingKey(item)!==fundingKey(choice)))}>Quitar {choice.name}</button>)}</div>}
    {Object.keys(manual).filter(key => Number(manual[key]) > 0 && !envelopes.some(envelope => envelope.id === key && !envelope.archived)).map(key => <button type="button" className="secondary" key={key} onClick={()=>{const next={...manual};delete next[key];onManual(next);}}>Quitar asignación de sobre no disponible</button>)}
    <div className={styles.summary} aria-live="polite"><span>Ingreso<b>{display(amount)}</b></span><span>Obligaciones seleccionadas<b>{display(plan.selected)}</b></span><span>Total a asignar<b>{display(plan.total)}</b></span><span>Restante sin asignar<b>{display(plan.remaining)}</b></span></div>
    {!!plan.errors.length && <p role="alert" className="form-error">{plan.errors.join(" ")}</p>}
    <small>La selección es provisional hasta confirmar. No marca obligaciones como pagadas.</small>
  </section>;
}
