import { validMovementDate, type Ledger } from "./finance-ledger";
import { postDistributedIncome, type FundingSelection } from "./income-distribution";
import { previewPostponement } from "./finance-recurrence";

export type SalaryConfig = { id:string; employer:string; name:string; currency:"CRC"; base:number; frequency:"Semanal"|"Quincenal"|"Mensual"; start:string; payOffset:number; workDays:number[]; active:boolean };
export type SalaryConcept = { id:string; name:string; amount:number };
export type SalaryPeriod = { id:string; configId:string; start:string; end:string; payDate:string; earned:boolean; concepts:SalaryConcept[]; notes:string; source?:string };
export type SalaryApplication = { periodId:string; conceptId:string; amount:number };
export type SalaryPayment = { id:string; configId:string; movementId:string; amount:number; date:string; accountId:string; method:string; reference:string; notes:string; applications:SalaryApplication[]; voidReason?:string };
export type SalaryAudit = { id:string; date:string; action:string; entityId:string; reason:string; before?:unknown };
export type SalaryState = { configs:SalaryConfig[]; periods:SalaryPeriod[]; payments:SalaryPayment[]; audit:SalaryAudit[] };
export type SalaryLedger = Ledger & { salary?:SalaryState };
export const emptySalary = ():SalaryState => ({configs:[],periods:[],payments:[],audit:[]});
export const salaryState = (ledger:SalaryLedger) => ledger.salary ?? emptySalary();
function ensure(condition:unknown,message:string):asserts condition { if(!condition)throw new Error(message); }
const amountValid = (n:number) => Number.isSafeInteger(n)&&n>=0;
export function salaryDay(day:string) { ensure(validMovementDate(`${day}T12:00`),"Selecciona una fecha válida.");return day; }
function total(values:number[]) { const n=values.reduce((s,v)=>s+v,0);ensure(amountValid(n),"El total salarial no es válido o excede el límite permitido.");return n; }
function audit(state:SalaryState,entityId:string,action:string,reason:string,before?:unknown):SalaryAudit[] { return [...state.audit,{id:crypto.randomUUID(),date:new Date().toISOString(),entityId,action,reason,before}]; }
export function salaryPaymentValid(ledger:SalaryLedger,payment:SalaryPayment) {
  if(payment.voidReason)return false;
  const m=ledger.movements.find(m=>m.id===payment.movementId);
  return Boolean(m&&m.type==="Ingreso"&&m.amount===payment.amount&&m.accountId===payment.accountId&&m.date===payment.date);
}
export function salaryConceptPaid(ledger:SalaryLedger,periodId:string,conceptId:string) {
  return total(salaryState(ledger).payments.filter(p=>salaryPaymentValid(ledger,p)).flatMap(p=>p.applications.filter(a=>a.periodId===periodId&&a.conceptId===conceptId).map(a=>a.amount)));
}
export function salaryPeriodTotals(ledger:SalaryLedger,period:SalaryPeriod) {
  const projected=total(period.concepts.map(c=>c.amount));
  const earned=period.earned?projected:0;
  const received=total(period.concepts.map(c=>salaryConceptPaid(ledger,period.id,c.id)));
  const pending=earned-received;
  return {projected:period.earned?0:projected,earned,received,pending,status:!period.earned?"Proyectado":pending===0?"Pagado":received>0?"Parcial":"Pendiente"};
}
export function saveSalaryConfig<T extends SalaryLedger>(ledger:T,requested:SalaryConfig,original:SalaryConfig|null):T {
  const state=salaryState(ledger),current=state.configs.find(c=>c.id===requested.id);
  ensure(original?JSON.stringify(current)===JSON.stringify(original):!current,"La configuración cambió. Vuelve a abrirla.");
  ensure(requested.id&&requested.employer.trim()&&requested.name.trim(),"Escribe el empleador y el nombre de la configuración.");
  ensure(requested.currency==="CRC"&&amountValid(requested.base)&&requested.base>0,"Usa un salario en colones enteros mayor que cero. No se redondean centavos.");
  ensure(["Semanal","Quincenal","Mensual"].includes(requested.frequency),"Selecciona una frecuencia válida.");
  salaryDay(requested.start);
  ensure(Number.isInteger(requested.payOffset)&&requested.payOffset>=0&&requested.payOffset<=31,"La fecha habitual admite entre 0 y 31 días después del período.");
  ensure(requested.workDays.length>0&&new Set(requested.workDays).size===requested.workDays.length&&requested.workDays.every(d=>Number.isInteger(d)&&d>=0&&d<=6),"Selecciona los días laborales.");
  const config={...requested,name:requested.name.trim(),employer:requested.employer.trim()};
  return {...ledger,salary:{...state,configs:original?state.configs.map(c=>c.id===config.id?config:c):[...state.configs,config],audit:audit(state,config.id,"Configuración",original?"Cambios para próximos períodos; historia conservada":"Nueva configuración",original)}};
}
const previousDay = (day:string) => { const d=new Date(`${salaryDay(day)}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-1);return salaryDay(d.toISOString().slice(0,10)); };
export function generateSalaryPeriods<T extends SalaryLedger>(ledger:T,configId:string,count:number):T {
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===configId&&c.active);
  ensure(config,"Selecciona una configuración salarial activa.");
  ensure(Number.isInteger(count)&&count>0&&count<=24,"Genera entre 1 y 24 períodos por operación.");
  const existing=state.periods.filter(p=>p.configId===configId).sort((a,b)=>b.end.localeCompare(a.end));
  let start=existing.length?previewPostponement(existing[0].end,{unit:"days",amount:1}):config.start;
  if(start<config.start)start=config.start;
  const periods=[...state.periods];
  for(let i=0;i<count;i++) {
    const next=previewPostponement(start,{unit:config.frequency==="Mensual"?"months":"days",amount:config.frequency==="Mensual"?1:config.frequency==="Semanal"?7:15},Number(config.start.slice(8)));
    const end=previousDay(next),id=`salary-period:${configId}:${start}`;
    ensure(!periods.some(p=>p.configId===configId&&p.start<=end&&p.end>=start),"El período se superpone con otro existente.");
    periods.push({id,configId,start,end,payDate:config.payOffset?previewPostponement(end,{unit:"days",amount:config.payOffset}):end,earned:false,concepts:[{id:`${id}:salary`,name:"Salario",amount:config.base}],notes:""});
    start=next;
  }
  return {...ledger,salary:{...state,periods,audit:audit(state,configId,"Generar períodos",`${count} proyecciones; sin ingresos ni deuda confirmada`)}};
}
export function saveSalaryPeriod<T extends SalaryLedger>(ledger:T,requested:SalaryPeriod,original:SalaryPeriod|null,today:string,reason:string):T {
  const state=salaryState(ledger),current=state.periods.find(p=>p.id===requested.id);
  ensure(original?JSON.stringify(current)===JSON.stringify(original):!current,"El período cambió. Vuelve a abrirlo.");
  ensure(state.configs.some(c=>c.id===requested.configId),"La configuración salarial no existe.");
  ensure(!current||current.configId===requested.configId,"Un período existente debe conservar su empleador.");
  ensure(requested.id&&reason.trim(),"Escribe el motivo del ajuste o la confirmación.");
  salaryDay(requested.start);salaryDay(requested.end);salaryDay(requested.payDate);salaryDay(today);
  ensure(requested.start<=requested.end,"La fecha inicial no puede superar la final.");
  ensure(!requested.earned||requested.end<=today,"Un período futuro sigue siendo una proyección. Confirma su devengo cuando finalice.");
  ensure(!state.periods.some(p=>p.id!==requested.id&&p.configId===requested.configId&&p.start<=requested.end&&p.end>=requested.start),"El período se superpone con otro existente.");
  ensure(requested.concepts.length>0&&new Set(requested.concepts.map(c=>c.id)).size===requested.concepts.length,"Revisa los conceptos del período.");
  ensure(requested.concepts.every(c=>c.id&&c.name.trim()&&amountValid(c.amount)),"Los conceptos necesitan nombre e importe en colones enteros, sin valores negativos.");
  total(requested.concepts.map(c=>c.amount));
  for(const c of current?.concepts??[]) {
    const paid=salaryConceptPaid(ledger,requested.id,c.id),replacement=requested.concepts.find(x=>x.id===c.id);
    ensure(!paid||(requested.earned&&replacement&&replacement.amount>=paid),"No puedes retirar un concepto pagado ni reducirlo por debajo de sus abonos. Revisa primero las vinculaciones.");
  }
  const value={...requested,concepts:requested.concepts.map(c=>({...c,name:c.name.trim()}))};
  return {...ledger,salary:{...state,periods:original?state.periods.map(p=>p.id===value.id?value:p):[...state.periods,value],audit:audit(state,value.id,"Guardar período",reason.trim(),original)}};
}
export type SalaryPaymentInput = { id:string; configId:string; date:string; amount:number; accountId:string; method:string; reference:string; notes:string; applications:SalaryApplication[]; existingMovementId?:string; manual?:Record<string,string>; selections?:FundingSelection[] };
export function postSalaryPayment<T extends SalaryLedger>(ledger:T,input:SalaryPaymentInput,today:string):T {
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===input.configId);
  ensure(config,"Selecciona un empleador.");
  ensure(input.id&&!state.payments.some(p=>p.id===input.id),"Este abono ya fue registrado. No se duplicó.");
  ensure(amountValid(input.amount)&&input.amount>0,"El abono debe ser un importe entero mayor que cero.");
  ensure(validMovementDate(input.date)&&input.date.slice(0,10)<=salaryDay(today),"Selecciona la fecha real del cobro, no una fecha futura.");
  ensure(input.applications.length>0&&new Set(input.applications.map(a=>`${a.periodId}:${a.conceptId}`)).size===input.applications.length,"Selecciona los conceptos sin repetirlos.");
  for(const a of input.applications) {
    const p=state.periods.find(p=>p.id===a.periodId&&p.configId===config.id&&p.earned),c=p?.concepts.find(c=>c.id===a.conceptId);
    ensure(c&&amountValid(a.amount)&&a.amount>0&&a.amount<=c.amount-salaryConceptPaid(ledger,a.periodId,a.conceptId),"Una aplicación supera la deuda pendiente o el período no está devengado.");
  }
  ensure(total(input.applications.map(a=>a.amount))===input.amount,"Distribuye el abono completo entre los conceptos y períodos seleccionados.");
  const movementId=input.existingMovementId||`salary-income:${input.id}`;
  ensure(!state.payments.some(p=>!p.voidReason&&p.movementId===movementId),"Este ingreso ya está vinculado a un abono salarial.");
  let next:Ledger=ledger;
  if(input.existingMovementId) {
    const m=ledger.movements.find(m=>m.id===movementId);
    ensure(m&&m.type==="Ingreso"&&m.amount===input.amount&&m.date===input.date&&m.accountId===input.accountId,"El ingreso cambió. Selecciónalo otra vez y revisa su monto, cuenta y fecha.");
    ensure(!Object.values(input.manual??{}).some(v=>Number(v)>0)&&!input.selections?.length,"El ingreso existente conserva su distribución; puedes ajustarla desde su detalle.");
  } else {
    next=postDistributedIncome(ledger,{id:movementId,amount:input.amount,date:input.date,accountId:input.accountId,name:`Salario · ${config.employer}`,category:"Salario",paymentMethod:input.method,reference:input.reference,description:input.notes},today,input.manual??{},input.selections??[]);
  }
  const linked=next.movements.find(m=>m.id===movementId)!;
  const payment:SalaryPayment={id:input.id,configId:config.id,movementId,amount:input.amount,date:input.date,accountId:input.accountId,method:linked.paymentMethod??"Sin especificar",reference:linked.reference??"",notes:input.notes,applications:input.applications.map(a=>({...a}))};
  return {...ledger,...next,salary:{...state,payments:[...state.payments,payment],audit:audit(state,payment.id,"Registrar abono",input.existingMovementId?"Ingreso existente vinculado; sin duplicar dinero":"Ingreso y aplicaciones guardados juntos")}};
}
export function unlinkSalaryPayment<T extends SalaryLedger>(ledger:T,paymentId:string,reason:string):T {
  const state=salaryState(ledger),payment=state.payments.find(p=>p.id===paymentId&&!p.voidReason);
  ensure(payment&&reason.trim(),"Selecciona un abono activo y explica la corrección.");
  return {...ledger,salary:{...state,payments:state.payments.map(p=>p.id===paymentId?{...p,voidReason:reason.trim()}:p),audit:audit(state,paymentId,"Desvincular abono",reason,payment)}};
}
