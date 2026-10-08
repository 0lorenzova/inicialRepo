"use client";
import { useRef, useState, type FormEvent } from "react";
import type { Ledger } from "@/lib/finance-ledger";
import { unassignedIncomes } from "@/lib/unassigned-incomes";
import { FinanceDialog } from "./finance-dialog";
import styles from "./unassigned-incomes.module.css";

const dateLabel = (value: string) => {
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}-06:00`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("es-CR", {timeZone:"America/Costa_Rica",dateStyle:"medium",timeStyle:"short"}).format(date) : "Fecha no disponible";
};

export function UnassignedIncomes({ledger,display,hidden,onAssign,onTrace}:{ledger:Ledger;display:(amount:number)=>string;hidden:boolean;onAssign:(incomeId:string)=>void;onTrace:(incomeId:string)=>void}) {
  const overview = unassignedIncomes(ledger);
  return <section className="section page-panel">
    <div className={styles.total}><span>Total sin asignar</span><strong>{display(overview.total)}</strong></div>
    <p className="flow-intro">Estos fondos ya están en tus cuentas. Asignarlos a un sobre conserva el dinero total.</p>
    <div className={styles.list}>{overview.incomes.map(({income,available})=><article className={styles.card} key={income.id}>
      <div><h2>{hidden?"Ingreso":income.name}</h2><small>{dateLabel(income.date)}{!hidden&&income.accountName?` · ${income.accountName}`:""}</small></div>
      <div className={styles.amounts}><span>Recibido<strong>{display(income.amount)}</strong></span><span>Sin asignar<strong>{display(available)}</strong></span></div>
      <div className={styles.actions}><button type="button" className="primary" onClick={()=>onAssign(income.id)}>Asignar dinero</button><button type="button" className="secondary" onClick={()=>onTrace(income.id)}>Ver distribución</button></div>
    </article>)}</div>
    {overview.common>0&&<section className={styles.card}><h2>Fondo común sin ingreso vinculado</h2><strong>{display(overview.common)}</strong><p className="flow-intro">Incluye dinero desasignado y saldos antiguos sin un origen registrado. Puedes asignarlo desde el menú de un sobre.</p></section>}
    {!overview.incomes.length&&<p className="empty-state">{overview.total>0?"No hay ingresos con un remanente identificable. El saldo disponible se muestra en el fondo común.":"No tienes dinero pendiente de asignar."}</p>}
    <p className="flow-intro">Los usos antiguos sin vínculo se descuentan del dinero más antiguo. No se atribuyen retiros de sobres a un ingreso sin evidencia.</p>
  </section>;
}

export function AssignIncomeDialog({ledger,incomeId,display,hidden,onSave,onClose}:{ledger:Ledger;incomeId:string;display:(amount:number)=>string;hidden:boolean;onSave:(envelopeId:string,amount:number)=>void;onClose:()=>void}) {
  const [amount,setAmount]=useState(""),[envelopeId,setEnvelopeId]=useState(""),[error,setError]=useState("");
  const submitting=useRef(false);
  const current=unassignedIncomes(ledger).incomes.find(item=>item.income.id===incomeId);
  const envelopes=ledger.envelopes.filter(envelope=>!envelope.archived);
  const submit=(event:FormEvent)=>{event.preventDefault();if(submitting.current)return;setError("");try{onSave(envelopeId,Number(amount));submitting.current=true;onClose();}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo asignar este dinero.");}};
  return <FinanceDialog label="Asignar desde este ingreso" onClose={onClose}><form className="flow-modal" noValidate onSubmit={submit}><header><h2>Asignar desde este ingreso</h2><button type="button" aria-label="Cerrar asignación de ingreso" onClick={onClose}>×</button></header><div className="flow-body">
    {current?<><div className="review-box"><strong>{hidden?"Ingreso seleccionado":current.income.name}</strong><span>{dateLabel(current.income.date)}</span><span>Sin asignar: {display(current.available)}</span></div><label htmlFor="income-destination">Sobre destino</label><select id="income-destination" value={envelopeId} onChange={event=>setEnvelopeId(event.target.value)}><option value="">Selecciona el sobre</option>{envelopes.map(envelope=><option value={envelope.id} key={envelope.id}>{envelope.name}</option>)}</select>{!envelopes.length&&<p>Crea un sobre antes de asignar dinero.</p>}<label htmlFor="income-assignment-amount">Monto a asignar</label><div className="currency-input"><span>₡</span><input id="income-assignment-amount" type="number" inputMode="numeric" min="1" max={current.available} step="1" value={amount} onChange={event=>setAmount(event.target.value)}/></div><button type="button" className="text-btn" onClick={()=>setAmount(String(current.available))}>Usar todo lo disponible</button><p className="flow-intro">Solo se asignarán fondos de este ingreso. No se registrará un gasto ni un pago.</p></>:<p role="status">Este ingreso ya no tiene dinero sin asignar. Vuelve a la lista para consultar los saldos actuales.</p>}
    {error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" className="primary wide" disabled={!current||!envelopeId||!Number.isSafeInteger(Number(amount))||Number(amount)<=0||Number(amount)>current.available}>Confirmar asignación</button><button type="button" className="secondary wide" onClick={onClose}>Cancelar</button>
  </div></form></FinanceDialog>;
}
