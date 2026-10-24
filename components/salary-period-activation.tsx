"use client";

import { useRef, useState } from "react";
import { salaryDateLabel, salaryWeekdays, salaryWorkSchedule } from "@/lib/salary-dates";
import { uiCopyEs } from "@/lib/ui-copy";
import { activateSalaryPeriod, salaryAdjustments, salaryExpected, salaryPeriodPresentation, salaryState, type SalaryConcept, type SalaryLedger, type SalaryPeriod } from "@/lib/salary-tracking";
import styles from "./salary-planning.module.css";

export function SalaryPeriodActivation({ ledger, period, today, display, onSave, receiptMode = false, hideTrigger = false, onReviewChange, openReview = false }: {
  ledger: SalaryLedger;
  period: SalaryPeriod;
  today: string;
  display: (amount: number) => string;
  onSave: (operation: (current: SalaryLedger) => SalaryLedger) => void | boolean;
  receiptMode?: boolean;
  hideTrigger?: boolean;
  onReviewChange?: (period: SalaryPeriod | null) => void;
  openReview?: boolean;
}) {
  const [error, setError] = useState("");
  const [localReviewOpen, setLocalReviewOpen] = useState(false);
  const reviewOpen = receiptMode ? openReview : localReviewOpen;
  const state = salaryState(ledger);
  const hasSavedPeriod = state.periods.some(item => item.id === period.id);
  const unrecordedHistory = period.end < today && !hasSavedPeriod;
  const [payDate, setPayDate] = useState(period.payDate);
  const [concepts, setConcepts] = useState<SalaryConcept[]>(() => period.concepts.map(concept => ({ ...concept, amount: unrecordedHistory ? 0 : concept.amount })));
  const [scheduledWorkDays, setScheduledWorkDays] = useState<number[]>(() => [...(period.scheduledWorkDays ?? [])]);
  const [payDateEditing, setPayDateEditing] = useState(false);
  const [workDaysEditing, setWorkDaysEditing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const view = salaryPeriodPresentation(ledger, period, today);
  if (!view.historicalEmpty && !(period.end < today && view.confirmed && !view.fullyPaid)) return null;

  const safeConcepts = concepts.map(concept => ({ ...concept, amount: Number.isSafeInteger(concept.amount) && concept.amount >= 0 ? concept.amount : 0 }));
  const reviewedPeriod = { ...period, payDate, concepts: safeConcepts, scheduledWorkDays };
  const notifyReview = (open: boolean, nextPayDate = payDate, nextConcepts = concepts, nextWorkDays = scheduledWorkDays) => {
    if (!receiptMode || !onReviewChange) return;
    onReviewChange(open ? { ...period, payDate: nextPayDate, concepts: nextConcepts.map(concept => ({ ...concept, amount: Number.isSafeInteger(concept.amount) && concept.amount >= 0 ? concept.amount : 0 })), scheduledWorkDays: [...nextWorkDays] } : null);
  };
  const amount = unrecordedHistory ? 0 : salaryExpected(ledger, reviewedPeriod, true);
  const conceptsValid = concepts.length > 0 && concepts.every(concept => concept.name.trim() && Number.isSafeInteger(concept.amount) && concept.amount >= 0);
  const canSave = Boolean(/^\d{4}-\d{2}-\d{2}$/.test(payDate) && conceptsValid && scheduledWorkDays.length > 0 && amount > 0 && !saving);
  const workSchedule = salaryWorkSchedule(reviewedPeriod).replace(/^Trabajo previsto:\s*/, "");
  const hasExplicitAdjustments = state.periodAdjustments?.some(item => item.configId === period.configId && item.periodId === period.id);
  const extraItems = unrecordedHistory && !hasExplicitAdjustments ? [] : salaryAdjustments(ledger, period);
  const weekdays = [1, 2, 3, 4, 5, 6, 0];

  const saveReviewedWeek = () => {
    if (!canSave || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = onSave(current => activateSalaryPeriod(current, { ...reviewedPeriod, concepts: concepts.map(concept => ({ ...concept })) }, today));
      if (result === false) {
        setError("No se pudo guardar la semana. Revisa el aviso de la aplicación e inténtalo de nuevo.");
        return;
      }
      setLocalReviewOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la semana pendiente.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return <div id={`salary-activation-review-${period.id}`} className={`${styles.activation} ${reviewOpen ? styles.activationReview : ""}`}>
    {!hideTrigger&&<><label className="check-label">
      <input
        type="checkbox"
        checked={view.confirmed || reviewOpen}
        disabled={view.confirmed || saving}
        aria-expanded={reviewOpen}
        aria-controls={`salary-activation-review-${period.id}`}
        onChange={event => {
          if (view.confirmed) return;
          setError("");
          if (!receiptMode) setLocalReviewOpen(event.target.checked);
          if (event.target.checked) setHelpOpen(false);
          notifyReview(event.target.checked);
        }}
      />
      <span>{view.confirmed ? "Activado como pendiente" : reviewOpen ? "Revisar semana histórica" : view.historicalEmpty ? "Sin registros → Registrar" : "Revisar semana histórica"}</span>
    </label>
    {!view.confirmed && <small>{reviewOpen ? receiptMode ? "Revisa la plantilla y confirma el pago con el formulario." : "Revisa la plantilla; la semana se activa al guardarla." : unrecordedHistory ? "Abre la ficha para introducir los importes reales de esta semana." : "Abre la plantilla guardada de esta semana."}</small>}</>}

    {reviewOpen && <div className={styles.activationForm} role="group" aria-label="Revisar semana histórica" onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }}>
      <div className={styles.activationTitle}><h3>Revisar semana histórica</h3><button type="button" className={`${styles.infoButton} ${reviewOpen&&!helpOpen ? styles.infoBlink : ""}`} aria-label={helpOpen ? "Ocultar información" : "Información sobre la revisión histórica"} aria-expanded={helpOpen} onClick={() => setHelpOpen(value => !value)}>ⓘ</button></div>
      {helpOpen && <div className={styles.helpMessage} role="note"><p>{unrecordedHistory ? "No hay un importe histórico guardado. Indica los conceptos y el salario real de esa semana antes de confirmarla." : "Revisa los conceptos y datos guardados de la semana. La fecha prevista no se toma como fecha real del pago."}</p><button type="button" className="text-btn" onClick={() => setHelpOpen(false)}>Ocultar esta información</button></div>}
      <p>{receiptMode ? "Al confirmar el formulario se registra el ingreso y se confirma esta semana." : "Guarda la semana como salario pendiente. Esto no registra un pago ni crea un movimiento de dinero."}</p>
      <div className={styles.activationFacts}>
        <div><span>Semana</span><b>{salaryDateLabel(period.start)} — {salaryDateLabel(period.end)}</b></div>
        <div className={styles.activationEditable}><span>Pago previsto</span>{payDateEditing ? <><input aria-label="Fecha prevista de pago" type="date" value={payDate} onChange={event => { setPayDate(event.target.value); notifyReview(true, event.target.value); }} /><button type="button" className="text-btn" onClick={() => setPayDateEditing(false)}>Listo</button></> : <b>{salaryDateLabel(payDate)} <button type="button" className={styles.editButton} aria-label="Editar fecha prevista de pago" onClick={() => setPayDateEditing(true)}>✎</button></b>}</div>
        <div className={styles.activationEditable}><span>Trabajo previsto</span><b>{workSchedule || "No hay días laborales configurados."} <button type="button" className={styles.editButton} aria-label="Editar días de trabajo previstos" onClick={() => setWorkDaysEditing(value => !value)}>✎</button></b>{workDaysEditing && <div className={styles.weekdayChecks}>{weekdays.map(day => <label key={day} title={["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][day]}><input type="checkbox" checked={scheduledWorkDays.includes(day)} onChange={event => { const next = event.target.checked ? [...scheduledWorkDays, day] : scheduledWorkDays.filter(value => value !== day); setScheduledWorkDays(next); notifyReview(true, payDate, concepts, next); }} /><span>{salaryWeekdays[day]}</span></label>)}<button type="button" className="text-btn" onClick={() => setWorkDaysEditing(false)}>Listo</button>{scheduledWorkDays.length === 0 && <small>Selecciona al menos un día.</small>}</div>}</div>
      </div>

      <section className={styles.extraReview} aria-label={uiCopyEs.salaryAdjustments.title}><h4>{uiCopyEs.salaryAdjustments.title}</h4>{extraItems.length ? <div className={styles.extraTableWrap}><table className={styles.extraTable}><thead><tr><th scope="col">{uiCopyEs.salaryAdjustments.title}</th><th scope="col">Monto</th><th scope="col">Cantidad</th><th scope="col">Detalle</th></tr></thead><tbody>{extraItems.map(item => <tr key={item.id}><th scope="row"><span>{item.name}</span><small>Total: {item.sign === "subtract" ? "−" : ""}{display(item.amount)} · {item.status === "confirmed" ? "Confirmado" : "Estimado"}</small></th><td>{display(item.rate ?? item.amount)}</td><td>{item.quantity ?? "—"}</td><td>{item.unit === "day" ? "Día" : item.unit === "hour" ? "Hora" : "—"}</td></tr>)}</tbody></table></div> : <small>{uiCopyEs.salaryAdjustments.emptyWeek}</small>}</section>

      <fieldset className={styles.activationConcepts}>
        <legend>{unrecordedHistory ? "Importes reales del período" : "Conceptos precargados"}</legend>
        {concepts.map(concept => <div className={styles.activationConcept} key={concept.id}>
          <label>Concepto<input value={concept.name} onChange={event => { const next = concepts.map(item => item.id === concept.id ? { ...item, name: event.target.value } : item); setConcepts(next); notifyReview(true, payDate, next); }} /></label>
          <label>Importe en colones<input type="number" value={concept.amount} onChange={event => { const next = concepts.map(item => item.id === concept.id ? { ...item, amount: Number(event.target.value) } : item); setConcepts(next); notifyReview(true, payDate, next); }} /></label>
          <button type="button" className="secondary" disabled={saving} onClick={() => { const next = concepts.filter(item => item.id !== concept.id); setConcepts(next); notifyReview(true, payDate, next); }}>Quitar concepto</button>
        </div>)}
        <button type="button" className="secondary" disabled={saving} onClick={() => { const next = [...concepts, { id: crypto.randomUUID(), name: "Salario", amount: 0 }]; setConcepts(next); notifyReview(true, payDate, next); }}>Agregar concepto</button>
      </fieldset>

      <div className="review-box">{unrecordedHistory ? <><b>Sin importe salarial guardado</b><small>Escribe los importes reales antes de activar la semana.</small></> : <b>Pendiente que se activará: {display(amount)}</b>}<small>Los ajustes estimados siguen siendo estimados; solo se incluyen los confirmados.</small></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!receiptMode && <div className={styles.actions}>
        <button className="primary" type="button" disabled={!canSave} onClick={saveReviewedWeek}>{saving ? "Guardando…" : "Guardar semana pendiente"}</button>
        <button className="secondary" type="button" disabled={saving} onClick={() => setLocalReviewOpen(false)}>Cancelar</button>
      </div>}
      {receiptMode && <button className="secondary" type="button" onClick={() => { notifyReview(false); }}>Cancelar revisión</button>}
    </div>}
    {error && !reviewOpen && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
