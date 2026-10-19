"use client";
import {SalaryPeriodActivation} from "./salary-period-activation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSalaryToday } from "./salary-earned-control";
import { SalaryImport } from "./salary-import";
import { FinanceDialog } from "./finance-dialog";
import { salaryBatchCandidates, salaryBatchPresetIds, salaryCycleSummary, salaryDefaultCycle, salaryPaymentTiming, salaryPeriodPaymentLabel, salaryPeriodPresentation, correctSalaryPayment, deleteSalaryPeriod, setSalaryView, salaryPeriodLabel, salaryPeriodRemaining, salaryConceptPaid, salaryPaymentValid, salaryPeriodForDate, salaryState, preferredSalaryConfigId, saveSalaryPeriod, unlinkSalaryPayment, recordStandardSalaryPayment, standardSalaryReceipt, type SalaryApplication, type SalaryPayment, type SalaryLedger, type SalaryPeriod, type SalaryPaymentInput, type SalaryPaymentDateAccuracy, type SalaryReceiptPlan } from "@/lib/salary-tracking";
import { SalaryBenefits } from "./salary-benefits";
import styles from "./salary-tracking.module.css";
import {SalaryAdjustments,SalaryEstimation} from "./salary-adjustments";
import {SalaryProjection} from "./salary-projection";
import {salaryPaymentConcepts} from "@/lib/salary-tracking";
import {SalaryPeriodReport} from "./salary-period-report";
import {sortSalaryHistory,setSalaryHistoryOrder} from "@/lib/salary-history";
import {salaryDateLabel,salaryLocalDateTime,salaryWorkSchedule} from "@/lib/salary-dates";
import statusStyles from "./salary-status.module.css";

type BatchGroup={id:string;name:string;periodIds:string[];dateAccuracy:SalaryPaymentDateAccuracy;date:string};
type Props={ledger:SalaryLedger;today:string;display:(n:number)=>string;incomeAccountId?:string;onSave:(operation:(current:SalaryLedger)=>SalaryLedger)=>void;onConfirmSave:()=>Promise<void>;onMovement:(id:string)=>void;onConfigure:()=>void;onReceive:(configId:string,periodId?:string,applications?:SalaryApplication[],plan?:SalaryReceiptPlan)=>void};
const day=salaryDateLabel;
const paymentDate=(payment:SalaryPayment)=>payment.dateAccuracy==="unknown"?"Fecha desconocida":payment.dateAccuracy==="approximate"?`Fecha aproximada · ${day(payment.date)}`:day(payment.date);
function Editor({title,onClose,onSubmit,children,error}:{title:string;onClose:()=>void;onSubmit:(e:FormEvent<HTMLFormElement>)=>void;children:ReactNode;error:string}) {
  return <FinanceDialog label={title} onClose={onClose} maxWidth={640}><form className={`flow-modal flow-body ${styles.editor}`} onSubmit={onSubmit}><div className={styles.row}><h2>{title}</h2><button type="button" className="secondary" aria-label="Cerrar" onClick={onClose}>×</button></div>{children}{error&&<p className="form-error" role="alert">{error}</p>}<div className={styles.actions}><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" type="submit">Guardar y confirmar</button></div></form></FinanceDialog>;
}

