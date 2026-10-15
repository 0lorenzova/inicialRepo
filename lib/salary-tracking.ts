import { totals, validMovementDate, type Ledger } from "./finance-ledger";
import { postDistributedIncome, type FundingSelection } from "./income-distribution";
import { incomeDistribution } from "./income-trace";
import { isoWeek } from "./iso-week";
import { movementDay } from "./finance-history";
import { previewPostponement } from "./finance-recurrence";

export type SalaryConfig = { id:string; employer:string; name:string; currency:"CRC"; base:number; frequency:"Semanal"|"Quincenal"|"Mensual"|"Otra"; intervalDays?:number; extraConcepts?:SalaryConcept[]; start:string; payOffset:number; workDays:number[]; active:boolean };
export type SalaryConcept = { id:string; name:string; amount:number };
export type SalaryPeriod = { id:string; configId:string; start:string; end:string; payDate:string; earned:boolean; concepts:SalaryConcept[]; notes:string; source?:string; frequency?:SalaryConfig["frequency"] };
export type SalaryApplication = { periodId:string; conceptId:string; amount:number };
export type SalaryPayment = { id:string; configId:string; movementId:string; amount:number; date:string; accountId:string; method:string; reference:string; notes:string; applications:SalaryApplication[]; voidReason?:string; historical?:{source:string;recordedAt:string} };
export type SalaryAudit = { id:string; date:string; action:string; entityId:string; reason:string; before?:unknown };
export type SalaryState = { configs:SalaryConfig[]; periods:SalaryPeriod[]; payments:SalaryPayment[]; audit:SalaryAudit[]; viewMode?:"list"|"grid" };
export type SalaryLedger = Ledger & { salary?:SalaryState };
export const emptySalary = ():SalaryState => ({configs:[],periods:[],payments:[],audit:[]});
export const salaryState = (ledger:SalaryLedger) => ledger.salary ?? emptySalary();
function ensure(condition:unknown,message:string):asserts condition { if(!condition)throw new Error(message); }
const amountValid = (n:number) => Number.isSafeInteger(n)&&n>=0;
export const normalizeSalaryName=(value:string)=>value.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("es");
export function salaryDay(day:string) { ensure(validMovementDate(`${day}T12:00`),"Selecciona una fecha válida.");return day; }
function total(values:number[]) { const n=values.reduce((s,v)=>s+v,0);ensure(amountValid(n),"El total salarial no es válido o excede el límite permitido.");return n; }
function audit(state:SalaryState,entityId:string,action:string,reason:string,before?:unknown):SalaryAudit[] { return [...state.audit,{id:crypto.randomUUID(),date:new Date().toISOString(),entityId,action,reason,before}]; }
export function salaryPaymentValid(ledger:SalaryLedger,payment:SalaryPayment) {
  if(payment.voidReason)return false;
  if(payment.historical)return Boolean(payment.historical.source&&!payment.movementId&&!payment.accountId&&amountValid(payment.amount)&&payment.amount>0&&validMovementDate(`${payment.date}T12:00`));
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
  const pending=period.earned?Math.max(0,earned-received):0;
  return {projected:period.earned?0:projected,earned,received,pending,status:!period.earned?(received>0?"Adelanto":"Proyectado"):pending===0?"Pagado":received>0?"Parcial":"Pendiente"};
}
export function saveSalaryConfig<T extends SalaryLedger>(ledger:T,requested:SalaryConfig,original:SalaryConfig|null):T {
  const state=salaryState(ledger),current=state.configs.find(c=>c.id===requested.id);
  ensure(original?JSON.stringify(current)===JSON.stringify(original):!current,"La configuración cambió. Vuelve a abrirla.");
  ensure(requested.id&&requested.employer.trim()&&requested.name.trim(),"Escribe el empleador y el nombre de la configuración.");
  ensure(!state.configs.some(c=>c.id!==requested.id&&normalizeSalaryName(c.employer)===normalizeSalaryName(requested.employer)&&normalizeSalaryName(c.name)===normalizeSalaryName(requested.name)),"Ya existe un ingreso con estos mismos datos.");
  ensure(requested.currency==="CRC"&&amountValid(requested.base)&&requested.base>0,"Usa un salario en colones enteros mayor que cero. No se redondean centavos.");
  ensure(["Semanal","Quincenal","Mensual","Otra"].includes(requested.frequency),"Selecciona una frecuencia válida.");
  ensure(requested.frequency!=="Otra"||(Number.isInteger(requested.intervalDays)&&requested.intervalDays!>=1&&requested.intervalDays!<=366),"Indica una periodicidad de 1 a 366 días.");
  ensure((requested.extraConcepts??[]).every(c=>c.id&&c.name.trim()&&amountValid(c.amount))&&new Set((requested.extraConcepts??[]).map(c=>c.id)).size===(requested.extraConcepts??[]).length,"Revisa los conceptos adicionales de la configuración.");
  total([requested.base,...(requested.extraConcepts??[]).map(c=>c.amount)]);
  salaryDay(requested.start);
  ensure(Number.isInteger(requested.payOffset)&&requested.payOffset>=0&&requested.payOffset<=31,"La fecha habitual admite entre 0 y 31 días después del período.");
  ensure(requested.workDays.length>0&&new Set(requested.workDays).size===requested.workDays.length&&requested.workDays.every(d=>Number.isInteger(d)&&d>=0&&d<=6),"Selecciona los días laborales.");
  const config={...requested,name:requested.name.trim(),employer:requested.employer.trim()};
  return {...ledger,salary:{...state,periods:state.periods.map(p=>p.configId===requested.id&&!p.frequency&&current?{...p,frequency:current.frequency}:p),configs:original?state.configs.map(c=>c.id===config.id?config:c):[...state.configs,config],audit:audit(state,config.id,"Configuración",original?"Cambios para próximos períodos; historia conservada":"Nueva configuración",original)}};
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
    const next=previewPostponement(start,{unit:config.frequency==="Mensual"?"months":"days",amount:config.frequency==="Mensual"?1:config.frequency==="Semanal"?7:config.frequency==="Otra"?config.intervalDays!:15},Number(config.start.slice(8)));
    const end=previousDay(next),id=`salary-period:${configId}:${start}`;
    ensure(!periods.some(p=>p.configId===configId&&p.start<=end&&p.end>=start),"El período se superpone con otro existente.");
    periods.push({id,configId,start,end,payDate:config.payOffset?previewPostponement(end,{unit:"days",amount:config.payOffset}):end,earned:false,concepts:[{id:`${id}:salary`,name:"Salario",amount:config.base},...(config.extraConcepts??[]).map(c=>({...c,id:`${id}:${c.id}`}))],frequency:config.frequency,notes:""});
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
    ensure(!paid||((requested.earned||!current?.earned)&&replacement&&replacement.amount>=paid),"No puedes retirar un concepto pagado ni reducirlo por debajo de sus abonos. Revisa primero las vinculaciones.");
  }
  for(const pay of state.payments.filter(pay=>salaryPaymentValid(ledger,pay)&&pay.applications.some(a=>a.periodId===requested.id)))ensure(requested.earned||requested.start<=(pay.historical?pay.date:movementDay(pay.date)),"La fecha inicial no puede quedar después de un adelanto recibido.");
  const value={...requested,frequency:requested.frequency??state.configs.find(c=>c.id===requested.configId)?.frequency,concepts:requested.concepts.map(c=>({...c,name:c.name.trim()}))};
  return {...ledger,salary:{...state,periods:original?state.periods.map(p=>p.id===value.id?value:p):[...state.periods,value],audit:audit(state,value.id,"Guardar período",reason.trim(),original)}};
}
export type SalaryPaymentInput = { id:string; configId:string; date:string; amount:number; accountId:string; method:string; reference:string; notes:string; name?:string; applications:SalaryApplication[]; existingMovementId?:string; manual?:Record<string,string>; selections?:FundingSelection[]; allowAdvance?:boolean };
export function salaryPeriodApplications(ledger:SalaryLedger,configId:string,periodId:string,amount:number,advanceDate?:string):SalaryApplication[] {
  const period=salaryState(ledger).periods.find(p=>p.id===periodId&&p.configId===configId&&(p.earned||Boolean(advanceDate&&p.start<=advanceDate)));
  ensure(period,"Selecciona un empleador y un período devengado con saldo pendiente.");
  ensure(amountValid(amount)&&amount>0,"Escribe un importe entero mayor que cero.");
  let remaining=amount;
  const applications=period.concepts.flatMap(c=>{const applied=Math.min(remaining,c.amount-salaryConceptPaid(ledger,period.id,c.id));if(applied<=0)return [];remaining-=applied;return [{periodId:period.id,conceptId:c.id,amount:applied}];});
  ensure(remaining===0,"El ingreso supera el saldo pendiente del período seleccionado.");
  return applications;
}
function validateSalaryApplications(ledger:SalaryLedger,configId:string,applications:SalaryApplication[],amount:number,advanceDate?:string) {
  const state=salaryState(ledger);
  ensure(applications.length>0&&new Set(applications.map(a=>`${a.periodId}:${a.conceptId}`)).size===applications.length,"Selecciona los conceptos sin repetirlos.");
  for(const a of applications) {
    const p=state.periods.find(p=>p.id===a.periodId&&p.configId===configId&&(p.earned||Boolean(advanceDate&&p.start<=advanceDate))),c=p?.concepts.find(c=>c.id===a.conceptId);
    ensure(c&&amountValid(a.amount)&&a.amount>0&&a.amount<=c.amount-salaryConceptPaid(ledger,a.periodId,a.conceptId),"Una aplicación supera la deuda pendiente o el período no está devengado.");
  }
  ensure(total(applications.map(a=>a.amount))===amount,"Distribuye el abono completo entre los conceptos y períodos seleccionados.");
}

