"use client";
import { SnoozeControl } from "./reminder-snooze";

import { calendarRelativeLabel } from "@/lib/planning-calendar";
import { envelopeLabel } from "@/lib/envelope-label";
import { useId, useRef, useState } from "react";
import type { Recurrence } from "@/lib/finance-recurrence";
import type { Account } from "@/lib/finance-ledger";
import { AccountSelector } from "@/components/account-selector";
import { FinanceDialog } from "@/components/finance-dialog";
import { useTemporalDisplay, TemporalBadge } from "@/components/temporal-indicator";
import { getEnvelopeGoal } from "@/lib/envelope-goals";
import { plannedPaymentDelay, plannedPaymentDelayText, planningItems, planningTone, planningStateText, type PlanningEnvelope, type PlanningItem, type ProximityFilter } from "@/lib/envelope-planning";
import styles from "./envelope-planning.module.css";

const dateLabel = (date?: string) => {
  if (!date) return "Sin fecha límite";
  const value = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(value.getTime()) ? "Revisa la fecha límite" : new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
};
const itemType = (item: PlanningItem) => item.kind === "goal" ? "Meta" : "Importe programado";
const stateText = planningStateText;

export function PlanningItemSummary({ item, today, display, privateMode }: { item: PlanningItem; today: string; display: (value: number) => string; privateMode: boolean }) {
  const {visible}=useTemporalDisplay();
  return <span className={styles.item}>
      <span className={styles.heading}><strong>{privateMode ? itemType(item) : item.name}</strong>{!item.payment&&!item.omitted&&item.timingEnabled&&<TemporalBadge tone={planningTone(item)} late={plannedPaymentDelay(item)>0} lateLabel={plannedPaymentDelayText(plannedPaymentDelay(item))} covered={privateMode||item.coverageHidden?undefined:item.covered} date={item.deadline} today={today} />}</span>
      <span>{itemType(item)} · {display(item.amount)}</span>{item.paidAmount!==undefined&&item.paidAmount>0&&!item.payment&&<small>Abonado {display(item.paidAmount)} · pendiente {display(item.remainingAmount??item.amount)}</small>}{item.recurrent&&<small>↻ Recurrente</small>}<span>Fecha límite: {dateLabel(item.deadline)}</span>{item.deadline&&<small>{calendarRelativeLabel(item.deadline,today)}</small>}{item.plannedPaymentDate&&<small>Pago previsto: {dateLabel(item.plannedPaymentDate)}{plannedPaymentDelay(item)>0?` · ${plannedPaymentDelayText(plannedPaymentDelay(item))}`:""}</small>}<small>{stateText(item)}</small>{visible&&!privateMode&&!item.coverageHidden&&!item.payment&&!item.omitted&&item.covered!==undefined&&<small>{item.covered?"Cubierto por el saldo del sobre":"Sin cobertura completa"} · {item.covered?"Aún no pagado":`Faltan ${display(item.shortfall??item.amount)}`}</small>}
    </span>;
}

export function EnvelopePlanningMenu({ envelope, today, display, privateMode, onSelect, onClose, filter, onAll, onAdd }: {
  envelope: PlanningEnvelope; today: string; anchor: HTMLElement; display: (value: number) => string; privateMode: boolean;
  filter?: ProximityFilter; onAll: () => void; onAdd: (kind: "goal" | "scheduled") => void;
  onSelect: (item: PlanningItem, pay?: boolean) => void; onClose: () => void;
}) {
  const {visible}=useTemporalDisplay();
  const [adding, setAdding] = useState(false);
  const all = planningItems(envelope, today);
  const items = all.filter(item => !visible || !filter || (planningTone(item) === filter && !item.payment));
  return <FinanceDialog label="Metas e importes de este sobre" maxWidth={960} onClose={onClose}><section className={`flow-modal ${styles.planningDialog}`}>
    <header><div><h2>Metas e importes de este sobre</h2><p className={styles.context}>{envelopeLabel(envelope.name)}</p></div><button type="button" aria-label="Agregar meta o importe a este sobre" aria-expanded={adding} onClick={()=>setAdding(!adding)}>＋</button><button type="button" aria-label="Cerrar diálogo" onClick={onClose}>×</button></header>
    <div className="flow-body">
      {adding && <div className={styles.addActions}><button className="secondary" onClick={()=>onAdd("goal")}>Configurar meta</button><button className="secondary" onClick={()=>onAdd("scheduled")}>Nuevo importe</button></div>}
      {filter && <button className="text-btn" onClick={onAll}>Ver todos</button>}
      <div className={styles.items}>{items.map(item=><article className={styles.planCard} key={`${item.kind}-${item.id}`}>
        <button type="button" className={styles.itemButton} onClick={()=>onSelect(item)}><PlanningItemSummary item={item} today={today} display={display} privateMode={privateMode}/></button>
        <SnoozeControl source={{kind:item.kind,envelopeId:envelope.id,itemId:item.id,date:item.deadline}}/>
        {item.kind === "scheduled" && !item.payment && !item.omitted && <label className="check-label"><input type="checkbox" checked={false} onChange={()=>onSelect(item,true)}/>Pagar</label>}
      </article>)}</div>
      {!items.length && <p>{all.length ? "No hay elementos en este rango." : "No hay metas ni importes asignados a este sobre."}</p>}
    </div>
  </section></FinanceDialog>;
}

