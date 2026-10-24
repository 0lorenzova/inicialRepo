"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import FormatListBulletedOutlined from "@mui/icons-material/FormatListBulletedOutlined";
import ReplayOutlined from "@mui/icons-material/ReplayOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import WalletOutlined from "@mui/icons-material/WalletOutlined";
import type { Ledger, LedgerMovement, Loan } from "@/lib/finance-ledger";
import { salaryPaymentValid, salaryReceived, salaryState, type SalaryLedger } from "@/lib/salary-tracking";
import { movementInstant } from "@/lib/finance-history";
import { incomeDistribution } from "@/lib/income-trace";
import { movementMoney } from "@/lib/movement-presentation";
import { uiCopyEs } from "@/lib/ui-copy";
import styles from "./recent-activity-list.module.css";

type Props = {
  items: LedgerMovement[];
  ledger: Ledger;
  salaryLedger: SalaryLedger;
  loans: Loan[];
  hidden: boolean;
  display: (amount: number) => string;
  onDetail: (id: string) => void;
  onTrace: (id: string) => void;
  onLoan: (id: string) => void;
  onHistory: () => void;
};

type SummaryCard = { key: string; label: string; value: string; icon: ReactNode; tone?: "purple" | "green" | "amber" | "blue"; hint?: string; sourceField?: string };

function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  if (!cards.length) return null;
  return <div className={styles.summaryCards} data-count={cards.length}>{cards.map(card => <div key={card.key} className={styles.summaryCard} data-tone={card.tone ?? "blue"}>
    <span className={styles.summaryIcon} aria-hidden="true">{card.icon}</span>
    <span className={styles.summaryCopy}><span className={styles.summaryLabel}>{card.label}</span>{card.hint && <small className={styles.summaryHint}>{card.hint}</small>}<strong className={styles.summaryValue}>{card.value}</strong></span>
  </div>)}</div>;
}

function activityTitle(movement: LedgerMovement, hidden: boolean, loan?: Loan) {
  if (hidden) return movement.type;
  const [source, target] = movement.allocations;
  if ((movement.type === "Préstamo" || movement.type === "Devolución") && loan) {
    return movement.type === "Préstamo" ? `${loan.sourceName} → ${loan.targetName}` : `${loan.targetName} → ${loan.sourceName}`;
  }
  if (movement.type === "Asignación" && source) return `Asignación a ${source.name}`;
  if (movement.type === "Desasignación" && source) return `Dinero devuelto desde ${source.name}`;
  if ((movement.type === "Transferencia" || movement.type === "Préstamo" || movement.type === "Devolución") && source && target) {
    return `${source.name} → ${target.name}`;
  }
  return movement.name;
}

function activityDate(value: string) {
  const instant = movementInstant(value);
  return Number.isFinite(instant)
    ? new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Costa_Rica" }).format(instant)
    : "Fecha no disponible";
}

function activityDay(value: string) {
  const instant = Date.parse(`${value}T12:00:00-06:00`);
  return Number.isFinite(instant)
    ? new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeZone: "America/Costa_Rica" }).format(instant)
    : "Fecha no disponible";
}

function iconFor(type: LedgerMovement["type"]) {
  switch (type) {
    case "Ingreso": return "+";
    case "Gasto": return "−";
    case "Asignación": return "⇄";
    case "Desasignación": return "↩";
    case "Préstamo": return "→";
    case "Devolución": return "↶";
    default: return "⇄";
  }
}

function iconClass(type: LedgerMovement["type"]) {
  return type === "Ingreso" ? styles.incomeIcon : type === "Gasto" ? styles.expenseIcon : styles.internalIcon;
}

function loanStatus(loan: Loan) {
  if (loan.outstanding <= 0) return "Devuelto";
  if (loan.outstanding < loan.amount) return "Parcialmente devuelto";
  return "Pendiente";
}

