"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import {FinanceDialog} from "./finance-dialog";
import {AccountSelector} from "./account-selector";
import {SalaryReceiptDialog} from "./salary-receipt-dialog";
import {incomeDefaults,incomeReceptionMethods} from "@/lib/income-preferences";
import {salaryDateLabel,salaryLocalDateTime,salaryViewerDay} from "@/lib/salary-dates";
import {salaryAdjustments,salaryConceptPaid,salaryPeriodLabel,salaryPeriodPresentation,salaryPeriodWeekStatus,salaryReceiptDefaults,salaryState,preferredSalaryConfigId,type SalaryPeriod} from "@/lib/salary-tracking";
import {postSalaryReceiptEntry,resolveSalaryReceiptPeriod,salaryReceiptNet,type ReceiptConcept} from "@/lib/salary-receipt-entry";
import type {SalaryReceiveDialogProps} from "./salary-receive-dialog";
import styles from "./salary-payment-entry.module.css";
import statusStyles from "./salary-status.module.css";

type Props=SalaryReceiveDialogProps&{onDetailed:(configId:string,periodId:string)=>void};
type DraftConcept={id:string;name:string;amount:string;sign:""|"add"|"subtract";existingAdjustmentId?:string};

export function SalaryPaymentEntry(props:Props){
  const state=salaryState(props.ledger);
  const starting=state.periods.find(period=>period.id===props.initialPeriodId);
  const [selection,setSelection]=useState({configId:props.initialConfigId??starting?.configId??preferredSalaryConfigId(props.ledger),periodId:props.initialPeriodId});
  let period:SalaryPeriod|null=null,error="";
  try{if(selection.configId)period=resolveSalaryReceiptPeriod(props.ledger,selection.configId,selection.periodId,salaryViewerDay());}
  catch(cause){error=cause instanceof Error?cause.message:"No se pudo abrir la semana.";}
  if(!period)return <FinanceDialog label="Registrar pago recibido" onClose={props.onClose}><section className={`flow-modal flow-body ${styles.form}`}><h2>Registrar pago recibido</h2><p role={error?"alert":undefined}>{error||"Configura tu salario para registrar el pago en su semana correspondiente."}</p><button className="primary wide" onClick={error?()=>setSelection(current=>({...current,periodId:undefined})):props.onConfigure}>{error?"Ir a la semana actual":"Configurar salario"}</button><button className="secondary wide" onClick={props.onClose}>Cerrar</button></section></FinanceDialog>;
  return <PaymentFields key={`${selection.configId}:${period.id}`} {...props} period={period} onConfig={configId=>setSelection({configId,periodId:undefined})}/>;
}

