"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import MailOutlineOutlined from "@mui/icons-material/MailOutlineOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { FinanceDialog } from "@/components/finance-dialog";
import { temporalDistance } from "@/lib/envelope-goals";
import {
  deriveFinanceNotifications, initializeNotifications, markNotifications, notificationDetail,
  notificationTones, pendingNotificationDelivery, saveNotificationUpdate, visibleNotifications,
  type FinanceNotification, type NotificationDestination, type NotificationEnvelope,
  type NotificationState, type NotificationTone, type NotificationUpdate,
} from "@/lib/finance-notifications";
import { playNotificationTone, stopNotificationAudio, supportsNotificationAudio } from "@/lib/notification-audio";
import type { LedgerMovement, Loan } from "@/lib/finance-ledger";
import styles from "./finance-notifications.module.css";

export const notificationDateLabel = (date: string) => {
  const instant = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}-06:00`);
  return Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "medium", timeStyle: "short" }).format(instant) : date;
};

export function notificationCopy(event: FinanceNotification, privateMode: boolean) {
  if (privateMode) return { concept: event.kind === "reminder" ? "Recordatorio pendiente" : "Obligación pendiente", context: "", description: "" };

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
    if (days < 0) return "Vencida";
    if (days === 0) return "Vence hoy";
    return `En ${days} ${days === 1 ? "día" : "días"}`;
  } catch {
    return event.title;
  }
}

export function isTemporalDescription(description: string) {
  return /^(?:Faltan?\s+\d+\s+d[ií]as? para la fecha l[ií]mite|La fecha l[ií]mite es hoy)\.?$/i.test(description.trim());
}

type NotificationFilter = "all" | "unread" | "overdue" | "upcoming";

export const responsibilityAmount = (amount: number) => new Intl.NumberFormat("es-CR", {
  style: "currency", currency: "CRC", maximumFractionDigits: 0,
}).format(amount);

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
  state, onChange, movements, envelopes, loans, today, ready = true, privateMode = false,
  onNavigate, open, onOpen, onClose, renderPayment,
}: {
  renderPayment: (destination: NotificationDestination) => ReactNode;
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
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const attempted = useRef(new Set<string>());
  const activeNotices = useRef(new Set<Notification>());
  const events = useMemo(() => deriveFinanceNotifications(movements, envelopes, today, loans), [movements, envelopes, today, loans]);
  const visible = useMemo(() => visibleNotifications(state, events), [state, events]);
  const read = useMemo(() => new Set(initializeNotifications(state, events).readIds), [state, events]);
  const unread = state.internal ? visible.filter(event => !read.has(event.id)).length : 0;
  const overdue = visible.filter(event => event.date.slice(0, 10) < today);
  const upcoming = visible.filter(event => event.date.slice(0, 10) >= today);
  const filterCounts: Record<NotificationFilter, number> = { all: visible.length, unread, overdue: overdue.length, upcoming: upcoming.length };
  const filtered = activeFilter === "all" ? visible
    : activeFilter === "unread" ? visible.filter(event => !read.has(event.id))
      : activeFilter === "overdue" ? overdue : upcoming;
  const filters: { id: NotificationFilter; label: string }[] = [
    { id: "all", label: "Todas" }, { id: "unread", label: "Sin leer" },
    { id: "overdue", label: "Vencidas" }, { id: "upcoming", label: "Próximas" },
  ];

  useEffect(() => {
    const notices = activeNotices.current;
    return () => { for (const notice of notices) notice.close(); notices.clear(); stopNotificationAudio(); };
  }, []);

  useEffect(() => { if (!state.sound) stopNotificationAudio(); }, [state.sound]);

  useEffect(() => {
    if (!ready) return;
    if (!state.initialized) {
      const error = saveNotificationUpdate(onChange, current => initializeNotifications(current, events));
      if (error) window.setTimeout(() => setDeliveryMessage(error), 0);
      return;
    }
    const pending = pendingNotificationDelivery(state, events).filter(event => !attempted.current.has(event.id));
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
      activeNotices.current.add(notification);
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
  }, [events, state, ready, onChange, onNavigate]);

  function openEvent(event: FinanceNotification) {
    updateState(current => markNotifications(current, "readIds", [event.id]));
    onNavigate(event.destination);
  }
  function updateState(update: (current: NotificationState) => NotificationState) {
    const error = saveNotificationUpdate(onChange, update);
    if (error) setDeliveryMessage(error);
  }

  return <>
    <button type="button" className={`header-control ${styles.bell}`} onClick={onOpen} title="Notificaciones" aria-label={`Notificaciones${unread ? `: ${unread} sin leer` : ": ninguna sin leer"}`}>
      <NotificationsOutlined aria-hidden="true" />
      {unread > 0 && <span className={styles.badge} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <FinanceDialog label="Notificaciones" onClose={onClose} maxWidth={680}>
      <section className={`flow-modal ${styles.dialog}`}>
        <header><h2>Notificaciones</h2><button type="button" aria-label="Cerrar notificaciones" onClick={onClose}>×</button></header>
        <div className={styles.body}>
          {!state.internal ? <p>Las notificaciones internas están desactivadas. Puedes activarlas en Configuración.</p> : <>
            <div className={styles.actions}><button type="button" className="secondary" disabled={!unread} onClick={() => updateState(current => markNotifications(current, "readIds", visible.map(event => event.id)))}>Marcar todas como leídas</button></div>
            <div className={styles.filters} role="group" aria-label="Filtrar notificaciones">
              {filters.map(filter => <button key={filter.id} type="button" className={activeFilter === filter.id ? styles.filterActive : styles.filter} aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)}>
                {filter.label}<span className={styles.filterCount}>{filterCounts[filter.id]}</span>
              </button>)}
            </div>
            {!filtered.length && <p>{visible.length === 0 ? "No tienes avisos que requieran atención. Aquí aparecerán vencimientos, obligaciones críticas y aportes pendientes." : `No tienes notificaciones ${activeFilter === "unread" ? "sin leer" : activeFilter === "overdue" ? "vencidas" : "próximas"}.`}</p>}
            <ul className={styles.list}>{filtered.slice(0, pageSize).map(event => {
              const isRead = read.has(event.id);
              const copy = notificationCopy(event, privateMode);
              const showAmount = state.showResponsibilityAmount === true && !privateMode;
              const timeLabel = notificationTimeLabel(event, today);
              const description = isTemporalDescription(copy.description) ? "" : copy.description;
              return <li className={`${styles.item} ${!isRead ? styles.unread : ""}`} key={event.id}>
                <div className={styles.itemMain}>
                  <span className={styles.noticeIcon} aria-hidden="true"><MailOutlineOutlined/></span>
                  <button type="button" className={styles.open} onClick={() => openEvent(event)} aria-label={`Abrir ${copy.concept}, ${event.destination.page}, ${isRead ? "leída" : "sin leer"}`}>
                    <span className={styles.primaryLine}>
                      <span className={styles.headingGroup}>
                        <span className={styles.priorityDot} data-tone={event.tone ?? "neutral"} aria-hidden="true"/>
                        <strong className={styles.concept} data-unread={!isRead}>{copy.concept}</strong>
                      </span>
                      <span className={styles.amountGroup}>
                        <span className={styles.timeBadge} data-tone={event.tone ?? "neutral"} title={privateMode ? undefined : event.title}>{timeLabel}</span>
                        {showAmount && <b className={styles.amount}>{responsibilityAmount(event.amount)}</b>}
                      </span>
                      <span className={styles.chevron} aria-hidden="true">›</span>
                    </span>
                    {copy.context && <span className={styles.context}>{copy.context}</span>}
                    {description && <span className={styles.description}>{description}</span>}
                    <span className={styles.metaLine}>
                      <span className={styles.date}><CalendarMonthOutlined aria-hidden="true"/><time dateTime={event.date}>{notificationDateLabel(event.date)}</time></span>
                      <span className={styles.destination}><CalendarMonthOutlined aria-hidden="true"/>Abrir {event.destination.page.toLowerCase()}</span>
                    </span>
                  </button>
                </div>
                <details className={styles.moreActions}>
                  <summary>Más opciones</summary>
                  <div className={styles.itemActions}>
                    {renderPayment(event.destination)}
                    <button type="button" onClick={() => updateState(current => isRead ? { ...current, readIds: current.readIds.filter(id => id !== event.id) } : markNotifications(current, "readIds", [event.id]))}>{isRead ? "Marcar sin leer" : "Marcar leída"}</button>
                    <button type="button" onClick={() => updateState(current => markNotifications(current, "dismissedIds", [event.id]))}>Descartar</button>
                  </div>
                </details>
              </li>;
            })}</ul>
            {filtered.length > pageSize && <button className="secondary" type="button" onClick={() => setPageSize(value => value + 20)}>Mostrar más notificaciones</button>}
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