export function EnvelopePlanningDetail({ envelope, itemId, kind, today, display, privateMode, onEdit, onBack, accounts, onPay, startPayment = false, onCreateAccount, destinations, onMove, onMovement, backLabel = "Volver a metas e importes" }: {
  envelope: PlanningEnvelope & {recurrence?:Recurrence}; itemId: string; kind: PlanningItem["kind"]; today: string; display: (value: number) => string; privateMode: boolean;
  onCreateAccount: (name:string,type:string)=>string; destinations: {id:string;name:string}[]; onMove:(targetId:string,moveContribution?:boolean)=>void;
  onMovement?: (movementId:string)=>void;
  backLabel?: string; startPayment?: boolean; onEdit: () => void; onBack: () => void; accounts: Account[]; onPay: (amount:number, accountId:string) => void;
}) {
  const id = useId();
  const item = planningItems(envelope, today).find(value => value.id === itemId && value.kind === kind);
  const activeAccounts=accounts.filter(a=>a.active);
  const defaultAccount = activeAccounts.length === 1 ? activeAccounts[0].id : "";
  const initialAvailable = Math.min(item?.remainingAmount ?? item?.amount ?? 0, Math.max(0,envelope.balance), Math.max(0,activeAccounts.length===1?activeAccounts[0].balance:item?.remainingAmount??item?.amount??0));
  const initialAmount = item ? initialAvailable : 0;
  const [paying,setPaying] = useState(startPayment),[amount,setAmount] = useState(startPayment && initialAmount ? String(initialAmount) : ""),[accountId,setAccountId] = useState(defaultAccount),[error,setError] = useState("");
  const [moving,setMoving]=useState(false),[targetId,setTargetId]=useState(""),[moveError,setMoveError]=useState("");
  const [moveContribution,setMoveContribution]=useState(false);
  const submitting = useRef(false);
  const goal = kind === "goal" ? getEnvelopeGoal(envelope, today) : null;
  const selectedAccount = accounts.find(account=>account.id===accountId && account.active);
  const maxPayment = Math.min(item?.remainingAmount ?? item?.amount ?? 0, Math.max(0,envelope.balance), Math.max(0,selectedAccount?.balance ?? item?.remainingAmount ?? item?.amount ?? 0));
  return <FinanceDialog label="Detalle de meta o importe" onClose={onBack}><section className="flow-modal">
    <header><button type="button" aria-label={backLabel} onClick={onBack}>‹</button><div><h2>{item ? itemType(item) : "Elemento no disponible"}</h2><p className={styles.context}>{envelopeLabel(envelope.name)}</p></div></header>
    <div className="flow-body">{item ? <>
      <h3 className={styles.name}>{privateMode ? itemType(item) : item.name}</h3>
      <div className="review-box"><b>{display(item.amount)}</b>{item.recurrent&&<span>↻ Recurrente</span>}<span>Fecha límite: {dateLabel(item.deadline)}</span>{item.plannedPaymentDate&&<span>Pago previsto: {dateLabel(item.plannedPaymentDate)}{plannedPaymentDelay(item)>0?` · ${plannedPaymentDelayText(plannedPaymentDelay(item))}`:""}</span>}<span className={styles.heading}>{!item.payment&&!item.omitted&&item.timingEnabled&&<TemporalBadge tone={planningTone(item)} late={plannedPaymentDelay(item)>0} lateLabel={plannedPaymentDelayText(plannedPaymentDelay(item))} covered={privateMode||item.coverageHidden?undefined:item.covered} date={item.deadline} today={today} />}{stateText(item)}</span></div>
      <SnoozeControl source={{kind,envelopeId:envelope.id,itemId,date:item.deadline}}/>
      {goal && <p className={styles.context}>{privateMode ? "Progreso oculto" : `${new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(goal.percentage)}% · ${envelope.balanceHidden ? "••••••" : display(envelope.balance)} de ${display(goal.amount)}`}</p>}
      {kind === "scheduled" && !item.payment && <p className={styles.context}>Al confirmar se registrará un gasto en este sobre y en la cuenta que elijas. Disponible en el sobre: {privateMode ? "••••••" : display(envelope.balance)}.</p>}
      {!item.payment && !item.omitted && <button className="primary wide" type="button" onClick={onEdit}>{kind === "goal" ? "Configurar meta" : "Modificar importe"}</button>}
      {!item.payment && !item.omitted && <details>
        <summary>Más opciones ▾</summary><button type="button" className="secondary wide" onClick={()=>{setMoving(!moving);setMoveError("");}}>Mover a otro sobre</button>
        {moving && <div className={styles.payment}><label htmlFor={`${id}-target`}>Sobre de destino</label><select id={`${id}-target`} value={targetId} onChange={event=>setTargetId(event.target.value)}><option value="">Selecciona otro sobre</option>{destinations.filter(e=>e.id!==envelope.id).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select><p className={styles.context}>{kind==="goal"?"La meta conservará su configuración. Su progreso se calculará con el saldo del destino. No se mueve dinero.":"Se traslada este importe pendiente con su recurrencia. Los saldos y pagos anteriores no cambian."}</p>{kind==="goal"&&envelope.recurrence&&<label className="check-label"><input type="checkbox" checked={moveContribution} onChange={event=>setMoveContribution(event.target.checked)}/>Trasladar también el aporte recurrente del sobre</label>}{moveError&&<p className="form-error" role="alert">{moveError}</p>}<button type="button" className="primary" onClick={()=>{try{onMove(targetId,moveContribution);setMoving(false);setTargetId("");}catch(cause){setMoveError(cause instanceof Error?cause.message:"No se pudo mover el importe.");}}}>Confirmar traslado</button><button type="button" className="secondary" onClick={()=>setMoving(false)}>Cancelar traslado</button></div>}
      </details>}
      {item.omitted && <div className="review-box"><b>Omitido</b><span>Esta ocurrencia se conserva en el historial y no generó un movimiento.</span></div>}
      {kind === "scheduled" && item.payments?.length ? <div className="review-box"><b>{item.payment ? "✓ Pago completado" : "Abonos registrados"} · {privateMode ? "••••••" : display(item.paidAmount ?? 0)}</b>{!item.payment&&<span>Pendiente: {privateMode ? "••••••" : display(item.remainingAmount ?? item.amount)}</span>}{item.payments.map(payment=><span key={payment.movementId}>{dateLabel(payment.date.slice(0,10))} · {privateMode ? "••••••" : display(payment.amount)} · {accounts.find(a=>a.id===payment.accountId)?.name ?? "Cuenta"}{onMovement&&<button type="button" className="text-btn" onClick={()=>onMovement(payment.movementId)}>Ver movimiento</button>}</span>)}<span>Los movimientos se conservan en Movimientos.</span></div> : null}
      {kind === "scheduled" && (item.payment ? null : item.omitted ? null : <>
        <label className="check-label"><input type="checkbox" checked={paying} onChange={event=>{setPaying(event.target.checked);setError("");}} />Pagar</label>
        {paying && <form className={styles.payment} noValidate onSubmit={event=>{event.preventDefault();if(submitting.current)return;submitting.current=true;try{onPay(Number(amount),accountId);setAmount("");setPaying(false);setError("");submitting.current=false;}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar el pago.");submitting.current=false;}}}>
          <label htmlFor={`${id}-paid`}>¿Monto pagado?</label><div className="currency-input"><span>₡</span><input id={`${id}-paid`} type="number" inputMode="numeric" min="1" max={Math.max(0,maxPayment)} step="1" value={amount} onChange={event=>setAmount(event.target.value)} /></div>
          <AccountSelector label="Cuenta de pago" accounts={accounts} value={accountId} onChange={setAccountId} onCreate={onCreateAccount} display={display}/>
          <div className="review-box"><b>Por pagar: {privateMode ? "••••••" : display(item.remainingAmount ?? item.amount)}</b><span>Disponible en el sobre: {privateMode ? "••••••" : display(envelope.balance)}</span>{selectedAccount&&<span>Disponible en la cuenta: {privateMode ? "••••••" : display(selectedAccount.balance)}</span>}<span>El límite del abono es {privateMode ? "••••••" : display(Math.max(0,maxPayment))}.</span></div>
          <p className={styles.context}>El importe se descontará de {envelopeLabel(envelope.name)} y de la cuenta seleccionada. Un abono menor conserva el saldo pendiente; al completar el total se generará la próxima ocurrencia.</p>
          {error && <p className="form-error" role="alert">{error}</p>}<button className="primary wide" type="submit" disabled={!Number.isSafeInteger(Number(amount))||Number(amount)<=0||Number(amount)>maxPayment||!accountId}>Confirmar pago</button>
        </form>}
      </>)}
    </> : <p>El elemento ya no está activo. Sus datos se conservan.</p>}
    <button className="secondary wide" type="button" onClick={onBack}>{backLabel}</button></div>
  </section></FinanceDialog>;
}
