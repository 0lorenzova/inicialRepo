"use client";

import { useId, useRef, useState } from "react";
import type { Account } from "@/lib/finance-ledger";
import { EnvelopeContextMenu } from "@/components/envelope-context-menu";
import { FinanceDialog } from "@/components/finance-dialog";
import { TemporalBadge } from "@/components/temporal-indicator";
import { getEnvelopeGoal } from "@/lib/envelope-goals";
import { planningItems, planningTone, type PlanningEnvelope, type PlanningItem, type ProximityFilter } from "@/lib/envelope-planning";
import styles from "./envelope-planning.module.css";

const dateLabel = (date?: string) => {
  if (!date) return "Sin fecha límite";
  const value = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(value.getTime()) ? "Revisa la fecha límite" : new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
};
const itemType = (item: PlanningItem) => item.kind === "goal" ? "Meta" : "Importe programado";
const stateText = (item: PlanningItem) => item.payment ? "Pagado" : item.temporal ? `${item.temporal.label}. ${item.temporal.explanation}` : !item.deadline ? "Sin fecha límite" : "Fuera de los rangos monitoreados";

export function PlanningItemSummary({ item, today, display, privateMode }: { item: PlanningItem; today: string; display: (value: number) => string; privateMode: boolean }) {
  return <span className={styles.item}>
      <span className={styles.heading}><strong>{privateMode ? itemType(item) : item.name}</strong><TemporalBadge tone={planningTone(item)} date={item.deadline} today={today} /></span>
      <span>{itemType(item)} · {display(item.amount)}</span><span>Fecha límite: {dateLabel(item.deadline)}</span><small>{stateText(item)}</small>
    </span>;
}

export function EnvelopePlanningMenu({ envelope, today, anchor, display, privateMode, onSelect, onClose, filter, onAll }: {
  envelope: PlanningEnvelope; today: string; anchor: HTMLElement; display: (value: number) => string; privateMode: boolean;
  filter?: ProximityFilter; onAll: () => void;
  onSelect: (item: PlanningItem) => void; onClose: () => void;
}) {
  const items = planningItems(envelope, today).filter(item => !filter || (item.kind === "scheduled" && planningTone(item) === filter && !item.payment));
  return <EnvelopeContextMenu anchor={anchor} name={envelope.name} title="Metas e importes de este sobre" menuId="envelope-planning-menu" onClose={onClose} closeOnSelect={false}
    actions={[...(filter ? [{label:"Ver todos",onSelect:onAll}] : []), ...items.map(item => ({ key: `${item.kind}-${item.id}`, label: `${privateMode ? itemType(item) : item.name}. ${stateText(item)}`, onSelect: () => onSelect(item), content: <PlanningItemSummary item={item} today={today} display={display} privateMode={privateMode} /> }))]} />;
}

export function EnvelopePlanningDetail({ envelope, itemId, kind, today, display, privateMode, onEdit, onBack, accounts, onPay }: {
  envelope: PlanningEnvelope; itemId: string; kind: PlanningItem["kind"]; today: string; display: (value: number) => string; privateMode: boolean;
  onEdit: () => void; onBack: () => void; accounts: Account[]; onPay: (amount:number, accountId:string) => void;
}) {
  const id = useId();
  const [paying,setPaying] = useState(false),[amount,setAmount] = useState(""),[accountId,setAccountId] = useState(accounts.filter(a=>a.active).length === 1 ? accounts.find(a=>a.active)!.id : ""),[error,setError] = useState("");
  const submitting = useRef(false);
  const item = planningItems(envelope, today).find(value => value.id === itemId && value.kind === kind);
  const goal = kind === "goal" ? getEnvelopeGoal(envelope, today) : null;
  return <FinanceDialog label="Detalle de meta o importe" onClose={onBack}><section className="flow-modal">
    <header><button type="button" aria-label="Volver a metas e importes" onClick={onBack}>‹</button><div><h2>{item ? itemType(item) : "Elemento no disponible"}</h2><p className={styles.context}>{envelope.name}</p></div></header>
    <div className="flow-body">{item ? <>
      <h3 className={styles.name}>{privateMode ? itemType(item) : item.name}</h3>
      <div className="review-box"><b>{display(item.amount)}</b><span>Fecha límite: {dateLabel(item.deadline)}</span><span className={styles.heading}><TemporalBadge tone={planningTone(item)} date={item.deadline} today={today} />{stateText(item)}</span></div>
      {goal && <p className={styles.context}>{privateMode ? "Progreso oculto" : `${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(goal.percentage)}% · ${envelope.balanceHidden ? "••••••" : display(envelope.balance)} de ${display(goal.amount)}`}</p>}
      {kind === "scheduled" && !item.payment && <p className={styles.context}>Al marcar Pagado se registrará un gasto en este sobre y en la cuenta que elijas.</p>}
      {!item.payment && <button className="primary wide" type="button" onClick={onEdit}>{kind === "goal" ? "Configurar meta" : "Modificar importe"}</button>}
      {kind === "scheduled" && (item.payment ? <div className="review-box"><b>✓ Pagado · {display(item.payment.amount)}</b><span>{dateLabel(item.payment.date.slice(0,10))} · {accounts.find(a=>a.id===item.payment!.accountId)?.name ?? "Cuenta del movimiento"}</span><span>El pago se conserva en Movimientos.</span></div> : <>
        <label className="check-label"><input type="checkbox" checked={paying} onChange={event=>{setPaying(event.target.checked);setError("");}} />Pagado</label>
        {paying && <form className={styles.payment} noValidate onSubmit={event=>{event.preventDefault();if(submitting.current)return;submitting.current=true;try{onPay(Number(amount),accountId);}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar el pago.");submitting.current=false;}}}>
          <label htmlFor={`${id}-paid`}>¿Monto pagado?</label><div className="currency-input"><span>₡</span><input id={`${id}-paid`} type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={event=>setAmount(event.target.value)} /></div>
          <label htmlFor={`${id}-account`}>Cuenta de pago</label><select id={`${id}-account`} value={accountId} onChange={event=>setAccountId(event.target.value)}><option value="">Selecciona la cuenta</option>{accounts.filter(a=>a.active).map(a=><option key={a.id} value={a.id}>{a.name} · {display(a.balance)}</option>)}</select>
          <p className={styles.context}>Se descontará el monto de {envelope.name} y de la cuenta seleccionada. Confirma el monto real pagado; puede diferir del programado.</p>
          {error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit">Confirmar pago</button>
        </form>}
      </>)}
    </> : <p>El elemento ya no está activo. Sus datos se conservan.</p>}
    <button className="secondary wide" type="button" onClick={onBack}>Volver a metas e importes</button></div>
  </section></FinanceDialog>;
}
