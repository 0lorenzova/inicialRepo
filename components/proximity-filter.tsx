"use client";

import { TemporalDot } from "./temporal-indicator";
import { PlanningItemSummary } from "./envelope-planning";
import { FinanceDialog } from "./finance-dialog";
import { globalPlanningItems, proximityLabels, type PlanningEnvelope, type PlanningItem, type ProximityFilter } from "@/lib/envelope-planning";
import styles from "./proximity-filter.module.css";

export function ProximityControls({ value, onChange }: { value?: ProximityFilter; onChange: (value?: ProximityFilter) => void }) {
  return <div className={styles.controls} role="group" aria-label="Filtrar por proximidad"><span className={styles.label}>Filtrar por proximidad</span><div className={styles.colors}>
    {(["white", "green", "yellow", "red"] as const).map(tone => <button key={tone} type="button" aria-label={`Filtrar proximidad: ${proximityLabels[tone]}`} aria-pressed={value === tone} onClick={() => onChange(tone)}><TemporalDot tone={tone} /></button>)}
    <button className={styles.all} type="button" aria-pressed={!value} onClick={() => onChange()}>Ver todos</button>
  </div></div>;
}

export function GlobalPlanningDialog({ envelopes, today, filter, onFilter, display, privateMode, onSelect, onClose }: {
  envelopes: PlanningEnvelope[]; today: string; filter?: ProximityFilter; onFilter: (value?: ProximityFilter) => void;
  display: (value: number) => string; privateMode: boolean; onSelect: (envelopeId: string, item: PlanningItem) => void; onClose: () => void;
}) {
  const items = globalPlanningItems(envelopes, today, filter);
  return <FinanceDialog label="Importes por proximidad" onClose={onClose}><section className="flow-modal"><header><h2>Importes por proximidad</h2><button type="button" aria-label="Cerrar filtro de proximidad" onClick={onClose}>×</button></header><div className="flow-body">
    <ProximityControls value={filter} onChange={onFilter} />
    <p className="flow-intro">Importes pendientes de todos los sobres, ordenados por fecha. Blanco significa fuera de los rangos monitoreados o sin indicador configurado. Los pagos anteriores se conservan en cada sobre.</p>
    <div className={styles.results}>{items.map(({ envelopeId, envelopeName, item }) => <button className={styles.result} type="button" key={`${envelopeId}:${item.id}`} onClick={() => onSelect(envelopeId, item)}>
      <span className={styles.envelope}>{envelopeName}</span><PlanningItemSummary item={item} today={today} display={display} privateMode={privateMode} />
    </button>)}</div>
    {!items.length && <p className="empty-state">No hay importes pendientes en este rango.</p>}
  </div></section></FinanceDialog>;
}
