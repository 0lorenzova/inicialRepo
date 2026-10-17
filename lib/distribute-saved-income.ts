import {assign,totals,type Ledger} from './finance-ledger';
import {incomeDistribution as traceIncome} from './income-trace';
import {incomeDistribution,type FundingSelection} from './income-distribution';

/** Allocate a saved income atomically, preserving its origin and never receiving it again. */
export function distributeSavedIncome<T extends Ledger>(ledger:T,input:{incomeId:string;id:string;date:string;today:string;manual:Record<string,string>;selections:FundingSelection[]}):T {
  const trace=traceIncome(ledger,input.incomeId);
  if(!trace)throw new Error('El ingreso ya no está disponible. Revisa los movimientos.');
  const available=Math.min(trace.unassigned,totals(ledger).unassigned);
  const plan=incomeDistribution(ledger.envelopes,input.today,available,input.manual,input.selections);
  if(plan.errors.length)throw new Error(plan.errors[0]);
  if(plan.total<=0)throw new Error('Indica cuánto deseas distribuir.');
  let next:Ledger=ledger;
  for(const item of plan.allocations){
    const id=`${input.id}:${item.id}`;
    next=assign(next,item.id,item.amount,input.date,id,input.incomeId);
    next={...next,movements:next.movements.map(m=>m.id===id?{...m,fundingTargets:input.selections.filter(s=>s.envelopeId===item.id).map(s=>({...s}))}:m)};
  }
  return {...ledger,...next};
}
