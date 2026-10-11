import { assign, unassign, validMovementDate, type Ledger } from "./finance-ledger";
import { incomeDistribution } from "./income-trace";
import { movementInstant } from "./finance-history";

export function correctionSnapshot(ledger: Ledger, incomeId: string) {
  const trace=incomeDistribution(ledger,incomeId);
  if(!trace) throw new Error("El ingreso ya no está disponible.");
  if(trace.distributions.some(item=>!item.envelopeId)) throw new Error("Este ingreso contiene sobres antiguos sin identificar. No se puede corregir su distribución automáticamente.");
  const amounts:Record<string,number>={};
  for(const item of trace.distributions)amounts[item.envelopeId!]=(amounts[item.envelopeId!]||0)+item.amount;
  const token=JSON.stringify({allocations:trace.distributions,unassigned:trace.unassigned});
  return {amounts,token,available:trace.assigned+trace.unassigned,unassigned:trace.unassigned};
}

export type IncomeCorrection = {incomeId:string;expectedToken:string;amounts:Record<string,number>;reason:string;date:string;id:string};

// Build the whole batch on immutable intermediate ledgers. The store receives
// only the final state, so a failed assignment never saves the prior releases.
export function correctIncomeDistribution(ledger:Ledger,input:IncomeCorrection):Ledger {
  const current=correctionSnapshot(ledger,input.incomeId);
  if(current.token!==input.expectedToken)throw new Error("La distribución o el dinero disponible cambió. Cancela y vuelve a abrir la corrección.");
  if(!input.id||ledger.movements.some(item=>item.distributionCorrection?.batchId===input.id))throw new Error("Esta corrección ya fue registrada.");
  const reason=input.reason.trim();
  if(!reason||reason.length>300)throw new Error("Escribe un motivo de hasta 300 caracteres.");
  if(!validMovementDate(input.date)||ledger.movements.some(item=>movementInstant(item.date)>movementInstant(input.date)))throw new Error("La corrección debe registrarse después de los movimientos existentes. Revisa las fechas futuras antes de continuar.");
  const ids=[...new Set([...Object.keys(current.amounts),...Object.keys(input.amounts)])].sort();
  const changes=ids.map(id=>({id,amount:input.amounts[id]??0,previous:current.amounts[id]??0}));
  if(changes.some(item=>!Number.isSafeInteger(item.amount)||item.amount<0))throw new Error("Los montos deben ser enteros mayores o iguales a cero.");
  const total=changes.reduce((sum,item)=>sum+item.amount,0);
  if(!Number.isSafeInteger(total)||total>current.available)throw new Error("La nueva distribución supera los fondos de este ingreso disponibles para corregir.");
  for(const item of changes) {
    if(item.amount===item.previous)continue;
    const envelope=ledger.envelopes.find(envelope=>envelope.id===item.id&&!envelope.archived);
    if(!envelope)throw new Error("Un sobre que deseas modificar ya no está activo.");
    if(item.previous-item.amount>envelope.balance)throw new Error(`El sobre ${envelope.name} no tiene saldo suficiente para retirar esa diferencia.`);
  }
  if(changes.every(item=>item.amount===item.previous))throw new Error("Modifica al menos un monto para registrar una corrección.");
  let next=ledger;
  let sequence=0;
  const tag=(updated:Ledger,id:string):Ledger=>({...updated,movements:updated.movements.map(item=>item.id===id?{...item,distributionCorrection:{incomeId:input.incomeId,batchId:input.id,reason},description:reason}:item)});
  for(const item of changes.filter(item=>item.amount<item.previous)) {
    const id=`${input.id}:${sequence++}`;
    next=tag(unassign(next,item.id,item.previous-item.amount,input.date,id),id);
  }
  for(const item of changes.filter(item=>item.amount>item.previous)) {
    const id=`${input.id}:${sequence++}`;
    next=tag(assign(next,item.id,item.amount-item.previous,input.date,id,input.incomeId),id);
  }
  return next;
}
