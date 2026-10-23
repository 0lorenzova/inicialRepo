"use client";

import { useMemo, useState } from "react";
import type { Loan, LedgerMovement } from "@/lib/finance-ledger";
import { envelopeLabel } from "@/lib/envelope-label";
import styles from "./loans-screen.module.css";

type LoanEnvelope = { id: string; balance: number };
type LoanFilter = "active" | "returned" | "all";
type Props = {
  loans: Loan[];
  movements: LedgerMovement[];
  envelopes: LoanEnvelope[];
  today: string;
  display: (amount: number) => string;
  onRepay: (loan: Loan) => void;
  onMovement: (movementId: string) => void;
};

const dateValue = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00Z`);
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}-06:00`);
};
const dateTimeLabel = (value: string) => {
  const date = dateValue(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "medium", timeStyle: "short" }).format(date)
    : "Fecha no disponible";
};
const dateLabel = (value: string) => {
  const date = dateValue(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "long" }).format(date)
    : "Fecha no disponible";
};

function loanState(loan: Loan) {
  if (loan.outstanding <= 0) return "Devuelto";
  if (loan.outstanding < loan.amount) return "Parcialmente devuelto";
  return "Pendiente";
}

export function LoansScreen({ loans, movements, envelopes, today, display, onRepay, onMovement }: Props) {
  const [filter, setFilter] = useState<LoanFilter>("active");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const pendingTotal = loans.reduce((sum, loan) => sum + Math.max(0, loan.outstanding), 0);
  const recoveredTotal = movements.reduce((sum, movement) => sum + (movement.type === "Devolución" && movement.loanId ? movement.amount : 0), 0);
  const activeCount = loans.filter(loan => loan.outstanding > 0).length;
  const counts = {
    active: activeCount,
    returned: loans.filter(loan => loan.outstanding <= 0).length,
    all: loans.length,
  };
  const shownLoans = useMemo(() => loans
    .filter(loan => filter === "all" || (filter === "active" ? loan.outstanding > 0 : loan.outstanding <= 0))
    .sort((a, b) => order === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)), [loans, filter, order]);

  const tabs: { id: LoanFilter; label: string }[] = [
    { id: "active", label: "Activos" },
    { id: "returned", label: "Devueltos" },
    { id: "all", label: "Todos" },
  ];

  return <section className={`section page-panel ${styles.screen}`} aria-label="Préstamos entre sobres">
    <div className={styles.summary} aria-label="Resumen de préstamos">
      <article className={styles.metric}>
        <span className={`${styles.metricIcon} ${styles.pendingIcon}`} aria-hidden="true">↔</span>
        <div><span>Por devolver</span><strong>{display(pendingTotal)}</strong><small>en {activeCount} {activeCount === 1 ? "préstamo" : "préstamos"}</small></div>
      </article>
      <article className={styles.metric}>
        <span className={`${styles.metricIcon} ${styles.recoveredIcon}`} aria-hidden="true">↶</span>
        <div><span>Recuperado</span><strong>{display(recoveredTotal)}</strong><small>devoluciones registradas</small></div>
      </article>
      <article className={styles.metric}>
        <span className={`${styles.metricIcon} ${styles.countIcon}`} aria-hidden="true">◷</span>
        <div><span>Préstamos activos</span><strong>{activeCount}</strong><small>de {loans.length} en total</small></div>
      </article>
    </div>

    <div className={styles.controls}>
      <div className={styles.tabs} role="group" aria-label="Filtrar préstamos">
        {tabs.map(tab => <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)}>{tab.label}<span>{counts[tab.id]}</span></button>)}
      </div>
      <label className={styles.sortControl}>
        <span aria-hidden="true">↕</span>
        <span className="visually-hidden">Ordenar préstamos por fecha</span>
        <select aria-label="Ordenar préstamos por fecha" value={order} onChange={event => setOrder(event.target.value as typeof order)}>
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
      </label>
    </div>

    {loans.length === 0 ? <div className={styles.empty}>
      <span aria-hidden="true">↔</span>
      <div><strong>No tienes préstamos registrados.</strong><p>Puedes prestar dinero entre sobres desde las opciones de cada sobre.</p></div>
    </div> : shownLoans.length === 0 ? <div className={styles.empty}>
      <span aria-hidden="true">✓</span>
      <div><strong>{filter === "active" ? "No tienes préstamos activos." : "No hay préstamos en esta vista."}</strong><p>Elige otro filtro para consultar el historial.</p></div>
    </div> : <div className={styles.list}>
      {shownLoans.map(loan => {
        const recovered = Math.max(0, loan.amount - loan.outstanding);
        const progress = loan.amount > 0 ? Math.max(0, Math.min(100, Math.round(recovered / loan.amount * 100))) : 0;
        const isActive = loan.outstanding > 0;
        const isOverdue = isActive && Boolean(loan.dueDate && loan.dueDate < today);
        const targetBalance = envelopes.find(envelope => envelope.id === loan.targetId)?.balance ?? 0;
        const history = movements.filter(movement => movement.loanId === loan.id && (movement.type === "Préstamo" || movement.type === "Devolución")).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
        return <article className={styles.card} key={loan.id}>
          <div className={styles.cardHeading}>
            <div className={styles.relation}>
              <strong>{envelopeLabel(loan.sourceName)}</strong><span aria-label="prestó a">→</span><strong>{envelopeLabel(loan.targetName)}</strong>
            </div>
            <span className={`${styles.status} ${isOverdue ? styles.overdue : loan.outstanding <= 0 ? styles.returned : loan.outstanding < loan.amount ? styles.partial : ""}`}>{isOverdue ? "Vencido" : loanState(loan)}</span>
          </div>

          <div className={styles.amounts}>
            <div><span>Préstamo original</span><strong>{display(loan.amount)}</strong></div>
            <div><span>Devuelto</span><strong className={styles.recoveredAmount}>{display(recovered)}</strong></div>
            <div><span>Pendiente</span><strong className={styles.pendingAmount}>{display(Math.max(0, loan.outstanding))}</strong></div>
          </div>

          <div className={styles.progressTrack} role="progressbar" aria-label={`Devolución de ${loan.sourceName} a ${loan.targetName}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressLabels}><span>{progress} % devuelto</span><span>{display(Math.max(0, loan.outstanding))} por devolver</span></div>

          <div className={styles.dates}>
            <span><b>Fecha del préstamo</b>{dateTimeLabel(loan.date)}</span>
            <span><b>Fecha límite</b>{loan.dueDate ? dateLabel(loan.dueDate) : "Sin fecha límite"}</span>
          </div>

          <div className={styles.cardFooter}>
            <details className={styles.historyDetails}>
              <summary><span>Ver detalles e historial</span><small>{history.length} {history.length === 1 ? "movimiento" : "movimientos"}</small></summary>
              <div className={styles.detailSummary}>
                <span>Estado actual <strong>{loanState(loan)}</strong></span>
                <span>Préstamo original <strong>{display(loan.amount)}</strong></span>
                <span>Total recuperado <strong>{display(recovered)}</strong></span>
                <span>Saldo pendiente <strong>{display(Math.max(0, loan.outstanding))}</strong></span>
                <span>Progreso <strong>{progress} %</strong></span>
              </div>
              <h3>Historial de movimientos</h3>
              {history.length ? <ol className={styles.historyList}>
                {history.map(movement => <li key={movement.id}>
                  <button type="button" onClick={() => onMovement(movement.id)} aria-label={`Abrir movimiento: ${movement.name}`}>
                    <span><strong>{movement.type === "Préstamo" ? "Préstamo registrado" : "Devolución registrada"}</strong><small>{dateTimeLabel(movement.date)}</small></span>
                    <b>{display(movement.amount)}</b>
                  </button>
                </li>)}
              </ol> : <p className={styles.noHistory}>No hay movimientos vinculados a este préstamo.</p>}
            </details>
            {isActive && <div className={styles.repayAction}>
              <button className="primary" type="button" disabled={targetBalance <= 0} onClick={() => onRepay(loan)}>Devolver</button>
              {targetBalance <= 0 && <small>El sobre receptor no tiene saldo disponible.</small>}
            </div>}
          </div>
        </article>;
      })}
    </div>}

    <aside className={styles.info}><span aria-hidden="true">i</span><p><strong>¿Cómo funcionan los préstamos?</strong><br/>El dinero se mueve entre sobres; las devoluciones regresan al sobre que prestó.</p></aside>
  </section>;
}
