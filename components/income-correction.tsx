"use client";
import { envelopeLabel } from "@/lib/envelope-label";
import { useState } from "react";
import { correctionSnapshot, type IncomeCorrection } from "@/lib/income-correction";
import type { Ledger } from "@/lib/finance-ledger";
import { uiCopyEs } from "@/lib/ui-copy";

export function IncomeCorrectionEditor({ledger,incomeId,display,onSave,onCancel}:{ledger:Ledger;incomeId:string;display:(amount:number)=>string;onSave:(input:Omit<IncomeCorrection,"date">)=>void;onCancel:()=>void}) {
  const [snapshot]=useState(()=>correctionSnapshot(ledger,incomeId));
  const [id]=useState(()=>crypto.randomUUID());
  const [amounts,setAmounts]=useState<Record<string,string>>(()=>Object.fromEntries(Object.entries(snapshot.amounts).map(([id,value])=>[id,String(value)])));
  const [reason,setReason]=useState("");
  const [review,setReview]=useState(false);
  const [error,setError]=useState("");
  const envelopes=ledger.envelopes.filter(item=>!item.archived||snapshot.amounts[item.id]);
  const total=Object.values(amounts).reduce((sum,value)=>sum+Number(value),0);
  const changes=envelopes.filter(item=>Number(amounts[item.id]||0)!==(snapshot.amounts[item.id]||0));
  const submit=()=>{
    setError("");
    if(Object.values(amounts).some(value=>!Number.isSafeInteger(Number(value))||Number(value)<0)||!Number.isSafeInteger(total)||total>snapshot.available){setError("Revisa los montos: deben ser enteros y no superar los fondos disponibles de este ingreso.");return;}
    if(!reason.trim()){setError("Escribe el motivo de la corrección.");return;}
    if(!changes.length){setError("Modifica al menos un monto.");return;}
    if(!review){setReview(true);return;}
    try{onSave({incomeId,expectedToken:snapshot.token,id,amounts:Object.fromEntries(Object.entries(amounts).map(([id,value])=>[id,Number(value)])),reason});}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar la corrección.");}
  };
  return <div className="income-correction">
    <h3>Corregir distribución</h3>
    <p className="flow-intro">El ingreso original se conserva. Se registrarán cargas y descargas vinculadas a él, con los saldos actuales. No se registran pagos ni se mueve dinero entre cuentas.</p>
    {!review?<>
      {envelopes.map(envelope=><label key={envelope.id} className="correction-row"><span>{envelopeLabel(envelope.name)}{envelope.archived?" (archivado)":""}<small>Distribuido: {display(snapshot.amounts[envelope.id]||0)} · Saldo actual: {display(envelope.balance)}</small></span><input aria-label={`Nueva distribución en ${envelope.name}`} type="number" inputMode="numeric" min="0" step="1" disabled={envelope.archived} value={amounts[envelope.id]??""} placeholder="0" onChange={event=>setAmounts({...amounts,[envelope.id]:event.target.value})}/></label>)}
      <label htmlFor="correction-reason">Motivo de la corrección</label><textarea id="correction-reason" maxLength={300} value={reason} onChange={event=>setReason(event.target.value)}/>
    </>:<><h4>Revisar cambios</h4>{changes.map(envelope=><div className="trace-row" key={envelope.id}><span>{envelopeLabel(envelope.name)}</span><b>{display(snapshot.amounts[envelope.id]||0)} → {display(Number(amounts[envelope.id]||0))}</b></div>)}<p>{reason}</p></>}
    <div className="review-box"><span>Total distribuido: {display(Number.isFinite(total)?total:0)}</span><span>{uiCopyEs.unassignedIncomes.remainingFromIncome}: {display(Number.isFinite(total)?snapshot.available-total:0)}</span></div>
    <small>El dinero usado fuera de esta distribución no está disponible para corregir. Tampoco se puede retirar más del saldo actual de un sobre.</small>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="primary wide" onClick={submit}>{review?"Confirmar corrección":"Revisar corrección"}</button>
    {review&&<button className="secondary wide" onClick={()=>{setReview(false);setError("");}}>Volver a editar</button>}
    <button className="secondary wide" onClick={onCancel}>Cancelar corrección</button>
  </div>;
}
