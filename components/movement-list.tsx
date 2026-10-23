"use client";

import { envelopeLabel, envelopeMovementLabel } from "@/lib/envelope-label";
import type { LedgerMovement } from "@/lib/finance-ledger";
import { envelopeMovementEffect, movementInstant } from "@/lib/finance-history";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";

const money = (n: number) => `₡${Math.round(n).toLocaleString("es-CR")}`;

type MovementListProps = {
  items: LedgerMovement[];
  envelopeId?: string;
  hidden: boolean;
  onTrace: (id: string) => void;
  onDetail?: (id: string) => void;
  variant?: "default" | "screen";
};

export function MovementList({ items, hidden, onTrace, envelopeId, onDetail, variant = "default" }: MovementListProps) {
  if (variant === "screen") return <ScreenMovementList items={items} hidden={hidden} onTrace={onTrace} envelopeId={envelopeId} onDetail={onDetail} />;

  return items.length ? <div className="movement-list">{items.map(m => {
    const effect = envelopeId ? envelopeMovementEffect(m, envelopeId) : null;
    const sign = effect === null ? (m.type === "Ingreso" ? 1 : m.type === "Gasto" ? -1 : 0) : Math.sign(effect);
    return <div className="movement-row" key={m.id}>
      <span className={`movement-icon ${m.type === "Ingreso" ? "ingreso" : m.type === "Gasto" ? "gasto" : "transferencia"}`}>{m.type === "Ingreso" ? "＋" : m.type === "Gasto" ? "−" : "⇄"}</span>
      <span className="movement-copy">
        <b>{onDetail ? <button className="movement-detail-link" onClick={() => onDetail(m.id)}>{hidden ? m.type : envelopeMovementLabel(m)}</button> : hidden ? m.type : envelopeMovementLabel(m)}</b>
        <small>{[m.type, m.accountName, m.category, (m.type === "Ingreso" || m.type === "Gasto") ? m.allocations.map(a => envelopeLabel(a.name)).join(" · ") : undefined, hidden ? undefined : m.description, hidden ? undefined : m.merchant, hidden ? undefined : m.paymentMethod, ...(hidden ? [] : (m.tags ?? []).map(tag => `#${tag}`)), hidden || m.reference === m.scheduledAmountId ? undefined : m.reference, new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(m.date) ? m.date : `${m.date}-06:00`).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Costa_Rica" })].filter(Boolean).join(" · ")}</small>
        {!hidden && Boolean(m.categoryAllocations?.length) && <details><summary>Clasificación del gasto</summary>{m.categoryAllocations!.filter(item => !envelopeId || item.envelopeId === envelopeId).map((item, index) => <p key={index}>{item.name} · {money(item.amount)} · {item.envelopeId ? envelopeLabel(m.allocations.find(a => a.envelopeId === item.envelopeId)?.name) : "Sin asignar"}</p>)}</details>}
        {!hidden && Boolean(m.products?.length) && <details><summary>Productos ({m.products!.length})</summary>{m.products!.map((p, index) => <p key={index}>{p.name} · {money(p.amount)}{p.quantity ? ` · Cantidad: ${p.quantity}` : ""}{p.notes ? ` · ${p.notes}` : ""}</p>)}</details>}
        {!hidden && !!m.fundingTargets?.length && <details><summary>Obligaciones consideradas ({m.fundingTargets.length})</summary><small>Fondos asignados; no constituye un comprobante de pago.</small>{m.fundingTargets.map((target, index) => <p key={index}>{target.name} · {money(target.amount)} · {envelopeLabel(m.allocations.find(allocation => allocation.envelopeId === target.envelopeId)?.name)}</p>)}</details>}
        {(m.type === "Ingreso" || m.type === "Asignación" || m.distributionCorrection) && <button className="text-btn trace-link" onClick={() => onTrace(m.distributionCorrection?.incomeId ?? m.id)}>{m.distributionCorrection ? "Ver corrección del ingreso" : m.type === "Ingreso" ? "Ver distribución del ingreso" : "Ver ingreso de origen"}</button>}
      </span>
      <strong className={sign > 0 ? "positive" : sign < 0 ? "negative" : ""}>{sign > 0 ? "+" : sign < 0 ? "−" : "↔ "}{hidden ? "••••" : money(effect === null ? m.amount : Math.abs(effect))}{envelopeId && <small className="movement-scope">{effect === null ? "Importe total · dirección no identificada" : "En este sobre"}</small>}</strong>
    </div>;
  })}</div> : <MovementEmptyState />;
}

function ScreenMovementList({ items, hidden, onTrace, envelopeId, onDetail }: MovementListProps) {
  if (!items.length) return <MovementEmptyState />;

  return <div className="movement-list movement-list-screen">{items.map(movement => {
    const effect = envelopeId ? envelopeMovementEffect(movement, envelopeId) : null;
    const direction = effect === null ? (movement.type === "Ingreso" ? 1 : movement.type === "Gasto" ? -1 : 0) : Math.sign(effect);
    const amount = effect === null ? movement.amount : Math.abs(effect);
    const instant = movementInstant(movement.date);
    const date = Number.isFinite(instant) ? new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Costa_Rica" }).format(instant) : "Fecha no disponible";
    const allocations = (movement.type === "Ingreso" || movement.type === "Gasto") ? movement.allocations.map(allocation => envelopeLabel(allocation.name)).filter(Boolean).join(" · ") : "";
    const metadata = [movement.accountName, movement.category, allocations, movement.paymentMethod].filter(Boolean).join(" · ");
    const title = hidden ? movement.type : envelopeMovementLabel(movement);
    const sign = direction > 0 ? "+" : direction < 0 ? "−" : "";
    const detailFields = [movement.description && ["Descripción", movement.description], movement.merchant && ["Comercio", movement.merchant], movement.reference && movement.reference !== movement.scheduledAmountId && ["Referencia", movement.reference], movement.tags?.length && ["Etiquetas", movement.tags.join(" · ")]].filter((field): field is string[] => Boolean(field));

    return <article className={`movement-row movement-row-screen ${movement.type === "Ingreso" ? "screen-income" : movement.type === "Gasto" ? "screen-expense" : "screen-transfer"}`} key={movement.id}>
      <span className={`movement-icon ${movement.type === "Ingreso" ? "ingreso" : movement.type === "Gasto" ? "gasto" : "transferencia"}`} aria-hidden="true">{movement.type === "Ingreso" ? <span>↑</span> : movement.type === "Gasto" ? <span>↓</span> : <span>⇄</span>}</span>
      <div className="movement-screen-copy">
        <b>{onDetail ? <button className="movement-detail-link" aria-label={`Abrir detalle de ${title}`} onClick={() => onDetail(movement.id)}>{title}</button> : title}</b>
        <small className="movement-screen-date">{date}</small>
        <span className="movement-screen-meta"><em>{movement.type}</em>{metadata && <small>{metadata}</small>}</span>
        {!hidden && detailFields.length > 0 && <details className="movement-screen-details"><summary>Más información</summary>{detailFields.map(([label, value]) => <p key={label}><b>{label}:</b> {value}</p>)}</details>}
        {!hidden && Boolean(movement.categoryAllocations?.length) && <details className="movement-screen-details"><summary>Clasificación del gasto</summary>{movement.categoryAllocations!.filter(item => !envelopeId || item.envelopeId === envelopeId).map((item, index) => <p key={index}>{item.name} · {money(item.amount)} · {item.envelopeId ? envelopeLabel(movement.allocations.find(allocation => allocation.envelopeId === item.envelopeId)?.name) : "Sin asignar"}</p>)}</details>}
        {!hidden && Boolean(movement.products?.length) && <details className="movement-screen-details"><summary>Productos ({movement.products!.length})</summary>{movement.products!.map((product, index) => <p key={index}>{product.name} · {money(product.amount)}{product.quantity ? ` · Cantidad: ${product.quantity}` : ""}{product.notes ? ` · ${product.notes}` : ""}</p>)}</details>}
        {!hidden && Boolean(movement.fundingTargets?.length) && <details className="movement-screen-details"><summary>Obligaciones consideradas ({movement.fundingTargets!.length})</summary><small>Fondos asignados; no constituye un comprobante de pago.</small>{movement.fundingTargets!.map((target, index) => <p key={index}>{target.name} · {money(target.amount)} · {envelopeLabel(movement.allocations.find(allocation => allocation.envelopeId === target.envelopeId)?.name)}</p>)}</details>}
        {(movement.type === "Ingreso" || movement.type === "Asignación" || movement.distributionCorrection) && <button className="text-btn trace-link" onClick={() => onTrace(movement.distributionCorrection?.incomeId ?? movement.id)}>{movement.distributionCorrection ? "Ver corrección del ingreso" : movement.type === "Ingreso" ? "Ver distribución del ingreso" : "Ver ingreso de origen"}</button>}
      </div>
      <strong className={`movement-screen-amount ${direction > 0 ? "positive" : direction < 0 ? "negative" : ""}`}>{sign}{hidden ? "••••" : money(amount)}{envelopeId && <small className="movement-scope">{effect === null ? "Importe total · dirección no identificada" : "En este sobre"}</small>}</strong>
      {onDetail && <button type="button" className="movement-screen-open" aria-label={`Ver detalle de ${title}`} onClick={() => onDetail(movement.id)}><ChevronRightOutlined aria-hidden="true" /></button>}
    </article>;
  })}</div>;
}

function MovementEmptyState() {
  return <div className="empty-state"><span>◷</span><b>Aún no hay movimientos</b><small>Cuando registres ingresos o gastos, aparecerán aquí.</small></div>;
}
