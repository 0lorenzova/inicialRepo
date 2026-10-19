"use client";

import { useRef, useState } from "react";
import { salaryDateLabel, salaryWorkSchedule } from "@/lib/salary-dates";
import { activateSalaryPeriod, salaryExpected, salaryHistoricalEstimate, salaryPeriodPresentation, type SalaryConcept, type SalaryLedger, type SalaryPeriod } from "@/lib/salary-tracking";
import styles from "./salary-planning.module.css";

export function SalaryPeriodActivation({ ledger, period, today, display, onSave, receiptMode = false, onReviewChange }: {
  ledger: SalaryLedger;
  period: SalaryPeriod;
  today: string;
  display: (amount: number) => string;
  onSave: (operation: (current: SalaryLedger) => SalaryLedger) => void | boolean;
  receiptMode?: boolean;
  onReviewChange?: (period: SalaryPeriod | null) => void;
}) {
  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [payDate, setPayDate] = useState(period.payDate);
  const [concepts, setConcepts] = useState<SalaryConcept[]>(() => period.concepts.map(concept => ({ ...concept })));
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const view = salaryPeriodPresentation(ledger, period, today);
  const estimate = salaryHistoricalEstimate(ledger, period);
  if (!view.historicalEmpty && !(period.end < today && view.confirmed && !view.fullyPaid)) return null;

  const safeConcepts = concepts.map(concept => ({ ...concept, amount: Number.isSafeInteger(concept.amount) && concept.amount >= 0 ? concept.amount : 0 }));
  const reviewedPeriod = { ...period, payDate, concepts: safeConcepts };
  const notifyReview = (open: boolean, nextPayDate = payDate, nextConcepts = concepts) => {
    if (!receiptMode || !onReviewChange) return;
    onReviewChange(open ? { ...period, payDate: nextPayDate, concepts: nextConcepts.map(concept => ({ ...concept, amount: Number.isSafeInteger(concept.amount) && concept.amount >= 0 ? concept.amount : 0 })) } : null);
  };
  const amount = salaryExpected(ledger, reviewedPeriod, true);
  const conceptsValid = concepts.length > 0 && concepts.every(concept => concept.name.trim() && Number.isSafeInteger(concept.amount) && concept.amount >= 0);
  const canSave = Boolean(/^\d{4}-\d{2}-\d{2}$/.test(payDate) && conceptsValid && amount > 0 && !saving);
  const workSchedule = salaryWorkSchedule(period).replace(/^Trabajo previsto:\s*/, "");

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
      setReviewOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la semana pendiente.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return <div className={`${styles.activation} ${reviewOpen ? styles.activationReview : ""}`}>
    <label className="check-label">
      <input
        type="checkbox"
        checked={view.confirmed || reviewOpen}
        disabled={view.confirmed || saving}
        aria-expanded={reviewOpen}
        aria-controls={`salary-activation-review-${period.id}`}
        onChange={event => {
          if (view.confirmed) return;
          setError("");
          setReviewOpen(event.target.checked);
          notifyReview(event.target.checked);
        }}
      />
      <span>{view.confirmed ? "Activado como pendiente" : reviewOpen ? "Revisar semana" : "Activar"}</span>
    </label>
    {!view.confirmed && <small>{reviewOpen ? receiptMode ? "La casilla parpadea mientras revisas. Al guardar el formulario se confirma la semana y se registra el ingreso." : "La casilla parpadea mientras revisas; la semana solo se activa al guardar." : "Haz clic para abrir la plantilla precargada de esta semana."}</small>}

    {reviewOpen && <div id={`salary-activation-review-${period.id}`} className={styles.activationForm} role="group" aria-label="Revisar semana histórica" onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }}>
      <h3>Revisar semana histórica</h3>
      <p>{receiptMode ? "Revisa la plantilla precargada y los datos del ingreso. El botón Guardar del formulario registra el ingreso y confirma esta semana juntos." : "Revisa la semana y guarda sus datos como salario pendiente. Esto no registra un pago ni crea un movimiento de dinero."}</p>
      <div className={styles.activationFacts}>
        <div><span>Semana</span><b>{salaryDateLabel(period.start)} — {salaryDateLabel(period.end)}</b></div>
        <label>Pago previsto<input type="date" value={payDate} onChange={event => { setPayDate(event.target.value); notifyReview(true, event.target.value); }} /></label>
        <div><span>Trabajo previsto</span><b>{workSchedule || "No hay días laborales configurados."}</b></div>
      </div>

      <fieldset className={styles.activationConcepts}>
        <legend>Conceptos precargados</legend>
        {concepts.map(concept => <div className={styles.activationConcept} key={concept.id}>
          <label>Concepto<input value={concept.name} onChange={event => { const next = concepts.map(item => item.id === concept.id ? { ...item, name: event.target.value } : item); setConcepts(next); notifyReview(true, payDate, next); }} /></label>
          <label>Importe en colones<input type="number" value={concept.amount} onChange={event => { const next = concepts.map(item => item.id === concept.id ? { ...item, amount: Number(event.target.value) } : item); setConcepts(next); notifyReview(true, payDate, next); }} /></label>
          <button type="button" className="secondary" disabled={saving} onClick={() => { const next = concepts.filter(item => item.id !== concept.id); setConcepts(next); notifyReview(true, payDate, next); }}>Quitar concepto</button>
        </div>)}
        <button type="button" className="secondary" disabled={saving} onClick={() => { const next = [...concepts, { id: crypto.randomUUID(), name: "Salario", amount: 0 }]; setConcepts(next); notifyReview(true, payDate, next); }}>Agregar concepto</button>
      </fieldset>

      <div className="review-box"><b>Pendiente que se activará: {display(amount)}</b><small>{estimate ? `Plantilla precargada: ${estimate.basis}` : "No hay una estimación histórica completa; la plantilla usa los valores disponibles para esta semana. Revísalos antes de guardar."}</small><small>Los ajustes estimados siguen siendo estimados; solo se incluyen los confirmados.</small></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!receiptMode && <div className={styles.actions}>
        <button className="primary" type="button" disabled={!canSave} onClick={saveReviewedWeek}>{saving ? "Guardando…" : "Guardar semana pendiente"}</button>
        <button className="secondary" type="button" disabled={saving} onClick={() => setReviewOpen(false)}>Cancelar</button>
      </div>}
      {receiptMode && <button className="secondary" type="button" onClick={() => { setReviewOpen(false); notifyReview(false); }}>Cancelar revisión</button>}
    </div>}
    {error && !reviewOpen && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
