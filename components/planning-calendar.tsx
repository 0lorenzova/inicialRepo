"use client";
import { calendarDays, calendarEntries, calendarRange, calendarScales, shiftCalendar, type CalendarEntry, type CalendarEnvelope, type CalendarScale } from "@/lib/planning-calendar";
import { PlanningItemSummary } from "./envelope-planning";
import styles from "./planning-calendar.module.css";

export function PlanningCalendar({envelopes,today,date,scale,onChange,onSelect,display,privateMode}:{
  envelopes:CalendarEnvelope[];today:string;date:string;scale:CalendarScale;onChange:(date:string,scale:CalendarScale)=>void;
  onSelect:(entry:CalendarEntry)=>void;display:(amount:number)=>string;privateMode:boolean;
}) {
  const entries=calendarEntries(envelopes,today), range=calendarRange(date,scale);
  const visible=entries.filter(entry=>entry.date>=range.from&&entry.date<=range.to);
  const month=calendarDays(date);
  const label=(value:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat("es-CR",{timeZone:"America/Costa_Rica",...options}).format(new Date(`${value}T12:00:00Z`));
  return <section className={`section page-panel ${styles.calendar}`}>
    <div className={styles.controls}><label>Vista<select value={scale} onChange={event=>onChange(date,event.target.value as CalendarScale)}>{calendarScales.map(value=><option key={value}>{value}</option>)}</select></label><label>Fecha<input type="date" min="0001-01-01" max="9999-12-31" value={date} onChange={event=>{const value=event.target.value;if(!value)return;try{calendarRange(value,scale);}catch{return;}onChange(value,scale);}}/></label><button className="secondary" onClick={()=>onChange(today,scale)}>Hoy</button></div>
    <div className={styles.period}><button className="secondary" aria-label="Período anterior" onClick={()=>onChange(shiftCalendar(date,scale,-1),scale)}>‹</button><h2>{scale==="Año"?date.slice(0,4):scale==="Semana"?`${label(range.from,{day:"numeric",month:"short"})} – ${label(range.to,{day:"numeric",month:"short",year:"numeric"})}`:label(date,scale==="Mes"?{month:"long",year:"numeric"}:{day:"numeric",month:"long",year:"numeric"})}</h2><button className="secondary" aria-label="Período siguiente" onClick={()=>onChange(shiftCalendar(date,scale,1),scale)}>›</button></div>
    <p className="flow-intro">Fechas pendientes guardadas en tus sobres. Las repeticiones muestran su próxima ocurrencia registrada; ningún aporte ni pago se realiza automáticamente.</p>
    {scale==="Mes"&&<div className={styles.month} aria-label="Calendario mensual">{["L","M","X","J","V","S","D"].map(day=><span className={styles.weekday} key={day} aria-hidden="true">{day}</span>)}{Array.from({length:month.offset},(_,i)=><span key={`blank-${i}`}/>)}{month.dates.map(day=>{const count=entries.filter(entry=>entry.date===day).length;return <button key={day} className={styles.day} data-today={day===today} aria-label={`${label(day,{dateStyle:"long"})}: ${count} pendientes`} onClick={()=>onChange(day,"Día")}><b>{Number(day.slice(-2))}</b>{count>0&&<small>{count}<span className={styles.srOnly}> pendientes</span></small>}</button>;})}</div>}
    {scale==="Año"&&<div className={styles.year}>{Array.from({length:12},(_,i)=>`${date.slice(0,4)}-${String(i+1).padStart(2,"0")}-01`).map(day=><button className="secondary" key={day} onClick={()=>onChange(day,"Mes")}><b>{label(day,{month:"long"})}</b><small>{entries.filter(entry=>entry.date.slice(0,7)===day.slice(0,7)).length} pendientes</small></button>)}</div>}
    <h3>{visible.length} {visible.length===1?"pendiente":"pendientes"} en este período</h3>
    <div className={styles.entries}>{visible.map(entry=><button className={styles.entry} key={entry.key} onClick={()=>onSelect(entry)}><small>{entry.envelopeName} · {label(entry.date,{day:"numeric",month:"short"})}</small>{entry.item?<PlanningItemSummary item={entry.item} today={today} display={display} privateMode={privateMode}/>:<><b>Aporte recurrente</b><span>{display(entry.amount)}</span><small>Consultar configuración del aporte</small></>}</button>)}</div>
    {!visible.length&&<p className="empty-state">No hay metas, importes ni aportes pendientes con fecha en este período.</p>}
    <p className="flow-intro">Las metas sin fecha se consultan desde su sobre. Los pagos realizados permanecen en Movimientos.</p>
  </section>;
}
