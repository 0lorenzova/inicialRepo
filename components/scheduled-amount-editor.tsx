"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import { TemporalDot, TemporalThresholdFields } from "@/components/temporal-indicator";
import { DEFAULT_GOAL_THRESHOLDS, getTemporalState } from "@/lib/envelope-goals";
import { validateScheduledAmount, type ScheduledAmount, type ScheduledRepetition } from "@/lib/envelope-planning";
import styles from "./envelope-goal-editor.module.css";

export function ScheduledAmountEditor({ envelopeName, original, today, onSave, onClose }: {
  envelopeName: string; original: ScheduledAmount | null; today: string;
  onSave: (item: ScheduledAmount) => void; onClose: () => void;
}) {
  const id = useId();
  const [itemId] = useState(() => original?.id ?? crypto.randomUUID());
  const [name, setName] = useState(original?.name ?? "");
  const [amount, setAmount] = useState(original?.amount.toString() ?? "");
  const [date, setDate] = useState(original?.deadline ?? "");
  const [timing, setTiming] = useState(original?.timingEnabled ?? true);
  const initial = original?.thresholds ?? DEFAULT_GOAL_THRESHOLDS;
  const [thresholds, setThresholds] = useState({ green: String(initial.green), yellow: String(initial.yellow), red: String(initial.red) });
  const [repeat, setRepeat] = useState(Boolean(original?.repetition));
  const [frequency, setFrequency] = useState<ScheduledRepetition["frequency"]>(original?.repetition?.frequency ?? "monthly");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const numeric = (value: string) => value.trim() ? Number(value) : NaN;
  const parsed = { green: numeric(thresholds.green), yellow: numeric(thresholds.yellow), red: numeric(thresholds.red) };
  let preview = null;
  try { if (date && timing) preview = getTemporalState(date, today, parsed); } catch { /* Submit explains invalid fields. */ }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      const item: ScheduledAmount = { ...original, id: itemId, name: name.trim(), amount: numeric(amount), deadline: date, thresholds: timing ? parsed : original?.thresholds, repetition: repeat ? { frequency, seriesId: original?.repetition?.seriesId ?? itemId, anchorDay: original?.deadline === date && original.repetition ? original.repetition.anchorDay : Number(date.slice(8,10)) } : undefined, active: original?.active ?? true, timingEnabled: timing };
      validateScheduledAmount(item);
      onSave(item);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el importe. Inténtalo de nuevo.");
      submitting.current = false;
    }
  }

  return <FinanceDialog label="Asignar pago a este sobre" onClose={onClose}><section className="flow-modal">
    <header><div><h2>{original ? "Configurar importe" : "Programar importe"}</h2><p className={styles.context}>{envelopeName}</p></div><button type="button" onClick={onClose} aria-label="Volver sin guardar">‹</button></header>
    <form className={`flow-body ${styles.form}`} noValidate onSubmit={submit} onChange={() => setError("")}>
      <p className={styles.hint}>Es un importe previsto para la fecha límite. Guardarlo no mueve dinero; marcarlo Pagado registra un gasto.</p>
      <label htmlFor={`${id}-name`}>Nombre del importe</label><input id={`${id}-name`} value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Bono anual" />
      <label htmlFor={`${id}-amount`}>Monto programado</label><div className="currency-input"><span aria-hidden="true">₡</span><input id={`${id}-amount`} type="number" inputMode="numeric" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} /></div>
      <label htmlFor={`${id}-date`}>Fecha límite</label><input id={`${id}-date`} type="date" value={date} onChange={event => setDate(event.target.value)} />
      <label className={`check-label ${styles.toggle}`}><input type="checkbox" checked={timing} onChange={event => setTiming(event.target.checked)} />Mostrar indicador de tiempo</label>
      {timing && <TemporalThresholdFields values={thresholds} onChange={(tone, value) => setThresholds(current => ({ ...current, [tone]: value }))} />}
      <label className={`check-label ${styles.toggle}`}><input type="checkbox" checked={repeat} onChange={event => setRepeat(event.target.checked)} />Repetir</label>
      {repeat && <><label htmlFor={`${id}-frequency`}>Frecuencia</label><select id={`${id}-frequency`} value={frequency} onChange={event => setFrequency(event.target.value as ScheduledRepetition["frequency"])}><option value="daily">Cada día</option><option value="weekly">Cada semana</option><option value="monthly">Cada mes el mismo día, o el último día válido</option></select><p className={styles.hint}>Al confirmar el pago se creará la siguiente ocurrencia. Nunca se paga automáticamente.</p></>}
      {preview && <div className={styles.preview} aria-live="polite">{preview.temporal ? <span className={styles.temporalPreview}><TemporalDot tone={preview.temporal.tone} /><span>{preview.temporal.label}. {preview.temporal.explanation}</span></span> : <span>⚪ Fuera de los rangos monitoreados. Entrará en verde {thresholds.green} días antes.</span>}</div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button className="primary" type="submit">Guardar importe programado</button><button className="secondary" type="button" onClick={onClose}>Cancelar</button></div>
    </form>
  </section></FinanceDialog>;
}
