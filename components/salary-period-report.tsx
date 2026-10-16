"use client";
import {useState} from 'react';
import {FinanceDialog} from './finance-dialog';
import {SalaryPeriodCalendar} from './salary-period-calendar';
import {salaryViewerDay} from '@/lib/salary-dates';
import {adjacentSalaryPeriod,salaryPeriodForDate,salaryPeriodPresentation,salaryPeriodLabel,salaryTemporalLabel,salaryPaymentValid,salaryConceptPaid,salaryPaymentTiming,salaryState,type SalaryLedger,type SalaryConfig} from '@/lib/salary-tracking';
import {sortSalaryHistory} from '@/lib/salary-history';
import styles from './salary-receive-dialog.module.css';
import status from './salary-status.module.css';
const day=(s:string)=>new Intl.DateTimeFormat('es-CR',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${s.slice(0,10)}T12:00:00Z`));
export function SalaryPeriodReport({ledger,config,today,display,onClose,onMovement}:{ledger:SalaryLedger;config:SalaryConfig;today:string;display:(n:number)=>string;onClose:()=>void;onMovement:(id:string)=>void}) {
  const [date,setDate]=useState(today),[month,setMonth]=useState(today.slice(0,7)),[calendar,setCalendar]=useState(false),[error,setError]=useState('');
  let period=null;try{period=salaryPeriodForDate(ledger,config.id,date);}catch{/* Display a clear date-selection message below. */}
  const view=period?salaryPeriodPresentation(ledger,period,today):null;
  const state=salaryState(ledger),saved=state.periods.some(p=>p.id===period?.id);
  const payments=sortSalaryHistory(state.payments.filter(p=>salaryPaymentValid(ledger,p)&&p.applications.some(a=>a.periodId===period?.id)),state.historyOrder??'newest',p=>p.date);
  const move=(direction:-1|1)=>{if(!period)return;try{const next=adjacentSalaryPeriod(ledger,period,direction);setDate(next.start);setMonth(next.start.slice(0,7));setError('');}catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar de período.');}};
  return <FinanceDialog label="Resumen del período" onClose={onClose} maxWidth={620}><section className={styles.dialog}>
    <header><h2>Resumen del período</h2><button className="secondary" aria-label="Cerrar" onClick={onClose}>×</button></header>
    <label>Consultar fecha<input type="date" value={date} onChange={e=>{if(e.target.value){setDate(e.target.value);setMonth(e.target.value.slice(0,7));setError('');}}}/></label>
    {period&&view?<><div className={`${styles.periodHeading} ${status.surface}`} data-tone={view.tone}>
      <button className="secondary" aria-label="Período anterior" onClick={()=>move(-1)}>‹</button><div><strong>{salaryPeriodLabel(period,config)}</strong><small>{salaryTemporalLabel(ledger,period,salaryViewerDay())}</small><small>{day(period.start)} — {day(period.end)}</small><small>{view.state}{view.overdueLabel?` · ${view.overdueLabel}`:''}</small></div><button className="secondary" aria-label="Período siguiente" onClick={()=>move(1)}>›</button><button className="secondary" aria-expanded={calendar} onClick={()=>setCalendar(!calendar)}>Almanaque</button>
    </div>
    {calendar&&<SalaryPeriodCalendar ledger={ledger} config={config} selected={period} today={today} month={month} onMonth={setMonth} onSelect={setDate}/>}
    <p>{saved?'Referencia conservada con sus datos originales.':'Proyección calculada; no hay un período guardado.'} Consultar no registra dinero ni confirma días trabajados.</p>
    <div className="review-box"><span>Esperado / proyectado: <b>{display(view.expected)}</b></span><span>Realmente recibido: <b>{display(view.received)}</b></span><span>Por recibir según lo previsto: <b>{display(view.remaining)}</b></span><span>Pago previsto: <b>{day(period.payDate)}</b></span></div>
    <h3>Conceptos</h3>{period.concepts.map(c=><p key={c.id}>{c.name}: {display(c.amount)} · Recibido {display(salaryConceptPaid(ledger,period.id,c.id))}</p>)}
    <h3>Pagos y abonos ({payments.length})</h3>{!payments.length&&<p>No hay pagos registrados para este período.</p>}{payments.map(p=><div className="review-box" key={p.id}><b>{day(p.date)} · {display(p.applications.filter(a=>a.periodId===period.id).reduce((n,a)=>n+a.amount,0))}</b><span>{salaryPaymentTiming(period,p.date).label}</span><span>{p.historical?'Histórico; sin entrada bancaria':p.method}</span>{p.reference&&<span>{p.reference}</span>}{!p.historical&&<button className="secondary" onClick={()=>{onClose();onMovement(p.movementId);}}>Ver movimiento</button>}</div>)}
    </>:<p role="alert">No hay una referencia disponible para esta fecha. Selecciona otra fecha o consulta el período histórico que la contiene.</p>}{error&&<p role="alert">{error}</p>}
  </section></FinanceDialog>;
}
