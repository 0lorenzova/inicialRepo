"use client";
import { useEffect, useMemo, useState } from "react";
import { deriveFinanceNotifications, type NotificationEnvelope, type NotificationDestination } from "@/lib/finance-notifications";
import { FinanceDialog } from "./finance-dialog";
import { TemporalDot } from "./temporal-indicator";

export function OpeningAttention({envelopes,today,ready,privateMode,onNavigate}:{envelopes:NotificationEnvelope[];today:string;ready:boolean;privateMode:boolean;onNavigate:(destination:NotificationDestination)=>void}) {
  const [checked,setChecked]=useState(false),[open,setOpen]=useState(false);
  const events=useMemo(()=>deriveFinanceNotifications([],envelopes,today),[envelopes,today]);
  useEffect(()=>{
    if(!ready||checked)return;
    const timer=window.setTimeout(()=>{setChecked(true);setOpen(events.length>0);},0);
    return()=>window.clearTimeout(timer);
  },[ready,checked,events]);
  if(!open||!events.length)return null;
  return <FinanceDialog label="Obligaciones que requieren atención" onClose={()=>setOpen(false)}><section className="flow-modal"><header><h2>Atención</h2><button type="button" aria-label="Cerrar resumen de atención" onClick={()=>setOpen(false)}>×</button></header><div className="flow-body"><p>{events.length} {events.length===1?"obligación requiere":"obligaciones requieren"} atención. Consulta sus detalles o continúa a tu espacio.</p>{events.slice(0,5).map(event=><button key={event.id} type="button" className="attention-item" onClick={()=>{setOpen(false);onNavigate(event.destination);}}><strong>{event.tone&&<TemporalDot tone={event.tone}/>} {event.title}</strong><span>{privateMode?"Detalles ocultos por privacidad.":event.detail}</span></button>)}{events.length>5&&<small>También tienes {events.length-5} avisos más en la campana.</small>}<button type="button" className="primary wide" onClick={()=>setOpen(false)}>Continuar</button><small>Asignar fondos no marca estas obligaciones como pagadas.</small></div></section></FinanceDialog>;
}
