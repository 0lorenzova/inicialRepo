"use client";
import { useState } from "react";
import { isoWeekRange } from "@/lib/iso-week-range";
import type { CalendarEnvelope, CalendarScale } from "@/lib/planning-calendar";
import { FinanceDialog } from "./finance-dialog";
import { PlanningCalendar } from "./planning-calendar";

export function IsoWeekPreview({date,envelopes,today,display,privateMode}:{date:string;envelopes:CalendarEnvelope[];today:string;display:(amount:number)=>string;privateMode:boolean}) {
  const [open,setOpen]=useState(false);
  const [calendar,setCalendar]=useState<{date:string;scale:CalendarScale}>({date:today,scale:"Semana"});
  let range:ReturnType<typeof isoWeekRange>;
  try {range=isoWeekRange(date);}catch{return null;}
  return <><button type="button" className="secondary wide" style={{height:"auto",whiteSpace:"normal",textAlign:"left",padding:12}} onClick={()=>{setCalendar({date:range.from,scale:"Semana"});setOpen(true);}}><strong>Semana {range.week} · {range.year} (ISO 8601)</strong><br/>{range.label}<br/><small>Ver calendario y obligaciones</small></button>
    {open&&<FinanceDialog label="Calendario de obligaciones" maxWidth={760} onClose={()=>setOpen(false)}><section className="flow-modal"><header><h2>Calendario de obligaciones</h2><button type="button" aria-label="Cerrar calendario de semana" onClick={()=>setOpen(false)}>×</button></header><div className="flow-body"><p>Consulta tus responsabilidades antes de distribuir el ingreso. Cambiar de período no modifica la fecha ni los datos del movimiento.</p><PlanningCalendar embedded envelopes={envelopes} today={today} date={calendar.date} scale={calendar.scale} onChange={(value,scale)=>setCalendar({date:value,scale})} display={display} privateMode={privateMode}/><button type="button" className="primary wide" onClick={()=>setOpen(false)}>Cerrar calendario</button></div></section></FinanceDialog>}
  </>;
}
