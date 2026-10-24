"use client";

import type { ReactNode } from "react";
import type { LedgerMovement } from "@/lib/finance-ledger";
import { uiCopyEs } from "@/lib/ui-copy";
import { envelopeLabel } from "@/lib/envelope-label";
import ArrowDownwardOutlined from "@mui/icons-material/ArrowDownwardOutlined";
import ArrowUpwardOutlined from "@mui/icons-material/ArrowUpwardOutlined";
import FormatListBulletedOutlined from "@mui/icons-material/FormatListBulletedOutlined";
import ReplayOutlined from "@mui/icons-material/ReplayOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";
import SwapVertOutlined from "@mui/icons-material/SwapVertOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { HistoryDateFilters } from "./history-filters";
import { EnvelopeHistory } from "./envelope-history";
import styles from "./movements-screen.module.css";

type MovementKind = LedgerMovement["type"];
type QuickFilter = "Todos" | "Ingreso" | "Gasto" | "Transferencia";

export function MovementScreen({
  items,
  counts,
  filter,
  onFilter,
  search,
  onSearch,
  envelopes,
  movementEnvelope,
  onEnvelopeChange,
  movementId,
  from,
  to,
  onDatesChange,
  order,
  onOrderChange,
  hidden,
  returnToIncome,
  onReturn,
  onClearMovement,
  onRemoveEnvelope,
  onClearFilters,
  onDetail,
  onTrace,
  unclearEnvelopeMovements,
}: {
  items: LedgerMovement[];
  counts: { all: number; income: number; expenses: number; transfers: number };
  filter: string;
  onFilter: (filter: string) => void;
  search: string;
  onSearch: (search: string) => void;
  envelopes: { id: string; name: string; archived?: boolean }[];
  movementEnvelope: string | null;
  onEnvelopeChange: (envelopeId: string | null) => void;
  movementId: string | null;
  from: string;
  to: string;
  onDatesChange: (range: { from: string; to: string }) => void;
  order: "newest" | "oldest";
  onOrderChange: (order: "newest" | "oldest") => void;
  hidden: boolean;
  returnToIncome: boolean;
  onReturn: () => void;
  onClearMovement: () => void;
  onRemoveEnvelope: () => void;
  onClearFilters: () => void;
  onDetail: (id: string) => void;
  onTrace: (id: string) => void;
  unclearEnvelopeMovements: boolean;
}) {
  const quickFilters: { value: QuickFilter; label: string; count: number; icon: ReactNode }[] = [
    { value: "Todos", label: "Todos", count: counts.all, icon: <FormatListBulletedOutlined aria-hidden="true" /> },
    { value: "Ingreso", label: "Ingresos", count: counts.income, icon: <ArrowUpwardOutlined aria-hidden="true" /> },
    { value: "Gasto", label: "Gastos", count: counts.expenses, icon: <ArrowDownwardOutlined aria-hidden="true" /> },
    { value: "Transferencia", label: "Transferencias", count: counts.transfers, icon: <SwapHorizOutlined aria-hidden="true" /> },
  ];
  const movementTypes: MovementKind[] = ["Ingreso", "Gasto", "Asignación", "Desasignación", "Transferencia", "Préstamo", "Devolución"];

  return <section className={`section page-panel ${styles.screen}`} aria-label="Historial de movimientos">
    {returnToIncome && <button className={`secondary ${styles.returnButton}`} onClick={onReturn}>‹ Volver a la ruta del ingreso</button>}
    {movementId && <div className={styles.contextFilter}><span>Movimiento seleccionado</span><button onClick={onClearMovement}>{uiCopyEs.movementActions.clearSelectedMovement}</button></div>}
    {movementEnvelope && <div className={styles.contextFilter}><span>Movimientos de <b>{envelopeLabel(envelopes.find(envelope => envelope.id === movementEnvelope)?.name || "Sobre archivado")}</b></span><button aria-label="Ver todos los movimientos" onClick={onRemoveEnvelope}>Quitar filtro ×</button></div>}

    <div className={styles.quickFilters} role="group" aria-label="Filtros rápidos por tipo de movimiento">
      {quickFilters.map(option => <button key={option.value} type="button" className={styles.quickFilter} aria-pressed={filter === option.value} onClick={() => onFilter(option.value)}>
        {option.icon}<span>{option.label} <small>({option.count})</small></span>
      </button>)}
    </div>

    <label className={styles.searchField}>
      <SearchOutlined aria-hidden="true" />
      <input type="search" aria-label="Buscar movimientos" placeholder="Buscar por nombre, sobre, categoría o nota…" value={search} onChange={event => onSearch(event.target.value)} />
    </label>

    <details className={styles.advancedFilters} open>
      <summary><span><TuneOutlined aria-hidden="true" />Filtros avanzados</span></summary>
      <div className={styles.filterGrid}>
        <label>Sobre
          <select value={movementEnvelope || ""} onChange={event => onEnvelopeChange(event.target.value || null)}>
            <option value="">Todos los sobres</option>
            {envelopes.map(envelope => <option key={envelope.id} value={envelope.id}>{envelopeLabel(envelope.name)}{envelope.archived ? " (archivado)" : ""}</option>)}
          </select>
        </label>
        <label>Tipo de movimiento
          <select value={filter} onChange={event => onFilter(event.target.value)}>
            <option value="Todos">Todos</option>
            {movementTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <div className={styles.dateFilters}><HistoryDateFilters from={from} to={to} onChange={onDatesChange} showClearButton={false} /></div>
        <button type="button" className={styles.clearFilters} onClick={onClearFilters}><ReplayOutlined aria-hidden="true" />Limpiar filtros</button>
      </div>
    </details>

    <div className={styles.resultsBar}>
      <b>Resultados ({items.length})</b>
      <label><SwapVertOutlined aria-hidden="true" /><span className={styles.visuallyHidden}>Ordenar movimientos</span>
        <select aria-label="Ordenar movimientos" value={order} onChange={event => onOrderChange(event.target.value as "newest" | "oldest")}>
          <option value="newest">Más reciente primero</option>
          <option value="oldest">Más antiguo primero</option>
        </select>
      </label>
    </div>

    <EnvelopeHistory key={movementEnvelope || "all"} items={items} envelopeId={movementEnvelope || undefined} hidden={hidden} onDetail={onDetail} onTrace={onTrace} variant="screen" />
    {movementEnvelope && unclearEnvelopeMovements && <p className={styles.legacyNote}>Algunos movimientos antiguos no identifican su sobre con certeza. Se conservan en el historial completo.</p>}
  </section>;
}
