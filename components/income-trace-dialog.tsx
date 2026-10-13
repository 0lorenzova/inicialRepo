"use client";
import { useState } from "react";
import { IncomeCorrectionEditor } from "./income-correction";
import { correctionSnapshot, type IncomeCorrection } from "@/lib/income-correction";
import { FinanceDialog } from "@/components/finance-dialog";
import { incomeDistribution } from "@/lib/income-trace";
import { planningItems, type PlanningEnvelope } from "@/lib/envelope-planning";
import { PlanningItemSummary } from "./envelope-planning";
import styles from "./income-trace-dialog.module.css";
import type { Ledger } from "@/lib/finance-ledger";

export function IncomeTraceDialog({ledger,movementId,display,hidden,onIncome,onEnvelope,onBack,onCorrect,envelopes,today,expanded=[],onExpanded}:{envelopes:(PlanningEnvelope&{icon:string})[];today:string;expanded?:string[];onExpanded:(ids:string[])=>void;ledger:Ledger;movementId:string;display:(value:number)=>string;hidden:boolean;onIncome:(id:string)=>void;onEnvelope:(id:string)=>void;onBack:()=>void;onCorrect:(input:Omit<IncomeCorrection,"date">)=>void}) {
  const [editing,setEditing]=useState(false),[saved,setSaved]=useState(false);
  let correctionError="";
  try { correctionSnapshot(ledger,movementId); } catch(error) { correctionError=error instanceof Error?error.message:"Este ingreso no se puede corregir."; }
  const corrections=ledger.movements.filter(item=>item.distributionCorrection?.incomeId===movementId);
  const movement=ledger.movements.find(m=>m.id===movementId);
  const trace=incomeDistribution(ledger,movementId);
  const grouped = new Map<string,{envelopeId?:string;name:string;amount:number}>();
  for(const allocation of trace?.distributions??[]) {
    const key=allocation.envelopeId??allocation.name;
    const previous=grouped.get(key);
    grouped.set(key,{...allocation,amount:(previous?.amount??0)+allocation.amount});
  }
  return <FinanceDialog label="Ruta del ingreso" onClose={onBack}><section className="flow-modal"><header><button type="button" aria-label="Volver al movimiento" onClick={onBack}>‹</button><h2>{trace?"Ruta del ingreso":"Ingreso de origen"}</h2></header><div className="flow-body">
    <h3 className="trace-name">{hidden?movement?.type:movement?.name}</h3><b>{display(movement?.amount??0)}</b>
    {trace?<><p className="flow-intro">Distribución registrada de este ingreso. Los saldos actuales de los sobres pueden haber cambiado.</p>{[...grouped.values()].map((a,index)=>{
      const envelope=envelopes.find(item=>item.id===a.envelopeId);
      const items=envelope?planningItems(envelope,today):[];
      const key=a.envelopeId??`legacy-${index}`;
      return <details className={styles.envelope} key={key} open={expanded.includes(key)} onToggle={event=>{const open=event.currentTarget.open;if(open!==expanded.includes(key))onExpanded(open?[...expanded,key]:expanded.filter(id=>id!==key));}}>
        <summary><span aria-hidden="true">{envelope?.icon??"✉"}</span><span>{envelope?.name??a.name}{envelope?.archived&&<small>Archivado</small>}</span><b>{display(a.amount)}</b></summary>
        <div className={styles.items}><small>Metas y pagos actuales del sobre</small>{items.map(item=><div key={`${item.kind}:${item.id}`} className={styles.item}><PlanningItemSummary item={item} today={today} display={display} privateMode={hidden}/></div>)}{!items.length&&<p className="flow-intro">No hay metas ni pagos programados activos en este sobre.</p>}{a.envelopeId&&<button className="secondary wide" onClick={()=>onEnvelope(a.envelopeId!)}>Ver movimientos de este sobre</button>}</div>
      </details>;
    })}<div className="trace-row"><span>Sin asignar de este ingreso</span><b>{display(trace.unassigned)}</b></div>{trace.otherUses>0&&<div className="trace-row"><span>Otros usos del fondo común o asignaciones antiguas sin vínculo</span><b>{display(trace.otherUses)}</b></div>}<p className="flow-intro">Al asignar desde un ingreso se conserva ese origen. Las asignaciones generales utilizan primero el dinero sin asignar más antiguo. Los retiros devueltos al fondo común conservan su historial, pero no se atribuyen a un ingreso sin evidencia.</p></>:<>{movement?.incomeSources?.map(source=><button className="choice" key={source.incomeId} onClick={()=>onIncome(source.incomeId)}><span>↗</span><b>{hidden?"Ingreso de origen":ledger.movements.find(m=>m.id===source.incomeId)?.name??"Ingreso de origen"}<small>{display(source.amount)}</small></b></button>)}{(!movement?.incomeSources?.length || movement.incomeSources.reduce((s,a)=>s+a.amount,0)<movement.amount)&&<p className="flow-intro">Parte o todo este dinero procede del fondo común sin un ingreso de origen documentado. No se reconstruyen vínculos antiguos por suposición.</p>}</>}
    {trace&&<>
      {saved&&<p role="status">Corrección registrada. La distribución y los saldos están actualizados.</p>}
      {corrections.length>0&&<details><summary>Correcciones registradas ({new Set(corrections.map(item=>item.distributionCorrection!.batchId)).size})</summary>{corrections.map(item=><div className="trace-row" key={item.id}><span>{item.type} · {item.allocations.map(a=>a.name).join(" · ")}<small>{hidden?"Corrección de distribución":item.distributionCorrection!.reason}</small><small>{new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(item.date)?item.date:`${item.date}-06:00`).toLocaleString("es-CR",{timeZone:"America/Costa_Rica"})}</small></span><b>{display(item.amount)}</b></div>)}</details>}
      {editing?<IncomeCorrectionEditor ledger={ledger} incomeId={movementId} display={display} onCancel={()=>setEditing(false)} onSave={input=>{onCorrect(input);setEditing(false);setSaved(true);}}/>:<><button className="secondary wide" disabled={Boolean(correctionError)||hidden} onClick={()=>{setEditing(true);setSaved(false);}}>Corregir distribución</button>{correctionError&&<p className="flow-intro">{correctionError}</p>}{hidden&&<p className="flow-intro">Muestra los montos para editar la distribución.</p>}</>}
    </>}
    <button className="secondary wide" onClick={onBack}>Volver</button>
  </div></section></FinanceDialog>;
}
