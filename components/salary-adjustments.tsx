"use client";
import {useState} from "react";
import {salaryAdjustments,salaryCatalog,salaryExpected,salaryHistoricalEstimate,salaryPeriodPresentation,salaryState,saveSalaryAdjustments,type SalaryAdjustment,type SalaryLedger,type SalaryPeriod} from "@/lib/salary-tracking";
import styles from "./salary-planning.module.css";
type Props={ledger:SalaryLedger;period:SalaryPeriod;today:string;display:(n:number)=>string;onSave?:(operation:(current:SalaryLedger)=>SalaryLedger)=>void};
export function SalaryEstimation({ledger,period,today,display}:Props) {
  const view=salaryPeriodPresentation(ledger,period,today),estimate=salaryHistoricalEstimate(ledger,period);
  if(!view.historicalEmpty)return null;
  return <details key={period.id} className={styles.panel}><summary>Ver estimación</summary>{estimate?<><p>Estimación histórica: <b>{display(estimate.amount)}</b></p><small>Base de cálculo: {estimate.basis}</small></>:<p>Sin información suficiente para estimar este período.</p>}<p>Esta cifra es una estimación; no representa un ingreso registrado ni una deuda confirmada.</p></details>;
}
export function SalaryAdjustments({ledger,period,today,display,onSave}:Props) {
  const original=salaryAdjustments(ledger,period),[editing,setEditing]=useState(false);
  const adjustment=salaryExpected(ledger,period)-period.concepts.reduce((n,c)=>n+c.amount,0);
  return <details className={styles.panel}><summary>Conceptos adicionales{original.length?` · ${display(adjustment)}`:""}</summary>
    {!editing?<><p>{original.length?"Ajustes de esta semana":"Sin ajustes adicionales en esta semana."}</p>{original.map(a=><p key={a.id}>{a.name}: {a.sign==="subtract"?"−":"+"}{display(a.amount)} · {a.status==="confirmed"?"Confirmado":"Estimado"}</p>)}{onSave&&<button type="button" className="secondary" onClick={()=>setEditing(true)}>Editar conceptos de esta semana</button>}</>:<AdjustmentEditor key={period.id+JSON.stringify(original)} {...{ledger,period,today,display,onSave}} original={original} onClose={()=>setEditing(false)}/>}
  </details>;
}
function AdjustmentEditor({ledger,period,display,onSave,original,onClose}:Props&{original:SalaryAdjustment[];onClose:()=>void}) {
  const [items,setItems]=useState(original.map(a=>({...a}))),[error,setError]=useState("");
  const config=salaryState(ledger).configs.find(c=>c.id===period.configId)!;
  const catalog=salaryCatalog(config).filter(c=>c.active&&!items.some(a=>a.catalogId===c.id));
  const update=(id:string,value:Partial<SalaryAdjustment>)=>setItems(items.map(a=>a.id===id?{...a,...value}:a));
  const canEstimate=salaryHistoricalEstimate(ledger,period)!==null;
  const base=period.concepts.reduce((n,c)=>n+c.amount,0),delta=items.reduce((n,a)=>n+(a.sign==="subtract"?-a.amount:a.amount),0);
  return <div className={styles.editor}>
    <label>Añadir desde catálogo<select value="" onChange={e=>{const c=catalog.find(c=>c.id===e.target.value);if(c)setItems([...items,{id:crypto.randomUUID(),catalogId:c.id,name:c.name,sign:c.sign,amount:c.usualAmount??0,status:"estimated"}]);}}><option value="">Seleccionar concepto</option>{catalog.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {items.map(a=><fieldset key={a.id}><legend>{a.name||"Nuevo concepto"}</legend><label>Concepto<input value={a.name} onChange={e=>update(a.id,{name:e.target.value})}/></label><div className={styles.two}><label>Importe<input type="number" min="0" step="1" value={a.amount} onChange={e=>update(a.id,{amount:Number(e.target.value)})}/></label><label>Ajuste<select value={a.sign} onChange={e=>update(a.id,{sign:e.target.value as SalaryAdjustment["sign"]})}><option value="add">Suma</option><option value="subtract">Resta</option></select></label></div><label>Estado<select value={a.status} onChange={e=>update(a.id,{status:e.target.value as SalaryAdjustment["status"]})}><option value="estimated">Estimado</option><option value="confirmed">Confirmado</option></select></label><button type="button" className="secondary" onClick={()=>setItems(items.filter(i=>i.id!==a.id))}>Quitar de esta semana</button></fieldset>)}
    <button type="button" className="secondary" onClick={()=>setItems([...items,{id:crypto.randomUUID(),name:"",amount:0,sign:"add",status:"estimated"}])}>Añadir personalizado</button>
    <p>Ajustes: {display(delta)} · Esperado ajustado: {canEstimate?display(base+delta):"Sin información suficiente"}</p><small>Confirmar un concepto no registra ingresos ni reconoce toda la deuda salarial. Los pagos existentes se conservan.</small>
    {error&&<p role="alert">{error}</p>}<div className={styles.actions}><button type="button" className="primary" onClick={()=>{try{onSave?.(d=>saveSalaryAdjustments(d,period,items,original));onClose();}catch(e){setError(e instanceof Error?e.message:"No se pudieron guardar los ajustes.");}}}>Guardar ajustes</button><button type="button" className="secondary" onClick={onClose}>Cancelar</button></div>
  </div>;
}