export function postHistoricalSalaryPayment<T extends SalaryLedger>(ledger:T,input:{id:string;configId:string;date:string;source:string;notes:string;applications:SalaryApplication[]},today:string):T {
  const state=salaryState(ledger);
  ensure(state.configs.some(c=>c.id===input.configId),"Selecciona un empleador.");
  ensure(input.id&&input.source.trim()&&!state.payments.some(p=>p.id===input.id||p.historical?.source===input.source),"Este pago histórico ya fue registrado o no identifica su origen.");
  ensure(salaryDay(input.date)<=salaryDay(today),"Un pago histórico necesita su fecha real, igual o anterior a hoy.");
  const amount=total(input.applications.map(a=>a.amount));
  ensure(amount>0,"El pago histórico debe ser mayor que cero.");
  validateSalaryApplications(ledger,input.configId,input.applications,amount);
  const payment:SalaryPayment={id:input.id,configId:input.configId,date:input.date,amount,movementId:"",accountId:"",method:"Histórico",reference:"",notes:input.notes,applications:input.applications.map(a=>({...a})),historical:{source:input.source,recordedAt:new Date().toISOString()}};
  return {...ledger,salary:{...state,payments:[...state.payments,payment],audit:audit(state,payment.id,"Registrar pago histórico","Cobro anterior confirmado; reduce deuda salarial sin crear ingresos ni modificar cuentas o sobres")}};
}
export function postSalaryPayment<T extends SalaryLedger>(ledger:T,input:SalaryPaymentInput,today:string):T {
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===input.configId);
  ensure(config,"Selecciona un empleador.");
  ensure(input.id&&!state.payments.some(p=>p.id===input.id),"Ya existe un ingreso con estos mismos datos.");
  ensure(amountValid(input.amount)&&input.amount>0,"El abono debe ser un importe entero mayor que cero.");
  ensure(validMovementDate(input.date)&&input.date.slice(0,10)<=salaryDay(today),"Selecciona la fecha real del cobro, no una fecha futura.");
  validateSalaryApplications(ledger,config.id,input.applications,input.amount,input.allowAdvance?movementDay(input.date):undefined);
  const applicationKey=(items:SalaryApplication[])=>JSON.stringify([...new Set(items.map(a=>a.periodId))].sort());
  if(!input.existingMovementId&&input.reference.trim())ensure(!state.payments.some(p=>!p.historical&&salaryPaymentValid(ledger,p)&&p.configId===config.id&&p.date===input.date&&p.amount===input.amount&&p.accountId===input.accountId&&normalizeSalaryName(p.reference)===normalizeSalaryName(input.reference)&&applicationKey(p.applications)===applicationKey(input.applications)),"Ya existe un ingreso con estos mismos datos.");
  const movementId=input.existingMovementId||`salary-income:${input.id}`;
  ensure(!state.payments.some(p=>!p.voidReason&&p.movementId===movementId),"Ya existe un ingreso con estos mismos datos.");
  let next:Ledger=ledger;
  if(input.existingMovementId) {
    const m=ledger.movements.find(m=>m.id===movementId);
    ensure(m&&m.type==="Ingreso"&&m.amount===input.amount&&m.date===input.date&&m.accountId===input.accountId,"El ingreso cambió. Selecciónalo otra vez y revisa su monto, cuenta y fecha.");
    ensure(!Object.values(input.manual??{}).some(v=>Number(v)>0)&&!input.selections?.length,"El ingreso existente conserva su distribución; puedes ajustarla desde su detalle.");
  } else {
    next=postDistributedIncome(ledger,{id:movementId,amount:input.amount,date:input.date,accountId:input.accountId,name:input.name?.trim()||`Salario · ${config.employer}`,category:"Salario",paymentMethod:input.method,reference:input.reference,description:input.notes},today,input.manual??{},input.selections??[]);
  }
  const linked=next.movements.find(m=>m.id===movementId)!;
  const payment:SalaryPayment={id:input.id,configId:config.id,movementId,amount:input.amount,date:input.date,accountId:input.accountId,method:linked.paymentMethod??"Sin especificar",reference:linked.reference??"",notes:input.notes,applications:input.applications.map(a=>({...a}))};
  return {...ledger,...next,salary:{...state,payments:[...state.payments,payment],audit:audit(state,payment.id,"Registrar abono",input.existingMovementId?"Ingreso existente vinculado; sin duplicar dinero":"Ingreso y aplicaciones guardados juntos")}};
}
export function unlinkSalaryPayment<T extends SalaryLedger>(ledger:T,paymentId:string,reason:string):T {
  const state=salaryState(ledger),payment=state.payments.find(p=>p.id===paymentId&&!p.voidReason);
  ensure(payment&&reason.trim(),"Selecciona un abono activo y explica la corrección.");
  return {...ledger,salary:{...state,payments:state.payments.map(p=>p.id===paymentId?{...p,voidReason:reason.trim()}:p),audit:audit(state,paymentId,payment.historical?"Anular pago histórico":"Desvincular abono",reason,payment)}};
}

