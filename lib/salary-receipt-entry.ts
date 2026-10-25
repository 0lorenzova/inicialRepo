import {canConfirmSalaryPeriod} from "./salary-dates";
import {incomeReceptionMethods} from "./income-preferences";
import {normalizeSalaryName,postSalaryPayment,salaryAdjustments,salaryConceptPaid,salaryExpected,salaryPaymentValid,salaryPeriodForDate,salaryPeriodLabel,salaryPeriodPresentation,salaryReceived,salaryState,saveSalaryAdjustments,saveSalaryPeriod,type SalaryAdjustment,type SalaryApplication,type SalaryLedger,type SalaryPeriod,type SalaryReceiptBreakdown} from "./salary-tracking";

export type ReceiptConcept = {id:string;name:string;amount:number;sign:"add"|"subtract";existingAdjustmentId?:string};
export type SalaryReceiptEntry = {
  id:string;period:SalaryPeriod;originalAdjustments:SalaryAdjustment[];salaryAmount:number;concepts:ReceiptConcept[];
  date:string;accountId:string;method:string;reference:string;notes:string;
  historicalExpected?:number;
};
const requireValue=(condition:unknown,message:string)=>{if(!condition)throw new Error(message);};
const wholeAmount=(value:number)=>Number.isSafeInteger(value)&&value>=0;

/** A link to an unsaved ISO week must not silently fall back to today's week. */
export function resolveSalaryReceiptPeriod(ledger:SalaryLedger,configId:string,periodId:string|undefined,day:string) {
  if(!periodId)return salaryPeriodForDate(ledger,configId,day);
  const saved=salaryState(ledger).periods.find(period=>period.id===periodId&&period.configId===configId);
  if(saved)return saved;
  const prefix=`salary-period:${configId}:`,date=periodId.startsWith(prefix)?periodId.slice(prefix.length):"";
  requireValue(/^\d{4}-\d{2}-\d{2}$/.test(date),"La semana seleccionada ya no está disponible. Vuelve a seleccionarla.");
  const period=salaryPeriodForDate(ledger,configId,date);
  requireValue(period.id===periodId,"La semana seleccionada cambió. Vuelve a seleccionarla.");
  return period;
}

export function salaryReceiptNet(salaryAmount:number,concepts:readonly Pick<ReceiptConcept,"amount"|"sign">[]) {
  return salaryAmount+concepts.reduce((sum,item)=>sum+(item.sign==="subtract"?-item.amount:item.amount),0);
}

/** Compose the existing period, adjustment and income operations into one immutable save.
 * Opening/editing the form never invokes this operation or persists a projection.
 */
