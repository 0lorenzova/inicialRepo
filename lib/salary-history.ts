import type {SalaryLedger} from './salary-tracking';
import {salaryState} from './salary-tracking';
export type SalaryHistoryOrder='newest'|'oldest';
export function sortSalaryHistory<T extends {id:string}>(items:readonly T[],order:SalaryHistoryOrder,date:(item:T)=>string):T[] {
  const stamp=(value:string)=>Date.parse(value.length===10?`${value}T00:00:00-06:00`:/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)?value:`${value}-06:00`);
  return [...items].sort((a,b)=>((stamp(date(a))-stamp(date(b)))||a.id.localeCompare(b.id))*(order==='oldest'?1:-1));
}
export function setSalaryHistoryOrder<T extends SalaryLedger>(ledger:T,order:SalaryHistoryOrder):T {
  if(order!=='newest'&&order!=='oldest')throw new Error('Selecciona un orden válido.');
  return {...ledger,salary:{...salaryState(ledger),historyOrder:order}};
}
