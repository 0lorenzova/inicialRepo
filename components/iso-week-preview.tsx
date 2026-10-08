"use client";
import { useState } from "react";
import { isoWeekRange } from "@/lib/iso-week-range";
import { calendarDays } from "@/lib/planning-calendar";
import { FinanceDialog } from "./finance-dialog";
import styles from "./planning-calendar.module.css";

export function IsoWeekPreview({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  let range: ReturnType<typeof isoWeekRange>;
  try { range = isoWeekRange(date); } catch { return null; }
  const months = [...new Set([range.from.slice(0, 7), range.to.slice(0, 7)])];
  return <><button type="button" className="secondary wide" style={{height:"auto",whiteSpace:"normal",textAlign:"left",padding:12}} onClick={() => setOpen(true)}><strong>Semana {range.week} · {range.year} (ISO 8601)</strong><br />{range.label}<br /><small>Ver calendario</small></button>
    {open && <FinanceDialog label="Calendario de la semana ISO" onClose={() => setOpen(false)}><section className="flow-modal"><header><h2>Semana {range.week} · {range.year}</h2><button type="button" aria-label="Cerrar calendario de semana" onClick={() => setOpen(false)}>×</button></header><div className="flow-body"><p>{range.label}</p><small>Calendario de consulta. La semana está resaltada; no modifica la fecha del movimiento.</small>{months.map(month => {
      const days = calendarDays(`${month}-01`);
      return <section key={month}><h3>{new Intl.DateTimeFormat("es-CR", {timeZone:"UTC",month:"long",year:"numeric"}).format(new Date(`${month}-01T12:00:00Z`))}</h3><div className={styles.month}>{["L","M","X","J","V","S","D"].map((day,index)=><span className={styles.weekday} key={index}>{day}</span>)}{Array.from({length:days.offset},(_,index)=><span key={`blank-${index}`}/>)}{days.dates.map(day=><span key={day} className={styles.day} data-today={day>=range.from&&day<=range.to} aria-label={`${day}${day>=range.from&&day<=range.to?", semana seleccionada":""}`}>{Number(day.slice(-2))}</span>)}</div></section>;
    })}<button type="button" className="primary wide" onClick={()=>setOpen(false)}>Cerrar</button></div></section></FinanceDialog>}
  </>;
}
