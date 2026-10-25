"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import MoreVertOutlined from "@mui/icons-material/MoreVertOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { SnoozeControl, useReminderSnooze, reminderDateLabel } from "./reminder-snooze";
import { isReminderSnoozed, reminderTargets } from "@/lib/reminder-snooze";
import { FinanceDialog } from "@/components/finance-dialog";
import { appViewActionLabel, uiCopyEs } from "@/lib/ui-copy";
import { TemporalDot } from "./temporal-indicator";
import { temporalDistance } from "@/lib/envelope-goals";
import {
  deriveFinanceNotifications, projectReminderNotifications, initializeNotifications, markNotifications, notificationDetail,
  notificationTones, pendingNotificationDelivery, saveNotificationUpdate, visibleNotifications,
  type FinanceNotification, type NotificationDestination, type NotificationEnvelope,
  type NotificationState, type NotificationTone, type NotificationUpdate,
} from "@/lib/finance-notifications";
import { playNotificationTone, stopNotificationAudio, supportsNotificationAudio } from "@/lib/notification-audio";
import type { LedgerMovement, Loan } from "@/lib/finance-ledger";
import styles from "./finance-notifications.module.css";

export const notificationDateLabel = (date: string) => {
  const instant = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(date) ? date : date.includes("T") ? `${date}-06:00` : `${date}T12:00:00-06:00`);
  return Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "medium" }).format(instant) : date;
};

export function notificationCopy(event: FinanceNotification, privateMode: boolean) {
  if (privateMode) return { concept: event.kind === "reminder" ? "Recordatorio pendiente" : "Obligación pendiente", context: "", description: "" };
  if (event.concept) return { concept: event.concept, context: event.context ?? "", description: event.description ?? "" };

  const detail = notificationDetail(event, false, false);
  const sentenceBreak = detail.indexOf(". ");
  if (event.kind === "attention") {
    const contextBreak = detail.indexOf(" · ");
    const concept = contextBreak < 0 ? detail : detail.slice(0, contextBreak);
    const contextAndDescription = contextBreak < 0 ? "" : detail.slice(contextBreak + 3);
    const descriptionBreak = contextAndDescription.lastIndexOf(". ");
    return {
      concept,
      context: descriptionBreak < 0 ? contextAndDescription : contextAndDescription.slice(0, descriptionBreak),
      description: descriptionBreak < 0 ? "" : contextAndDescription.slice(descriptionBreak + 2),
    };
  }
  if (event.kind === "reminder") {
    const reminderBreak = detail.lastIndexOf(". ");
    return {
      concept: reminderBreak < 0 ? detail : detail.slice(0, reminderBreak),
      context: event.title,
      description: reminderBreak < 0 ? "" : detail.slice(reminderBreak + 2),
    };
  }
  if (event.kind === "loan") return {
    concept: sentenceBreak < 0 ? detail : detail.slice(0, sentenceBreak),
    context: "",
    description: sentenceBreak < 0 ? "" : detail.slice(sentenceBreak + 2),
  };
  return { concept: event.title, context: "", description: detail };
}

export function notificationTimeLabel(event: FinanceNotification, today: string) {
  try {
    const days = temporalDistance(event.date.slice(0, 10), today);
    if (days < 0) return `Vencido hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`;
    if (days === 0) return "Vence hoy";
    return `En ${days} ${days === 1 ? "día" : "días"}`;
  } catch {
    return event.title;
  }
}

export function isTemporalDescription(description: string) {
  return /^(?:Faltan?\s+\d+\s+d[ií]as? para la fecha l[ií]mite|La fecha l[ií]mite es hoy)\.?$/i.test(description.trim());
}

type NotificationFilter = "pending" | "upcoming" | "all";

function notificationStatus(event: FinanceNotification, today: string, dismissed: boolean) {
  if (dismissed) return { key: "dismissed", label: "Aviso descartado" };
  if (event.snoozedUntil && event.snoozedUntil > today) return { key: "snoozed", label: `Pospuesto hasta: ${notificationDateLabel(event.snoozedUntil)}` };
  const date = event.date.slice(0, 10);
  if (date < today) return { key: "overdue", label: notificationTimeLabel(event, today) };
  if (date === today) return { key: "today", label: "Vence hoy" };
  return { key: "upcoming", label: notificationTimeLabel(event, today) };
}

