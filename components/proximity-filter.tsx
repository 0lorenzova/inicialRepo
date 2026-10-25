"use client";

import { envelopeLabel } from "@/lib/envelope-label";
import { useTemporalDisplay, TemporalDot } from "./temporal-indicator";
import { PlanningItemSummary } from "./envelope-planning";
import { FinanceDialog } from "./finance-dialog";
import { globalPlanningItems, plannedPaymentWarnings, planningCoverage, planningTone, proximityLabels, proximityCounts, proximityTones, type PlanningEnvelope, type PlanningItem, type ProximityFilter } from "@/lib/envelope-planning";
import styles from "./proximity-filter.module.css";
import { uiCopyEs } from "@/lib/ui-copy";

export function ProximityControls({ value, onChange, envelopes, today, home = false, enabled = true, onEnabledChange, showAll = true, allEnabled = false, onAllEnabledChange }: { envelopes: PlanningEnvelope[]; today: string; value?: ProximityFilter; onChange: (value?: ProximityFilter) => void; home?: boolean; enabled?: boolean; onEnabledChange?: (enabled:boolean)=>void; showAll?: boolean; allEnabled?:boolean; onAllEnabledChange?:(enabled:boolean)=>void }) {
  const {visible}=useTemporalDisplay();
  const all=globalPlanningItems(envelopes,today).map(entry=>entry.item);
  const counts = proximityCounts(all);
  if(!visible)return null;
  return <div className={`${styles.controls} ${home?styles.home:""}`} role="group" aria-label={home?"Filtros de sobres y proximidad":"Filtrar por proximidad"}>{home?<label className={styles.enable}><span>{uiCopyEs.proximity.showFilters}</span><input type="checkbox" checked={enabled} onChange={event=>onEnabledChange?.(event.target.checked)}/></label>:<span className={styles.label}>Filtrar por proximidad</span>}{(!home||enabled)&&<div className={styles.colors}>
    {proximityTones.map(tone => <button key={tone} type="button" aria-label={`Filtrar proximidad: ${proximityLabels[tone]}, ${counts[tone]} elementos`} aria-pressed={value === tone} onClick={() => { if(home)onAllEnabledChange?.(false); onChange(tone); }}><TemporalDot tone={tone} late={Boolean(plannedPaymentWarnings(all.filter(item=>planningTone(item)===tone)))} lateLabel={plannedPaymentWarnings(all.filter(item=>planningTone(item)===tone))} alert={counts[tone]>0} covered={planningCoverage(all.filter(item=>planningTone(item)===tone))}/><small>{counts[tone]}</small></button>)}
  </div>}{showAll&&(home?<button className={`${styles.all} ${styles.allToggle}`} type="button" data-active={allEnabled} onClick={()=>{onAllEnabledChange?.(true);onChange();}}>Ver todos</button>:<button className={styles.all} type="button" aria-pressed={!value} onClick={() => onChange()}>Ver todos</button>)}</div>;
}

export function GlobalPlanningDialog({ envelopes, today, filter, onFilter, display, privateMode, onSelect, onClose }: {
  envelopes: PlanningEnvelope[]; today: string; filter?: ProximityFilter; onFilter: (value?: ProximityFilter) => void;
  display: (value: number) => string; privateMode: boolean; onSelect: (envelopeId: string, item: PlanningItem) => void; onClose: () => void;
}) {
  const {visible}=useTemporalDisplay();
  const items = globalPlanningItems(envelopes, today, visible?filter:undefined);
  return <FinanceDialog label="Metas y pagos por proximidad" onClose={onClose}><section className="flow-modal"><header><h2>Metas y pagos por proximidad</h2><button type="button" aria-label="Cerrar filtro de proximidad" onClick={onClose}>×</button></header><div className="flow-body">
    <ProximityControls envelopes={envelopes} today={today} value={filter} onChange={onFilter} />
    <p className="flow-intro">Metas y pagos pendientes de todos los sobres, ordenados por fecha. Blanco indica contenido fuera de los períodos de seguimiento; púrpura indica fecha vencida. Los pagos realizados se conservan en el historial.</p>
    <div className={styles.results}>{items.map(({ envelopeId, envelopeName, item }) => <button className={styles.result} type="button" key={`${envelopeId}:${item.id}`} onClick={() => onSelect(envelopeId, item)}>
      <span className={styles.envelope}>{envelopeLabel(envelopeName)}</span><PlanningItemSummary item={item} today={today} display={display} privateMode={privateMode} />
    </button>)}</div>
    {!items.length && <p className="empty-state">No hay metas ni pagos pendientes en este rango.</p>}
  </div></section></FinanceDialog>;
}
