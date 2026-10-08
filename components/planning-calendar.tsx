"use client";
import { calendarDays, calendarEntryTone, calendarEntries, calendarRange, calendarScales, shiftCalendar, type CalendarEntry, type CalendarEnvelope, type CalendarScale } from "@/lib/planning-calendar";
import { proximityTones, proximityLabels } from "@/lib/envelope-planning";
import { TemporalDot, TemporalBadge } from "./temporal-indicator";
import { PlanningItemSummary } from "./envelope-planning";
import styles from "./planning-calendar.module.css";

export function PlanningCalendar({envelopes,today,date,scale,onChange,onSelect,display,privateMode,embedded=false}:{
  envelopes:CalendarEnvelope[];today:string;date:string;scale:CalendarScale;onChange:(date:string,scale:CalendarScale)=>void;
  onSelect?:(entry:CalendarEntry)=>void;embedded?:boolean;display:(amount:number)=>string;privateMode:boolean;
}) {
  const entries=calendarEntries(envelopes,today), range=calendarRange(date,scale);
  const visible=entries.filter(entry=>entry.date>=range.from&&entry.date<=range.to);
  const months = scale === "Semana" ? [...new Set([range.from.slice(0,7),range.to.slice(0,7)])] : [date.slice(0,7)];
  const tonesFor=(items:CalendarEntry[])=>proximityTones.filter(tone=>items.some(entry=>calendarEntryTone(entry,today)===tone));
  const dots=(items:CalendarEntry[])=> <span className={styles.dots} aria-hidden="true">{tonesFor(items).map(tone=><TemporalDot key={tone} tone={tone}/>)}</span>;
  const toneLabel=(items:CalendarEntry[])=>tonesFor(items).map(tone=>`${items.filter(entry=>calendarEntryTone(entry,today)===tone).length} ${proximityLabels[tone]}`).join(", ");
  const label=(value:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat("es-CR",{timeZone:"America/Costa_Rica",...options}).format(new Date(`${value}T12:00:00Z`));
  return <section className={`${embedded?"":"section page-panel"} ${styles.calendar}`}>
    <div className={styles.shortcuts} role="group" aria-label="Consultar período">{([ ["Hoy","Día"], ["Esta semana","Semana"], ["Este mes","Mes"], ["Año","Año"] ] as const).map(([name,value])=><button type="button" className="secondary" key={value} aria-pressed={scale===value && calendarRange(today,value).from===range.from} onClick={()=>onChange(today,value)}>{name}</button>)}</div>
    <div className={styles.controls}><label>Vista<select value={scale} onChange={event=>onChange(date,event.target.value as CalendarScale)}>{calendarScales.map(value=><option key={value}>{value}</option>)}</select></label><label>Fecha<input type="date" min="0001-01-01" max="9999-12-31" value={date} onChange={event=>{const value=event.target.value;if(!value)return;try{calendarRange(value,scale);}catch{return;}onChange(value,scale);}}/></label></div>
    <div className={styles.period}><button className="secondary" aria-label="Período anterior" onClick={()=>onChange(shiftCalendar(date,scale,-1),scale)}>‹</button><h2>{scale==="Año"?date.slice(0,4):scale==="Semana"?`${label(range.from,{day:"numeric",month:"short"})} – ${label(range.to,{day:"numeric",month:"short",year:"numeric"})}`:label(date,scale==="Mes"?{month:"long",year:"numeric"}:{day:"numeric",month:"long",year:"numeric"})}</h2><button className="secondary" aria-label="Período siguiente" onClick={()=>onChange(shiftCalendar(date,scale,1),scale)}>›</button></div>
    <p className="flow-intro">Fechas pendientes guardadas en tus sobres. Las repeticiones muestran su próxima ocurrencia registrada; ningún aporte ni pago se realiza automáticamente.</p>
    <div className={styles.legend} aria-label="Colores de proximidad">{proximityTones.map(tone=><span key={tone}><TemporalDot tone={tone}/>{proximityLabels[tone]}</span>)}</div>
    {(scale==="Mes"||scale==="Semana")&&months.map(month=>{const grid=calendarDays(`${month}-01`);return <section key={month}><h3>{label(`${month}-01`,{month:"long",year:"numeric"})}</h3><div className={styles.month} aria-label="Calendario mensual">{["L","M","X","J","V","S","D"].map(day=><span className={styles.weekday} key={day} aria-hidden="true">{day}</span>)}{Array.from({length:grid.offset},(_,i)=><span key={`blank-${i}`}/>)}{grid.dates.map(day=>{const items=entries.filter(entry=>entry.date===day);return <button type="button" key={day} className={styles.day} data-today={day===today} data-selected={scale==="Semana"&&day>=range.from&&day<=range.to} aria-label={`${label(day,{dateStyle:"long"})}: ${items.length} pendientes${items.length?`, ${toneLabel(items)}`:""}`} onClick={()=>onChange(day,"Día")}><b>{Number(day.slice(-2))}</b>{dots(items)}{items.length>0&&<small>{items.length}<span className={styles.srOnly}> pendientes</span></small>}</button>;})}</div></section>;})}
    {scale==="Año"&&<div className={styles.year}>{Array.from({length:12},(_,i)=>`${date.slice(0,4)}-${String(i+1).padStart(2,"0")}-01`).map(day=>{const items=entries.filter(entry=>entry.date.slice(0,7)===day.slice(0,7));return <button type="button" className="secondary" key={day} aria-label={`${label(day,{month:"long"})}: ${items.length} pendientes, ${toneLabel(items)}`} onClick={()=>onChange(day,"Mes")}><b>{label(day,{month:"long"})}</b>{dots(items)}<small>{items.length} pendientes</small></button>;})}</div>}
    <h3>{visible.length} {visible.length===1?"pendiente":"pendientes"} en este período</h3>
    <div className={styles.entries}>{visible.map(entry=>{const content=<><small>{privateMode?"Sobre":entry.envelopeName} · {label(entry.date,{day:"numeric",month:"short"})}</small>{entry.item?<PlanningItemSummary item={entry.item} today={today} display={display} privateMode={privateMode}/>:<><b>Aporte recurrente</b><TemporalBadge tone={calendarEntryTone(entry,today)} date={entry.date} today={today}/><span>{display(entry.amount)}</span><small>Requiere confirmar el aporte</small></>}</>;return onSelect?<button type="button" className={styles.entry} key={entry.key} onClick={()=>onSelect(entry)}>{content}</button>:<article className={styles.entry} key={entry.key}>{content}</article>;})}</div>
    {!visible.length&&<p className="empty-state">No hay metas, importes ni aportes pendientes con fecha en este período.</p>}
    <p className="flow-intro">Las metas sin fecha se consultan desde su sobre. Los pagos realizados permanecen en Movimientos.</p>
  </section>;
}