export function postSalaryReceiptEntry<T extends SalaryLedger>(ledger:T,input:SalaryReceiptEntry,today:string):T {
  const state=salaryState(ledger),config=state.configs.find(item=>item.id===input.period.configId);
  requireValue(config,"Selecciona una configuración salarial.");
  requireValue(!state.payments.some(payment=>payment.id===input.id),"Este pago ya se registró.");
  const current=salaryPeriodForDate(ledger,input.period.configId,input.period.start);
  requireValue(JSON.stringify(current)===JSON.stringify(input.period),"La semana cambió mientras registrabas el pago. Cierra y vuelve a abrir el formulario.");
  const original=salaryAdjustments(ledger,current);
  requireValue(JSON.stringify(original)===JSON.stringify(input.originalAdjustments),"Los conceptos de la semana cambiaron. Cierra y vuelve a abrir el formulario.");
  requireValue(wholeAmount(input.salaryAmount),"El salario debe ser un importe entero en colones, mayor o igual que cero.");
  requireValue(input.concepts.every(item=>item.id&&item.name.trim()&&wholeAmount(item.amount)&&item.amount>0&&(item.sign==="add"||item.sign==="subtract")),"Cada concepto necesita nombre, naturaleza e importe entero mayor que cero.");
  requireValue(new Set(input.concepts.map(item=>item.id)).size===input.concepts.length,"No repitas conceptos en el pago.");
  requireValue(new Set(input.concepts.map(item=>normalizeSalaryName(item.name))).size===input.concepts.length,"Utiliza un nombre distinto para cada concepto del pago.");
  const amount=salaryReceiptNet(input.salaryAmount,input.concepts);
  requireValue(wholeAmount(amount)&&amount>0,"El total neto debe ser un importe entero mayor que cero.");
  requireValue(ledger.accounts.some(account=>account.id===input.accountId&&account.active),"Selecciona una cuenta receptora activa.");
  requireValue(incomeReceptionMethods.includes(input.method as typeof incomeReceptionMethods[number]),"Selecciona un medio de recepción válido.");

  const historicalEmpty=salaryPeriodPresentation(ledger,current,today).historicalEmpty&&!state.periods.some(period=>period.id===current.id);
  if(historicalEmpty)requireValue(input.historicalExpected!==undefined&&wholeAmount(input.historicalExpected)&&input.historicalExpected>=input.salaryAmount,"Indica el salario esperado real de esa semana para distinguir el pago completo de un abono.");
  const period:SalaryPeriod=historicalEmpty?{...current,concepts:[{id:current.concepts[0].id,name:"Salario",amount:input.historicalExpected!}],earned:canConfirmSalaryPeriod(current,today)}:{...current};
  const adjustments=[...original];
  const extraApplications:SalaryApplication[]=[];
  const breakdown:SalaryReceiptBreakdown={salaryAmount:input.salaryAmount,concepts:[]};
  for(const item of input.concepts){
    const existing=item.existingAdjustmentId?original.find(adjustment=>adjustment.id===item.existingAdjustmentId):undefined;
    if(item.existingAdjustmentId){
      requireValue(existing&&existing.sign==="add"&&item.sign==="add"&&existing.name===item.name,"El concepto seleccionado cambió. Vuelve a seleccionarlo.");
      requireValue(item.amount<=existing!.amount-salaryConceptPaid(ledger,period.id,`adjustment:${existing!.id}`),"El concepto supera su importe pendiente.");
    }else{
      requireValue(!original.some(adjustment=>normalizeSalaryName(adjustment.name)===normalizeSalaryName(item.name)),"Ese concepto ya existe en la semana. Selecciónalo entre los conceptos existentes o utiliza un nombre distinto.");
      requireValue(!original.some(adjustment=>adjustment.id===item.id),"El concepto ya se registró.");
      adjustments.push({id:item.id,name:item.name.trim(),amount:item.amount,sign:item.sign,status:"confirmed"});
    }
    const adjustmentId=existing?.id??item.id;
    breakdown.concepts.push({adjustmentId,name:existing?.name??item.name.trim(),amount:item.amount,sign:item.sign});
    if(item.sign==="add")extraApplications.push({periodId:period.id,conceptId:`adjustment:${adjustmentId}`,amount:item.amount});
  }
  const signature=(value:SalaryReceiptBreakdown)=>JSON.stringify([value.salaryAmount,value.concepts.map(item=>[normalizeSalaryName(item.name),item.sign,item.amount]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);
  requireValue(!state.payments.some(payment=>salaryPaymentValid(ledger,payment)&&payment.receiptBreakdown&&payment.configId===period.configId&&payment.date===input.date&&payment.accountId===input.accountId&&payment.amount===amount&&normalizeSalaryName(payment.reference)===normalizeSalaryName(input.reference)&&payment.applications.some(application=>application.periodId===period.id)&&signature(payment.receiptBreakdown)===signature(breakdown)),"Ya existe un pago con la misma semana, fecha, cuenta, importe y conceptos.");

  let remainingSalary=input.salaryAmount;
  const applications:SalaryApplication[]=[];
  for(const concept of period.concepts){
    const applied=Math.min(remainingSalary,Math.max(0,concept.amount-salaryConceptPaid(ledger,period.id,concept.id)));
    if(applied>0)applications.push({periodId:period.id,conceptId:concept.id,amount:applied});
    remainingSalary-=applied;
  }
  requireValue(remainingSalary===0,"El salario recibido supera el salario pendiente de la semana. Registra los adicionales como conceptos o revisa los datos en Registro detallado.");
  applications.push(...extraApplications);
  let deductions=input.concepts.filter(item=>item.sign==="subtract").reduce((sum,item)=>sum+item.amount,0);
  for(const application of applications){const reduction=Math.min(deductions,application.amount);application.amount-=reduction;deductions-=reduction;}
  const saved=state.periods.find(item=>item.id===period.id)??null;
  let prepared=saved&&JSON.stringify(saved)===JSON.stringify(period)?ledger:saveSalaryPeriod(ledger,period,saved,today,"Referencia salarial revisada al confirmar el pago recibido");
  if(input.concepts.some(item=>!item.existingAdjustmentId))prepared=saveSalaryAdjustments(prepared,period,adjustments,original);
  // Match the existing full-payment shortcut only when no unconfirmed wage debt
  // would be created. A partial receipt does not confirm projected work.
  if(!period.earned&&canConfirmSalaryPeriod(period,today)&&salaryReceived(ledger,period.id)+amount>=salaryExpected(prepared,period,true)){
    const savedPeriod=salaryState(prepared).periods.find(item=>item.id===period.id)!;
    prepared=saveSalaryPeriod(prepared,{...savedPeriod,earned:true},savedPeriod,today,"Período finalizado y completamente recibido al registrar el pago");
  }
  return postSalaryPayment(prepared,{id:input.id,configId:period.configId,date:input.date,amount,accountId:input.accountId,method:input.method,reference:input.reference,notes:input.notes,name:`Salario · ${config!.employer} · ${salaryPeriodLabel(period,config)}`,applications:applications.filter(item=>item.amount>0),receiptBreakdown:breakdown,manual:{},selections:[]},today);
}
