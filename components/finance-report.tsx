"use client";

import { useState, type ReactNode } from "react";
import { envelopeLabel } from "@/lib/envelope-label";
import { filterHistory, financialReport, monthRange } from "@/lib/finance-history";
import type { LedgerMovement } from "@/lib/finance-ledger";
import { movementMoney, movementDate } from "@/lib/movement-presentation";
import { reportPanels, type ReportKind, type ReportPanel } from "@/lib/app-navigation";
import styles from "./finance-history.module.css";

const reportOptions: { value: ReportKind; label: string }[] = [
  { value: "summary", label: "Resumen general" },
  { value: "income", label: "Ingresos" },
  { value: "category", label: "Gastos por categoría" },
  { value: "envelope", label: "Gastos por sobre" },
  { value: "history", label: "Historial de movimientos" },
];
const movementTypes = ["Todos", "Ingreso", "Gasto", "Asignación", "Desasignación", "Transferencia", "Préstamo", "Devolución"] as const;
type MovementFilter = (typeof movementTypes)[number];

function signedMoney(value: number, display: (value: number) => string) {
  if (value === 0) return display(0);
  return `${value > 0 ? "+" : "−"}${display(Math.abs(value))}`;
}

function balanceMoney(value: number, display: (value: number) => string) {
  return value < 0 ? `−${display(Math.abs(value))}` : display(value);
}

