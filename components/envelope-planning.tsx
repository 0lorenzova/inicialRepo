"use client";

import { useId, useRef, useState } from "react";
import type { Account } from "@/lib/finance-ledger";
import { AccountSelector } from "@/components/account-selector";
import { FinanceDialog } from "@/components/finance-dialog";
import { TemporalBadge } from "@/components/temporal-indicator";
import { getEnvelopeGoal } from "@/lib/envelope-goals";
import { planningItems, planningTone, planningStateText, type PlanningEnvelope, type PlanningItem, type ProximityFilter } from "@/lib/envelope-planning";
import styles from "./envelope-planning.module.css";

const dateLabel = (date?: string) => {
  if (!date) return "Sin fecha límite";
  const value = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(value.getTime()) ? "Revisa la fecha límite" : new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
};
const itemType = (item: PlanningItem) => item.kind === "goal" ? "Meta" : "Importe programado";
const stateText = planningStateText;

export function PlanningItemSummary({ item, today, display, privateMode }: { item: PlanningItem; today: string; display: (value: number) => string; privateMode: boolean }) {
  return <span className={styles.item}>
      <span className={styles.heading}><strong>{privateMode ? itemType(item) : item.name}</strong><TemporalBadge tone={planningTone(item)} date={item.deadline} today={today} /></span>
      <span>{itemType(item)} · {display(item.amount)}</span><span>Fecha límite: {dateLabel(item.deadline)}</span><small>{stateText(item)}</small>
    </span>;
}