/** Weekly identity uses the ISO week/year of the configured start date; dates never move. */
export function salaryPeriodLabel(period:SalaryPeriod, config?:SalaryConfig) {
  const frequency=period.frequency??config?.frequency;
  if(frequency==="Semanal") { const value=isoWeek(period.start);return `Semana ${value.week} · Año ${value.year}`; }
  const month=new Intl.DateTimeFormat("es-CR",{timeZone:"UTC",month:"long",year:"numeric"}).format(new Date(`${period.start}T12:00:00Z`));
  if(frequency==="Quincenal")return `Quincena ${Number(period.start.slice(8))<=15?1:2} · ${month}`;
  return frequency==="Mensual"?`Mes · ${month}`:`Período · ${period.start}`;
}
export const salaryPeriodRemaining=(ledger:SalaryLedger,p:SalaryPeriod)=>total(p.concepts.map(c=>c.amount-salaryConceptPaid(ledger,p.id,c.id)));
export function salarySuggestions(ledger:SalaryLedger,configId:string,receptionDay:string) {
  salaryDay(receptionDay);
  const periods=salaryState(ledger).periods.filter(p=>p.configId===configId).sort((a,b)=>b.end.localeCompare(a.end));
  const last=periods.find(p=>p.end<receptionDay);
  const suggested=last&&last.earned&&salaryPeriodRemaining(ledger,last)>0?last:undefined;
  return {last,suggested,current:periods.filter(p=>p.start<=receptionDay&&p.end>=receptionDay&&salaryPeriodRemaining(ledger,p)>0),older:periods.filter(p=>p!==suggested&&p.earned&&p.end<receptionDay&&salaryPeriodRemaining(ledger,p)>0)};
}
export function setSalaryView<T extends SalaryLedger>(ledger:T,viewMode:"list"|"grid"):T {
  return {...ledger,salary:{...salaryState(ledger),viewMode}};
}
export function deleteSalaryPeriod<T extends SalaryLedger>(ledger:T,id:string,expected:SalaryPeriod,reason:string):T {
  const state=salaryState(ledger),period=state.periods.find(p=>p.id===id);
  ensure(period&&JSON.stringify(period)===JSON.stringify(expected),"El período cambió. Vuelve a abrirlo.");
  ensure(reason.trim(),"Escribe el motivo de eliminación.");
  ensure(!state.payments.some(p=>!p.voidReason&&p.applications.some(a=>a.periodId===id)),"Este período tiene abonos vinculados. Corrígelos o anúlalos antes de eliminarlo.");
  return {...ledger,salary:{...state,periods:state.periods.filter(p=>p.id!==id),audit:audit(state,id,"Eliminar período",reason,period)}};
}

