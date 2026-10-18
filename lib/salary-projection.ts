import {salaryDay,shiftSalaryDate,salaryState,salaryPeriodForDate,salaryHistoricalEstimate,salaryExpected,salaryPaymentValid,salaryConfigAt,type SalaryLedger} from "./salary-tracking";
import {movementDay} from "./finance-history";
export type ProjectionUnit="days"|"weeks"|"months"|"years";
export function salaryProjectionRange(today:string,preset:string,count=1,unit:ProjectionUnit="weeks") {
  salaryDay(today);let start=shiftSalaryDate(today,1),end:string;
  if(preset==="week"){start=shiftSalaryDate(today,7-((new Date(`${today}T12:00:00Z`).getUTCDay()+6)%7));end=shiftSalaryDate(start,6);}
  else if(preset==="fortnight"){start=Number(today.slice(-2))<16?`${today.slice(0,7)}-16`:shiftSalaryDate(`${today.slice(0,7)}-01`,1,"months");end=Number(start.slice(-2))===1?`${start.slice(0,7)}-15`:shiftSalaryDate(shiftSalaryDate(`${start.slice(0,7)}-01`,1,"months"),-1);}
  else if(preset==="month"){start=shiftSalaryDate(`${today.slice(0,7)}-01`,1,"months");end=shiftSalaryDate(shiftSalaryDate(start,1,"months"),-1);}
  else if(preset==="year"){start=`${String(Number(today.slice(0,4))+1).padStart(4,"0")}-01-01`;end=`${start.slice(0,4)}-12-31`;salaryDay(end);}
  else {if(!Number.isSafeInteger(count)||count<1)throw new Error("La cantidad debe ser un entero positivo.");end=shiftSalaryDate(shiftSalaryDate(start,count*(unit==="weeks"?7:unit==="years"?12:1),unit==="months"||unit==="years"?"months":"days"),-1);}
  return {start,end};
}
export function salaryProjection(ledger:SalaryLedger,start:string,end:string,today:string,sourceIds:string[]) {
  salaryDay(start);salaryDay(end);if(end<start)throw new Error("Revisa el intervalo de consulta.");
  const state=salaryState(ledger),sources=state.configs.filter(c=>sourceIds.includes(c.id));
  const rows=sources.map(config=>{
    const periods: {id:string;start:string;end:string;payDate:string;expected:number|null;basis:string}[]=[];
    let cursor:string;try{cursor=shiftSalaryDate(start,-31);}catch{cursor="0001-01-01";}
    const seen=new Set<string>();let visited=0;
    while(cursor<=end){
      if(++visited>50000)throw new Error("Consulta un intervalo más corto para mostrar el desglose sin bloquear la aplicación.");
      const p=salaryPeriodForDate(ledger,config.id,cursor);
      if(!seen.has(p.id)&&p.payDate>=start&&p.payDate<=end){
        const estimate=salaryHistoricalEstimate(ledger,p),validFuture=p.start>=today&&(salaryConfigAt(config,p.start)!==null||!(config.termsHistory?.length))&&p.start>=config.start;
        periods.push({id:p.id,start:p.start,end:p.end,payDate:p.payDate,expected:estimate?.amount??(validFuture?salaryExpected(ledger,p):null),basis:estimate?.basis??(validFuture?"Estimación con la configuración actual":"Sin información suficiente")});seen.add(p.id);
      }
      if(p.end>=end)break;
      const next=shiftSalaryDate(p.end,1);if(next<=cursor)throw new Error("La referencia temporal no pudo avanzar.");cursor=next;
    }
    const payments=state.payments.filter(p=>p.configId===config.id&&salaryPaymentValid(ledger,p)).filter(p=>{const day=p.date.length===10?p.date:movementDay(p.date);return day>=start&&day<=end;});
    const expected=periods.reduce((n,p)=>n+(p.expected??0),0),received=payments.reduce((n,p)=>n+p.amount,0);
    if(!Number.isSafeInteger(expected)||!Number.isSafeInteger(received))throw new Error("Los importes exceden el límite permitido.");
    return {config,periods,expected,received,unknown:periods.filter(p=>p.expected===null).length};
  });
  return {rows,expected:rows.reduce((n,r)=>n+r.expected,0),received:rows.reduce((n,r)=>n+r.received,0),unknown:rows.reduce((n,r)=>n+r.unknown,0)};
}