export const responsibilityAmount = (amount: number) => new Intl.NumberFormat("es-CR", {
  style: "currency", currency: "CRC", maximumFractionDigits: 0,
}).format(amount);

export function NotificationCard({ event, today, privateMode, showAmount, read = false, dismissed = false, expanded, onToggleExpanded, onNavigate, onToggleRead, onDismiss, renderPayment }: {
  event: FinanceNotification;
  today: string;
  privateMode: boolean;
  showAmount: boolean;
  read?: boolean;
  dismissed?: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onNavigate: (destination: NotificationDestination) => void;
  onToggleRead?: (event: FinanceNotification) => void;
  onDismiss?: (event: FinanceNotification) => void;
  renderPayment?: (event: FinanceNotification) => ReactNode;
}) {
  const copy = notificationCopy(event, privateMode);
  const status = notificationStatus(event, today, dismissed);
  const amountVisible = showAmount && !privateMode && event.amount > 0;
  const paymentAction = event.actionKind === "payment" ? renderPayment?.(event) : null;
  const actionLabel = event.actionKind === "contribution" ? "Registrar aporte"
    : event.actionKind === "goal" ? "Ver meta"
      : event.actionKind === "loan" ? "Ver préstamo" : "Ver detalle";
  const primaryAction = paymentAction ?? <button type="button" className="secondary" onClick={() => onNavigate(event.destination)}>{actionLabel}</button>;
  const hasDifferentPaymentDate = Boolean(event.plannedPaymentDate && event.plannedPaymentDate.slice(0, 10) !== event.date.slice(0, 10));

  return <li className={styles.item} data-status={status.key} data-unread={!read} data-dismissed={dismissed}>
    <div className={styles.itemMain}>
      <span className={styles.noticeIcon} aria-hidden="true"><TemporalDot className={styles.noticeEnvelope} alwaysVisible tone={event.tone ?? "white"} covered={privateMode ? undefined : event.covered} late={Boolean(event.plannedLate)} alert={event.date.slice(0, 10) < today}/></span>
      <button type="button" className={styles.open} aria-expanded={expanded} onClick={onToggleExpanded} aria-label={`${expanded ? "Contraer" : "Expandir"} ${copy.concept}`}>
        <span className={styles.primaryLine}>
          <strong className={styles.concept}>{copy.concept}</strong>
          {amountVisible && <b className={styles.amount}>{responsibilityAmount(event.amount)}</b>}
          <span className={styles.context}>{copy.context || "Aviso financiero"}</span>
          <span className={styles.timeBadge} data-status={status.key}>{status.label}</span>
        </span>
        <ExpandMoreOutlined className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ""}`} aria-hidden="true"/>
      </button>
    </div>
    {expanded && <div className={styles.expanded}>
      {copy.description && <p className={styles.description}>{copy.description}</p>}
      {event.snoozedUntil && <small>{event.snoozedUntil > today ? "Pospuesto hasta" : "Aviso reactivado"}: {reminderDateLabel(event.snoozedUntil)}</small>}
      <div className={styles.dates}>
        <span className={styles.date}><CalendarMonthOutlined aria-hidden="true"/>Vence <time dateTime={event.date}>{notificationDateLabel(event.date)}</time></span>
        {hasDifferentPaymentDate && <span className={styles.date}><CalendarMonthOutlined aria-hidden="true"/>Pago previsto <time dateTime={event.plannedPaymentDate}>{notificationDateLabel(event.plannedPaymentDate!)}</time></span>}
      </div>
      <div className={styles.expandedActions}>
        <div className={styles.primaryAction}>{primaryAction}</div>
        <details className={styles.moreActions}>
          <summary aria-label="Más opciones" title="Más opciones"><MoreVertOutlined aria-hidden="true"/></summary>
          <div className={styles.moreMenu}>
            <SnoozeControl reminderId={event.reminderKey} actionOnly/>
            <button type="button" onClick={() => onNavigate(event.destination)}>{appViewActionLabel(event.destination.page)}</button>
            {onToggleRead && <button type="button" onClick={() => onToggleRead(event)}>{read ? "Marcar como no leída" : "Marcar como leída"}</button>}
            {onDismiss && !dismissed && <button type="button" onClick={() => onDismiss(event)}>Descartar aviso</button>}
          </div>
        </details>
      </div>
    </div>}
  </li>;
}

function browserCapabilities() {
  const system = !("Notification" in window) ? "unsupported" : !window.isSecureContext ? "insecure" : Notification.permission;
  return `${system}|${supportsNotificationAudio() ? "audio" : "silent"}`;
}
function subscribeCapabilities(listener: () => void) {
  window.addEventListener("focus", listener);
  document.addEventListener("visibilitychange", listener);
  return () => { window.removeEventListener("focus", listener); document.removeEventListener("visibilitychange", listener); };
}
const serverCapabilities = () => "unsupported|silent";

export function FinanceNotifications({
  state, onChange, movements, envelopes, loans, today: initialToday, ready = true, privateMode = false,
  onNavigate, open, onOpen, onClose, renderPayment,
}: {
  renderPayment: (event: FinanceNotification) => ReactNode;
  state: NotificationState;
  onChange: NotificationUpdate;
  movements: LedgerMovement[];
  envelopes: NotificationEnvelope[];
  loans: Loan[];
  today: string;
  ready?: boolean;
  privateMode?: boolean;
  onNavigate: (destination: NotificationDestination) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const snooze = useReminderSnooze();
  const today = snooze?.today ?? initialToday;
  const targets = useMemo(() => snooze?.targets ?? reminderTargets(envelopes, movements, loans, today), [snooze?.targets, envelopes, movements, loans, today]);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const attempted = useRef(new Set<string>());
  const activeNotices = useRef(new Map<Notification, string>());
  const events = useMemo(() => projectReminderNotifications(deriveFinanceNotifications(movements, envelopes, today, loans), state, today, targets), [movements, envelopes, today, loans, state, targets]);
  const visible = useMemo(() => visibleNotifications(state, events), [state, events]);
  const read = useMemo(() => new Set(initializeNotifications(state, events).readIds), [state, events]);
  const dismissed = useMemo(() => new Set(state.dismissedIds), [state.dismissedIds]);
  const pending = visible.filter(event => !isReminderSnoozed(state.snoozes, event.reminderKey, today));
  const unreadEvents = visible.filter(event => !read.has(event.id));
  const upcoming = visible.filter(event => event.date.slice(0, 10) > today || isReminderSnoozed(state.snoozes, event.reminderKey, today));
  const allEvents = useMemo(() => [...events].sort((a, b) => {
    const aDismissed = dismissed.has(a.id), bDismissed = dismissed.has(b.id);
    if (aDismissed !== bDismissed) return aDismissed ? 1 : -1;
    const aDate = a.date.slice(0, 10), bDate = b.date.slice(0, 10);
    const aRank = aDate < today ? 0 : aDate === today ? 1 : 2, bRank = bDate < today ? 0 : bDate === today ? 1 : 2;
    const readDelta = Number(read.has(a.id)) - Number(read.has(b.id));
    return aRank - bRank || aDate.localeCompare(bDate) || readDelta || a.id.localeCompare(b.id);
  }), [events, read, dismissed, today]);
  const pendingCount = state.internal ? pending.length : 0;
  const filterCounts: Record<NotificationFilter, number> = { pending: pending.length, upcoming: upcoming.length, all: events.length };
  const filtered = activeFilter === "pending" ? pending : activeFilter === "upcoming" ? upcoming : allEvents;
  const filters: { id: NotificationFilter; label: string }[] = [
    { id: "pending", label: "Pendientes" }, { id: "upcoming", label: "Próximos" }, { id: "all", label: "Todos" },
  ];

  useEffect(() => {
    const notices = activeNotices.current;
    return () => { for (const notice of notices.keys()) notice.close(); notices.clear(); stopNotificationAudio(); };
  }, []);

  useEffect(() => {
    const activeIds = new Set(events.filter(event=>!isReminderSnoozed(state.snoozes,event.reminderKey,today)).map(event=>event.id));
    for (const [notice, id] of activeNotices.current) if (!activeIds.has(id)) { notice.close(); activeNotices.current.delete(notice); }
  }, [events, state.snoozes, today]);

  useEffect(() => { if (!state.sound) stopNotificationAudio(); }, [state.sound]);

  useEffect(() => {
    if (!ready) return;
    if (!state.initialized) {
      const error = saveNotificationUpdate(onChange, current => initializeNotifications(current, events));
      if (error) window.setTimeout(() => setDeliveryMessage(error), 0);
      return;
    }
    const pending = pendingNotificationDelivery(state, events, today).filter(event => !attempted.current.has(event.id));
    if (!pending.length) return;
    // One delivery per event in this session, also before persistence completes.
    for (const event of pending) attempted.current.add(event.id);
    const error = saveNotificationUpdate(onChange, current => markNotifications(current, "deliveredIds", pending.map(event => event.id)));
    if (error) { window.setTimeout(() => setDeliveryMessage(error), 0); return; }
    const externalAllowed = state.system && "Notification" in window && Notification.permission === "granted";
    if (state.sound && (state.internal || externalAllowed)) void playNotificationTone(state.tone);
    if (!externalAllowed) return;
    try {
      const latest = pending[0];
      const notification = new Notification("Finanzas", {
        body: pending.length === 1 ? "Tienes una notificación nueva. Abre Finanzas para verla." : `Tienes ${pending.length} notificaciones nuevas. Abre Finanzas para verlas.`,
        tag: `finanzas:${latest.id}`, silent: true,
      });
      activeNotices.current.set(notification, latest.id);
      notification.onclose = () => activeNotices.current.delete(notification);
      notification.onclick = () => {
        window.focus(); notification.close();
        const error = saveNotificationUpdate(onChange, current => markNotifications(current, "readIds", [latest.id]));
        if (error) setDeliveryMessage(error);
        onNavigate(latest.destination);
      };
    } catch {
      // In particular, mobile browsers can expose Notification but reject its
      // constructor. Internal notifications continue to work in that case.
      window.setTimeout(() => setDeliveryMessage("Este navegador no permite mostrar avisos del sistema en esta vista. Puedes consultar las notificaciones dentro de Finanzas."), 0);
    }
  }, [events, state, today, ready, onChange, onNavigate]);

  function updateState(update: (current: NotificationState) => NotificationState) {
    const error = saveNotificationUpdate(onChange, update);
    if (error) setDeliveryMessage(error);
  }
  function closeDialog() { setExpandedId(null); setExpandAll(false); setPageSize(5); onClose(); }

  return <>
    <button type="button" className={`header-control ${styles.bell}`} onClick={onOpen} title="Notificaciones" aria-label={`Notificaciones${pendingCount ? `: ${pendingCount} pendientes` : ": ninguna pendiente"}`}>
      <NotificationsOutlined aria-hidden="true" />
      {pendingCount > 0 && <span className={styles.badge} aria-hidden="true">{pendingCount > 99 ? "99+" : pendingCount}</span>}
    </button>
    {open && <FinanceDialog label="Notificaciones" onClose={closeDialog} maxWidth={560}>
      <section className={`flow-modal ${styles.dialog}`}>
        <header><div className={styles.dialogHeaderCopy}><h2>Notificaciones</h2><p className={styles.dialogSubtitle}>Tus recordatorios y alertas importantes</p></div><button type="button" aria-label="Cerrar notificaciones" onClick={closeDialog}>×</button></header>
        <div className={styles.body}>
          {!state.internal ? <p>Las notificaciones internas están desactivadas. Puedes activarlas en Configuración.</p> : <>
            <div className={styles.filters} role="group" aria-label="Filtrar notificaciones">
              {filters.map(filter => <button key={filter.id} type="button" className={activeFilter === filter.id ? styles.filterActive : styles.filter} aria-pressed={activeFilter === filter.id} onClick={() => { setActiveFilter(filter.id); setPageSize(5); setExpandedId(null); setExpandAll(false); }}>
                {filter.label}<span className={styles.filterCount}>{filterCounts[filter.id]}</span>
              </button>)}
            </div>
            {!!filtered.length && <div className={styles.noticeControls}>
              <label className={styles.expandAll}>
                <input type="checkbox" checked={expandAll} onChange={event => { setExpandAll(event.target.checked); setExpandedId(null); }}/>
                <span>Desplegar todos</span>
              </label>
              {unreadEvents.length > 0 && <button className={styles.markAllRead} type="button" onClick={() => updateState(current => markNotifications(current, "readIds", unreadEvents.map(event => event.id)))}>Marcar avisos como leídos</button>}
            </div>}
            {!filtered.length && <p>{activeFilter === "pending" ? "No tienes compromisos pendientes." : activeFilter === "upcoming" ? "No tienes compromisos próximos." : "No hay avisos disponibles."}</p>}
            <ul className={styles.list}>{filtered.slice(0, pageSize).map(event => {
              const isRead = read.has(event.id), isDismissed = dismissed.has(event.id);
              return <NotificationCard key={event.id} event={event} today={today} privateMode={privateMode} showAmount={state.showResponsibilityAmount === true} read={isRead} dismissed={isDismissed} expanded={expandAll || expandedId === event.id} onToggleExpanded={() => { if (expandAll) { setExpandAll(false); setExpandedId(null); } else setExpandedId(current => current === event.id ? null : event.id); }} onNavigate={destination => { closeDialog(); onNavigate(destination); }} onToggleRead={item => updateState(current => read.has(item.id) ? { ...current, readIds: current.readIds.filter(id => id !== item.id) } : markNotifications(current, "readIds", [item.id]))} onDismiss={item => updateState(current => markNotifications(current, "dismissedIds", [item.id]))} renderPayment={renderPayment}/>;
            })}</ul>
            {filtered.length>pageSize&&<button type="button" className="text-btn" onClick={()=>setPageSize(value=>value+20)}>Mostrar más avisos</button>}
            <button className={styles.allNotices} type="button" onClick={() => { closeDialog(); onNavigate({ page: "Cronograma" }); }}><span><b>Ver todos los avisos</b><small>{uiCopyEs.calendarActions.openNamed}</small></span><span aria-hidden="true">›</span></button>
          </>}
          {deliveryMessage && <p role="status">{deliveryMessage}</p>}
        </div>
      </section>
    </FinanceDialog>}
  </>;
}

export function NotificationSettings({ state, onChange }: { state: NotificationState; onChange: NotificationUpdate }) {
  const capabilities = useSyncExternalStore(subscribeCapabilities, browserCapabilities, serverCapabilities);
  const [systemCapability, audioCapability] = capabilities.split("|");
  const [, setPermissionResult] = useState<NotificationPermission | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const systemSupported = systemCapability !== "unsupported" && systemCapability !== "insecure";
  const permission = systemSupported ? Notification.permission : systemCapability;
  const audioSupported = audioCapability === "audio";
  function updateState(update: (current: NotificationState) => NotificationState) {
    const error = saveNotificationUpdate(onChange, update);
    if (error) setMessage(error);
    return !error;
  }

  async function toggleSystem() {
    if (state.system && permission !== "default") { updateState(current => ({ ...current, system: false })); return; }
    if (!systemSupported) return;
    setBusy(true);
    try {
      const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (!mounted.current) return;
      setPermissionResult(result);
      if (!updateState(current => ({ ...current, system: result === "granted" }))) return;
      setMessage(result === "granted" ? "Avisos del sistema activados en los navegadores compatibles." : result === "denied" ? "El navegador bloqueó el permiso. Puedes cambiarlo desde los permisos de este sitio." : "No se concedió permiso. Las notificaciones internas siguen disponibles.");
    } catch { if (mounted.current) setMessage("No se pudo solicitar el permiso en este navegador. Puedes usar las notificaciones internas."); }
    finally { if (mounted.current) setBusy(false); }
  }

  async function toggleSound() {
    if (state.sound) { stopNotificationAudio(); if (updateState(current => ({ ...current, sound: false }))) setMessage("Sonido desactivado."); return; }
    const played = await playNotificationTone(state.tone, true);
    if (!mounted.current) return;
    if (!updateState(current => ({ ...current, sound: played }))) return;
    setMessage(played ? "Sonido activado para esta sesión." : "El navegador no permitió reproducir sonido. Intenta probar el tono otra vez.");
  }

  return <div className={styles.settings}>
    <h3>Notificaciones</h3>
    <label className={styles.amountPreference}><input type="checkbox" checked={state.showResponsibilityAmount===true} onChange={event=>{const checked=event.target.checked;updateState(current=>({...current,showResponsibilityAmount:checked}));}}/><span>Mostrar saldo de la responsabilidad en las notificaciones<small>Muestra el importe pendiente, no el saldo del sobre. La privacidad global siempre prevalece.</small></span></label>
    <div className={styles.setting}><span><b>Dentro de Finanzas</b><small>Campana y avisos que requieren atención.</small></span><button type="button" className={styles.toggle} aria-label="Notificaciones dentro de Finanzas" aria-pressed={state.internal} onClick={() => updateState(current => ({ ...current, internal: !current.internal }))}>{state.internal ? "Activadas" : "Desactivadas"}</button></div>
    <div className={styles.setting}><span><b>En el dispositivo</b><small>{!systemSupported ? "Este navegador o conexión no admite avisos del sistema." : permission === "denied" ? "Permiso bloqueado en los ajustes del navegador." : state.system && permission === "default" ? "Falta conceder permiso en este dispositivo." : "Avisos discretos, sin mostrar montos ni nombres."}</small></span><button type="button" className={styles.toggle} aria-label="Notificaciones del dispositivo" aria-pressed={state.system} disabled={busy || (!systemSupported && !state.system)} onClick={() => void toggleSystem()}>{busy ? "Esperando…" : state.system && permission === "default" ? "Dar permiso" : state.system ? "Activadas" : "Activar"}</button></div>
    <p className={styles.hint}>Los avisos se generan mientras Finanzas está abierta. La disponibilidad de avisos del sistema depende del navegador; no se envían con la aplicación cerrada.</p>
    <h3>Sonidos</h3>
    <div className={styles.setting}><span><b>Sonido de notificación</b><small>{audioSupported ? "Tú decides cuándo habilitar el audio." : "El audio no está disponible en este navegador."}</small></span><button type="button" className={styles.toggle} aria-label="Sonido de notificación" aria-pressed={state.sound} disabled={!audioSupported && !state.sound} onClick={() => void toggleSound()}>{state.sound ? "Activado" : "Desactivado"}</button></div>
    <div className={styles.toneRow}><label htmlFor="notification-tone">Tono</label><select id="notification-tone" value={state.tone} onChange={event => updateState(current => ({ ...current, tone: event.target.value as NotificationTone }))}>{notificationTones.map(tone => <option key={tone}>{tone}</option>)}</select><button type="button" className={styles.toggle} disabled={!audioSupported || !state.sound} onClick={async () => { const played = await playNotificationTone(state.tone, true); if (mounted.current) setMessage(played ? "Tono reproducido. Audio disponible en esta sesión." : "El navegador no permitió reproducir el tono."); }}>Probar tono</button></div>
    <p className={styles.hint}>Al volver a abrir Finanzas, prueba el tono para habilitar el audio si el navegador lo requiere. Con el sonido desactivado no se reproduce ningún tono.</p>
    {message && <p className={styles.status} role="status">{message}</p>}
  </div>;
}