function activityFields(movement: LedgerMovement, title: string): [string, string][] {
  const normalizedTitle = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const fields: [string, string][] = [];
  const add = (label: string, value?: string) => {
    const clean = value?.trim();
    if (!clean || normalizedTitle.includes(clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) return;
    fields.push([label, clean]);
  };
  add(movement.type === "Ingreso" ? "Cuenta receptora" : "Cuenta afectada", movement.accountName);
  add(movement.type === "Ingreso" ? "Medio de recepción" : "Método de pago", movement.paymentMethod);
  add(movement.type === "Ingreso" ? "Tipo de ingreso" : "Categoría", movement.category);
  add("Descripción", movement.description);
  add("Comercio / lugar", movement.merchant);
  add("Referencia", movement.reference === movement.scheduledAmountId ? undefined : movement.reference);
  add("Etiquetas", movement.tags?.join(" · "));
  return fields;
}

function secondaryDetailsExist(movement: LedgerMovement, loan?: Loan, hidden = false) {
  if (hidden || movement.type === "Ingreso" || movement.type === "Asignación") return true;
  if (loan && (movement.type === "Devolución" || loan.dueDate)) return true;
  const title = activityTitle(movement, hidden, loan);
  const fields = activityFields(movement, title);
  if (loan && (movement.type === "Préstamo" || movement.type === "Devolución")) {
    return fields.length > 0 || Boolean(movement.categoryAllocations?.length || movement.products?.length || movement.fundingTargets?.length || movement.distributionCorrection);
  }
  const order = movement.type === "Gasto"
    ? ["Cuenta afectada", "Categoría", "Comercio / lugar", "Método de pago"]
    : ["Cuenta afectada", "Medio de recepción", "Método de pago", "Categoría", "Tipo de ingreso", "Comercio / lugar"];
  const summaryCount = 3;
  const summarized = new Set(order.filter(label => fields.some(([fieldLabel]) => fieldLabel === label)).slice(0, summaryCount));
  return fields.some(([label]) => !summarized.has(label)) ||
    (movement.type === "Gasto" && movement.allocations.length > 1) ||
    Boolean(movement.categoryAllocations?.length || movement.products?.length || movement.fundingTargets?.length || movement.distributionCorrection);
}

export function RecentActivityList({ items, ledger, salaryLedger, loans, hidden, display, onDetail, onTrace, onLoan, onHistory }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const checkboxRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const loansById = useMemo(() => new Map(loans.map(loan => [loan.id, loan])), [loans]);
  const salary = useMemo(() => salaryState(salaryLedger), [salaryLedger]);
  const salaryPeriodsById = useMemo(() => new Map(salary.periods.map(period => [period.id, period])), [salary.periods]);
  const salaryPaymentsByMovementId = useMemo(() => new Map(salary.payments.filter(payment => salaryPaymentValid(salaryLedger, payment)).map(payment => [payment.movementId, payment])), [salary.payments, salaryLedger]);
  const expandableIds = items.filter(item => secondaryDetailsExist(item, item.loanId ? loansById.get(item.loanId) : undefined, hidden)).map(item => item.id);
  const allExpanded = expandableIds.length > 0 && expandableIds.every(id => expandedIds.has(id));
  const someExpanded = expandableIds.some(id => expandedIds.has(id));
  const incomeTraces = useMemo(() => {
    const traces = new Map<string, ReturnType<typeof incomeDistribution>>();
    if (hidden) return traces;
    for (const item of items) {
      if (item.type === "Ingreso") traces.set(item.id, incomeDistribution(ledger, item.id));
    }
    return traces;
  }, [hidden, items, ledger]);

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = someExpanded && !allExpanded;
  }, [allExpanded, someExpanded]);

  const toggleAll = () => setExpandedIds(current => {
    if (expandableIds.length > 0 && expandableIds.every(id => current.has(id))) return new Set([...current].filter(id => !expandableIds.includes(id)));
    return new Set([...current, ...expandableIds]);
  });

  const toggleOne = (id: string) => setExpandedIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return <div className={styles.root}>
    <label className={styles.expandAll}>
      <input ref={checkboxRef} type="checkbox" checked={allExpanded} disabled={!expandableIds.length} aria-checked={someExpanded && !allExpanded ? "mixed" : allExpanded} onChange={toggleAll} />
      <span>Desplegar todo</span>
    </label>

    {items.length ? <div className={styles.list}>
      {items.map(movement => {
        const loan = movement.loanId ? loansById.get(movement.loanId) : undefined;
        const title = activityTitle(movement, hidden, loan);
        const canExpand = secondaryDetailsExist(movement, loan, hidden);
        const expanded = canExpand && expandedIds.has(movement.id);
        const detailsId = `recent-${listId}-${movement.id}`;
        const sign = movement.type === "Ingreso" ? "+" : movement.type === "Gasto" ? "−" : "";
        const trace = incomeTraces.get(movement.id);
        const allocations = movement.allocations;
        const sourceMovements = (movement.incomeSources ?? []).map(source => ({ source, income: ledger.movements.find(item => item.id === source.incomeId) })).filter(item => Boolean(item.income));
        const titleText = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const fields = activityFields(movement, title);

        const isLoanMovement = Boolean(loan && (movement.type === "Préstamo" || movement.type === "Devolución"));
        const returned = loan ? Math.max(0, loan.amount - loan.outstanding) : 0;
        const summaryCards: SummaryCard[] = [];
        const salaryPayment = salaryPaymentsByMovementId.get(movement.id);

        if (!hidden && isLoanMovement && loan) {
          summaryCards.push(
            { key: "loan-original", label: "Monto original", value: display(loan.amount), icon: <AccountBalanceWalletOutlined />, tone: "purple" },
            { key: "loan-returned", label: "Devuelto", value: display(returned), icon: <ReplayOutlined />, tone: "green" },
            { key: "loan-pending", label: "Pendiente", value: display(Math.max(0, loan.outstanding)), icon: <ScheduleOutlined />, tone: "amber" },
          );
        } else if (!hidden && movement.type === "Ingreso" && salaryPayment && trace) {
          const periodIds = [...new Set(salaryPayment.applications.map(application => application.periodId))].filter(id => salaryPeriodsById.has(id));
          if (periodIds.length) {
            const received = periodIds.reduce((sum, id) => sum + salaryReceived(salaryLedger, id), 0);
            summaryCards.push(
              { key: "salary-received", label: "Total recibido", hint: "del período", value: display(received), icon: <AccountBalanceWalletOutlined />, tone: "blue" },
              { key: "salary-assigned", label: "Asignado", hint: "de este abono", value: display(trace.assigned), icon: <CategoryOutlined />, tone: "purple" },
              { key: "salary-unassigned", label: uiCopyEs.money.availableToAssign, hint: "de este abono", value: display(trace.unassigned), icon: <AccountBalanceOutlined />, tone: "green" },
            );
          }
        }

        if (!hidden && summaryCards.length === 0) {
          if (movement.type === "Asignación" && sourceMovements.length) {
            const sourceLabel = sourceMovements.length === 1 ? sourceMovements[0].income!.name : `${sourceMovements.length} ingresos vinculados`;
            summaryCards.push({ key: "assignment-origin", label: "Ingreso de origen", value: sourceLabel, icon: <AccountBalanceWalletOutlined />, tone: "blue" });
          }
          const fieldOrder = movement.type === "Gasto"
            ? ["Cuenta afectada", "Categoría", "Comercio / lugar", "Método de pago"]
            : movement.type === "Ingreso"
              ? ["Cuenta receptora", "Tipo de ingreso", "Medio de recepción", "Categoría", "Comercio / lugar"]
              : ["Cuenta afectada", "Medio de recepción", "Método de pago", "Categoría", "Tipo de ingreso", "Comercio / lugar"];
          for (const label of fieldOrder) {
            const field = fields.find(([fieldLabel]) => fieldLabel === label);
            if (!field || summaryCards.length >= 3 || summaryCards.some(card => card.sourceField === label)) continue;
            const icon = label.startsWith("Cuenta") ? <CreditCardOutlined /> : label === "Categoría" || label === "Tipo de ingreso" ? <CategoryOutlined /> : <AccountBalanceOutlined />;
            const cardLabel = label === "Cuenta afectada" || label === "Cuenta receptora" ? "Cuenta" : label === "Comercio / lugar" ? "Lugar" : label;
            summaryCards.push({ key: `field-${label}`, label: cardLabel, value: field[1], icon, tone: "blue", sourceField: label });
          }
          if (movement.type === "Gasto" && allocations.length === 1 && summaryCards.length < 3) {
            const name = allocations[0].name;
            if (!titleText.includes(name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) summaryCards.push({ key: "expense-envelope", label: "Sobre utilizado", value: name, icon: <WalletOutlined />, tone: "purple" });
          }
        }
        const summaryFieldLabels = new Set(summaryCards.map(card => card.sourceField).filter((label): label is string => Boolean(label)));
        const secondaryFields = fields.filter(([label]) => !summaryFieldLabels.has(label));
        const amountClass = [styles.amount, movement.type === "Ingreso" ? styles.positive : movement.type === "Gasto" ? styles.negative : ""].filter(Boolean).join(" ");

        return <article key={movement.id} className={styles.item}>
          <div className={styles.row}>
            <span className={`${styles.icon} ${iconClass(movement.type)}`} aria-hidden="true">{iconFor(movement.type)}</span>
            <div className={styles.heading}>
              <button type="button" className={styles.title} aria-label={`Abrir detalle de ${title}`} onClick={() => onDetail(movement.id)}>{title}</button>
              <div className={styles.amountStack}>
                {isLoanMovement && loan && !hidden && <span className={styles.loanStatus} data-state={loan.outstanding <= 0 ? "returned" : loan.outstanding < loan.amount ? "partial" : "pending"}>{loanStatus(loan)}</span>}
                <strong className={amountClass}>{sign}{hidden ? "••••••" : movementMoney(movement)}</strong>
              </div>
            </div>
            <time className={styles.date} dateTime={movement.date}>{activityDate(movement.date)}</time>
            {canExpand && <button type="button" className={styles.expandButton} aria-label={(expanded ? "Contraer" : "Expandir") + " detalles de " + title} aria-expanded={expanded} aria-controls={detailsId} onClick={() => toggleOne(movement.id)}>
              <ExpandMoreOutlined aria-hidden="true" />
            </button>}
          </div>

          <SummaryCards cards={summaryCards} />
          {!hidden && isLoanMovement && loan && <button type="button" className={styles.loanLink} onClick={() => onLoan(loan.id)}><span>Ver préstamo</span><ChevronRightOutlined aria-hidden="true" /></button>}

          <div id={detailsId} className={styles.details} hidden={!expanded}>
            {expanded && (hidden ? <p className={styles.privacy}>Los detalles están ocultos por privacidad.</p> : <>
              {(movement.type === "Préstamo" || movement.type === "Devolución") && loan && (movement.type === "Devolución" || loan.dueDate) && <dl className={styles.fields}>
                {movement.type === "Devolución" && <div><dt>Fecha del préstamo</dt><dd>{activityDate(loan.date)}</dd></div>}
                {loan.dueDate && <div><dt>Fecha límite</dt><dd>{activityDay(loan.dueDate)}</dd></div>}
              </dl>}

              {secondaryFields.length > 0 && <dl className={styles.fields}>{secondaryFields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}

              {movement.type === "Ingreso" && trace && <div className={styles.detailGroup}>
                {trace.distributions.length > 0 && <><b>Distribución registrada</b><ul>{trace.distributions.map((allocation, index) => <li key={`${allocation.movementId}-${allocation.envelopeId ?? allocation.name}-${index}`}><span>{allocation.name}</span><strong>{allocation.amount < 0 ? "−" : ""}{display(Math.abs(allocation.amount))}</strong></li>)}</ul></>}
                {trace.otherUses > 0 && <dl className={styles.fields}><div><dt>Otros usos sin vínculo documentado</dt><dd>{display(trace.otherUses)}</dd></div></dl>}
              </div>}

              {movement.type === "Gasto" && allocations.length > 1 && <div className={styles.detailGroup}>
                <b>{allocations.length === 1 ? "Sobre utilizado" : "Sobres utilizados"}</b>
                <ul>{allocations.map((allocation, index) => <li key={`${allocation.envelopeId ?? allocation.name}-${index}`}><span>{allocation.name}</span>{allocations.length > 1 && <strong>{display(allocation.amount)}</strong>}</li>)}</ul>
              </div>}

              {movement.categoryAllocations?.length ? <div className={styles.detailGroup}><b>Clasificación del gasto</b><ul>{movement.categoryAllocations.map((item, index) => <li key={`${item.name}-${index}`}><span>{item.name}{item.envelopeId ? ` · ${allocations.find(allocation => allocation.envelopeId === item.envelopeId)?.name ?? ""}` : ""}</span><strong>{display(item.amount)}</strong></li>)}</ul></div> : null}
              {movement.products?.length ? <div className={styles.detailGroup}><b>Productos ({movement.products.length})</b><ul>{movement.products.map((product, index) => <li key={`${product.name}-${index}`}><span>{product.name}{product.quantity ? ` · Cantidad: ${product.quantity}` : ""}{product.notes ? ` · ${product.notes}` : ""}</span><strong>{display(product.amount)}</strong></li>)}</ul></div> : null}
              {movement.fundingTargets?.length ? <div className={styles.detailGroup}><b>Obligaciones consideradas</b><ul>{movement.fundingTargets.map((target, index) => <li key={`${target.itemId}-${index}`}><span>{target.name}</span><strong>{display(target.amount)}</strong></li>)}</ul><small className={styles.note}>Fondos asignados; no constituye un comprobante de pago.</small></div> : null}

            </>)}
            {expanded && (movement.type === "Ingreso" || movement.type === "Asignación" || movement.distributionCorrection) && <div className={styles.actions}>
              <button type="button" className="text-btn" onClick={() => onTrace(movement.distributionCorrection?.incomeId ?? movement.id)}>{movement.distributionCorrection ? "Ver corrección del ingreso" : movement.type === "Ingreso" ? uiCopyEs.movementActions.viewDistribution : uiCopyEs.movementActions.viewOrigin}</button>
            </div>}
          </div>
        </article>;
      })}
    </div> : <div className={styles.empty}>Aún no hay movimientos registrados.</div>}

    <button type="button" className={styles.historyLink} onClick={onHistory}>
      <FormatListBulletedOutlined aria-hidden="true" />
      <span>{uiCopyEs.movementActions.viewAllMovements}</span>
      <ChevronRightOutlined aria-hidden="true" />
    </button>
  </div>;
}