export function EnvelopePlanningMenu({ envelope, today, display, privateMode, onSelect, onClose, filter, onAll, onAdd }: {
  envelope: PlanningEnvelope; today: string; anchor: HTMLElement; display: (value: number) => string; privateMode: boolean;
  filter?: ProximityFilter; onAll: () => void; onAdd: (kind: "goal" | "scheduled") => void;
  onSelect: (item: PlanningItem, pay?: boolean) => void; onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const all = planningItems(envelope, today);
  const items = all.filter(item => !filter || (planningTone(item) === filter && !item.payment));
  return <FinanceDialog label="Metas e importes de este sobre" maxWidth={960} onClose={onClose}><section className={`flow-modal ${styles.planningDialog}`}>
    <header><div><h2>Metas e importes de este sobre</h2><p className={styles.context}>{envelope.name}</p></div><button type="button" aria-label="Agregar meta o importe a este sobre" aria-expanded={adding} onClick={()=>setAdding(!adding)}>＋</button><button type="button" aria-label="Cerrar diálogo" onClick={onClose}>×</button></header>
    <div className="flow-body">
      {adding && <div className={styles.addActions}><button className="secondary" onClick={()=>onAdd("goal")}>Configurar meta</button><button className="secondary" onClick={()=>onAdd("scheduled")}>Nuevo importe</button></div>}
      {filter && <button className="text-btn" onClick={onAll}>Ver todos</button>}
      <div className={styles.items}>{items.map(item=><article className={styles.planCard} key={`${item.kind}-${item.id}`}>
        <button type="button" className={styles.itemButton} onClick={()=>onSelect(item)}><PlanningItemSummary item={item} today={today} display={display} privateMode={privateMode}/></button>
        {item.kind === "scheduled" && !item.payment && <label className="check-label"><input type="checkbox" checked={false} onChange={()=>onSelect(item,true)}/>Pagar</label>}
      </article>)}</div>
      {!items.length && <p>{all.length ? "No hay elementos en este rango." : "No hay metas ni importes asignados a este sobre."}</p>}
    </div>
  </section></FinanceDialog>;
}

export function EnvelopePlanningDetail({ envelope, itemId, kind, today, display, privateMode, onEdit, onBack, accounts, onPay, startPayment = false, onCreateAccount, destinations, onMove }: {
  envelope: PlanningEnvelope; itemId: string; kind: PlanningItem["kind"]; today: string; display: (value: number) => string; privateMode: boolean;
  onCreateAccount: (name:string,type:string)=>string; destinations: {id:string;name:string}[]; onMove:(targetId:string)=>void;
  startPayment?: boolean; onEdit: () => void; onBack: () => void; accounts: Account[]; onPay: (amount:number, accountId:string) => void;
}) {
  const id = useId();
  const [paying,setPaying] = useState(startPayment),[amount,setAmount] = useState(""),[accountId,setAccountId] = useState(accounts.filter(a=>a.active).length === 1 ? accounts.find(a=>a.active)!.id : ""),[error,setError] = useState("");
  const [moving,setMoving]=useState(false),[targetId,setTargetId]=useState(""),[moveError,setMoveError]=useState("");
  const submitting = useRef(false);
  const item = planningItems(envelope, today).find(value => value.id === itemId && value.kind === kind);
  const goal = kind === "goal" ? getEnvelopeGoal(envelope, today) : null;
  return <FinanceDialog label="Detalle de meta o importe" onClose={onBack}><section className="flow-modal">
    <header><button type="button" aria-label="Volver a metas e importes" onClick={onBack}>‹</button><div><h2>{item ? itemType(item) : "Elemento no disponible"}</h2><p className={styles.context}>{envelope.name}</p></div></header>
    <div className="flow-body">{item ? <>
      <h3 className={styles.name}>{privateMode ? itemType(item) : item.name}</h3>
      <div className="review-box"><b>{display(item.amount)}</b><span>Fecha límite: {dateLabel(item.deadline)}</span><span className={styles.heading}><TemporalBadge tone={planningTone(item)} date={item.deadline} today={today} />{stateText(item)}</span></div>
      {goal && <p className={styles.context}>{privateMode ? "Progreso oculto" : `${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(goal.percentage)}% · ${envelope.balanceHidden ? "••••••" : display(envelope.balance)} de ${display(goal.amount)}`}</p>}
      {kind === "scheduled" && !item.payment && <p className={styles.context}>Al seleccionar Pagar se registrará un gasto en este sobre y en la cuenta que elijas.</p>}
      {!item.payment && <button className="primary wide" type="button" onClick={onEdit}>{kind === "goal" ? "Configurar meta" : "Modificar importe"}</button>}
      {kind === "scheduled" && !item.payment && <>
        <button type="button" className="secondary wide" onClick={()=>{setMoving(!moving);setMoveError("");}}>Mover a otro sobre</button>
        {moving && <div className={styles.payment}><label htmlFor={`${id}-target`}>Sobre de destino</label><select id={`${id}-target`} value={targetId} onChange={event=>setTargetId(event.target.value)}><option value="">Selecciona otro sobre</option>{destinations.filter(e=>e.id!==envelope.id).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select><p className={styles.context}>Se traslada este importe pendiente con su recurrencia. Los saldos y pagos anteriores no cambian.</p>{moveError&&<p className="form-error" role="alert">{moveError}</p>}<button type="button" className="primary" onClick={()=>{try{onMove(targetId);setMoving(false);setTargetId("");}catch(cause){setMoveError(cause instanceof Error?cause.message:"No se pudo mover el importe.");}}}>Confirmar traslado</button><button type="button" className="secondary" onClick={()=>setMoving(false)}>Cancelar traslado</button></div>}
      </>}
      {kind === "scheduled" && (item.payment ? <div className="review-box"><b>✓ Pagado · {display(item.payment.amount)}</b><span>{dateLabel(item.payment.date.slice(0,10))} · {accounts.find(a=>a.id===item.payment!.accountId)?.name ?? "Cuenta del movimiento"}</span><span>El pago se conserva en Movimientos.</span></div> : <>
        <label className="check-label"><input type="checkbox" checked={paying} onChange={event=>{setPaying(event.target.checked);setError("");}} />Pagar</label>
        {paying && <form className={styles.payment} noValidate onSubmit={event=>{event.preventDefault();if(submitting.current)return;submitting.current=true;try{onPay(Number(amount),accountId);}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar el pago.");submitting.current=false;}}}>
          <label htmlFor={`${id}-paid`}>¿Monto pagado?</label><div className="currency-input"><span>₡</span><input id={`${id}-paid`} type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={event=>setAmount(event.target.value)} /></div>
          <AccountSelector label="Cuenta de pago" accounts={accounts} value={accountId} onChange={setAccountId} onCreate={onCreateAccount} display={display}/>
          <p className={styles.context}>Se descontará el monto de {envelope.name} y de la cuenta seleccionada. Confirma el monto real pagado; puede diferir del programado.</p>
          {error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit">Confirmar pago</button>
        </form>}
      </>)}
    </> : <p>El elemento ya no está activo. Sus datos se conservan.</p>}
    <button className="secondary wide" type="button" onClick={onBack}>Volver a metas e importes</button></div>
  </section></FinanceDialog>;
}