function PaymentFields({period:livePeriod,onConfig,onDetailed,...props}:Props&{period:SalaryPeriod;onConfig:(id:string)=>void}){
  const {ledger,today,display,onClose,onSave,onCreateAccount,incomePreferences}=props;
  // Preserve the reference the user reviewed; the save operation rejects concurrent changes.
  const [period]=useState(()=>structuredClone(livePeriod));
  const [originalAdjustments]=useState(()=>salaryAdjustments(ledger,period).map(item=>({...item})));
  const config=salaryState(ledger).configs.find(item=>item.id===period.configId)!;
  const view=salaryPeriodPresentation(ledger,period,today),status=salaryPeriodWeekStatus(view);
  const needsHistoricalReference=view.historicalEmpty&&!salaryState(ledger).periods.some(item=>item.id===period.id);
  const [salary,setSalary]=useState("");
  const [concepts,setConcepts]=useState<DraftConcept[]>([]);
  const [historicalExpected,setHistoricalExpected]=useState("");
  const [accountId,setAccountId]=useState(()=>salaryReceiptDefaults(ledger,config.id).accountId||incomeDefaults(incomePreferences,ledger.accounts).accountId);
  const [method,setMethod]=useState(()=>salaryReceiptDefaults(ledger,config.id).method);
  const [date,setDate]=useState(salaryLocalDateTime);
  const [reference,setReference]=useState(""),[notes,setNotes]=useState("");
  const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const [discardAction,setDiscardAction]=useState<(()=>void)|null>(null);
  const [incomeId,setIncomeId]=useState<string|null>(null);
  const [paymentId]=useState(()=>crypto.randomUUID());
  const busy=useRef(false),committed=useRef(false);
  const receiptClosingBlocked=useRef(false),receiptTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(receiptTimer.current!==null)clearTimeout(receiptTimer.current);},[]);
  const salaryAmount=Number(salary||0);
  const numericConcepts:ReceiptConcept[]=concepts.map(item=>({...item,amount:Number(item.amount),sign:item.sign as ReceiptConcept["sign"]}));
  const completeConcepts=concepts.every(item=>item.name.trim()&&item.sign&&item.amount!==""&&Number.isSafeInteger(Number(item.amount))&&Number(item.amount)>0);
  const total=salaryReceiptNet(salaryAmount,numericConcepts);
  const validTotal=completeConcepts&&Number.isSafeInteger(salaryAmount)&&salaryAmount>=0&&Number.isSafeInteger(total)&&total>0;
  const existingAdditions=originalAdjustments.filter(item=>item.sign==="add"&&item.amount>salaryConceptPaid(ledger,period.id,`adjustment:${item.id}`));
  const edit=()=>{setDirty(true);setError("");};
  const requestDiscard=(action:()=>void)=>{if(busy.current)return;if(dirty)setDiscardAction(()=>action);else action();};
  const close=()=>requestDiscard(onClose);
  const updateConcept=(id:string,change:Partial<DraftConcept>)=>{edit();setConcepts(current=>current.map(item=>item.id===id?{...item,...change}:item));};
  const submit=(event:FormEvent)=>{
    event.preventDefault();
    if(busy.current||committed.current)return;
    if(!validTotal){setError("Revisa los importes y la naturaleza de cada concepto. El total neto debe ser mayor que cero.");return;}
    busy.current=true;setSaving(true);setError("");
    const input={id:paymentId,period,originalAdjustments,salaryAmount,concepts:numericConcepts,date,accountId,method,reference,notes,...(needsHistoricalReference?{historicalExpected:historicalExpected===""?undefined:Number(historicalExpected)}:{})};
    const operation=(current:typeof ledger)=>postSalaryReceiptEntry(current,input,today);
    try{
      operation(ledger);
      if(!onSave(operation))throw new Error("No se pudo guardar el pago. Revisa el aviso de sincronización.");
      committed.current=true;receiptClosingBlocked.current=true;receiptTimer.current=setTimeout(()=>{receiptClosingBlocked.current=false;},400);setDirty(false);setIncomeId(`salary-income:${paymentId}`);
    }catch(cause){setError(cause instanceof Error?cause.message:"No se pudo registrar el pago.");}
    finally{busy.current=false;setSaving(false);}
  };
  // A second tap on the old confirm button must not dismiss the new choice dialog.
  if(incomeId)return <SalaryReceiptDialog ledger={ledger} envelopes={props.envelopes} incomeId={incomeId} today={today} display={display} onSave={onSave} onConfirmSave={props.onConfirmSave} onClose={()=>{if(!receiptClosingBlocked.current)onClose();}}/>;
  if(discardAction)return <FinanceDialog label="Descartar cambios sin guardar" onClose={()=>setDiscardAction(null)}><section className={`flow-modal flow-body ${styles.form}`}><h2>¿Descartar este pago sin guardar?</h2><p>Tus importes y conceptos todavía no se han registrado.</p><button type="button" className="primary wide" onClick={()=>setDiscardAction(null)}>Seguir editando</button><button type="button" className="secondary wide" onClick={()=>{const action=discardAction;setDiscardAction(null);action();}}>Descartar cambios</button></section></FinanceDialog>;
  return <FinanceDialog label="Registrar pago recibido" onClose={close} maxWidth={620}><form className={`flow-modal flow-body ${styles.form}`} onSubmit={submit}>
    <header><h2>Registrar pago recibido</h2><button type="button" aria-label="Cerrar registro de pago" onClick={close}>×</button></header>
    {salaryState(ledger).configs.length>1&&<label>Configuración salarial<select value={config.id} onChange={event=>{const id=event.target.value;requestDiscard(()=>onConfig(id));}}>{salaryState(ledger).configs.map(item=><option value={item.id} key={item.id}>{item.employer} · {item.name}</option>)}</select></label>}
    <div className={`${styles.week} ${statusStyles.surface}`} data-tone={status.tone}><CalendarMonthOutlined aria-hidden="true"/><div><strong>{salaryPeriodLabel(period,config)}</strong><small>{salaryDateLabel(period.start)} – {salaryDateLabel(period.end)}</small><small>{config.employer} · {config.name}</small></div><span>{status.label}</span></div>
    <fieldset disabled={saving} className={styles.fields}>
      <label className={styles.salaryLabel}><span><PaidOutlined aria-hidden="true"/> Salario recibido</span><div className={styles.moneyInput}><span aria-hidden="true">₡</span><input aria-label="Salario recibido" type="number" inputMode="numeric" min="0" step="1" value={salary} placeholder="0" onChange={event=>{setSalary(event.target.value);edit();}}/></div><small>Indica el importe de este abono antes de los conceptos siguientes. Usa 0 si solo recibiste un adicional.</small></label>
      {needsHistoricalReference&&<label className={styles.historical}>Salario esperado confirmado de esa semana<input type="number" inputMode="numeric" min="0" step="1" required value={historicalExpected} onChange={event=>{setHistoricalExpected(event.target.value);edit();}}/><small>No hay una referencia histórica guardada. Al registrar, confirmas este salario acordado y su saldo pendiente después del abono.</small></label>}
      <section className={styles.concepts} aria-labelledby="salary-extra-heading"><h3 id="salary-extra-heading">Conceptos adicionales</h3>
        {concepts.map((item,index)=><fieldset className={styles.concept} key={item.id}><legend>Concepto {index+1}</legend>
          {existingAdditions.length>0&&<label className={styles.full}>Origen del concepto<select value={item.existingAdjustmentId??""} onChange={event=>{const existing=existingAdditions.find(addition=>addition.id===event.target.value);updateConcept(item.id,existing?{existingAdjustmentId:existing.id,name:existing.name,sign:"add",amount:String(existing.amount-salaryConceptPaid(ledger,period.id,`adjustment:${existing.id}`))}:{existingAdjustmentId:undefined,name:"",sign:"",amount:""});}}><option value="">Nuevo concepto</option>{existingAdditions.map(addition=><option key={addition.id} value={addition.id}>{addition.name} · existente en esta semana</option>)}</select></label>}
          <label>Concepto<input aria-label={`Nombre del concepto ${index+1}`} required value={item.name} readOnly={Boolean(item.existingAdjustmentId)} onChange={event=>updateConcept(item.id,{name:event.target.value})}/></label>
          <label>Importe (₡)<input aria-label={`Importe del concepto ${index+1}`} type="number" inputMode="numeric" min="1" step="1" required value={item.amount} onChange={event=>updateConcept(item.id,{amount:event.target.value})}/></label>
          <label className={styles.full}>Tratamiento<select aria-label={`Tratamiento del concepto ${index+1}`} required value={item.sign} disabled={Boolean(item.existingAdjustmentId)} onChange={event=>updateConcept(item.id,{sign:event.target.value as DraftConcept["sign"]})}><option value="">Seleccionar naturaleza</option><option value="add">Ingreso adicional</option><option value="subtract">Deducción o descuento</option></select></label>
          <button type="button" className={`text-btn ${styles.full}`} onClick={()=>{edit();setConcepts(current=>current.filter(concept=>concept.id!==item.id));}}>Quitar concepto {index+1}</button>
        </fieldset>)}
        <button type="button" className="secondary wide" onClick={()=>{edit();setConcepts(current=>[...current,{id:crypto.randomUUID(),name:"",amount:"",sign:""}]);}}>＋ Agregar concepto</button>
      </section>
      <section className={styles.total} aria-live="polite" aria-atomic="true"><span>Total del ingreso a registrar</span><strong>{completeConcepts&&Number.isSafeInteger(total)?display(total):"Completa los conceptos"}</strong><dl><div><dt>Salario recibido</dt><dd>{Number.isSafeInteger(salaryAmount)?display(salaryAmount):"—"}</dd></div>{numericConcepts.map(item=><div key={item.id}><dt>{item.name||"Concepto adicional"}</dt><dd>{item.sign==="subtract"?"−":"+"}{Number.isSafeInteger(item.amount)?display(item.amount):"—"}</dd></div>)}</dl></section>
      <div className={styles.reception}><AccountSelector label="Cuenta receptora" ariaLabel="Cuenta receptora" accounts={ledger.accounts} value={accountId} onChange={value=>{setAccountId(value);edit();}} onCreate={onCreateAccount} display={display}/><label>Medio de recepción<select value={method} onChange={event=>{setMethod(event.target.value);edit();}}>{incomeReceptionMethods.map(value=><option key={value}>{value}</option>)}</select></label><label className={styles.full}>Fecha efectiva del pago<input type="datetime-local" required max={salaryLocalDateTime()} value={date} onChange={event=>{setDate(event.target.value);edit();}}/></label></div>
      <details className={styles.details}><summary>Más detalles y ajustes</summary><label>Referencia<input value={reference} onChange={event=>{setReference(event.target.value);edit();}}/></label><label>Notas<textarea value={notes} onChange={event=>{setNotes(event.target.value);edit();}}/></label><button type="button" className="secondary wide" onClick={()=>requestDiscard(()=>onDetailed(config.id,period.id))}>Registro detallado</button><small>Vincular ingresos existentes, aplicar un depósito a varias semanas o revisar la referencia salarial.</small></details>
      {(error||props.error)&&<p className="form-error" role="alert">{error||props.error}</p>}
      <button type="submit" className="primary wide" disabled={saving||!validTotal||!accountId}>{saving?"Registrando…":"Confirmar y registrar pago"}</button><button type="button" className="secondary wide" onClick={close}>Cancelar</button>
    </fieldset>
  </form></FinanceDialog>;
}
