"use client";

import { TemporalDot } from "./temporal-indicator";
import { PlanningItemSummary } from "./envelope-planning";
import { FinanceDialog } from "./finance-dialog";
import { globalPlanningItems, proximityLabels, proximityCounts, proximityTones, type PlanningEnvelope, type PlanningItem, type ProximityFilter } from "@/lib/envelope-planning";
import styles from "./proximity-filter.module.css";

export function ProximityControls({ value, onChange, envelopes, today }: { envelopes: PlanningEnvelope[]; today: string; value?: ProximityFilter; onChange: (value?: ProximityFilter) => void }) {
  const counts = proximityCounts(globalPlanningItems(envelopes, today).map(entry => entry.item));
  return <div className={styles.controls} role="group" aria-label="Filtrar por proximidad"><span className={styles.label}>Filtrar por proximidad</span><div className={styles.colors}>
    {proximityTones.map(tone => <button key={tone} type="button" aria-label={`Filtrar proximidad: ${proximityLabels[tone]}, ${counts[tone]} elementos`} aria-pressed={value === tone} onClick={() => onChange(tone)}><TemporalDot tone={tone} /><small>{counts[tone]}</small></button>)}
  </div><button className={styles.all} type="button" aria-pressed={!value} onClick={() => onChange()}>Ver todos</button></div>;
}

export function GlobalPlanningDialog({ envelopes, today, filter, onFilter, display, privateMode, onSelect, onClose }: {
  envelopes: PlanningEnvelope[]; today: string; filter?: ProximityFilter; onFilter: (value?: ProximityFilter) => void;
  display: (value: number) => string; privateMode: boolean; onSelect: (envelopeId: string, item: PlanningItem) => void; onClose: () => void;
}) {
  const items = globalPlanningItems(envelopes, today, filter);
  return <FinanceDialog label="Metas y pagos por proximidad" onClose={onClose}><section className="flow-modal"><header><h2>Metas y pagos por proximidad</h2><button type="button" aria-label="Cerrar filtro de proximidad" onClick={onClose}>×</button></header><div className="flow-body">
    <ProximityControls envelopes={envelopes} today={today} value={filter} onChange={onFilter} />
    <p className="flow-intro">Metas y pagos pendientes de todos los sobres, ordenados por fecha. Blanco indica contenido fuera de los períodos de seguimiento; púrpura indica fecha vencida. Los pagos realizados se conservan en el historial.</p>
    <div className={styles.results}>{items.map(({ envelopeId, envelopeName, item }) => <button className={styles.result} type="button" key={`${envelopeId}:${item.id}`} onClick={() => onSelect(envelopeId, item)}>
      <span className={styles.envelope}>{envelopeName}</span><PlanningItemSummary item={item} today={today} display={display} privateMode={privateMode} />
    </button>)}</div>
    {!items.length && <p className="empty-state">No hay metas ni pagos pendientes en este rango.</p>}
  </div></section></FinanceDialog>;
}