export function SalaryTracking({ledger,today:initialToday,display,incomeAccountId,onSave,onConfirmSave,onMovement,onReceive,onConfigure}:Props) {
  const today=useSalaryToday(initialToday);
  const state=salaryState(ledger);
  const [reportOpen,setReportOpen]=useState(false);
  const [projectionOpen,setProjectionOpen]=useState(false);
  const [configId,setConfigId]=useState(()=>preferredSalaryConfigId(ledger));
  const [batchFrom,setBatchFrom]=useState(()=>state.periods.filter(p=>p.configId===preferredSalaryConfigId(ledger)&&p.earned).sort((a,b)=>a.start.localeCompare(b.start))[0]?.start??`${initialToday.slice(0,4)}-01-01`);
  const [batchTo,setBatchTo]=useState(initialToday);
  const [batchSelection,setBatchSelection]=useState<string[]>([]);
  const [batchGroups,setBatchGroups]=useState<BatchGroup[]>([{id:"deposit-1",name:"Depósito 1",periodIds:[],dateAccuracy:"exact",date:initialToday}]);
  const [cycleRange,setCycleRange]=useState(()=>salaryDefaultCycle(initialToday));
  const [importOpen,setImportOpen]=useState(false);
  const config=state.configs.find(c=>c.id===configId)??state.configs[0];
  const batchCandidates=config&&batchFrom&&batchTo?salaryBatchCandidates(ledger,config.id,batchFrom,batchTo,today):[];
  const selectedBatch=batchCandidates.filter(candidate=>batchSelection.includes(candidate.period.id));
  const batchTotal=selectedBatch.reduce((sum,candidate)=>sum+candidate.amount,0);
  const cycleRangeValid=Boolean(cycleRange.from&&cycleRange.to&&cycleRange.from<=cycleRange.to);
  const cycleSummary=config&&cycleRangeValid?salaryCycleSummary(ledger,config.id,cycleRange.from,cycleRange.to,today):null;
  const [filter,setFilter]=useState("Todos"),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const quickSaving=useRef(false),[quickSavingPeriod,setQuickSavingPeriod]=useState<string|null>(null);
  const [periodEdit,setPeriodEdit]=useState<{value:SalaryPeriod;original:SalaryPeriod|null}|null>(null);
  const [editingPayment,setEditingPayment]=useState<SalaryPayment|null>(null);
  const [deleting,setDeleting]=useState<{period?:SalaryPeriod;payment?:SalaryPayment}|null>(null);
  const [payment,setPayment]=useState<SalaryPaymentInput|null>(null);
  const [reason,setReason]=useState(""),[unlinkId,setUnlinkId]=useState<string|null>(null);
  const order=state.historyOrder??"newest";
  const references=state.periods.filter(p=>p.configId===config?.id);
  try{if(config){const current=salaryPeriodForDate(ledger,config.id,today);if(!references.some(p=>p.id===current.id))references.push(current);}}catch{/* Preserve custom history. */}
  for(const adjustment of state.periodAdjustments??[])if(adjustment.configId===config?.id&&!references.some(p=>p.id===adjustment.periodId)){
    try{references.push(salaryPeriodForDate(ledger,adjustment.configId,adjustment.start));}catch{/* Keep an obsolete reference in storage until its source is corrected. */}
  }
  const periods=sortSalaryHistory(references,order,p=>p.start);
  const summaries=periods.map(p=>salaryPeriodPresentation(ledger,p,today));
  const payments=sortSalaryHistory(state.payments.filter(p=>p.configId===config?.id),order,p=>p.date);
  const latestPayment=sortSalaryHistory(payments.filter(p=>salaryPaymentValid(ledger,p)),"newest",p=>p.date)[0];
  const validPayments=payments.filter(p=>salaryPaymentValid(ledger,p));
  const execute=(operation:(d:SalaryLedger)=>SalaryLedger,close?:()=>void)=>{try{onSave(operation);setError("");setNotice("Cambios guardados.");close?.();return true;}catch(e){setError(e instanceof Error?e.message:"No se pudo guardar. Revisa los datos.");return false;}};
  const close=()=>{setPeriodEdit(null);setPayment(null);setEditingPayment(null);setDeleting(null);setUnlinkId(null);setError("");};
  const editPeriod=(value:SalaryPeriod)=>{setError("");setReason("");setPeriodEdit({original:state.periods.find(p=>p.id===value.id)??null,value});};
  const modalOpen=Boolean(periodEdit||payment||unlinkId||deleting);
  const allocationLedger:SalaryLedger=editingPayment?{...ledger,salary:{...state,payments:state.payments.filter(p=>p.id!==editingPayment.id)}}:ledger;
  const matchesFilter=(p:SalaryPeriod)=>{const v=salaryPeriodPresentation(ledger,p,today);return filter==="Todos"||(filter==="Con saldo pendiente"&&v.pending>0)||(filter==="Pago parcial"&&v.received>0&&!v.fullyPaid)||(filter==="Pagado"&&v.fullyPaid)||(filter==="Atrasado"&&(v.overdue||v.late>0))||(filter==="Proyectado"&&p.start>today&&v.received===0)||(filter==="En curso"&&p.start<=today&&p.end>=today)||(filter==="Sin registros"&&v.state==="Sin registros");};
  const correctPayment=(p:SalaryPayment)=>{setError("");setReason("");setEditingPayment(p);setPayment({...p,name:ledger.movements.find(m=>m.id===p.movementId)?.name,applications:p.applications.map(a=>({...a}))});};
  const registerPeriod=async(period:SalaryPeriod)=>{
    const quick=standardSalaryReceipt(ledger,period,today,incomeAccountId);
    if(!quick){onReceive(config!.id,period.id);return;}
    if(quickSaving.current)return;
    quickSaving.current=true;setQuickSavingPeriod(period.id);setError("");
    const id=crypto.randomUUID(),date=salaryLocalDateTime();
    const operation=(current:SalaryLedger)=>recordStandardSalaryPayment(current,period,{id,date,accountId:quick.accountId,method:quick.method,today});
    try{
      operation(ledger);
      onSave(operation);
      setNotice(`Salario ${display(quick.amount)} ingresado en ${ledger.accounts.find(account=>account.id===quick.accountId)?.name??"la cuenta habitual"}. Quedó sin asignar.`);
      window.setTimeout(()=>setNotice(""),4500);
      try{await onConfirmSave();}catch{setNotice("Salario registrado. La sincronización sigue pendiente; revisa el aviso superior.");}
    }catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar el salario.");}
    finally{quickSaving.current=false;setQuickSavingPeriod(null);}
  };
  const toggleBatchPeriod=(periodId:string,selected:boolean)=>{
    setBatchSelection(current=>selected?[...new Set([...current,periodId])]:current.filter(id=>id!==periodId));
    setBatchGroups(current=>{
      if(!selected)return current.map(group=>({...group,periodIds:group.periodIds.filter(id=>id!==periodId)}));
      if(current.some(group=>group.periodIds.includes(periodId)))return current;
      const first=current[0]??{id:"deposit-1",name:"Depósito 1",periodIds:[],dateAccuracy:"exact" as const,date:today};
      return current.length?current.map((group,index)=>index===0?{...group,periodIds:[...group.periodIds,periodId]}:group):[{...first,periodIds:[periodId]}];
    });
  };
  const assignBatchPeriod=(periodId:string,groupId:string)=>setBatchGroups(current=>current.map(group=>({...group,periodIds:[...group.periodIds.filter(id=>id!==periodId),...(group.id===groupId?[periodId]:[])]})));
  const addBatchGroup=()=>setBatchGroups(current=>[...current,{id:crypto.randomUUID(),name:`Depósito ${current.length+1}`,periodIds:[],dateAccuracy:"exact",date:today}]);
  const removeBatchGroup=(groupId:string)=>setBatchGroups(current=>{if(current.length<=1)return current;const next=current.filter(group=>group.id!==groupId),target=next[0];return next.map(group=>group.id===target.id?{...group,periodIds:[...new Set([...group.periodIds,...(current.find(item=>item.id===groupId)?.periodIds??[])])]}:group);});
  const batchGroupCandidates=(group:BatchGroup)=>selectedBatch.filter(candidate=>group.periodIds.includes(candidate.period.id));
  return <section className={`section page-panel ${styles.root}`}><datalist id="salary-concepts">{["Días laborales","Feriados","Vacaciones","Aguinaldo","Horas extra","Moto / transporte","Otros conceptos laborales","Ajuste"].map(name=><option key={name} value={name}/>)}</datalist>
    {!config&&<button className="primary" onClick={onConfigure}>Configurar salario</button>}
    <p>Consulta lo trabajado, lo cobrado y lo que aún te deben. Las proyecciones no aumentan tus cuentas ni tus sobres.</p>
    {notice&&<p role="status">{notice}</p>}{!modalOpen&&error&&<p role="alert" className="form-error">{error}</p>}
    {!config?<p className="empty-state">Agrega un empleador para comenzar. No se importan ni generan cobros automáticamente.</p>:<>
      {state.configs.length>1?<label>Empleador / configuración<select value={config.id} onChange={e=>{const next=e.target.value;setConfigId(next);setFilter("Todos");setBatchSelection([]);setBatchGroups(current=>current.map(group=>({...group,periodIds:[]})));setBatchFrom(state.periods.filter(p=>p.configId===next&&p.earned).sort((a,b)=>a.start.localeCompare(b.start))[0]?.start??`${today.slice(0,4)}-01-01`);}}>{state.configs.map(c=><option key={c.id} value={c.id}>{c.employer} · {c.name}{c.active?"":" (inactivo)"}</option>)}</select></label>:<p className={styles.sourceName}>{config.employer} · {config.name}{!config.active?" · Inactivo":""}</p>}
      <div className={styles.actions}><h2>Seguimiento de salarios</h2><button className="primary" onClick={()=>onReceive(config.id)}>Registrar salario</button></div>
      <SalaryBenefits ledger={ledger} configId={config.id} today={today} display={display} onSave={operation=>execute(operation)}/>
      <details className={`${styles.card} ${styles.moreTools}`}><summary>Más opciones</summary>
      <section className={styles.auxSection}><div className={styles.actions}><button className="secondary" onClick={()=>setProjectionOpen(true)}>Ver proyección</button><button className="secondary" onClick={onConfigure}>Fuentes salariales</button><button className="secondary" onClick={()=>setImportOpen(true)}>Importar Excel</button></div></section>
      <section className={styles.auxSection}><h3>Resumen por ciclo o fechas</h3><p>Solo incluye períodos completos y confirmados.</p><div className={styles.actions}><label>Desde<input type="date" value={cycleRange.from} onChange={event=>setCycleRange(current=>({...current,from:event.target.value}))}/></label><label>Hasta<input type="date" value={cycleRange.to} onChange={event=>setCycleRange(current=>({...current,to:event.target.value}))}/></label><button type="button" className="secondary" onClick={()=>setCycleRange(salaryDefaultCycle(today))}>Ciclo 1 dic — 30 nov</button></div>{!cycleRangeValid?<p className="form-error" role="status">La fecha inicial debe ser anterior o igual a la fecha final.</p>:cycleSummary&&<><div className={styles.summary}><div><small>Devengado</small><strong>{display(cycleSummary.earned)}</strong></div><div><small>Abonado</small><strong className={styles.received}>{display(cycleSummary.received)}</strong></div><div><small>Pendiente</small><strong className={styles.pending}>{display(cycleSummary.pending)}</strong></div></div>{cycleSummary.crossingCount>0&&<p>{cycleSummary.crossingCount} período(s) cruzan el rango y quedan fuera; no se prorratean.</p>}{cycleSummary.unconfirmedCount>0&&<p>{cycleSummary.unconfirmedCount} período(s) no están confirmados y quedan fuera.</p>}{cycleSummary.periods.length?cycleSummary.periods.map(item=><div className={styles.concept} key={item.period.id}><span>{salaryPeriodLabel(item.period,config)} · {day(item.period.start)} — {day(item.period.end)}</span><b>{display(item.earned)} devengado · {display(item.received)} abonado · {display(item.pending)} pendiente</b></div>):<p className="empty-state">No hay períodos confirmados completos en este rango.</p>}<small>No se prorratean períodos que cruzan las fechas.</small></>}</section>
      <section className={styles.auxSection}><h3>Registrar varios depósitos</h3><p>Usa esto cuando recibiste depósitos separados en fechas distintas.</p><div className={styles.selection}>
        <div className={styles.actions}><label>Desde<input type="date" value={batchFrom} max={today} onChange={event=>{setBatchFrom(event.target.value);setBatchSelection([]);setBatchGroups(current=>current.map(group=>({...group,periodIds:[]})));}}/></label><label>Hasta<input type="date" value={batchTo} max={today} onChange={event=>{setBatchTo(event.target.value);setBatchSelection([]);setBatchGroups(current=>current.map(group=>({...group,periodIds:[]})));}}/></label></div>
        <div className={styles.actions}><button type="button" className="secondary" disabled={!batchCandidates.length} onClick={()=>{const ids=salaryBatchPresetIds(batchCandidates,3);setBatchSelection(ids);setBatchGroups(current=>current.map((group,index)=>({...group,periodIds:index===0?ids:[]})));}}>Seleccionar 3 últimos</button><button type="button" className="secondary" disabled={!batchCandidates.length} onClick={()=>{const ids=salaryBatchPresetIds(batchCandidates,20);setBatchSelection(ids);setBatchGroups(current=>current.map((group,index)=>({...group,periodIds:index===0?ids:[]})));}}>Seleccionar 20 últimos</button><button type="button" className="secondary" disabled={!batchCandidates.length} onClick={()=>{const ids=salaryBatchPresetIds(batchCandidates,"all");setBatchSelection(ids);setBatchGroups(current=>current.map((group,index)=>({...group,periodIds:index===0?ids:[]})));}}>Seleccionar todos</button><button type="button" className="secondary" disabled={!batchSelection.length} onClick={()=>{setBatchSelection([]);setBatchGroups(current=>current.map(group=>({...group,periodIds:[]})));}}>Limpiar</button></div>
        {batchCandidates.length?batchCandidates.map(candidate=>{const selected=batchSelection.includes(candidate.period.id),groupId=batchGroups.find(group=>group.periodIds.includes(candidate.period.id))?.id??"";return <div className={styles.batchRow} key={candidate.period.id}><label className="check-label"><input type="checkbox" checked={selected} onChange={event=>toggleBatchPeriod(candidate.period.id,event.target.checked)}/><span>{salaryPeriodLabel(candidate.period,config)} · {day(candidate.period.start)} — {day(candidate.period.end)} · {display(candidate.amount)}</span></label><label>Depósito<select value={groupId} disabled={!selected} onChange={event=>assignBatchPeriod(candidate.period.id,event.target.value)}><option value="">Sin asignar</option>{batchGroups.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}</select></label></div>;}):<small>No hay períodos elegibles en este rango. Solo se muestran períodos confirmados, sin abonos previos y con ajustes validados.</small>}
        <div className={styles.actions}><button type="button" className="secondary" onClick={addBatchGroup}>Agregar otro depósito</button></div>
        {batchGroups.map(group=>{const members=batchGroupCandidates(group),applications=members.flatMap(item=>item.applications),amount=members.reduce((sum,item)=>sum+item.amount,0);return <fieldset className={styles.batchGroup} key={group.id}><legend>{group.name}</legend><p>Períodos: {members.length} · Total: {display(amount)}</p><label>Fecha de recepción<select value={group.dateAccuracy} onChange={event=>setBatchGroups(current=>current.map(item=>item.id===group.id?{...item,dateAccuracy:event.target.value as SalaryPaymentDateAccuracy}:item))}><option value="exact">Exacta</option><option value="approximate">Aproximada</option><option value="unknown">Desconocida</option></select></label>{group.dateAccuracy!=="unknown"?<label>{group.dateAccuracy==="exact"?"Fecha real":"Fecha aproximada"}<input type="date" max={today} value={group.date} onChange={event=>setBatchGroups(current=>current.map(item=>item.id===group.id?{...item,date:event.target.value}:item))}/></label>:<small>Se guardará como pago histórico sin movimiento y sin fecha de recepción asignada.</small>}<div className={styles.actions}><button type="button" className="primary" disabled={!members.length||(group.dateAccuracy!=="unknown"&&!group.date)} onClick={()=>onReceive(config.id,members[0].period.id,applications,{dateAccuracy:group.dateAccuracy,date:group.date,groupId:group.id})}>Registrar {group.name.toLocaleLowerCase("es-CR")}</button>{batchGroups.length>1&&<button type="button" className="secondary" onClick={()=>removeBatchGroup(group.id)}>Quitar depósito</button>}</div></fieldset>;})}
        <div className="review-box"><span>Períodos seleccionados: {selectedBatch.length}</span><b>Total seleccionado: {display(batchTotal)}</b></div>
      </div></section>
      <section className={styles.auxSection}><h3>Vista e historial</h3><label>Filtrar semanas<select value={filter} onChange={e=>setFilter(e.target.value)}>{["Todos","Con saldo pendiente","Pago parcial","Pagado","Atrasado","Proyectado","En curso","Sin registros"].map(f=><option key={f} value={f}>{f}</option>)}</select></label><div className={styles.actions}><button className="secondary" onClick={()=>setReportOpen(true)}>Resumen del período</button><button className="secondary" onClick={()=>execute(d=>setSalaryHistoryOrder(d,order==="newest"?"oldest":"newest"))}>Orden: {order==="newest"?"recientes primero":"antiguos primero"}</button><button className="secondary" onClick={()=>execute(d=>setSalaryView(d,state.viewMode==="grid"?"list":"grid"))}>{state.viewMode==="grid"?"Ver lista":"Ver cuadrícula"}</button></div></section>
      </details>
      <div className={styles.summary}>{([ ["Esperado","expected"],["Recibido","received"],["Pendiente confirmado","pending"],["Proyectado","projected"] ] as const).map(([label,key])=><div key={key}><small>{label}</small><strong className={styles[key]}>{display(summaries.reduce((s,v)=>s+((key==="expected"||key==="projected")&&!v.estimateKnown?0:v[key]),0))}</strong></div>)}</div>
      {validPayments.some(p=>p.historical)&&<small>Recibido incluye los pagos históricos confirmados; estos no incrementan el saldo de las cuentas.</small>}<p>Último cobro: {latestPayment?`${paymentDate(latestPayment)} · ${display(latestPayment.amount)}`:"Sin pagos registrados"}</p>
      {payments.some(p=>!p.voidReason&&!salaryPaymentValid(ledger,p))&&<p className="form-error" role="alert">Hay abonos cuyo ingreso ya no coincide. No se cuentan como pagados. Revísalos en el historial antes de volver a registrar dinero.</p>}
      <small>Las semanas usan año ISO. Al registrar, puedes saltar a otra semana desde el calendario.</small>
      <div className={state.viewMode==="grid"?styles.grid:styles.list}>
      {periods.filter(matchesFilter).map(p=>{
        const sum=salaryPeriodPresentation(ledger,p,today);
        const periodPayments=validPayments.filter(pay=>pay.applications.some(a=>a.periodId===p.id));
        const quick=standardSalaryReceipt(ledger,p,today,incomeAccountId);
        return <details className={`${styles.card} ${styles.salaryCard}`} key={p.id}>
          <summary>
            <span className={`${styles.ribbon} ${statusStyles.surface}`} data-tone={sum.tone}>
              <b>{salaryPeriodLabel(p,config)}</b><small>{sum.state}{sum.overdueLabel?` · ${sum.overdueLabel}`:""}</small>
              {sum.fullyPaid?<span className={styles.paidBadge}>Pagado</span>:<button type="button" className={`secondary ${styles.periodAction}`} aria-label={quick?`Ingresar salario estándar de ${display(quick.amount)} para ${salaryPeriodLabel(p,config)}`:`Registrar salario de ${salaryPeriodLabel(p,config)}`} disabled={quickSavingPeriod===p.id} onClick={event=>{event.preventDefault();event.stopPropagation();void registerPeriod(p);}}>{quickSavingPeriod===p.id?"Ingresando…":quick?`Ingresar ${display(quick.amount)}`:"Registrar salario"}</button>}
            </span>
            <span>{day(p.start)} — {day(p.end)}<small className={styles.workState}>Pago previsto: {day(p.payDate)}</small></span>
             <span>{salaryPeriodPaymentLabel(ledger,p)}{sum.early>0?" · Antes de la fecha de pago":""}{sum.laborAdvances>0?" · Adelanto laboral":""}{sum.late>0?" · Pago atrasado":""}<small className={styles.workState}>{sum.workState}</small></span>
            <div className={styles.periodAmounts}>{!sum.historicalEmpty&&<span>Esperado<strong className={styles.earned}>{sum.estimateKnown?display(sum.expected):"Sin proyección"}</strong></span>}<span>Recibido<strong className={styles.received}>{display(sum.received)}</strong></span><span>Pendiente confirmado<strong className={styles.pending}>{display(sum.pending)}</strong></span></div>
          </summary>
          {sum.historicalEmpty&&<details className={styles.periodExtra}><summary>Confirmar trabajo sin registrar un ingreso</summary><SalaryPeriodActivation ledger={ledger} period={p} today={today} display={display} onSave={onSave}/></details>}
          <p>Fecha prevista de pago: {day(p.payDate)} · Estado laboral: {sum.workState}</p>
          {p.scheduledWorkDays&&<small>{salaryWorkSchedule(p)}</small>}{(p.workedDays??[]).length>0&&<p>Días registrados como trabajados: {p.workedDays!.map(value=>day(value)).join(", ")}</p>}
          {!sum.historicalEmpty&&sum.estimateKnown&&p.concepts.map(c=><div className={styles.concept} key={c.id}><b>{c.name}</b><span>{display(c.amount)} · Recibido {display(salaryConceptPaid(ledger,p.id,c.id))}</span></div>)}
          <SalaryEstimation ledger={ledger} period={p} today={today} display={display}/><SalaryAdjustments ledger={ledger} period={p} today={today} display={display} onSave={onSave}/>
          {p.notes&&<p>{p.notes}</p>}
          <details><summary>Correcciones históricas</summary><div className={styles.actions}><button className="secondary" disabled={!state.periods.some(item=>item.id===p.id)} onClick={()=>editPeriod(p)}>Corregir datos y conceptos</button><button disabled={!state.periods.some(item=>item.id===p.id)} className="secondary" onClick={()=>{setReason("");setError("");setDeleting({period:p});}}>Eliminar período</button></div></details>
          <h3>Pagos del período</h3>
          {periodPayments.map(pay=><article className={styles.card} key={pay.id}><p>{paymentDate(pay)} · {display(pay.applications.filter(a=>a.periodId===p.id).reduce((s,a)=>s+a.amount,0))} · {!pay.dateAccuracy||pay.dateAccuracy==="exact"?salaryPaymentTiming(p,pay.date).label:"Sin comparación de puntualidad"}{pay.historical?" · Histórico (sin movimiento bancario)":""}</p><div className={styles.actions}>{!pay.historical&&<button className="secondary" onClick={()=>onMovement(pay.movementId)}>Ver movimiento</button>}<button className="secondary" onClick={()=>correctPayment(pay)}>Corregir pago</button></div></article>)}
        </details>;
      })}
      </div>{periods.length>0&&!periods.some(matchesFilter)&&<p className="empty-state">No hay períodos con este estado. Consulta también el historial de pagos.</p>}
      {!periods.length&&<p className="empty-state">Sin registros guardados. Usa Resumen del período para consultar cualquier semana.</p>}
      <details className={styles.card}><summary>Historial de pagos ({payments.length})</summary>{payments.map(p=><article className={styles.card} key={p.id}><b>{paymentDate(p)} · {display(p.amount)}</b><p>{p.historical?"Pago histórico · sin movimiento bancario":`${ledger.accounts.find(a=>a.id===p.accountId)?.name??"Cuenta histórica"} · ${p.method}${p.reference?` · ${p.reference}`:""}`}</p>{p.applications.map(a=>{const period=state.periods.find(v=>v.id===a.periodId);return <small className={styles.block} key={`${a.periodId}:${a.conceptId}`}>{period?`${day(period.start)} · ${period.concepts.find(c=>c.id===a.conceptId)?.name??"Concepto histórico"}`:"Período histórico"}: {display(a.amount)}</small>;})}{p.notes&&<p>{p.notes}</p>}{p.voidReason&&<p>{p.historical?"Pago histórico anulado":"Vinculación anulada"}: {p.voidReason}</p>}{!p.voidReason&&<div className={styles.actions}>{!p.historical&&<button className="secondary" onClick={()=>onMovement(p.movementId)}>Ver movimiento</button>}<button className="secondary" onClick={()=>correctPayment(p)}>Editar pago</button><button className="secondary" onClick={()=>{setReason("");setError("");setDeleting({payment:p});}}>Anular pago</button><button className="secondary" onClick={()=>{setReason("");setError("");setUnlinkId(p.id);}}>{p.historical?"Anular pago histórico":"Corregir vinculación"}</button></div>}</article>)}</details>
    </>}
    {projectionOpen&&<SalaryProjection ledger={ledger} today={today} display={display} onClose={()=>setProjectionOpen(false)}/>}
    {reportOpen&&config&&<SalaryPeriodReport ledger={ledger} config={config} today={today} display={display} onSave={onSave} onClose={()=>setReportOpen(false)} onMovement={onMovement}/>}
    {importOpen&&config&&<SalaryImport ledger={ledger} config={config} today={today} display={display} onSave={onSave} onClose={()=>setImportOpen(false)}/>}
    {periodEdit&&<Editor title="Período y conceptos" onClose={close} error={error} onSubmit={e=>{e.preventDefault();execute(d=>saveSalaryPeriod(d,periodEdit.value,periodEdit.original,today,reason),close);}}>
      {([ ["start","Inicio"],["end","Fin"],["payDate","Fecha prevista de cobro"] ] as const).map(([key,label])=><label key={key}>{label}<input type="date" required value={periodEdit.value[key]} onChange={e=>setPeriodEdit({...periodEdit,value:{...periodEdit.value,[key]:e.target.value}})}/></label>)}<p>{periodEdit.original?"Corrección excepcional de datos conservados.":"Proyección opcional: guardar no registra ingresos ni confirma días trabajados."} No es necesario completar ni cerrar períodos para registrar salarios.</p>
      {periodEdit.value.concepts.map((c,i)=><div className={styles.card} key={c.id}><label>Concepto<input list="salary-concepts" required value={c.name} onChange={e=>setPeriodEdit({...periodEdit,value:{...periodEdit.value,concepts:periodEdit.value.concepts.map((v,n)=>n===i?{...v,name:e.target.value}:v)}})}/></label><label>Importe en colones<input type="number" min="0" step="1" required value={c.amount} onChange={e=>setPeriodEdit({...periodEdit,value:{...periodEdit.value,concepts:periodEdit.value.concepts.map((v,n)=>n===i?{...v,amount:Number(e.target.value)}:v)}})}/></label><button className="secondary" type="button" onClick={()=>setPeriodEdit({...periodEdit,value:{...periodEdit.value,concepts:periodEdit.value.concepts.filter(v=>v.id!==c.id)}})}>Quitar concepto</button></div>)}<button type="button" className="secondary" onClick={()=>setPeriodEdit({...periodEdit,value:{...periodEdit.value,concepts:[...periodEdit.value.concepts,{id:crypto.randomUUID(),name:"",amount:0}]}})}>Agregar concepto</button><label>Notas<textarea value={periodEdit.value.notes} onChange={e=>setPeriodEdit({...periodEdit,value:{...periodEdit.value,notes:e.target.value}})}/></label><label>Motivo / confirmación<input required value={reason} onChange={e=>setReason(e.target.value)}/></label>
    </Editor>}
    {payment&&editingPayment&&<Editor title="Corregir pago salarial" onClose={close} error={error} onSubmit={e=>{e.preventDefault();execute(d=>correctSalaryPayment(d,editingPayment,payment,today,reason),close);}}>
      {!editingPayment.historical&&<label>Nombre del ingreso<input value={payment.name??""} onChange={e=>setPayment({...payment,name:e.target.value})}/><small>El movimiento vinculado se actualizará junto con el pago.</small></label>}
      <label>Monto recibido<input type="number" min="1" step="1" required value={payment.amount||""} onChange={e=>setPayment({...payment,amount:Number(e.target.value)})}/></label>
      {editingPayment.historical&&<label>Precisión de la fecha<select value={payment.dateAccuracy??"exact"} onChange={e=>setPayment({...payment,dateAccuracy:e.target.value as SalaryPaymentDateAccuracy})}><option value="exact">Exacta</option><option value="approximate">Aproximada</option><option value="unknown">Desconocida</option></select></label>}
      <label>{editingPayment.historical?(payment.dateAccuracy==="unknown"?"Fecha de referencia interna (no se conoce la recepción)":payment.dateAccuracy==="approximate"?"Fecha aproximada":"Fecha real"):"Fecha y hora real (Costa Rica)"}<input type={editingPayment.historical?"date":"datetime-local"} required disabled={Boolean(editingPayment.historical&&payment.dateAccuracy==="unknown")} value={payment.date} onChange={e=>setPayment({...payment,date:e.target.value})}/></label>
      {!editingPayment.historical&&<label>Cuenta<select required disabled value={payment.accountId}><option value="">Selecciona una cuenta</option>{ledger.accounts.filter(a=>a.active||a.id===payment.accountId).map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select></label>}
      <label>Referencia<input value={payment.reference} onChange={e=>setPayment({...payment,reference:e.target.value})}/></label><label>Notas<textarea value={payment.notes} onChange={e=>setPayment({...payment,notes:e.target.value})}/></label>
      <h3>Aplicar a períodos</h3><p>La fecha del cobro puede ser anterior o posterior al período. Esto no confirma que el trabajo esté completo.</p>{periods.filter(p=>salaryPeriodRemaining(allocationLedger,p)>0||payment.applications.some(a=>a.periodId===p.id)).map(p=><fieldset key={p.id}><legend>{salaryPeriodLabel(p,config)} · {day(p.start)} — {day(p.end)}</legend>{salaryPaymentConcepts(allocationLedger,p).map(c=>{const pending=c.amount-salaryConceptPaid(allocationLedger,p.id,c.id);if(!pending&&!payment.applications.some(a=>a.periodId===p.id&&a.conceptId===c.id))return null;const applied=payment.applications.find(a=>a.periodId===p.id&&a.conceptId===c.id);return <label key={c.id}>{c.name} · Pendiente {display(pending)}<input aria-label={`Pago a ${c.name} ${p.start}`} type="number" min="0" step="1" max={pending} value={applied?.amount??""} placeholder="0" onChange={e=>{const amount=Number(e.target.value);setPayment({...payment,applications:[...payment.applications.filter(a=>a.periodId!==p.id||a.conceptId!==c.id),...(amount>0?[{periodId:p.id,conceptId:c.id,amount}]:[])]});}}/></label>;})}</fieldset>)}<div className="review-box"><b>Recibido: {display(payment.amount)}</b><span>Aplicado: {display(payment.applications.reduce((s,a)=>s+a.amount,0))}</span><span>Por aplicar: {display(payment.amount-payment.applications.reduce((s,a)=>s+a.amount,0))}</span></div>
      <label>Motivo de la corrección<input required value={reason} onChange={e=>setReason(e.target.value)}/></label>
    </Editor>}
    {deleting&&<Editor title={deleting.period?"Eliminar período":"Anular cobro"} onClose={close} error={error} onSubmit={e=>{e.preventDefault();execute(d=>deleting.period?deleteSalaryPeriod(d,deleting.period.id,deleting.period,reason):correctSalaryPayment(d,deleting.payment!,deleting.payment!,today,reason,true),close);}}><p>{deleting.period?"Se eliminará el período si no tiene abonos activos. Quedará una copia en la auditoría.":deleting.payment?.historical?"Se reabre la deuda sin modificar cuentas ni sobres. Se conserva el registro anulado.":"Se reabre la deuda y se retira el ingreso de la cuenta. Solo se permite si el dinero sigue completamente sin asignar y sin usos ni movimientos dependientes. La auditoría conserva el original."}</p><label>Motivo<input required value={reason} onChange={e=>setReason(e.target.value)}/></label></Editor>}
    {unlinkId&&<Editor title={payments.find(p=>p.id===unlinkId)?.historical?"Anular pago histórico":"Corregir vinculación salarial"} onClose={close} error={error} onSubmit={e=>{e.preventDefault();execute(d=>unlinkSalaryPayment(d,unlinkId,reason),close);}}><p>{payments.find(p=>p.id===unlinkId)?.historical?"Se anula el pago histórico y se reabre la deuda correspondiente. Su registro y el motivo se conservan. Las cuentas y los sobres no cambian.":"Se retira la aplicación salarial y se reabre la deuda. El ingreso bancario, sus asignaciones y el historial se conservan. Después puedes vincularlo a los conceptos correctos."}</p><label>Motivo<input required value={reason} onChange={e=>setReason(e.target.value)}/></label></Editor>}
  </section>;
}
