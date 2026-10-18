"use client";
import {SalaryPeriodActivation} from "./salary-period-activation";
import {useRef,useState} from 'react';
import {SalaryAdjustments,SalaryEstimation} from './salary-adjustments';
import {FinanceDialog} from './finance-dialog';
import {SalaryPeriodCalendar} from './salary-period-calendar';
import {salaryViewerDay,salaryDateLabel,salaryWorkSchedule} from '@/lib/salary-dates';
import {saveSalaryPeriod,adjacentSalaryPeriod,salaryPeriodForDate,salaryPeriodPresentation,salaryPeriodLabel,salaryTemporalLabel,salaryPaymentValid,salaryConceptPaid,salaryPaymentTiming,salaryState,type SalaryPeriod,type SalaryLedger,type SalaryConfig} from '@/lib/salary-tracking';
import {sortSalaryHistory} from '@/lib/salary-history';
import styles from './salary-receive-dialog.module.css';
import status from './salary-status.module.css';
import planning from './salary-planning.module.css';
const day=salaryDateLabel;
export function SalaryPeriodReport({ledger,config,today,display,onClose,onMovement,initialDate=today,planningTitle,onSave,onEdit}:{initialDate?:string;planningTitle?:string;onSave?:(operation:(current:SalaryLedger)=>SalaryLedger)=>void;onEdit?:(period:SalaryPeriod)=>void;ledger:SalaryLedger;config:SalaryConfig;today:string;display:(n:number)=>string;onClose:()=>void;onMovement:(id:string)=>void}) {
  const [date,setDate]=useState(initialDate),[month,setMonth]=useState(initialDate.slice(0,7)),[calendar,setCalendar]=useState(false),[error,setError]=useState('');
  const saving=useRef(false);
  const title=planningTitle??"Resumen del período";
  const [notice,setNotice]=useState('');
  const selectDate=(value:string)=>{setDate(value);setMonth(value.slice(0,7));setError('');setNotice('');saving.current=false;};
  let period=null;try{period=salaryPeriodForDate(ledger,config.id,date);}catch{/* Display a clear date-selection message below. */}
  const view=period?salaryPeriodPresentation(ledger,period,today):null;
  const state=salaryState(ledger),saved=state.periods.some(p=>p.id===period?.id);
  const payments=sortSalaryHistory(state.payments.filter(p=>salaryPaymentValid(ledger,p)&&p.applications.some(a=>a.periodId===period?.id)),state.historyOrder??'newest',p=>p.date);
  const move=(direction:-1|1)=>{if(!period)return;try{const next=adjacentSalaryPeriod(ledger,period,direction);selectDate(next.start);}catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar de período.');}};
  const saveProjection=()=>{
    if(!period||saved||!onSave||saving.current)return;
    saving.current=true;
    try{onSave(current=>saveSalaryPeriod(current,{...period,earned:false},null,today,"Proyección opcional confirmada por el usuario"));setError('');setNotice('Proyección guardada. No se registró ningún ingreso.');}
    catch(e){saving.current=false;setError(e instanceof Error?e.message:'No se pudo guardar la proyección.');}
  };
  return <FinanceDialog label={title} onClose={onClose} maxWidth={620}><section className={styles.dialog}>
    <header><h2>{title}</h2><button className="secondary" aria-label="Cerrar" onClick={onClose}>×</button></header>
    <label>Consultar fecha<input type="date" value={date} onChange={e=>{if(e.target.value){selectDate(e.target.value);}}}/></label>
    {period&&view?<><div className={`${styles.periodHeading} ${status.surface}`} data-tone={view.tone}>
      <button className="secondary" aria-label="Período anterior" onClick={()=>move(-1)}>‹</button><div><strong>{salaryPeriodLabel(period,config)}</strong><small>{salaryTemporalLabel(ledger,period,salaryViewerDay())}</small><small>{day(period.start)} — {day(period.end)}</small><small>{view.state}{view.overdueLabel?` · ${view.overdueLabel}`:''}</small></div><button className="secondary" aria-label="Período siguiente" onClick={()=>move(1)}>›</button><button className="secondary" aria-expanded={calendar} onClick={()=>setCalendar(!calendar)}>Calendario</button>
    </div>
    {calendar&&<SalaryPeriodCalendar ledger={ledger} config={config} selected={period} today={today} month={month} onMonth={setMonth} onSelect={value=>{selectDate(salaryPeriodForDate(ledger,config.id,value).start);}}/>}
    {planningTitle&&<details className={planning.panel}><summary>Opciones de la referencia salarial</summary><div className="review-box">
      <p>{saved?'Este período ya está guardado. Puedes consultar o corregir sus datos sin duplicarlo.':'Guardar conserva esta proyección y sus conceptos; no confirma trabajo realizado ni modifica cuentas o sobres.'}</p>
      {!saved&&<button className="primary" onClick={saveProjection}>Guardar proyección</button>}
      {onEdit&&<button className="secondary" onClick={()=>onEdit(period)}>{saved?'Corregir datos y conceptos':'Ajustar fechas y conceptos'}</button>}
      <button className="secondary" onClick={onClose}>Cerrar</button>
    </div></details>}
    {notice&&<p role="status">{notice}</p>}
    <div className="review-box">{!view.historicalEmpty&&<span>Esperado / proyectado: <b>{view.estimateKnown?display(view.expected):"Sin proyección"}</b></span>}<span>Realmente recibido: <b>{display(view.received)}</b></span><span>Pendiente confirmado: <b>{display(view.pending)}</b></span><span>Pago previsto: <b>{day(period.payDate)}</b></span></div>
    {onSave&&<SalaryPeriodActivation key={`activate:${period.id}`} {...{ledger,period,today,display,onSave}}/>}
    <SalaryEstimation key={`estimate:${period.id}`} {...{ledger,period,today,display}}/><SalaryAdjustments key={`adjust:${period.id}`} {...{ledger,period,today,display,onSave}}/><details className={planning.panel}><summary>Base de cálculo y conceptos conservados</summary><p>{saved?'Referencia conservada con sus datos originales.':'Proyección calculada; no hay un período guardado.'} Consultar no registra dinero ni confirma días trabajados.</p><small>{salaryWorkSchedule(period)}</small>{!view.historicalEmpty&&<h3>Conceptos conservados</h3>}{!view.historicalEmpty&&view.estimateKnown&&period.concepts.map(c=><p key={c.id}>{c.name}: {display(c.amount)} · Recibido {display(salaryConceptPaid(ledger,period.id,c.id))}</p>)}</details>
    <details className={planning.panel}><summary>Pagos y abonos ({payments.length})</summary>{!payments.length&&<p>No hay pagos registrados para este período.</p>}{payments.map(p=><div className="review-box" key={p.id}><b>{day(p.date)} · {display(p.applications.filter(a=>a.periodId===period.id).reduce((n,a)=>n+a.amount,0))}</b><span>{salaryPaymentTiming(period,p.date).label}</span><span>{p.historical?'Histórico; sin entrada bancaria':p.method}</span>{p.reference&&<span>{p.reference}</span>}{!p.historical&&<button className="secondary" onClick={()=>{onClose();onMovement(p.movementId);}}>Ver movimiento</button>}</div>)}</details>
    </>:<p role="alert">No hay una referencia disponible para esta fecha. Selecciona otra fecha o consulta el período histórico que la contiene.</p>}{error&&<p role="alert">{error}</p>}
  </section></FinanceDialog>;
}
