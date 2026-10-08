"use client";
import { FinanceDialog } from "@/components/finance-dialog";
import { incomeDistribution } from "@/lib/income-trace";
import type { Ledger } from "@/lib/finance-ledger";

export function IncomeTraceDialog({ledger,movementId,display,hidden,onIncome,onEnvelope,onBack}:{ledger:Ledger;movementId:string;display:(value:number)=>string;hidden:boolean;onIncome:(id:string)=>void;onEnvelope:(id:string)=>void;onBack:()=>void}) {
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
    {trace?<><p className="flow-intro">Distribución registrada de este ingreso. Los saldos actuales de los sobres pueden haber cambiado.</p>{[...grouped.values()].map((a,index)=><div className="trace-row" key={`${a.envelopeId}-${index}`}><span>{a.name}</span><b>{display(a.amount)}</b>{a.envelopeId&&<button className="secondary" onClick={()=>onEnvelope(a.envelopeId!)}>Ver movimientos del sobre</button>}</div>)}<div className="trace-row"><span>Sin asignar de este ingreso</span><b>{display(trace.unassigned)}</b></div>{trace.otherUses>0&&<div className="trace-row"><span>Otros usos del fondo común o asignaciones antiguas sin vínculo</span><b>{display(trace.otherUses)}</b></div>}<p className="flow-intro">Al asignar desde un ingreso se conserva ese origen. Las asignaciones generales utilizan primero el dinero sin asignar más antiguo. Los retiros devueltos al fondo común conservan su historial, pero no se atribuyen a un ingreso sin evidencia.</p></>:<>{movement?.incomeSources?.map(source=><button className="choice" key={source.incomeId} onClick={()=>onIncome(source.incomeId)}><span>↗</span><b>{hidden?"Ingreso de origen":ledger.movements.find(m=>m.id===source.incomeId)?.name??"Ingreso de origen"}<small>{display(source.amount)}</small></b></button>)}{(!movement?.incomeSources?.length || movement.incomeSources.reduce((s,a)=>s+a.amount,0)<movement.amount)&&<p className="flow-intro">Parte o todo este dinero procede del fondo común sin un ingreso de origen documentado. No se reconstruyen vínculos antiguos por suposición.</p>}</>}
    <button className="secondary wide" onClick={onBack}>Volver</button>
  </div></section></FinanceDialog>;
}
