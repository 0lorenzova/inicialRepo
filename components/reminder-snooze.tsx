"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { FinanceDialog } from "./finance-dialog";
import { previewPostponement } from "@/lib/finance-recurrence";
import { cancelReminderSnooze, isReminderSnoozed, reminderTargets, snoozeReminder, validReminderDate, type ReminderSource, type ReminderTarget } from "@/lib/reminder-snooze";
import type { NotificationState, NotificationUpdate, NotificationEnvelope } from "@/lib/finance-notifications";
import type { LedgerMovement, Loan } from "@/lib/finance-ledger";
import styles from "./reminder-snooze.module.css";

export const reminderDateLabel = (date: string) => new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
export const localReminderDay = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
type SnoozeContext = { state: NotificationState; today: string; targets: ReminderTarget[]; open: (key: string) => void; cancel: (key: string) => void };
const Context = createContext<SnoozeContext | null>(null);
export const useReminderSnooze = () => useContext(Context);

export function ReminderSnoozeProvider({ state, onChange, envelopes, movements, loans, today: initialDay, privateMode, children }: {
  state: NotificationState; onChange: NotificationUpdate; envelopes: NotificationEnvelope[]; movements: LedgerMovement[]; loans: Loan[]; today: string; privateMode: boolean; children: ReactNode;
}) {
  const [today, setToday] = useState(initialDay);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const targets = useMemo(() => reminderTargets(envelopes, movements, loans, today), [envelopes, movements, loans, today]);
  const target = targets.find(item => item.key === selected);
  useEffect(() => {
    if (!Object.keys(state.snoozes ?? {}).some(key => !targets.some(target => target.key === key))) return;
    // The workspace updater prunes against its latest ledger snapshot, never this render's snapshot.
    const timer = window.setTimeout(() => {
      try { onChange(current => ({ ...current })); }
      catch { setError("No se pudo actualizar la programación de avisos. Revisa la sincronización."); }
    }, 0);
    return () => clearTimeout(timer);
  }, [state.snoozes, targets, onChange]);
  useEffect(() => {
    const refresh = () => setToday(localReminderDay());
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const cancel = (key: string) => {
    try { onChange(current => ({ ...current, snoozes: cancelReminderSnooze(current.snoozes ?? {}, key) })); setError(""); }
    catch { setError("No se pudo guardar el cambio. Revisa la sincronización e inténtalo de nuevo."); }
  };
  return <Context.Provider value={{ state, today, targets, open: key => { setError(""); setSelected(key); }, cancel }}>
    {children}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {selected && <SnoozeDialog key={selected} target={target} today={today} privateMode={privateMode} onClose={() => setSelected(null)} onSave={until => {
      if (!target) throw new Error("El evento ya no está pendiente. Vuelve a consultar su estado.");
      onChange(current => ({ ...current, snoozes: snoozeReminder(current.snoozes ?? {}, target, until, localReminderDay()) }));
      setSelected(null);
    }}/>}
  </Context.Provider>;
}

export function SnoozeDialog({ target, today, privateMode, onClose, onSave }: { target?: ReminderTarget; today: string; privateMode: boolean; onClose: () => void; onSave: (until: string) => void }) {
  const id = useId();
  const [mode, setMode] = useState("days"), [days, setDays] = useState("1"), [date, setDate] = useState(""), [error, setError] = useState("");
  const submitted = useRef(false);
  let preview = "";
  try { preview = mode === "next" ? target?.nextDate ?? "" : mode === "date" ? date : previewPostponement(today, { unit: "days", amount: Number(days) }); } catch { /* Invalid input disables confirmation. */ }
  const valid = Boolean(target && validReminderDate(preview) && preview > today);
  return <FinanceDialog label="Posponer recordatorio" onClose={onClose}><section className={`flow-modal ${styles.dialog}`}>
    <header><h2>Posponer recordatorio</h2><button type="button" aria-label="Cerrar posposición" onClick={onClose}>×</button></header>
    <form className="flow-body" onSubmit={event => { event.preventDefault(); if (!valid || submitted.current) return; submitted.current = true; try { onSave(preview); } catch (cause) { submitted.current = false; setError(cause instanceof Error ? cause.message : "No se pudo guardar la posposición."); } }}>
      {target ? <><strong>{privateMode ? "Recordatorio" : target.title}</strong><small>Fecha original: {reminderDateLabel(target.originalDate)}</small></> : <p>Este evento ya no está pendiente.</p>}
      <fieldset className={styles.options}><legend className={styles.srOnly}>Opciones de posposición</legend>
        {target?.nextDate && <label><input type="radio" name={id} checked={mode === "next"} onChange={() => setMode("next")}/><span>Siguiente fecha programada<small>{reminderDateLabel(target.nextDate)}</small></span></label>}
        <label><input type="radio" name={id} checked={mode === "days"} onChange={() => setMode("days")}/><span>Dentro de X días</span></label>
        {mode === "days" && <label className={styles.field}>Cantidad de días<input type="number" inputMode="numeric" min="1" step="1" value={days} onChange={event => setDays(event.target.value)}/></label>}
        <label><input type="radio" name={id} checked={mode === "date"} onChange={() => setMode("date")}/><span>Elegir fecha</span></label>
        {mode === "date" && <label className={styles.field}>Nueva fecha de aviso<input type="date" min={previewPostponement(today, { unit: "days", amount: 1 })} max="9999-12-31" value={date} onChange={event => setDate(event.target.value)}/></label>}
      </fieldset>
      <div className="review-box" aria-live="polite">{valid ? <>Volver a recordar el <strong>{reminderDateLabel(preview)}</strong></> : "Introduce un plazo entero positivo o una fecha futura."}</div>
      <small>Solo se aplaza este aviso. El vencimiento y la programación del evento se conservan.</small>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className={styles.actions}><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={!valid}>Confirmar</button></div>
    </form>
  </section></FinanceDialog>;
}

export function SnoozeControl({ source, reminderId, statusOnly = false, actionOnly = false }: { source?: ReminderSource; reminderId?: string; statusOnly?: boolean; actionOnly?: boolean }) {
  const context = useReminderSnooze();
  if (!context) return null;
  const target = context.targets.find(item => reminderId ? item.key === reminderId : source && item.kind === source.kind && item.envelopeId === source.envelopeId && (!source.itemId || item.itemId === source.itemId) && (!source.date || item.date === source.date));
  if (!target) return null;
  const until = context.state.snoozes?.[target.key]?.until;
  const active = isReminderSnoozed(context.state.snoozes, target.key, context.today);
  const status = active ? `Pospuesto hasta: ${reminderDateLabel(until!)}` : until ? `Aviso reactivado: ${reminderDateLabel(until)}` : "";
  if (statusOnly) return status ? <small className={styles.status}>{status}</small> : null;
  return <span className={styles.control}>
    {!actionOnly && status && <small className={styles.status}>{status}</small>}
    <button type="button" className="text-btn" onClick={() => context.open(target.key)}>Posponer recordatorio</button>
    {active && <button type="button" className="text-btn" onClick={() => context.cancel(target.key)}>Cancelar posposición</button>}
  </span>;
}