/** Correct a receipt and its allocations together. Used/assigned money cannot be silently removed. */
export function correctSalaryPayment<T extends SalaryLedger>(ledger:T,expected:SalaryPayment,changes:{amount:number;date:string;reference:string;notes:string;name?:string;applications:SalaryApplication[]},today:string,reason:string,remove=false):T {
  const state=salaryState(ledger),payment=state.payments.find(p=>p.id===expected.id&&!p.voidReason);
  ensure(payment&&JSON.stringify(payment)===JSON.stringify(expected),"El abono cambió. Vuelve a abrirlo.");
  ensure(reason.trim(),"Escribe el motivo de la corrección.");
  ensure(remove||(amountValid(changes.amount)&&changes.amount>0),"El importe debe ser entero y mayor que cero.");
  const date=payment.historical?salaryDay(changes.date):movementDay(changes.date);
  ensure((payment.historical||validMovementDate(changes.date))&&date<=salaryDay(today),"Selecciona la fecha real del cobro, igual o anterior a hoy.");
  let next:SalaryLedger={...ledger,salary:{...state,payments:state.payments.filter(p=>p.id!==payment.id)}};
  if(!remove)validateSalaryApplications(next,payment.configId,changes.applications,changes.amount,date);
  if(!payment.historical) {
    const movement=ledger.movements.find(m=>m.id===payment.movementId);
    ensure(movement&&salaryPaymentValid(ledger,payment),"El ingreso vinculado cambió; revísalo antes de corregirlo.");
    const trace=incomeDistribution(ledger,movement.id)!;
    const reduction=remove?payment.amount:payment.amount-changes.amount;
    const linked=ledger.movements.some(m=>m.incomeSources?.some(s=>s.incomeId===movement.id)||m.distributionCorrection?.incomeId===movement.id);
    ensure(reduction<=trace.unassigned,"El dinero que quieres retirar ya fue asignado o utilizado. Corrige primero su distribución.");
    if(remove)ensure(!linked&&!movement.allocations.length,"El ingreso tiene historial de asignaciones. Conserva su trazabilidad y corrige primero la vinculación.");
    if(changes.date!==payment.date)ensure(!linked&&!movement.allocations.length&&trace.unassigned===payment.amount,"La fecha de un ingreso utilizado o asignado requiere revisar sus movimientos dependientes.");
    const account=ledger.accounts.find(a=>a.id===payment.accountId&&a.active);
    ensure(account&&account.balance>=reduction,"La cuenta no tiene saldo suficiente para esta corrección.");
    next={...next,accounts:ledger.accounts.map(a=>a.id===payment.accountId?{...a,balance:a.balance-reduction}:a),movements:remove?ledger.movements.filter(m=>m.id!==movement.id):ledger.movements.map(m=>m.id===movement.id?{...m,name:changes.name?.trim()||m.name,amount:changes.amount,date:changes.date,reference:changes.reference,description:changes.notes}:m).sort((a,b)=>b.date.localeCompare(a.date))};
    ensure(totals(next).unassigned>=0,"La corrección dejaría más dinero asignado que dinero real.");
    if(changes.date!==payment.date)for(const other of ledger.movements.filter(m=>m.type==="Ingreso"&&m.id!==movement.id))ensure(incomeDistribution(ledger,other.id)?.unassigned===incomeDistribution(next,other.id)?.unassigned,"Esta fecha alteraría la trazabilidad de otros ingresos. Revisa primero los movimientos dependientes.");
  }
  if(!remove&&changes.reference.trim()&&!payment.historical)ensure(!state.payments.some(p=>p.id!==payment.id&&!p.historical&&salaryPaymentValid(ledger,p)&&p.configId===payment.configId&&p.date===changes.date&&p.amount===changes.amount&&p.accountId===payment.accountId&&normalizeSalaryName(p.reference)===normalizeSalaryName(changes.reference)&&JSON.stringify([...new Set(p.applications.map(a=>a.periodId))].sort())===JSON.stringify([...new Set(changes.applications.map(a=>a.periodId))].sort())),"Ya existe un ingreso con estos mismos datos.");
  const updated=remove?{...payment,voidReason:reason}:{...payment,amount:changes.amount,date:changes.date,reference:changes.reference,notes:changes.notes,applications:changes.applications.map(a=>({...a}))};
  return {...ledger,...next,salary:{...state,payments:state.payments.map(p=>p.id===payment.id?updated:p),audit:audit(state,payment.id,remove?"Anular cobro":"Corregir cobro",reason,{payment,movement:ledger.movements.find(m=>m.id===payment.movementId)})}};
}
