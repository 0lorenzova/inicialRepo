"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import MailOutlineOutlined from "@mui/icons-material/MailOutlineOutlined";
import { deriveFinanceNotifications, type NotificationEnvelope, type NotificationDestination } from "@/lib/finance-notifications";
import type { Loan } from "@/lib/finance-ledger";
import { FinanceDialog } from "./finance-dialog";
import { isTemporalDescription, notificationCopy, notificationDateLabel, notificationTimeLabel, responsibilityAmount } from "./finance-notifications";
import styles from "./finance-notifications.module.css";

export function OpeningAttention({envelopes,loans,today,ready,privateMode,showAmounts=false,onNavigate,renderPayment}:{envelopes:NotificationEnvelope[];loans:Loan[];today:string;ready:boolean;privateMode:boolean;showAmounts?:boolean;onNavigate:(destination:NotificationDestination)=>void;renderPayment:(destination:NotificationDestination)=>ReactNode}) {
  const [checked,setChecked]=useState(false),[open,setOpen]=useState(false);
  const events=useMemo(()=>deriveFinanceNotifications([],envelopes,today,loans),[envelopes,loans,today]);
  useEffect(()=>{
    if(!ready||checked)return;
    const timer=window.setTimeout(()=>{setChecked(true);setOpen(events.length>0);},0);
    return()=>window.clearTimeout(timer);
  },[ready,checked,events]);
  if(!open||!events.length)return null;
  return <FinanceDialog label="Notificaciones" onClose={()=>setOpen(false)} maxWidth={680}><section className={`flow-modal ${styles.dialog}`}>
    <header><div className={styles.dialogHeaderCopy}><h2>Notificaciones</h2><p className={styles.dialogSubtitle}>Tus recordatorios y alertas importantes</p></div><button type="button" aria-label="Cerrar notificaciones" onClick={()=>setOpen(false)}>×</button></header>
    <div className={styles.body}>
      <p className={styles.attentionIntro}>{events.length} {events.length===1?"aviso requiere":"avisos requieren"} atención. Abre uno para consultar sus detalles o continúa a tu espacio.</p>
      <ul className={styles.list}>{events.slice(0,5).map(event=>{
        const copy=notificationCopy(event,privateMode);
        const description=isTemporalDescription(copy.description)?"":copy.description;
        const showAmount=showAmounts&&!privateMode;
        return <li className={styles.item} key={event.id}>
          <div className={styles.itemMain}>
            <span className={styles.noticeIcon} aria-hidden="true"><MailOutlineOutlined/></span>
            <button type="button" className={styles.open} onClick={()=>{setOpen(false);onNavigate(event.destination);}} aria-label={`Abrir ${copy.concept}, ${event.destination.page}`}>
              <span className={styles.primaryLine}>
                <span className={styles.headingGroup}><span className={styles.priorityDot} data-tone={event.tone??"neutral"} aria-hidden="true"/><strong className={styles.concept}>{copy.concept}</strong></span>
                <span className={styles.amountGroup}><span className={styles.timeBadge} data-tone={event.tone??"neutral"} title={event.title}>{notificationTimeLabel(event,today)}</span>{showAmount&&<b className={styles.amount}>{responsibilityAmount(event.amount)}</b>}</span>
                <span className={styles.chevron} aria-hidden="true">›</span>
              </span>
              {copy.context&&<span className={styles.context}>{copy.context}</span>}
              {description&&<span className={styles.description}>{description}</span>}
              <span className={styles.metaLine}>
                <span className={styles.date}><CalendarMonthOutlined aria-hidden="true"/><time dateTime={event.date}>{notificationDateLabel(event.date)}</time></span>
                <span className={styles.destination}><CalendarMonthOutlined aria-hidden="true"/>Abrir {event.destination.page.toLowerCase()}</span>
              </span>
            </button>
          </div>
          <div className={styles.attentionPayment}>{renderPayment(event.destination)}</div>
        </li>;
      })}</ul>
      {events.length>5&&<small>También tienes {events.length-5} avisos más en la campana.</small>}
      <button type="button" className="primary wide" onClick={()=>setOpen(false)}>Continuar</button>
      <small>Asignar fondos no registra pagos ni devoluciones.</small>
    </div>
  </section></FinanceDialog>;
}
