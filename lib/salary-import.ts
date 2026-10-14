import {movementDay} from "./finance-history";
import {postSalaryPayment,salaryState,saveSalaryPeriod,type SalaryLedger,type SalaryApplication} from "./salary-tracking";
import type {SalaryImportDraft} from "./salary-xlsx";
import type {SalaryImportPeriod} from "./salary-xlsx";

export function importAmount(value:string,label:string) {
  if(!value.trim()||!/^\d+$/.test(value.trim())||!Number.isSafeInteger(Number(value)))throw new Error(`${label}: escribe un importe en colones enteros. No se sustituyen vacíos ni se redondean decimales.`);
  return Number(value);
}

export function importPreviewTotals(period:SalaryImportPeriod) {
  try {
    const earned=period.concepts.filter(c=>c.included).reduce((s,c)=>s+importAmount(c.amount,c.name),0);
    const received=period.receipts.reduce((s,r)=>s+Object.values(r.amounts).reduce((a,v)=>a+importAmount(v,"Abono"),0),0);
    if(!Number.isSafeInteger(earned)||!Number.isSafeInteger(received))return null;
    return {earned,received,pending:earned-received};
  } catch {return null;}
}

export function importSalaryPeriods<T extends SalaryLedger>(ledger:T,draft:SalaryImportDraft,configId:string,today:string):T {
  if(!/^[a-f0-9]{64}$/.test(draft.fingerprint))throw new Error("Vuelve a abrir el archivo antes de importarlo.");
  const selected=draft.periods.filter(p=>p.selected);
  if(!selected.length)throw new Error("Selecciona al menos un período revisado.");
  if(selected.length>120||new Set(selected.map(p=>p.id)).size!==selected.length)throw new Error("Revisa los períodos seleccionados.");
  let next=ledger;
  const groups=new Map<string,{applications:SalaryApplication[];sources:string[]}>();
  for(const period of selected){
    const source=`xlsx:${draft.fingerprint}:Hoja1:${period.row}`;
    if(period.id!==source||salaryState(next).periods.some(p=>p.source===source||p.id===`${configId}:${source}`))throw new Error(`El período de la fila ${period.row} ya fue importado o cambió su origen.`);
    const periodId=`${configId}:${source}`;
    const concepts=period.concepts.filter(c=>c.included).map(c=>({id:`${periodId}:${c.id}`,name:c.name,amount:importAmount(c.amount,c.name)}));
    next=saveSalaryPeriod(next,{id:periodId,configId,start:period.start,end:period.end,payDate:period.payDate,earned:period.earned,concepts,notes:period.notes,source},null,today,`Importación revisada de Hoja1, fila ${period.row}`);
    for(const receipt of period.receipts){
      if(receipt.mode!=="existing"||!receipt.movementId)throw new Error(`Fila ${period.row}, abono ${receipt.column}: selecciona el ingreso existente que corresponde. Los cobros sin conciliar no se importan como deuda impagada.`);
      const movement=ledger.movements.find(m=>m.id===receipt.movementId&&m.type==="Ingreso");
      if(!movement?.accountId)throw new Error("El ingreso elegido no existe o no identifica su cuenta.");
      if(receipt.date!==movementDay(movement.date))throw new Error(`Fila ${period.row}, abono ${receipt.column}: confirma la fecha real del ingreso.`);
      const group=groups.get(movement.id)??{applications:[],sources:[]};
      for(const [conceptId,value] of Object.entries(receipt.amounts)){
        const amount=importAmount(value,`Abono ${receipt.column}`);
        if(!amount)continue;
        const c=period.concepts.find(c=>c.id===conceptId&&c.included);
        if(!c)throw new Error("No puedes excluir un concepto que tiene abonos en el archivo.");
        const id=`${periodId}:${conceptId}`,existing=group.applications.find(a=>a.periodId===periodId&&a.conceptId===id);
        if(existing)existing.amount+=amount;else group.applications.push({periodId:periodId,conceptId:id,amount});
      }
      group.sources.push(`${source}:${receipt.column}`);groups.set(movement.id,group);
    }
  }
  for(const [movementId,group] of groups){
    const m=ledger.movements.find(m=>m.id===movementId)!;
    next=postSalaryPayment(next,{id:`xlsx-payment:${draft.fingerprint}:${movementId}`,configId,date:m.date,amount:m.amount,accountId:m.accountId!,method:m.paymentMethod??"",reference:m.reference??"",notes:`Importación revisada: ${group.sources.join(", ")}`,applications:group.applications,existingMovementId:movementId},today);
  }
  return next;
}
