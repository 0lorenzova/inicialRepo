"use client";
import {useState} from "react";
import {SalaryEarnedControl,useSalaryToday} from "./salary-earned-control";
import {canConfirmSalaryPeriod} from "@/lib/salary-dates";
import {FinanceDialog} from "./finance-dialog";
import {salaryState,salaryPeriodApplications,salaryPeriodRemaining,salaryPeriodLabel,salarySuggestions,saveSalaryPeriod,type SalaryApplication,type SalaryLedger,type SalaryPeriod} from "@/lib/salary-tracking";
import styles from "./salary-tracking.module.css";
export type SalarySelection={configId:string;periodId:string;multiple:boolean;applications:SalaryApplication[];allowAdvance:boolean};
export const blankSalarySelection=():SalarySelection=>({configId:"",periodId:"",multiple:false,applications:[],allowAdvance:false});
export function initialSalarySelection(ledger:SalaryLedger,date:string):SalarySelection {
  const configs=salaryState(ledger).configs.filter(c=>c.active),configId=configs.length===1?configs[0].id:"";
  return {...blankSalarySelection(),configId,periodId:configId?salarySuggestions(ledger,configId,date.slice(0,10)).suggested?.id??"":""};
}
export function selectedSalaryApplications(ledger:SalaryLedger,value:SalarySelection,amount:number,date:string) {
  return value.multiple?value.applications:salaryPeriodApplications(ledger,value.configId,value.periodId,amount,value.allowAdvance?date.slice(0,10):undefined);
}
export function SalaryIncomeLink({ledger,value,amount,date,today:initialToday,onChange,onSave,display}:{ledger:SalaryLedger;value:SalarySelection;amount:number;date:string;today:string;onChange:(value:SalarySelection)=>void;onSave:(operation:(current:SalaryLedger)=>SalaryLedger)=>void;display:(n:number)=>string}) {
  const today=useSalaryToday(initialToday);
  const [newEnd,setNewEnd]=useState(date.slice(0,10)),[newEarned,setNewEarned]=useState(false);
  const state=salaryState(ledger),config=state.configs.find(c=>c.id===value.configId);
  const receptionDay=/^\d{4}-\d{2}-\d{2}/.test(date)?date.slice(0,10):today;
  const suggestions=salarySuggestions(ledger,value.configId,receptionDay);
  const periods=state.periods.filter(p=>p.configId===value.configId&&(p.earned||p.start<=receptionDay)&&salaryPeriodRemaining(ledger,p)>0).sort((a,b)=>b.start.localeCompare(a.start));
  const selected=periods.find(p=>p.id===value.periodId);
  const [creating,setCreating]=useState(false),[error,setError]=useState("");
  let preview:SalaryApplication[]=[];let previewError="";
  try{if(amount>0&&(value.periodId||value.multiple))preview=selectedSalaryApplications(ledger,value,amount,date);}catch(e){previewError=e instanceof Error?e.message:"Revisa la aplicación.";}
  const applied=preview.reduce((s,a)=>s+a.amount,0);
  const needsAdvance=value.multiple?value.applications.some(a=>periods.some(p=>p.id===a.periodId&&(!p.earned||!canConfirmSalaryPeriod(p.end,receptionDay)))):selected&&(!selected.earned||!canConfirmSalaryPeriod(selected.end,receptionDay));
  const label=(p:SalaryPeriod)=>`${salaryPeriodLabel(p,config)} · ${p.start} — ${p.end} · ${p.earned?"Pendiente":"Por cubrir (proyección)"} ${display(salaryPeriodRemaining(ledger,p))}`;
  const choose=(id:string)=>onChange({...value,periodId:id,multiple:false,applications:[],allowAdvance:false});
  return <fieldset className={styles.selection}><legend>¿A qué período corresponde este pago?</legend>
    <label>Empleador / configuración<select value={value.configId} onChange={e=>{const configId=e.target.value;onChange({...blankSalarySelection(),configId,periodId:salarySuggestions(ledger,configId,receptionDay).suggested?.id??""});}}><option value="">Selecciona un empleador</option>{state.configs.filter(c=>c.active||c.id===value.configId).map(c=><option key={c.id} value={c.id}>{c.employer} · {c.name}</option>)}</select></label>
    {!state.configs.length&&<p>Configura primero el empleador en Gestión salarial. Puedes conservar esta entrada como otro ingreso y vincularla después.</p>}
    {config&&<>
      {suggestions.suggested&&<button type="button" className="secondary" onClick={()=>choose(suggestions.suggested!.id)}>Último período trabajado — Sugerido: {salaryPeriodLabel(suggestions.suggested,config)}</button>}
      {suggestions.last&&!suggestions.suggested&&<p role="status">El último período finalizado, {salaryPeriodLabel(suggestions.last,config)}, {suggestions.last.earned?"ya está completamente pagado":"aún no está confirmado como devengado"}. Elige expresamente otro período o revisa su devengo en Gestión salarial.</p>}
      {suggestions.current.length>0&&<button type="button" className="secondary" onClick={()=>choose(suggestions.current[0].id)}>Pago anticipado · {salaryPeriodLabel(suggestions.current[0],config)}</button>}
      {suggestions.older.length>0&&<button type="button" className="secondary" onClick={()=>choose(suggestions.older[0].id)}>Pagar saldo anterior · {salaryPeriodLabel(suggestions.older[0],config)}</button>}
      <label className="check-label"><input type="checkbox" checked={value.multiple} onChange={e=>onChange({...value,multiple:e.target.checked,applications:[],allowAdvance:false})}/>Aplicar a varios períodos / elegir conceptos</label>
      {!value.multiple?<label>Período<select value={value.periodId} onChange={e=>choose(e.target.value)}><option value="">Selecciona el período correspondiente</option>{periods.map(p=><option key={p.id} value={p.id}>{label(p)}</option>)}</select></label>:periods.map(p=><details className={styles.card} key={p.id}><summary>{label(p)}</summary><SalaryConceptChoices ledger={ledger} period={p} applications={value.applications} onChange={applications=>onChange({...value,applications})} display={display}/></details>)}
      {needsAdvance&&<label className="check-label"><input type="checkbox" checked={value.allowAdvance} onChange={e=>onChange({...value,allowAdvance:e.target.checked})}/>Pago anticipado / cobro sin devengo confirmado: recibí este dinero; el período no se marca como completamente trabajado.</label>}
      {previewError&&<p role="alert">{needsAdvance&&!value.allowAdvance?"Confirma el pago anticipado recibido para continuar. Esto no confirma el devengo del período.":previewError}{selected&&amount>salaryPeriodRemaining(ledger,selected)&&" Selecciona «Aplicar a varios períodos» para indicar el destino del excedente. No se reparte automáticamente."}</p>}
      {value.multiple&&<p role="status">Aplicado: {display(applied)} · Por aplicar: {display(amount-applied)}</p>}
      {!value.multiple&&preview.length>0&&<p>{preview.map(a=>`${selected?.concepts.find(c=>c.id===a.conceptId)?.name}: ${display(a.amount)}`).join(" · ")}</p>}
      <button type="button" className="secondary" onClick={()=>{setNewEnd(receptionDay);setNewEarned(false);setCreating(true);setError("");}}>Crear período correspondiente</button>
      <small>Un solo ingreso real. La fecha del cobro no cambia las fechas trabajadas. Los conceptos se cubren en el orden mostrado, salvo que elijas importes individuales.</small>
    </>}
    {creating&&config&&<FinanceDialog label="Agregar período salarial" onClose={()=>setCreating(false)}><form className={`flow-modal flow-body ${styles.editor}`} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget),id=crypto.randomUUID();try{const period:SalaryPeriod={id,configId:config.id,start:String(f.get("start")),end:String(f.get("end")),payDate:String(f.get("payDate")),earned:newEarned,frequency:config.frequency,concepts:[{id:`${id}:salary`,name:"Salario",amount:Number(f.get("amount"))},...(config.extraConcepts??[]).map(c=>({...c,id:`${id}:${c.id}`}))],notes:""};onSave(d=>saveSalaryPeriod(d,period,null,today,"Período creado y confirmado desde Entrada"));choose(id);setCreating(false);}catch(e){setError(e instanceof Error?e.message:"No se pudo guardar.");}}}><h2>Agregar período</h2><label>Inicio<input name="start" type="date" required defaultValue={receptionDay}/></label><label>Fin<input name="end" type="date" required value={newEnd} onChange={e=>{setNewEnd(e.target.value);if(!canConfirmSalaryPeriod(e.target.value,today))setNewEarned(false);}}/></label><label>Fecha esperada de cobro<input name="payDate" type="date" required defaultValue={receptionDay}/></label><label>Importe previsto<input name="amount" type="number" min="1" step="1" required defaultValue={config.base}/></label><SalaryEarnedControl end={newEnd} today={today} checked={newEarned} onChange={setNewEarned}/><p>No crea ingresos. {(config.extraConcepts??[]).length>0?`Incluye los conceptos de la configuración: ${(config.extraConcepts??[]).map(c=>`${c.name} · ${display(c.amount)}`).join(", ")}.`:""} Puedes ajustar conceptos desde Gestión salarial.</p>{error&&<p role="alert" className="form-error">{error}</p>}<button className="primary" type="submit">Guardar período</button><button type="button" className="secondary" onClick={()=>setCreating(false)}>Cancelar</button></form></FinanceDialog>}
  </fieldset>;
}
import {salaryConceptPaid} from "@/lib/salary-tracking";
export function SalaryConceptChoices({ledger,period,applications,onChange,display}:{ledger:SalaryLedger;period:SalaryPeriod;applications:SalaryApplication[];onChange:(a:SalaryApplication[])=>void;display:(n:number)=>string}) {
  return <div className={styles.selection}>{period.concepts.map(c=>{const pending=c.amount-salaryConceptPaid(ledger,period.id,c.id);if(pending<=0)return null;const a=applications.find(a=>a.periodId===period.id&&a.conceptId===c.id);return <label key={c.id}>{c.name} · Por cubrir {display(pending)}<input aria-label={`Abono a ${c.name} ${period.start}`} type="number" min="0" step="1" max={pending} value={a?.amount??""} placeholder="0" onChange={e=>onChange([...applications.filter(a=>a.periodId!==period.id||a.conceptId!==c.id),...(Number(e.target.value)>0?[{periodId:period.id,conceptId:c.id,amount:Number(e.target.value)}]:[])])}/></label>;})}</div>;
}
