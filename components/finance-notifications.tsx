"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import { FinanceDialog } from "@/components/finance-dialog";
import {
  deriveFinanceNotifications, initializeNotifications, markNotifications,
  notificationTones, pendingNotificationDelivery, saveNotificationUpdate, visibleNotifications,
  type FinanceNotification, type NotificationDestination, type NotificationEnvelope,
  type NotificationState, type NotificationTone, type NotificationUpdate,
} from "@/lib/finance-notifications";
import { playNotificationTone, stopNotificationAudio, supportsNotificationAudio } from "@/lib/notification-audio";
import type { LedgerMovement } from "@/lib/finance-ledger";
import styles from "./finance-notifications.module.css";

const money = (value: number) => new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(value);
const dateLabel = (date: string) => {
  const instant = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}-06:00`);
  return Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", dateStyle: "medium", timeStyle: "short" }).format(instant) : date;
};

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
  state, onChange, movements, envelopes, today, ready = true, privateMode = false,
  onNavigate, open, onOpen, onClose,
}: {
  state: NotificationState;
  onChange: NotificationUpdate;
  movements: LedgerMovement[];
  envelopes: NotificationEnvelope[];
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
  const attempted = useRef(new Set<string>());
  const activeNotices = useRef(new Set<Notification>());
  const events = useMemo(() => deriveFinanceNotifications(movements, envelopes, today), [movements, envelopes, today]);
  const visible = useMemo(() => visibleNotifications(state, events), [state, events]);
  const read = useMemo(() => new Set(initializeNotifications(state, events).readIds), [state, events]);
  const unread = state.internal ? visible.filter(event => !read.has(event.id)).length : 0;

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
    {open && <FinanceDialog label="Notificaciones" onClose={onClose}>
      <section className="flow-modal">
        <header><h2>Notificaciones</h2><button type="button" aria-label="Cerrar notificaciones" onClick={onClose}>×</button></header>
        <div className={styles.body}>
          {!state.internal ? <p>Las notificaciones internas están desactivadas. Puedes activarlas en Configuración.</p> : <>
            <div className={styles.actions}><button type="button" className="secondary" disabled={!unread} onClick={() => updateState(current => markNotifications(current, "readIds", visible.map(event => event.id)))}>Marcar todas como leídas</button></div>
            {!visible.length && <p>No tienes notificaciones. Los nuevos movimientos y aportes pendientes aparecerán aquí.</p>}
            <ul className={styles.list}>{visible.slice(0, pageSize).map(event => <li className={`${styles.item} ${!read.has(event.id) ? styles.unread : ""}`} key={event.id}>
              <button type="button" className={styles.open} onClick={() => openEvent(event)}>
                <strong>{privateMode ? (event.kind === "reminder" ? "Recordatorio pendiente" : "Movimiento registrado") : event.title} · {read.has(event.id) ? "Leída" : "Sin leer"}</strong>
                <span>{privateMode ? "Los detalles están ocultos por privacidad." : `${event.detail} · ${money(event.amount)}`}</span>
                <small>{dateLabel(event.date)} · Abrir {event.destination.page.toLowerCase()}</small>
              </button>
              <div className={styles.itemActions}>
                <button type="button" onClick={() => updateState(current => read.has(event.id) ? { ...current, readIds: current.readIds.filter(id => id !== event.id) } : markNotifications(current, "readIds", [event.id]))}>{read.has(event.id) ? "Marcar sin leer" : "Marcar leída"}</button>
                <button type="button" onClick={() => updateState(current => markNotifications(current, "dismissedIds", [event.id]))}>Descartar</button>
              </div>
            </li>)}</ul>
            {visible.length > pageSize && <button className="secondary" type="button" onClick={() => setPageSize(value => value + 20)}>Mostrar más notificaciones</button>}
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
    <div className={styles.setting}><span><b>Dentro de Finanzas</b><small>Campana, contador y listado de actividad.</small></span><button type="button" className={styles.toggle} aria-label="Notificaciones dentro de Finanzas" aria-pressed={state.internal} onClick={() => updateState(current => ({ ...current, internal: !current.internal }))}>{state.internal ? "Activadas" : "Desactivadas"}</button></div>
    <div className={styles.setting}><span><b>En el dispositivo</b><small>{!systemSupported ? "Este navegador o conexión no admite avisos del sistema." : permission === "denied" ? "Permiso bloqueado en los ajustes del navegador." : state.system && permission === "default" ? "Falta conceder permiso en este dispositivo." : "Avisos discretos, sin mostrar montos ni nombres."}</small></span><button type="button" className={styles.toggle} aria-label="Notificaciones del dispositivo" aria-pressed={state.system} disabled={busy || (!systemSupported && !state.system)} onClick={() => void toggleSystem()}>{busy ? "Esperando…" : state.system && permission === "default" ? "Dar permiso" : state.system ? "Activadas" : "Activar"}</button></div>
    <p className={styles.hint}>Los avisos se generan mientras Finanzas está abierta. La disponibilidad de avisos del sistema depende del navegador; no se envían con la aplicación cerrada.</p>
    <h3>Sonidos</h3>
    <div className={styles.setting}><span><b>Sonido de notificación</b><small>{audioSupported ? "Tú decides cuándo habilitar el audio." : "El audio no está disponible en este navegador."}</small></span><button type="button" className={styles.toggle} aria-label="Sonido de notificación" aria-pressed={state.sound} disabled={!audioSupported && !state.sound} onClick={() => void toggleSound()}>{state.sound ? "Activado" : "Desactivado"}</button></div>
    <div className={styles.toneRow}><label htmlFor="notification-tone">Tono</label><select id="notification-tone" value={state.tone} onChange={event => updateState(current => ({ ...current, tone: event.target.value as NotificationTone }))}>{notificationTones.map(tone => <option key={tone}>{tone}</option>)}</select><button type="button" className={styles.toggle} disabled={!audioSupported || !state.sound} onClick={async () => { const played = await playNotificationTone(state.tone, true); if (mounted.current) setMessage(played ? "Tono reproducido. Audio disponible en esta sesión." : "El navegador no permitió reproducir el tono."); }}>Probar tono</button></div>
    <p className={styles.hint}>Al volver a abrir Finanzas, prueba el tono para habilitar el audio si el navegador lo requiere. Con el sonido desactivado no se reproduce ningún tono.</p>
    {message && <p className={styles.status} role="status">{message}</p>}
  </div>;
}
