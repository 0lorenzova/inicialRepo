"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import { DEFAULT_GOAL_THRESHOLDS, getEnvelopeGoal, validateGoalSettings, type GoalSettings } from "@/lib/envelope-goals";
import { nextContributionDate, validateRecurrence, type Recurrence } from "@/lib/finance-recurrence";
import styles from "./envelope-goal-editor.module.css";

type GoalEnvelope = GoalSettings & { id: string; name: string; balance: number; recurrence?: Recurrence };
type GoalPatch = GoalSettings & { recurrence?: Recurrence };
const money = (amount: number) => new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(amount);
const dateLabel = (date: string) => new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeZone: "America/Costa_Rica" }).format(new Date(`${date}T12:00:00Z`));

export function EnvelopeGoalEditor({ envelope, today, onSave, onClose }: {
  envelope: GoalEnvelope;
  today: string;
  onSave: (patch: GoalPatch) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [enabled, setEnabled] = useState(envelope.goalEnabled ?? Boolean(envelope.goal && envelope.goal > 0));
  const [amount, setAmount] = useState(envelope.goal?.toString() ?? "");
  const [date, setDate] = useState(envelope.goalDate ?? "");
  const [display, setDisplay] = useState<NonNullable<GoalSettings["goalDisplay"]>>(envelope.goalDisplay ?? "percentage");
  const [timing, setTiming] = useState(envelope.goalTimingEnabled ?? Boolean(envelope.goalDate));
  const [progressVisible, setProgressVisible] = useState(envelope.goalProgressVisible ?? true);
  const initialThresholds = envelope.goalThresholds ?? DEFAULT_GOAL_THRESHOLDS;
  const [green, setGreen] = useState(String(initialThresholds.green));
  const [yellow, setYellow] = useState(String(initialThresholds.yellow));
  const [red, setRed] = useState(String(initialThresholds.red));
  const [recurring, setRecurring] = useState(Boolean(envelope.recurrence));
  const [recurringAmount, setRecurringAmount] = useState(envelope.recurrence?.amount.toString() ?? "");
  const [frequency, setFrequency] = useState<Recurrence["frequency"]>(envelope.recurrence?.frequency ?? "Mensual");
  const [intervalDays, setIntervalDays] = useState(String(envelope.recurrence?.intervalDays ?? 15));
  const [nextDate, setNextDate] = useState(() => envelope.recurrence?.nextDate ?? nextContributionDate(today, "Mensual"));
  const [error, setError] = useState("");
  const submitting = useRef(false);

  const numeric = (value: string) => value.trim() === "" ? NaN : Number(value);
  const goal: GoalSettings = {
    goalEnabled: enabled,
    goal: amount.trim() ? numeric(amount) : undefined,
    goalDate: date || undefined,
    goalDisplay: display,
    goalTimingEnabled: timing,
    goalProgressVisible: progressVisible,
    goalThresholds: { green: numeric(green), yellow: numeric(yellow), red: numeric(red) },
  };
  const progress = getEnvelopeGoal({ ...goal, balance: envelope.balance }, today);
  const percent = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(progress.percentage);
  const progressLabel = progress.reached && display === "reached" ? "Meta alcanzada"
    : progress.reached && display === "surplus" ? `Excedente: ${money(progress.surplus)}` : `${percent}% de la meta`;

  function proposeDate(nextFrequency: Recurrence["frequency"], days = intervalDays) {
    try { setNextDate(nextContributionDate(today, nextFrequency, numeric(days))); }
    catch { /* The user can finish the interval; submit reports its validation. */ }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (enabled && !amount.trim()) throw new Error("Debes ingresar el monto objetivo de la meta.");
      validateGoalSettings(goal);
      let recurrence: Recurrence | undefined;
      if (recurring) {
        if (!recurringAmount.trim()) throw new Error("Debes ingresar el monto de cada aporte.");
        recurrence = {
          ...envelope.recurrence,
          amount: numeric(recurringAmount), frequency, nextDate,
          intervalDays: frequency === "Personalizado" ? numeric(intervalDays) : undefined,
          snoozedUntil: nextDate === envelope.recurrence?.nextDate ? envelope.recurrence?.snoozedUntil : undefined,
        };
        if (!nextDate) throw new Error("Selecciona la fecha del próximo aporte.");
        validateRecurrence(recurrence);
      }
      onSave({ ...goal, recurrence });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la configuración. Inténtalo de nuevo.");
      submitting.current = false;
    }
  }

  return <FinanceDialog label={`Configurar meta de ${envelope.name}`} onClose={onClose}>
    <div className="flow-modal">
      <header><div><h2>Configurar meta</h2><p className={styles.context}>{envelope.name}</p></div><button type="button" aria-label="Cerrar configuración de meta" onClick={onClose}>×</button></header>
      <form className={`flow-body ${styles.form}`} onSubmit={submit} noValidate onChange={() => setError("")}>
        <label className={`check-label ${styles.toggle}`}><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Activar meta</label>
        {enabled && <>
          <label htmlFor={`${id}-amount`}>Monto objetivo</label>
          <div className="currency-input"><span aria-hidden="true">₡</span><input id={`${id}-amount`} inputMode="numeric" type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder="100000" /></div>
          <label htmlFor={`${id}-date`}>Fecha límite (opcional)</label>
          <input id={`${id}-date`} type="date" value={date} onChange={event => { setDate(event.target.value); if (!date && event.target.value) setTiming(true); }} />
          <label htmlFor={`${id}-display`}>Al alcanzar o superar la meta</label>
          <select id={`${id}-display`} value={display} onChange={event => setDisplay(event.target.value as typeof display)}><option value="percentage">Mostrar porcentaje real</option><option value="reached">Mostrar «Meta alcanzada»</option><option value="surplus">Mostrar excedente</option></select>
          <p className={styles.hint}>La barra representa el dinero acumulado. El porcentaje puede superar 100%.</p>
          <label className={`check-label ${styles.toggle}`}><input type="checkbox" checked={progressVisible} onChange={event => setProgressVisible(event.target.checked)} />Mostrar barra y progreso en la tarjeta</label>
          <p className={styles.hint}>Puedes ocultarlos sin desactivar la meta ni modificar el saldo.</p>
          {date && <>
            <label className={`check-label ${styles.toggle}`}><input type="checkbox" checked={timing} onChange={event => setTiming(event.target.checked)} />Mostrar indicador de tiempo</label>
            {timing && <fieldset className={styles.thresholds}><legend>Días antes de la fecha límite</legend>
              <label>Verde<input type="number" inputMode="numeric" min="0" step="1" value={green} onChange={event => setGreen(event.target.value)} /></label>
              <label>Amarillo<input type="number" inputMode="numeric" min="0" step="1" value={yellow} onChange={event => setYellow(event.target.value)} /></label>
              <label>Rojo<input type="number" inputMode="numeric" min="0" step="1" value={red} onChange={event => setRed(event.target.value)} /></label>
              <p className={styles.hint}>Verde debe ser mayor que amarillo, y amarillo mayor que rojo. El indicador aparece al entrar en el plazo verde.</p>
            </fieldset>}
          </>}
          {progress.active && <div className={styles.preview} aria-live="polite"><strong>{progressLabel}</strong><span>{money(envelope.balance)} de {money(progress.amount)}</span>{progress.temporal && <span>{progress.temporal.label}. {progress.temporal.explanation}</span>}</div>}
        </>}
        <section className={styles.recurrence} aria-labelledby={`${id}-recurrence`}>
          <h3 id={`${id}-recurrence`}>Aporte recurrente</h3>
          <label className={`check-label ${styles.toggle}`}><input type="checkbox" checked={recurring} onChange={event => setRecurring(event.target.checked)} />Recordarme hacer un aporte</label>
          <p className={styles.hint}>Cada aporte necesita tu confirmación. Puedes usar recordatorios aunque la meta esté desactivada.</p>
          {recurring && <div className={styles.fields}>
            <label htmlFor={`${id}-recurring-amount`}>Monto de cada aporte</label>
            <div className="currency-input"><span aria-hidden="true">₡</span><input id={`${id}-recurring-amount`} type="number" inputMode="numeric" min="1" step="1" value={recurringAmount} onChange={event => setRecurringAmount(event.target.value)} /></div>
            <label htmlFor={`${id}-frequency`}>Frecuencia</label>
            <select id={`${id}-frequency`} value={frequency} onChange={event => { const value = event.target.value as Recurrence["frequency"]; setFrequency(value); proposeDate(value); }}><option value="Semanal">Semanal · cada 7 días</option><option value="Quincenal">Quincenal · cada 15 días</option><option value="Mensual">Mensual</option><option value="Personalizado">Personalizado</option></select>
            {frequency === "Personalizado" && <><label htmlFor={`${id}-interval`}>Repetir cada cuántos días</label><input id={`${id}-interval`} type="number" inputMode="numeric" min="1" step="1" value={intervalDays} onChange={event => { setIntervalDays(event.target.value); proposeDate(frequency, event.target.value); }} /></>}
            <label htmlFor={`${id}-next-date`}>Próximo aporte</label>
            <input id={`${id}-next-date`} type="date" value={nextDate} onChange={event => setNextDate(event.target.value)} />
            <p className={styles.hint}>{nextDate && !Number.isNaN(new Date(`${nextDate}T12:00:00Z`).getTime()) ? `Próximo aporte: ${dateLabel(nextDate)}. ` : ""}Al cambiar la frecuencia se propone una fecha desde hoy; puedes ajustarla.</p>
          </div>}
        </section>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><button className="primary" type="submit">Guardar configuración</button><button className="secondary" type="button" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  </FinanceDialog>;
}