function shiftMonth(month: string, offset: number) {
  if (!month) return month;
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function monthName(month: string) {
  if (!month) return "Todo el historial";
  const date = new Date(`${month}-01T12:00:00Z`);
  return new Intl.DateTimeFormat("es-CR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function currentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "America/Costa_Rica" }).formatToParts(new Date());
  return `${parts.find(part => part.type === "year")?.value}-${parts.find(part => part.type === "month")?.value}`;
}

function categoryAmount(movement: LedgerMovement, category: string) {
  if (movement.type !== "Gasto") return 0;
  if (movement.categoryAllocations?.length) return movement.categoryAllocations.filter(item => item.name === category).reduce((sum, item) => sum + item.amount, 0);
  return (movement.category || "Sin categoría") === category ? movement.amount : 0;
}

function envelopeAmount(movement: LedgerMovement, envelopeId: string) {
  if (movement.type !== "Gasto") return 0;
  if (envelopeId === "without-envelope") return Math.max(0, movement.amount - movement.allocations.reduce((sum, item) => sum + item.amount, 0));
  return movement.allocations.filter(item => (item.envelopeId || `legacy:${item.name}`) === envelopeId).reduce((sum, item) => sum + item.amount, 0);
}

function movementSecondary(movement: LedgerMovement) {
  const envelopes = [...new Set(movement.allocations.map(item => envelopeLabel(item.name)).filter(Boolean))];
  return [movement.type, movement.category, envelopes.length ? envelopes.join(" · ") : ""].filter(Boolean).join(" · ");
}

function Disclosure({ title, summary, expanded, onToggle, children }: { title: string; summary?: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className={styles.reportPanel}>
    <button type="button" className={styles.panelHeading} aria-expanded={expanded} onClick={onToggle}>
      <span className={styles.panelTitle}>{title}</span>
      <span className={styles.panelHeadingEnd}>{summary && <small>{summary}</small>}<span aria-hidden="true">{expanded ? "⌃" : "⌄"}</span></span>
    </button>
    {expanded && <div className={styles.panelBody}>{children}</div>}
  </section>;
}

function ReportMovements({ items, hidden, onDetail, amountFor }: { items: LedgerMovement[]; hidden: boolean; onDetail: (id: string) => void; amountFor?: (movement: LedgerMovement) => number }) {
  if (!items.length) return <p className={styles.compactEmpty}>No hay movimientos en este período.</p>;
  return <div className={styles.movementList}>{items.map(movement => {
    const amount = amountFor ? amountFor(movement) : movement.amount;
    const color = movement.type === "Ingreso" ? styles.income : movement.type === "Gasto" ? styles.expense : styles.internal;
    const sign = movement.type === "Ingreso" ? "+" : movement.type === "Gasto" ? "−" : "↔";
    return <button type="button" className={styles.movementRow} key={movement.id} onClick={() => onDetail(movement.id)}>
      <span className={styles.movementCopy}>
        <b>{hidden ? movement.type : movement.name || movement.reference || movement.type}</b>
        <small>{movementDate(movement.date)}</small>
        <small>{hidden ? movement.type : movementSecondary(movement)}</small>
      </span>
      <strong className={color}>{hidden ? "••••" : `${sign} ${movementMoney(movement, amount)}`}</strong>
      <span className={styles.rowChevron} aria-hidden="true">›</span>
    </button>;
  })}</div>;
}

export function FinanceReport({ movements, month, onMonth, display, kind, onKind, panels, onPanels, hidden, onDetail }: {
  movements: LedgerMovement[];
  month: string;
  onMonth: (month: string) => void;
  display: (value: number) => string;
  kind?: ReportKind | null;
  onKind: (kind: ReportKind) => void;
  panels?: string;
  onPanels: (panels: string) => void;
  hidden: boolean;
  onDetail: (id: string) => void;
}) {
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("Todos");
  const [openBreakdown, setOpenBreakdown] = useState<string | null>(null);
  const selectedKind = kind || "summary";
  let report: ReturnType<typeof financialReport> | null = null;
  let periodItems: LedgerMovement[] = [];
  try {
    report = financialReport(movements, month || undefined);
    periodItems = filterHistory(movements, month ? monthRange(month) : {});
  } catch { /* The invalid period is explained below without showing partial totals. */ }

  const defaultPanels: ReportPanel[] = [
    "summary",
    ...(report?.spent ? ["category", "envelope"] as const : []),
    ...(selectedKind === "history" || selectedKind === "income" ? ["history"] as const : []),
    ...(selectedKind === "category" ? ["category"] as const : []),
    ...(selectedKind === "envelope" ? ["envelope"] as const : []),
  ];
  const expanded = new Set<ReportPanel>((panels === undefined ? defaultPanels : panels.split(",").filter((panel): panel is ReportPanel => reportPanels.some(item => item === panel))));
  const togglePanel = (panel: ReportPanel) => {
    const next = new Set(expanded);
    if (next.has(panel)) next.delete(panel); else next.add(panel);
    onPanels([...next].join(","));
  };
  const selectKind = (nextKind: ReportKind) => {
    const panel: ReportPanel = nextKind === "income" || nextKind === "history" ? "history" : nextKind === "summary" ? "summary" : nextKind;
    const next = new Set(expanded);
    next.add(panel);
    onPanels([...next].join(","));
    onKind(nextKind);
  };
  const categories = report?.categories ?? [];
  const envelopes = [...(report?.envelopes ?? [])];
  if (report?.withoutEnvelope) envelopes.push({ id: "without-envelope", name: "Sin sobre", spent: report.withoutEnvelope });
  const incomeItems = periodItems.filter(item => item.type === "Ingreso");
  const historyItems = movementFilter === "Todos" ? periodItems : periodItems.filter(item => item.type === movementFilter);

  return <div className={styles.reports}>
    <div className={styles.reportFilters}>
      <div className={styles.filterGrid}>
        <label className={styles.filterField}>
          <span>Período</span>
          <span className={styles.periodControl}>
            <button type="button" aria-label="Mes anterior" disabled={!month} onClick={() => onMonth(shiftMonth(month, -1))}>‹</button>
            <input aria-label="Mes del reporte" type="month" value={month} onChange={event => onMonth(event.target.value)} />
            <button type="button" aria-label="Mes siguiente" disabled={!month} onClick={() => onMonth(shiftMonth(month, 1))}>›</button>
          </span>
        </label>
        <label className={styles.filterField}>
          <span>Tipo de reporte</span>
          <select aria-label="Tipo de reporte" value={selectedKind} onChange={event => selectKind(event.target.value as ReportKind)}>
            {reportOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <button type="button" className={styles.historyToggle} onClick={() => onMonth(month ? "" : currentMonth())}>{month ? "Ver todo el historial" : "Volver al mes actual"}</button>
    </div>

    {!report ? <p role="alert" className={styles.error}>Selecciona un período válido.</p> : <>
      <p className={styles.periodSummary}>{monthName(month)} <span>·</span> {report.count} movimientos. Los movimientos internos se muestran en el historial, sin sumarse como ingresos o gastos.</p>

      {selectedKind === "summary" && <>
        <Disclosure title="Resumen del período" summary={`${report.count} movimientos`} expanded={expanded.has("summary")} onToggle={() => togglePanel("summary")}>
          <div className={styles.metricGrid}>
            <button type="button" className={`${styles.metric} ${styles.metricIncome}`} onClick={() => selectKind("income")}>
              <span>Ingresos</span><b>{signedMoney(report.income, display)}</b><small>Total recibido en el período · Ver detalle</small>
            </button>
            <button type="button" className={`${styles.metric} ${styles.metricExpense}`} onClick={() => selectKind("category")}>
              <span>Gastos</span><b>{signedMoney(-report.spent, display)}</b><small>Total gastado en el período · Ver detalle</small>
            </button>
            <div className={`${styles.metric} ${styles.metricBalance}`}>
              <span>Balance del período</span><b>{balanceMoney(report.net, display)}</b><small>Ingresos − gastos</small>
            </div>
          </div>
        </Disclosure>

        <Disclosure title="Gasto por categoría" summary={display(report.spent)} expanded={expanded.has("category")} onToggle={() => togglePanel("category")}>
          {report.spent > 0 && <BreakdownRows rows={categories.map(([name, amount]) => ({ id: name, name, amount }))} total={report.spent} expandedId={openBreakdown} onOpen={setOpenBreakdown} items={periodItems} display={display} hidden={hidden} onDetail={onDetail} panel="category" />}
        </Disclosure>

        <Disclosure title="Gasto por sobre" summary={display(report.spent)} expanded={expanded.has("envelope")} onToggle={() => togglePanel("envelope")}>
          {report.spent > 0 && <BreakdownRows rows={envelopes.map(item => ({ id: item.id, name: envelopeLabel(item.name), amount: item.spent }))} total={report.spent} expandedId={openBreakdown} onOpen={setOpenBreakdown} items={periodItems} display={display} hidden={hidden} onDetail={onDetail} panel="envelope" />}
        </Disclosure>

        {report.spent === 0 && <p className={styles.sharedEmpty}>No hay gastos en este período.</p>}

        <Disclosure title="Historial de movimientos" summary={`${report.count}`} expanded={expanded.has("history")} onToggle={() => togglePanel("history")}>
          <HistoryList items={periodItems} filter={movementFilter} onFilter={setMovementFilter} hidden={hidden} onDetail={onDetail} />
        </Disclosure>
      </>}

      {selectedKind === "income" && <Disclosure title="Ingresos del período" summary={`${incomeItems.length} movimientos`} expanded={expanded.has("history")} onToggle={() => togglePanel("history")}>
        <ReportMovements items={incomeItems} hidden={hidden} onDetail={onDetail} />
      </Disclosure>}

      {selectedKind === "category" && <Disclosure title="Gasto por categoría" summary={display(report.spent)} expanded={expanded.has("category")} onToggle={() => togglePanel("category")}>
        {report.spent > 0 ? <BreakdownRows rows={categories.map(([name, amount]) => ({ id: name, name, amount }))} total={report.spent} expandedId={openBreakdown} onOpen={setOpenBreakdown} items={periodItems} display={display} hidden={hidden} onDetail={onDetail} panel="category" /> : <p className={styles.compactEmpty}>No hay gastos en este período.</p>}
      </Disclosure>}

      {selectedKind === "envelope" && <Disclosure title="Gasto por sobre" summary={display(report.spent)} expanded={expanded.has("envelope")} onToggle={() => togglePanel("envelope")}>
        {report.spent > 0 ? <BreakdownRows rows={envelopes.map(item => ({ id: item.id, name: envelopeLabel(item.name), amount: item.spent }))} total={report.spent} expandedId={openBreakdown} onOpen={setOpenBreakdown} items={periodItems} display={display} hidden={hidden} onDetail={onDetail} panel="envelope" /> : <p className={styles.compactEmpty}>No hay gastos en este período.</p>}
      </Disclosure>}

      {selectedKind === "history" && <Disclosure title="Historial de movimientos" summary={`${historyItems.length} movimientos`} expanded={expanded.has("history")} onToggle={() => togglePanel("history")}>
        <HistoryList items={periodItems} filter={movementFilter} onFilter={setMovementFilter} hidden={hidden} onDetail={onDetail} />
      </Disclosure>}
    </>}
  </div>;
}

function BreakdownRows({ rows, total, expandedId, onOpen, items, display, hidden, onDetail, panel }: {
  rows: { id: string; name: string; amount: number }[];
  total: number;
  expandedId: string | null;
  onOpen: (id: string | null) => void;
  items: LedgerMovement[];
  display: (value: number) => string;
  hidden: boolean;
  onDetail: (id: string) => void;
  panel: "category" | "envelope";
}) {
  if (!rows.length) return <p className={styles.compactEmpty}>No hay gastos clasificados en este período.</p>;
  return <div className={styles.breakdownList}>{rows.map(row => {
    const key = `${panel}:${row.id}`;
    const opened = expandedId === key;
    const related = items.filter(item => item.type === "Gasto" && (panel === "category" ? categoryAmount(item, row.id) : envelopeAmount(item, row.id)) > 0);
    const amountForRow = panel === "category" ? (movement: LedgerMovement) => categoryAmount(movement, row.id) : (movement: LedgerMovement) => envelopeAmount(movement, row.id);
    const share = total ? row.amount / total * 100 : 0;
    return <div className={styles.breakdownItem} key={row.id}>
      <button type="button" className={styles.breakdownButton} aria-expanded={opened} onClick={() => onOpen(opened ? null : key)}>
        <span className={styles.breakdownCopy}><b>{row.name}</b><small>{share.toLocaleString("es-CR", { maximumFractionDigits: 1 })}% del gasto</small><span className={styles.bar}><i style={{ width: `${Math.max(0, Math.min(100, share))}%` }} /></span></span>
        <strong>{hidden ? "••••" : display(row.amount)}</strong>
        <span className={styles.rowChevron} aria-hidden="true">{opened ? "⌃" : "›"}</span>
      </button>
      {opened && <ReportMovements items={related} hidden={hidden} onDetail={onDetail} amountFor={amountForRow} />}
    </div>;
  })}</div>;
}

function HistoryList({ items, filter, onFilter, hidden, onDetail }: {
  items: LedgerMovement[];
  filter: MovementFilter;
  onFilter: (filter: MovementFilter) => void;
  hidden: boolean;
  onDetail: (id: string) => void;
}) {
  const filtered = filter === "Todos" ? items : items.filter(item => item.type === filter);
  return <>
    <label className={styles.historyFilter}><span>Tipo de movimiento</span><select aria-label="Tipo de movimiento" value={filter} onChange={event => onFilter(event.target.value as MovementFilter)}>{movementTypes.map(type => <option value={type} key={type}>{type}</option>)}</select></label>
    <ReportMovements items={filtered} hidden={hidden} onDetail={onDetail} />
  </>;
}
