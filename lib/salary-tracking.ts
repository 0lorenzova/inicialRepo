import {canConfirmSalaryPeriod,salaryLocalToday,SALARY_NOT_FINISHED,salaryWorkEnd} from "./salary-dates";
import { totals, validMovementDate, type Ledger } from "./finance-ledger";
import { postDistributedIncome, type FundingSelection } from "./income-distribution";
import { incomeDistribution } from "./income-trace";
import { isoWeek } from "./iso-week";
import { movementDay } from "./finance-history";
import { previewPostponement } from "./finance-recurrence";
import {incomeReceptionMethods} from "./income-preferences";

export type SalaryPayRule = {kind:"last-day"}|{kind:"days-before";days:number}|{kind:"weekday";day:number};
export type SalaryConfig = {employmentStart?:string;employmentEnd?:string;payRule?:SalaryPayRule; id:string; employer:string; name:string; currency:"CRC"; base:number; frequency:"Semanal"|"Quincenal"|"Mensual"|"Otra"; intervalDays?:number; extraConcepts?:SalaryConcept[]; start:string; payOffset:number; calendarMode?:"iso-workdays"; workDays:number[]; active:boolean; remuneration?:"hour"|"day"|"week"|"fortnight"|"month"|"variable"; hourlyRate?:number; dailyRate?:number; hoursPerDay?:number; effectiveFrom?:string; termsHistory?:SalaryTerms[]; catalog?:SalaryCatalogConcept[]; catalogBase?:SalaryCatalogConcept[]; catalogHistory?:SalaryCatalogRevision[] };
export type SalaryTerms = Pick<SalaryConfig,"base"|"frequency"|"intervalDays"|"start"|"payOffset"|"calendarMode"|"workDays"|"remuneration"|"hourlyRate"|"dailyRate"|"hoursPerDay"|"payRule"> & {effectiveFrom:string};
export type SalaryQuantityUnit = "hour"|"day";
export type SalaryCatalogConcept = {id:string;name:string;sign:"add"|"subtract";usualAmount?:number;unit?:SalaryQuantityUnit;rate?:number;usualQuantity?:number;kind?:"salary"|"benefit"|"other";recurring?:boolean;active:boolean};
export type SalaryCatalogRevision = {effectiveFrom:string;items:SalaryCatalogConcept[]};
export type SalaryAdjustment = {id:string;catalogId?:string;name:string;amount:number;sign:"add"|"subtract";status:"estimated"|"confirmed";unit?:SalaryQuantityUnit;rate?:number;quantity?:number};
export type SalaryPeriodAdjustments = {configId:string;periodId:string;start:string;end:string;items:SalaryAdjustment[]};
export type SalaryConcept = { id:string; name:string; amount:number };
export type SalaryPeriod = { id:string; configId:string; start:string; end:string; payDate:string; earned:boolean; concepts:SalaryConcept[]; notes:string; source?:string; frequency?:SalaryConfig["frequency"]; workedDays?:string[]; scheduledWorkDays?:number[] };
export type SalaryApplication = { periodId:string; conceptId:string; amount:number };
export type SalaryPayment = { id:string; configId:string; movementId:string; amount:number; date:string; accountId:string; method:string; reference:string; notes:string; applications:SalaryApplication[]; voidReason?:string; historical?:{source:string;recordedAt:string} };
export type SalaryAudit = { id:string; date:string; action:string; entityId:string; reason:string; before?:unknown };
export type SalaryState = { configs:SalaryConfig[]; periods:SalaryPeriod[]; payments:SalaryPayment[]; audit:SalaryAudit[]; periodAdjustments?:SalaryPeriodAdjustments[]; viewMode?:"list"|"grid"; historyOrder?:"newest"|"oldest"; lastConfigId?:string; lastReceipt?:{method:string;accountId:string}; receiptDefaultsByConfig?:Record<string,{method:string;accountId:string}> };
export type SalaryLedger = Ledger & { salary?:SalaryState };
export const emptySalary = ():SalaryState => ({configs:[],periods:[],payments:[],audit:[]});
export const salaryState = (ledger:SalaryLedger) => ledger.salary ?? emptySalary();
function ensure(condition:unknown,message:string):asserts condition { if(!condition)throw new Error(message); }
const amountValid = (n:number) => Number.isSafeInteger(n)&&n>=0;
export function salaryMeasuredAmount(quantity:number,rate:number) {
  ensure(Number.isFinite(quantity)&&quantity>0&&Number.isInteger(quantity*4),"Indica una cantidad positiva en incrementos de 0,25.");
  ensure(amountValid(rate)&&rate>0,"Indica una tarifa entera mayor que cero.");
  const amount=quantity*rate;
  ensure(amountValid(amount),"La cantidad y la tarifa deben producir un importe entero en colones.");
  return amount;
}
export const normalizeSalaryName=(value:string)=>value.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("es");
export function salaryDay(day:string) { ensure(validMovementDate(`${day}T12:00`),"Selecciona una fecha válida.");return day; }
const salaryReceiptDay=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?salaryDay(value):salaryDay(movementDay(value));
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
export function salaryPeriodTotals(ledger:SalaryLedger,period:SalaryPeriod,today=salaryLocalToday()) {
  const projected=salaryExpected(ledger,period);
  const confirmed=period.earned&&canConfirmSalaryPeriod(period,today);
  const earned=confirmed?salaryExpected(ledger,period,true):0;
  const received=salaryReceived(ledger,period.id);
  const pending=confirmed?Math.max(0,earned-received):0;
  return {projected:confirmed?0:projected,earned,received,pending,status:!confirmed?(received>0?"Adelanto":"Proyectado"):pending===0?"Pagado":received>0?"Parcial":"Pendiente"};
}
export function saveSalaryConfig<T extends SalaryLedger>(ledger:T,requested:SalaryConfig,original:SalaryConfig|null):T {
  const state=salaryState(ledger),current=state.configs.find(c=>c.id===requested.id);
  ensure(original?JSON.stringify(current)===JSON.stringify(original):!current,"La configuración cambió. Vuelve a abrirla.");
  ensure(requested.id&&requested.employer.trim()&&requested.name.trim(),"Escribe el empleador y el nombre de la configuración.");
  ensure(!state.configs.some(c=>c.id!==requested.id&&normalizeSalaryName(c.employer)===normalizeSalaryName(requested.employer)&&normalizeSalaryName(c.name)===normalizeSalaryName(requested.name)),"Ya existe un ingreso con estos mismos datos.");
  ensure(requested.currency==="CRC"&&amountValid(requested.base)&&(requested.base>0||["hour","day","variable"].includes(requested.remuneration??"")),"Usa un salario en colones enteros mayor que cero. No se redondean centavos.");
  ensure(!requested.remuneration||["hour","day","week","fortnight","month","variable"].includes(requested.remuneration),"Revisa el tipo de remuneración.");
  if(requested.remuneration==="hour")ensure(amountValid(requested.hourlyRate??-1)&&requested.hourlyRate!>0&&Number.isFinite(requested.hoursPerDay)&&requested.hoursPerDay!>0&&requested.hoursPerDay!<=24,"Indica una tarifa por hora y una jornada habitual entre 0 y 24 horas.");
  if(requested.remuneration==="day")ensure(amountValid(requested.dailyRate??-1)&&requested.dailyRate!>0,"Indica la tarifa por día en colones enteros.");
  ensure(["Semanal","Quincenal","Mensual","Otra"].includes(requested.frequency),"Selecciona una frecuencia válida.");
  ensure(requested.frequency!=="Otra"||(Number.isInteger(requested.intervalDays)&&requested.intervalDays!>=1&&requested.intervalDays!<=366),"Indica una periodicidad de 1 a 366 días.");
  ensure((requested.extraConcepts??[]).every(c=>c.id&&c.name.trim()&&amountValid(c.amount))&&new Set((requested.extraConcepts??[]).map(c=>c.id)).size===(requested.extraConcepts??[]).length,"Revisa los conceptos adicionales de la configuración.");
  total([requested.base,...(requested.extraConcepts??[]).map(c=>c.amount)]);
  salaryDay(requested.start);
  if(requested.employmentStart)salaryDay(requested.employmentStart);
  if(requested.employmentEnd){salaryDay(requested.employmentEnd);ensure(requested.employmentEnd>=(requested.employmentStart??requested.start),"La finalización laboral no puede ser anterior al inicio.");}
  if(requested.payRule){
    const rule=requested.payRule;
    ensure(["last-day","days-before","weekday"].includes(rule.kind),"Selecciona una opción de pago válida.");
    if(rule.kind==="weekday")ensure(Number.isInteger(rule.day)&&rule.day>=0&&rule.day<=6,"Selecciona un día de lunes a domingo.");
    if(rule.kind==="days-before")ensure(Number.isInteger(rule.days)&&rule.days>=0&&rule.days<=6,"Indica de 0 a 6 días antes del cierre de la semana.");
  }
  ensure(Number.isInteger(requested.payOffset)&&requested.payOffset>=0&&requested.payOffset<=31,"La fecha habitual admite entre 0 y 31 días después del período.");
  ensure(requested.workDays.length>0&&new Set(requested.workDays).size===requested.workDays.length&&requested.workDays.every(d=>Number.isInteger(d)&&d>=0&&d<=6),"Selecciona los días laborales.");
  ensure(!requested.calendarMode||requested.calendarMode==="iso-workdays","Selecciona una regla de calendario válida.");
  const effectiveFrom=requested.effectiveFrom??(current?undefined:requested.start);
  if(effectiveFrom)salaryDay(effectiveFrom);
  const terms=(c:SalaryConfig):SalaryTerms=>({remuneration:c.remuneration,hourlyRate:c.hourlyRate,dailyRate:c.dailyRate,hoursPerDay:c.hoursPerDay,payRule:c.payRule,base:c.base,frequency:c.frequency,intervalDays:c.intervalDays,start:c.start,payOffset:c.payOffset,calendarMode:c.calendarMode,workDays:[...c.workDays],effectiveFrom:effectiveFrom!});
  const changed=Boolean(current&&JSON.stringify(terms(current))!==JSON.stringify(terms(requested)));
  if(changed){ensure(effectiveFrom,"Indica desde qué fecha entran en vigor las nuevas condiciones.");ensure(periodStartForDate(current!,effectiveFrom).start===effectiveFrom,"Selecciona el inicio de un período para cambiar condiciones; el prorrateo dentro del período está pendiente de definir.");}
  let history=current?.termsHistory??[];
  if(effectiveFrom&&(!current||changed||!history.length)) {
    ensure(!history.some(t=>t.effectiveFrom>=effectiveFrom),"La nueva vigencia debe ser posterior a las condiciones ya conservadas.");
    history=[...history,terms(requested)];
  }
  const config={...requested,effectiveFrom,termsHistory:history,name:requested.name.trim(),employer:requested.employer.trim()};
  return {...ledger,salary:{...state,periods:state.periods.map(p=>p.configId===requested.id&&current?{...p,frequency:p.frequency??current.frequency,scheduledWorkDays:p.scheduledWorkDays??[...current.workDays]}:p),configs:original?state.configs.map(c=>c.id===config.id?config:c):[...state.configs,config],audit:audit(state,config.id,"Configuración",original?"Cambios para próximos períodos; historia conservada":"Nueva configuración",original)}};
}
const previousDay = (day:string) => { const d=new Date(`${salaryDay(day)}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-1);return salaryDay(d.toISOString().slice(0,10)); };
const daysBetween=(from:string,to:string)=>Math.round((Date.parse(`${salaryDay(to)}T12:00:00Z`)-Date.parse(`${salaryDay(from)}T12:00:00Z`))/86400000);
export function shiftSalaryDate(value:string,amount:number,unit:"days"|"months"="days") {
  salaryDay(value);ensure(Number.isSafeInteger(amount),"El intervalo no es válido.");
  const d=new Date(`${value}T12:00:00Z`);
  if(unit==="months") { const anchor=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+amount);const end=new Date(d);end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);d.setUTCDate(Math.min(anchor,end.getUTCDate())); }
  else d.setUTCDate(d.getUTCDate()+amount);
  ensure(Number.isFinite(d.getTime())&&d.getUTCFullYear()>=1&&d.getUTCFullYear()<=9999,"La fecha queda fuera del rango permitido (años 1 a 9999).");
  return salaryDay(d.toISOString().slice(0,10));
}
function periodStartForDate(config:SalaryConfig,date:string) {
  if(config.frequency==="Semanal"&&config.calendarMode==="iso-workdays") {
    const start=shiftSalaryDate(date,-((new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7));
    return {start,next:shiftSalaryDate(start,7)};
  }
  if(config.frequency==="Mensual") {
    const monthDistance=(Number(date.slice(0,4))-Number(config.start.slice(0,4)))*12+Number(date.slice(5,7))-Number(config.start.slice(5,7));
    let index=monthDistance;
    let start=shiftSalaryDate(config.start,index,"months");
    if(start>date){index--;start=shiftSalaryDate(config.start,index,"months");}
    const next=shiftSalaryDate(config.start,index+1,"months");
    return {start,next};
  }
  const interval=config.frequency==="Semanal"?7:config.frequency==="Quincenal"?15:config.intervalDays??7;
  const index=Math.floor(daysBetween(config.start,date)/interval);
  const start=shiftSalaryDate(config.start,index*interval);
  const next=shiftSalaryDate(config.start,(index+1)*interval);
  return {start,next};
}
function projectedSalaryPeriod(config:SalaryConfig,start:string,next:string):SalaryPeriod {
  const end=previousDay(next),id=`salary-period:${config.id}:${start}`;
  let payBase=end;
  if(config.calendarMode==="iso-workdays") {
    for(let back=0;back<7;back++) {const day=shiftSalaryDate(end,-back);if(day<start)break;if(config.workDays.includes(new Date(`${day}T12:00:00Z`).getUTCDay())){payBase=day;break;}}
  }
  let base=config.base;
  if(config.remuneration==="hour"||config.remuneration==="day") {
    let days=0;for(let date=start;date<next;date=shiftSalaryDate(date,1))if(config.workDays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()))days++;
    base=days*(config.remuneration==="hour"?config.hourlyRate!*config.hoursPerDay!:config.dailyRate!);
    ensure(amountValid(base),"La tarifa y jornada producen fracciones de colón; ajusta las condiciones o utiliza un importe manual.");
  }
  let payDate=shiftSalaryDate(payBase,config.payOffset);
  if(config.payRule?.kind==="last-day")payDate=end;
  if(config.payRule?.kind==="days-before")payDate=shiftSalaryDate(end,-config.payRule.days);
  if(config.payRule?.kind==="weekday")payDate=shiftSalaryDate(end,-((new Date(`${end}T12:00:00Z`).getUTCDay()-config.payRule.day+7)%7));
  return {id,configId:config.id,start,end,payDate,earned:false,concepts:[{id:`${id}:salary`,name:"Salario",amount:base}],frequency:config.frequency,scheduledWorkDays:[...config.workDays],notes:""};
}
/** Returns the saved period when it exists, or a pure, unsaved projection for the date. */
export function salaryPeriodForDate(ledger:SalaryLedger,configId:string,date:string):SalaryPeriod {
  salaryDay(date);
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===configId);
  ensure(config,"Selecciona una configuración salarial.");
  const existing=state.periods.find(p=>p.configId===configId&&p.start<=date&&p.end>=date);
  if(existing)return existing;
  const applicable=salaryConfigAt(config,date)??config;
  const {start,next}=periodStartForDate(applicable,date);
  const scheduled=state.periods.find(p=>p.configId===configId&&p.start===start);
  if(scheduled)return scheduled;
  // Reuse a crossing historical reference instead of creating an overlapping obligation.
  const crossing=state.periods.filter(p=>p.configId===configId&&p.start<next&&p.end>=start)
    .sort((a,b)=>Math.min(Math.abs(daysBetween(a.start,date)),Math.abs(daysBetween(a.end,date)))-Math.min(Math.abs(daysBetween(b.start,date)),Math.abs(daysBetween(b.end,date)))||a.id.localeCompare(b.id))[0];
  if(crossing)return crossing;
  return projectedSalaryPeriod(applicable,start,next);
}
export function preferredSalaryConfigId(ledger:SalaryLedger) {
  const configs=salaryState(ledger).configs;
  const last=salaryState(ledger).lastConfigId;
  return configs.find(c=>c.id===last&&c.active)?.id??configs.find(c=>c.active)?.id??configs[0]?.id??"";
}
export function salaryTemporalLabel(ledger:SalaryLedger,period:SalaryPeriod,viewerDay:string) {
  salaryDay(viewerDay);
  if(period.start<=viewerDay&&period.end>=viewerDay)return "Hoy";
  const config=salaryState(ledger).configs.find(c=>c.id===period.configId);
  ensure(config,"Selecciona una configuración salarial.");
  const current=periodStartForDate(config,viewerDay).start;
  const target=periodStartForDate(config,period.start).start;
  const frequency=period.frequency??config.frequency;
  const difference=config.frequency==="Mensual"?(Number(target.slice(0,4))-Number(current.slice(0,4)))*12+Number(target.slice(5,7))-Number(current.slice(5,7)):
    Math.round(daysBetween(current,target)/(config.frequency==="Semanal"?7:config.frequency==="Quincenal"?15:config.intervalDays??7));
  // A shortened historical period can share an anchor with today without containing it.
  const offset=difference|| (period.end<viewerDay?-1:1);
  const unit=frequency==="Semanal"?"semana":frequency==="Quincenal"?"quincena":frequency==="Mensual"?"mes":"período";
  if(offset===-1)return unit==="mes"?"El mes pasado":unit==="período"?"El período pasado":`La ${unit} pasada`;
  if(offset===1)return unit==="mes"?"El próximo mes":unit==="período"?"El próximo período":`La próxima ${unit}`;
  const plural=unit==="mes"?"meses":`${unit}s`;
  return offset<0?`Hace ${Math.abs(offset)} ${plural}`:`Dentro de ${offset} ${plural}`;
}
export function adjacentSalaryPeriod(ledger:SalaryLedger,period:SalaryPeriod,direction:-1|1) {
  const config=salaryState(ledger).configs.find(c=>c.id===period.configId)!;
  const nextDate=direction>0&&config.frequency==="Semanal"&&config.calendarMode==="iso-workdays"?periodStartForDate(config,period.end).next:shiftSalaryDate(direction<0?period.start:period.end,direction);
  let next=salaryPeriodForDate(ledger,period.configId,nextDate);
  if(next.id===period.id){const bounds=periodStartForDate(config,direction<0?period.start:period.end);next=salaryPeriodForDate(ledger,period.configId,direction<0?shiftSalaryDate(bounds.start,-1):bounds.next);}
  ensure(next.id!==period.id,"No hay otro período en esta fecha.");return next;
}
export function salaryReceiptDefaults(ledger:SalaryLedger,configId?:string) {
  const state=salaryState(ledger),sourceDefault=configId?state.receiptDefaultsByConfig?.[configId]:undefined;
  const remembered=sourceDefault??state.lastReceipt;
  return {method:incomeReceptionMethods.some(m=>m===remembered?.method)?remembered!.method:"Transferencia",accountId:ledger.accounts.find(a=>a.active&&a.id===remembered?.accountId)?.id??""};
}
/** Read-only shortcut: skip settled history, including gaps without saved rows. */
export function latestSalaryPeriodPending(ledger:SalaryLedger,configId:string,today:string) {
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===configId);
  if(!config)return null;
  let period=salaryPeriodForDate(ledger,configId,today);
  // At most each saved settled row plus the first unsaved reference is visited.
  for(let i=0;i<=state.periods.filter(p=>p.configId===configId).length+1;i++) {
    if(salaryWorkEnd(period)<today&&salaryPeriodRemaining(ledger,period)>0)return period;
    if(period.start<=config.start)return null;
    period=adjacentSalaryPeriod(ledger,period,-1);
    if(period.end<config.start)return null;
  }
  return null;
}
export function salaryPaymentDuplicate(ledger:SalaryLedger,input:{configId:string;date:string;amount:number;accountId:string;reference:string;applications:SalaryApplication[]},excludeId?:string) {
  const key=(items:SalaryApplication[])=>JSON.stringify(items.map(a=>[a.periodId,a.conceptId,a.amount]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))||String(a[1]).localeCompare(String(b[1]))));
  return salaryState(ledger).payments.some(p=>p.id!==excludeId&&!p.historical&&salaryPaymentValid(ledger,p)&&p.configId===input.configId&&p.date===input.date&&p.amount===input.amount&&p.accountId===input.accountId&&key(p.applications)===key(input.applications)&&normalizeSalaryName(p.reference)===normalizeSalaryName(input.reference));
}
export function generateSalaryPeriods<T extends SalaryLedger>(ledger:T,configId:string,count:number):T {
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===configId&&c.active);
  ensure(config,"Selecciona una configuración salarial activa.");
  ensure(Number.isInteger(count)&&count>0&&count<=24,"Genera entre 1 y 24 períodos por operación.");
  const existing=state.periods.filter(p=>p.configId===configId).sort((a,b)=>b.end.localeCompare(a.end));
  let start=existing.length?previewPostponement(existing[0].end,{unit:"days",amount:1}):config.start;
  if(start<config.start)start=config.start;
  if(config.frequency==="Semanal"&&config.calendarMode==="iso-workdays") {const aligned=periodStartForDate(config,start).start;start=existing.length&&aligned<start?shiftSalaryDate(aligned,7):aligned;}
  const periods=[...state.periods];
  for(let i=0;i<count;i++) {
    const next=previewPostponement(start,{unit:config.frequency==="Mensual"?"months":"days",amount:config.frequency==="Mensual"?1:config.frequency==="Semanal"?7:config.frequency==="Otra"?config.intervalDays!:15},Number(config.start.slice(8)));
    const end=previousDay(next);
    ensure(!periods.some(p=>p.configId===configId&&p.start<=end&&p.end>=start),"El período se superpone con otro existente.");
    periods.push(projectedSalaryPeriod(config,start,next));
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
  ensure(!requested.earned||canConfirmSalaryPeriod(requested,today),SALARY_NOT_FINISHED);
  ensure(!requested.scheduledWorkDays||(requested.scheduledWorkDays.length>0&&new Set(requested.scheduledWorkDays).size===requested.scheduledWorkDays.length&&requested.scheduledWorkDays.every(d=>Number.isInteger(d)&&d>=0&&d<=6)),"Revisa los días laborales guardados del período.");
  ensure(new Set(requested.workedDays??[]).size===(requested.workedDays??[]).length,"No repitas días trabajados.");
  ensure((requested.workedDays??[]).every(day=>salaryDay(day)>=requested.start&&day<=requested.end&&day<=today),"Un día trabajado debe estar dentro del período y no ser futuro.");
  ensure(!state.periods.some(p=>p.id!==requested.id&&p.configId===requested.configId&&p.start<=requested.end&&p.end>=requested.start),"El período se superpone con otro existente.");
  ensure(requested.concepts.length>0&&new Set(requested.concepts.map(c=>c.id)).size===requested.concepts.length,"Revisa los conceptos del período.");
  ensure(requested.concepts.every(c=>c.id&&c.name.trim()&&amountValid(c.amount)),"Los conceptos necesitan nombre e importe en colones enteros, sin valores negativos.");
  total(requested.concepts.map(c=>c.amount));
  for(const c of current?.concepts??[]) {
    const paid=salaryConceptPaid(ledger,requested.id,c.id),replacement=requested.concepts.find(x=>x.id===c.id);
    ensure(!paid||((requested.earned||!current?.earned||!canConfirmSalaryPeriod(current,today))&&replacement&&replacement.amount>=paid),"No puedes retirar un concepto pagado ni reducirlo por debajo de sus abonos. Revisa primero las vinculaciones.");
  }
  const value={...requested,frequency:requested.frequency??state.configs.find(c=>c.id===requested.configId)?.frequency,concepts:requested.concepts.map(c=>({...c,name:c.name.trim()}))};
  return {...ledger,salary:{...state,periods:original?state.periods.map(p=>p.id===value.id?value:p):[...state.periods,value],audit:audit(state,value.id,"Guardar período",reason.trim(),original)}};
}
/** Explicitly recognize a past salary obligation without receiving or distributing money. */
export function activateSalaryPeriod<T extends SalaryLedger>(ledger:T,requested:SalaryPeriod,today:string):T {
  const period=salaryPeriodForDate(ledger,requested.configId,requested.start);
  const original=salaryState(ledger).periods.find(p=>p.id===period.id)??null;
  ensure(period.id===requested.id,"La semana cambió. Vuelve a seleccionarla.");
  if(original?.earned)return ledger;
  ensure(JSON.stringify(period)===JSON.stringify(requested),"Los datos de la semana cambiaron. Revísalos antes de activar.");
  ensure(salaryPeriodPresentation(ledger,period,today).historicalEmpty,"Solo puedes activar una semana pasada sin pagos ni obligación confirmada.");
  ensure(salaryHistoricalEstimate(ledger,period)!==null,"Configura las condiciones salariales vigentes de esta semana antes de activarla.");
  ensure(salaryExpected(ledger,period,true)>0,"El importe confirmado debe ser mayor que cero para activar el pendiente.");
  return saveSalaryPeriod(ledger,{...period,earned:true},original,today,"El usuario activó la semana como salario pendiente; no registra un ingreso.");
}
export type SalaryPaymentInput = { id:string; configId:string; date:string; amount:number; accountId:string; method:string; reference:string; notes:string; name?:string; applications:SalaryApplication[]; existingMovementId?:string; manual?:Record<string,string>; selections?:FundingSelection[]; allowAdvance?:boolean; preparedPeriod?:SalaryPeriod };
export function salaryPeriodApplications(ledger:SalaryLedger,configId:string,periodId:string,amount:number,advanceDate?:string):SalaryApplication[] {
  void advanceDate;
  const period=salaryState(ledger).periods.find(p=>p.id===periodId&&p.configId===configId);
  ensure(period,"Selecciona un período salarial.");
  ensure(amountValid(amount)&&amount>0,"Escribe un importe entero mayor que cero.");
  ensure(amount<=salaryPeriodRemaining(ledger,period),"El ingreso supera el importe esperado restante del período.");
  let remaining=amount;
  const applications=salaryPaymentConcepts(ledger,period).flatMap(c=>{const applied=Math.min(remaining,c.amount-salaryConceptPaid(ledger,period.id,c.id));if(applied<=0)return [];remaining-=applied;return [{periodId:period.id,conceptId:c.id,amount:applied}];});
  ensure(remaining===0,"El ingreso supera el saldo pendiente del período seleccionado.");
  return applications;
}
function validateSalaryApplications(ledger:SalaryLedger,configId:string,applications:SalaryApplication[],amount:number) {
  const state=salaryState(ledger);
  ensure(applications.length>0&&new Set(applications.map(a=>`${a.periodId}:${a.conceptId}`)).size===applications.length,"Selecciona los conceptos sin repetirlos.");
  for(const a of applications) {
    const p=state.periods.find(p=>p.id===a.periodId&&p.configId===configId),c=p?salaryPaymentConcepts(ledger,p).find(c=>c.id===a.conceptId):undefined;
    ensure(c&&amountValid(a.amount)&&a.amount>0&&a.amount<=c.amount-salaryConceptPaid(ledger,a.periodId,a.conceptId),"Una aplicación supera la deuda pendiente o el período no está devengado.");
  }
  for(const id of new Set(applications.map(a=>a.periodId))) {
    const p=state.periods.find(p=>p.id===id)!;
    ensure(total(applications.filter(a=>a.periodId===id).map(a=>a.amount))<=salaryPeriodRemaining(ledger,p),"El abono supera el importe esperado restante del período.");
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
  let prepared:SalaryLedger=ledger;
  const initialState=salaryState(ledger);
  const missingPeriods=[...new Set(input.applications.map(a=>a.periodId))].filter(id=>!initialState.periods.some(p=>p.id===id));
  if(missingPeriods.length) {
    ensure(input.preparedPeriod&&missingPeriods.length===1&&missingPeriods[0]===input.preparedPeriod.id&&input.preparedPeriod.configId===input.configId,"El período de este salario ya no está disponible. Vuelve a seleccionarlo.");
    prepared=saveSalaryPeriod(ledger,input.preparedPeriod,null,today,"Proyección creada al registrar el ingreso salarial");
  }
  const state=salaryState(prepared),config=state.configs.find(c=>c.id===input.configId);
  ensure(config,"Selecciona un empleador.");
  ensure(input.id&&!state.payments.some(p=>p.id===input.id),"Ya existe un ingreso con estos mismos datos.");
  ensure(amountValid(input.amount)&&input.amount>0,"El abono debe ser un importe entero mayor que cero.");
  ensure(validMovementDate(input.date)&&input.date.slice(0,10)<=salaryDay(today),"Selecciona la fecha real del cobro, no una fecha futura.");
  validateSalaryApplications(prepared,config.id,input.applications,input.amount);
  if(!input.existingMovementId)ensure(!salaryPaymentDuplicate(prepared,input),"Ya existe un ingreso con estos mismos datos.");
  const movementId=input.existingMovementId||`salary-income:${input.id}`;
  ensure(!state.payments.some(p=>!p.voidReason&&p.movementId===movementId),"Ya existe un ingreso con estos mismos datos.");
  let next:Ledger=prepared;
  if(input.existingMovementId) {
    const m=ledger.movements.find(m=>m.id===movementId);
    ensure(m&&m.type==="Ingreso"&&m.amount===input.amount&&m.date===input.date&&m.accountId===input.accountId,"El ingreso cambió. Selecciónalo otra vez y revisa su monto, cuenta y fecha.");
    ensure(!Object.values(input.manual??{}).some(v=>Number(v)>0)&&!input.selections?.length,"El ingreso existente conserva su distribución; puedes ajustarla desde su detalle.");
  } else {
    next=postDistributedIncome(ledger,{id:movementId,amount:input.amount,date:input.date,accountId:input.accountId,name:input.name?.trim()||`Salario · ${config.employer}`,category:"Salario",paymentMethod:input.method,reference:input.reference,description:input.notes},today,input.manual??{},input.selections??[]);
  }
  const linked=next.movements.find(m=>m.id===movementId)!;
  const payment:SalaryPayment={id:input.id,configId:config.id,movementId,amount:input.amount,date:input.date,accountId:input.accountId,method:linked.paymentMethod??"Sin especificar",reference:linked.reference??"",notes:input.notes,applications:input.applications.map(a=>({...a}))};
  const receiptDefaultsByConfig={...(state.receiptDefaultsByConfig??{}),[config.id]:{method:payment.method,accountId:payment.accountId}};
  return {...ledger,...next,salary:{...state,payments:[...state.payments,payment],lastConfigId:config.id,lastReceipt:{method:payment.method,accountId:payment.accountId},receiptDefaultsByConfig,audit:audit(state,payment.id,"Registrar pago salarial",input.existingMovementId?"Ingreso existente vinculado; sin duplicar dinero":"Ingreso y aplicaciones guardados juntos")}};
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
export const salaryPeriodRemaining=(ledger:SalaryLedger,p:SalaryPeriod)=>Math.max(0,salaryExpected(ledger,p)-salaryReceived(ledger,p.id));
export function salaryPeriodPaymentLabel(ledger:SalaryLedger,period:SalaryPeriod) {
  const payments=salaryState(ledger).payments.filter(payment=>salaryPaymentValid(ledger,payment)&&payment.applications.some(application=>application.periodId===period.id));
  if(!payments.length)return "Sin pagos";
  if(payments.length===1&&total(payments[0].applications.filter(application=>application.periodId===period.id).map(application=>application.amount))>=salaryExpected(ledger,period))return "Pago completo";
  return `${payments.length} abono${payments.length===1?"":"s"}`;
}
/** A receipt remains identifiable as an advance after the period is confirmed. */
export function salaryPeriodPresentation(ledger:SalaryLedger,period:SalaryPeriod,today:string) {
  const amounts=salaryPeriodTotals(ledger,period,today);
  const confirmed=period.earned&&canConfirmSalaryPeriod(period,today);
  const payments=salaryState(ledger).payments.filter(p=>salaryPaymentValid(ledger,p)&&p.applications.some(a=>a.periodId===period.id));
  const expected=salaryExpected(ledger,period);
  const amountFor=(payment:SalaryPayment)=>total(payment.applications.filter(a=>a.periodId===period.id).map(a=>a.amount));
  const early=total(payments.filter(p=>salaryReceiptDay(p.date)<period.payDate).map(amountFor));
  const workEnd=salaryWorkEnd(period);
  const laborAdvances=total(payments.filter(p=>salaryReceiptDay(p.date)<=workEnd).map(amountFor));
  const late=total(payments.filter(p=>salaryReceiptDay(p.date)>period.payDate).map(amountFor));
  const remaining=Math.max(0,expected-amounts.received);
  const overdue=(confirmed?amounts.pending>0:amounts.received>0&&remaining>0)&&period.payDate<today;
  const overdueDays=overdue?daysBetween(period.payDate,today):0;
  const overdueLabel=overdueDays?`${overdueDays} ${overdueDays===1?"día":"días"} de atraso`:"";
  const fullyPaid=expected>0&&amounts.received>=expected;
  const workState=period.start>today?"Aún no comienza":today<=workEnd?"En curso":"Jornada prevista finalizada";
  const config=salaryState(ledger).configs.find(c=>c.id===period.configId);
  const estimateKnown=Boolean(salaryHistoricalEstimate(ledger,period))||Boolean(config&&period.start>=today&&period.start>=config.start&&!config.termsHistory?.length&&(!config.employmentStart||period.start>=config.employmentStart)&&(!config.employmentEnd||period.end<=config.employmentEnd));
  const noRecords=!payments.length&&!confirmed;
  const historicalEmpty=noRecords&&period.end<today;
  const state=noRecords&&period.start<=today?"Sin registros":fullyPaid?"Completamente pagado":amounts.received>0?"Parcialmente pagado":overdue?"Pendiente vencido":period.start>today?"Proyectado":today<=workEnd?"En curso":"Pendiente de pago";
  const tone=fullyPaid?"paid":amounts.received>0?"partial":confirmed&&overdue?"overdue":"neutral";
  return {...amounts,expected,remaining,confirmed,fullyPaid,noRecords,historicalEmpty,estimateKnown,early,late,advances:early,laborAdvances,hasAdvance:early>0||laborAdvances>0,workEnd,overdue,overdueDays,overdueLabel,workState,state,tone,paymentCount:payments.length};
}
export function salaryPaymentTiming(period:SalaryPeriod,receivedAt:string) {
  const receivedDay=salaryReceiptDay(receivedAt);
  const days=daysBetween(period.payDate,receivedDay);
  const laborAdvance=receivedDay<=salaryWorkEnd(period);
  const paymentLabel=days<0?`Pagado ${Math.abs(days)} ${Math.abs(days)===1?"día":"días"} por adelantado`:days>0?`Pagado ${days} ${days===1?"día":"días"} de atraso`:"Pagado en la fecha prevista";
  return {days,laborAdvance,label:`${paymentLabel}${laborAdvance?" · Adelanto laboral":""}`,kind:days<0?"early" as const:days>0?"late" as const:"on-time" as const};
}
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
  if(!remove&&(changes.amount!==payment.amount||JSON.stringify(changes.applications)!==JSON.stringify(payment.applications)))validateSalaryApplications(next,payment.configId,changes.applications,changes.amount);
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
  if(!remove&&!payment.historical)ensure(!salaryPaymentDuplicate(ledger,{...changes,configId:payment.configId,accountId:payment.accountId},payment.id),"Ya existe un ingreso con estos mismos datos.");
  const updated=remove?{...payment,voidReason:reason}:{...payment,amount:changes.amount,date:changes.date,reference:changes.reference,notes:changes.notes,applications:changes.applications.map(a=>({...a}))};
  return {...ledger,...next,salary:{...state,payments:state.payments.map(p=>p.id===payment.id?updated:p),audit:audit(state,payment.id,remove?"Anular cobro":"Corregir cobro",reason,{payment,movement:ledger.movements.find(m=>m.id===payment.movementId)})}};
}


export function salaryConfigAt(config:SalaryConfig,date:string):SalaryConfig|null {
  const terms=[...(config.termsHistory??[])].filter(t=>t.effectiveFrom<=date).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  return terms?{...config,payRule:undefined,...terms}:null;
}
export function salaryReceived(ledger:SalaryLedger,periodId:string) {
  return total(salaryState(ledger).payments.filter(p=>salaryPaymentValid(ledger,p)).flatMap(p=>p.applications.filter(a=>a.periodId===periodId).map(a=>a.amount)));
}
export function salaryAdjustments(ledger:SalaryLedger,period:SalaryPeriod) {
  const state=salaryState(ledger),saved=state.periodAdjustments?.find(a=>a.configId===period.configId&&a.periodId===period.id);
  if(saved)return saved.items;
  const config=state.configs.find(c=>c.id===period.configId);
  if(!config)return [];
  return salaryCatalogAt(config,period.start).filter(c=>c.active&&c.recurring).flatMap(c=>{
    let amount=c.usualAmount;
    if(c.unit&&c.rate&&c.usualQuantity!==undefined)try{amount=salaryMeasuredAmount(c.usualQuantity,c.rate);}catch{return [];}
    if(amount===undefined||!amountValid(amount))return [];
    return [{id:`catalog-recurring:${c.id}`,catalogId:c.id,name:c.name,amount,sign:c.sign,status:"estimated" as const,...(c.unit&&c.rate&&c.usualQuantity!==undefined?{unit:c.unit,rate:c.rate,quantity:c.usualQuantity}:{})}];
  });
}
export function salaryExpected(ledger:SalaryLedger,period:SalaryPeriod,confirmedOnly=false) {
  return total([...period.concepts.map(c=>c.amount),...salaryAdjustments(ledger,period).filter(a=>!confirmedOnly||a.status==="confirmed").map(a=>a.sign==="subtract"?-a.amount:a.amount)]);
}
export function salaryPaymentConcepts(ledger:SalaryLedger,period:SalaryPeriod):SalaryConcept[] {
  return [...period.concepts,...salaryAdjustments(ledger,period).filter(a=>a.sign==="add").map(a=>({id:`adjustment:${a.id}`,name:a.name,amount:a.amount}))];
}
export function salaryBatchCandidates(ledger:SalaryLedger,configId:string,from:string,to:string,today:string) {
  salaryDay(from);salaryDay(to);salaryDay(today);
  if(from>to)return [];
  return salaryState(ledger).periods.filter(period=>period.configId===configId&&period.start>=from&&period.end<=to).sort((a,b)=>b.start.localeCompare(a.start)).flatMap(period=>{
    const view=salaryPeriodPresentation(ledger,period,today);
    if(!period.earned||!view.confirmed||!view.estimateKnown||view.paymentCount>0||view.received>0||view.pending<=0||salaryExpected(ledger,period)!==salaryExpected(ledger,period,true))return [];
    let remaining=view.pending;
    const applications:SalaryApplication[]=[];
    for(const concept of salaryPaymentConcepts(ledger,period)){
      const available=concept.amount-salaryConceptPaid(ledger,period.id,concept.id),amount=Math.min(remaining,available);
      if(amount>0){applications.push({periodId:period.id,conceptId:concept.id,amount});remaining-=amount;}
    }
    if(remaining!==0||!applications.length)return [];
    return [{period,amount:view.pending,applications}];
  });
}
export function salaryCatalog(config:SalaryConfig):SalaryCatalogConcept[] {
  return config.catalog??(config.extraConcepts??[]).map(c=>({id:c.id,name:c.name,sign:"add",usualAmount:c.amount,active:true}));
}
export function salaryCatalogAt(config:SalaryConfig,date:string):SalaryCatalogConcept[] {
  salaryDay(date);
  const history=config.catalogHistory??[],revision=history.filter(h=>h.effectiveFrom<=date).sort((a,b)=>b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  return revision?.items??(history.length?config.catalogBase??[]:salaryCatalog(config));
}
export function salaryCatalogNextEffectiveFrom(config:SalaryConfig,today:string):string {
  salaryDay(today);
  const latest=(config.catalogHistory??[]).map(h=>h.effectiveFrom).sort().at(-1);
  const anchor=latest&&latest>today?latest:today;
  return periodStartForDate(config,anchor).next;
}
export function saveSalaryCatalog<T extends SalaryLedger>(ledger:T,configId:string,items:SalaryCatalogConcept[],original:SalaryCatalogConcept[],effectiveFrom:string,today:string):T {
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===configId);
  ensure(config&&JSON.stringify(salaryCatalog(config))===JSON.stringify(original),"El catálogo cambió. Vuelve a abrirlo.");
  ensure(new Set(items.map(c=>c.id)).size===items.length&&new Set(items.map(c=>normalizeSalaryName(c.name))).size===items.length,"No repitas conceptos en el catálogo.");
  const validItems=items.every(c=>{
    const commonValid=Boolean(c.id&&c.name.trim()&&(c.sign==="add"||c.sign==="subtract")&&typeof c.active==="boolean"&&(c.usualAmount===undefined||amountValid(c.usualAmount)));
    const measurementValid=!c.unit?c.rate===undefined&&c.usualQuantity===undefined:(c.unit==="hour"||c.unit==="day")&&c.usualAmount===undefined&&amountValid(c.rate??-1)&&(c.rate??0)>0&&(c.usualQuantity===undefined||salaryMeasuredAmount(c.usualQuantity,c.rate!))&&c.kind!=="benefit";
    const recurringValid=!c.recurring||(c.kind!=="benefit"&&(c.unit?c.usualQuantity!==undefined:c.usualAmount!==undefined));
    return commonValid&&measurementValid&&recurringValid;
  });
  ensure(validItems,"Revisa los importes y la cantidad habitual de los conceptos recurrentes. Los beneficios no admiten reglas recurrentes ni cantidades por hora o día.");
  const normalized=items.map(i=>({...i,name:i.name.trim()}));
  if(JSON.stringify(normalized)===JSON.stringify(original))return ledger;
  salaryDay(effectiveFrom);salaryDay(today);
  ensure(effectiveFrom>=today,"Los cambios del catálogo deben empezar hoy o después.");
  const effectiveStart=periodStartForDate(config,effectiveFrom).start,currentStart=periodStartForDate(config,today).start;
  ensure(effectiveStart>currentStart,"Los cambios del catálogo se aplican desde el próximo período para conservar las estimaciones anteriores.");
  const latest=(config.catalogHistory??[]).map(h=>h.effectiveFrom).sort().at(-1);
  ensure(!latest||effectiveStart>latest,"La vigencia del catálogo debe ser posterior a la última versión guardada.");
  const base=config.catalogBase??((config.catalogHistory?.length??0)>0?undefined:salaryCatalog(config).map(c=>({...c,recurring:false})));
  const catalogHistory=[...(config.catalogHistory??[]),{effectiveFrom:effectiveStart,items:normalized.map(c=>({...c}))}];
  return {...ledger,salary:{...state,configs:state.configs.map(c=>c.id===configId?{...c,catalog:normalized,catalogBase:base,catalogHistory}:c),audit:audit(state,configId,"Catálogo salarial",`Nueva versión vigente desde ${effectiveStart}; las semanas anteriores conservan su referencia`,original)}};
}
export function saveSalaryAdjustments<T extends SalaryLedger>(ledger:T,period:SalaryPeriod,items:SalaryAdjustment[],original:SalaryAdjustment[]):T {
  const state=salaryState(ledger);
  ensure(state.configs.some(c=>c.id===period.configId),"La fuente salarial no existe.");
  ensure(JSON.stringify(salaryAdjustments(ledger,period))===JSON.stringify(original),"Los ajustes cambiaron. Vuelve a abrirlos.");
  ensure(new Set(items.map(a=>a.id)).size===items.length,"No repitas ajustes.");
  const catalogIds=items.flatMap(a=>a.catalogId?[a.catalogId]:[]);
  ensure(new Set(catalogIds).size===catalogIds.length,"Este concepto ya está incluido en la semana.");
  ensure(items.every(a=>a.id&&a.name.trim()&&amountValid(a.amount)&&(a.sign==="add"||a.sign==="subtract")&&(a.status==="estimated"||a.status==="confirmed")&&(!a.unit?a.rate===undefined&&a.quantity===undefined:(a.unit==="hour"||a.unit==="day")&&a.rate!==undefined&&a.quantity!==undefined&&a.amount===salaryMeasuredAmount(a.quantity,a.rate))),"Revisa el nombre, importe, cantidad y estado de los ajustes.");
  const current=salaryPeriodForDate(ledger,period.configId,period.start);
  ensure(current.id===period.id&&current.end===period.end,"La referencia cambió. Vuelve a seleccionar la semana.");
  const entry={configId:period.configId,periodId:period.id,start:period.start,end:period.end,items:items.map(a=>({...a,name:a.name.trim()}))};
  const periodAdjustments=[...(state.periodAdjustments??[]).filter(a=>!(a.configId===period.configId&&a.periodId===period.id)),entry];
  const next={...ledger,salary:{...state,periodAdjustments,audit:audit(state,period.id,"Ajustes salariales","Solo planificación; no registra dinero ni confirma deuda",original)}};
  salaryExpected(next,current);salaryExpected(next,current,true);
  return next;
}
export function salaryHistoricalEstimate(ledger:SalaryLedger,period:SalaryPeriod) {
  const config=salaryState(ledger).configs.find(c=>c.id===period.configId);
  const saved=salaryState(ledger).periods.find(p=>p.id===period.id);
  if(saved)return {amount:salaryExpected(ledger,saved),basis:"Condiciones e importes conservados en la referencia histórica."};
  const applicable=config&&salaryConfigAt(config,period.start);
  if(config&&((config.employmentStart&&period.start<config.employmentStart)||(config.employmentEnd&&period.end>config.employmentEnd)))return null;
  if(!config||!applicable||(config.termsHistory??[]).some(t=>t.effectiveFrom>period.start&&t.effectiveFrom<=period.end))return null;
  return {amount:salaryExpected(ledger,period),basis:`Salario base y jornada habitual configurados desde ${applicable.effectiveFrom}. No acredita horas efectivamente trabajadas.`};
}
