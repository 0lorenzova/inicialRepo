"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { deriveFinanceNotifications, type FinanceNotification, type NotificationEnvelope, type NotificationDestination } from "@/lib/finance-notifications";
import type { LedgerMovement, Loan } from "@/lib/finance-ledger";
import { FinanceDialog } from "./finance-dialog";
import { uiCopyEs } from "@/lib/ui-copy";
import { NotificationCard } from "./finance-notifications";
import styles from "./finance-notifications.module.css";

export function OpeningAttention({envelopes,movements,loans,today,ready,privateMode,showAmounts=false,onNavigate,renderPayment}:{envelopes:NotificationEnvelope[];movements:LedgerMovement[];loans:Loan[];today:string;ready:boolean;privateMode:boolean;showAmounts?:boolean;onNavigate:(destination:NotificationDestination)=>void;renderPayment:(event:FinanceNotification)=>ReactNode}) {
  const [checked,setChecked]=useState(false),[open,setOpen]=useState(false),[expandedId,setExpandedId]=useState<string|null>(null);
  const events=useMemo(()=>deriveFinanceNotifications(movements,envelopes,today,loans),[movements,envelopes,loans,today]);
  useEffect(()=>{
    if(!ready||checked)return;
    const timer=window.setTimeout(()=>{setChecked(true);setOpen(events.length>0);},0);
    return()=>window.clearTimeout(timer);
  },[ready,checked,events]);
  if(!open||!events.length)return null;
  return <FinanceDialog label="Notificaciones" onClose={()=>setOpen(false)} maxWidth={560}><section className={`flow-modal ${styles.dialog}`}>
    <header><div className={styles.dialogHeaderCopy}><h2>Notificaciones</h2><p className={styles.dialogSubtitle}>Tus recordatorios y alertas importantes</p></div><button type="button" aria-label="Cerrar notificaciones" onClick={()=>setOpen(false)}>×</button></header>
    <div className={styles.body}>
      <ul className={styles.list}>{events.slice(0,5).map(event=><NotificationCard key={event.id} event={event} today={today} privateMode={privateMode} showAmount={showAmounts} expanded={expandedId===event.id} onToggleExpanded={()=>setExpandedId(current=>current===event.id?null:event.id)} onNavigate={destination=>{setOpen(false);onNavigate(destination);}} renderPayment={renderPayment}/>)}</ul>
      <button className={styles.allNotices} type="button" onClick={()=>{setOpen(false);onNavigate({page:"Cronograma"});}}><span><b>Ver todos los avisos</b><small>{uiCopyEs.calendarActions.openNamed}</small></span><span aria-hidden="true">›</span></button>
    </div>
  </section></FinanceDialog>;
}
