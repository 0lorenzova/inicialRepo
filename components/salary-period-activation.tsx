"use client";

import { useRef, useState } from "react";
import { salaryDateLabel, salaryWorkSchedule } from "@/lib/salary-dates";
import { activateSalaryPeriod, salaryExpected, salaryHistoricalEstimate, salaryPeriodPresentation, type SalaryConcept, type SalaryLedger, type SalaryPeriod } from "@/lib/salary-tracking";
import styles from "./salary-planning.module.css";

export function SalaryPeriodActivation({ ledger, period, today, display, onSave }: {
  ledger: SalaryLedger;
  period: SalaryPeriod;
  today: string;
  display: (amount: number) => string;
  onSave: (operation: (current: SalaryLedger) => SalaryLedger) => void | boolean;
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

  const updateConcept = (id: string, value: Partial<SalaryConcept>) => {
    setConcepts(current => current.map(concept => concept.id === id ? { ...concept, ...value } : concept));
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
        }}
      />
      <span>{view.confirmed ? "Activado como pendiente" : reviewOpen ? "Revisar semana" : "Activar"}</span>
    </label>
    {!view.confirmed && <small>{reviewOpen ? "La casilla parpadea mientras revisas; la semana solo se activa al guardar." : "Haz clic para abrir la plantilla precargada de esta semana."}</small>}

    {reviewOpen && <div id={`salary-activation-review-${period.id}`} className={styles.activationForm} role="group" aria-label="Revisar semana histórica" onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }}>
      <h3>Revisar semana histórica</h3>
      <p>Revisa la semana y guarda sus datos como salario pendiente. Esto no registra un pago ni crea un movimiento de dinero.</p>
      <div className={styles.activationFacts}>
        <div><span>Semana</span><b>{salaryDateLabel(period.start)} — {salaryDateLabel(period.end)}</b></div>
        <label>Pago previsto<input type="date" value={payDate} onChange={event => setPayDate(event.target.value)} /></label>
        <div><span>Trabajo previsto</span><b>{workSchedule || "No hay días laborales configurados."}</b></div>
      </div>

      <fieldset className={styles.activationConcepts}>
        <legend>Conceptos precargados</legend>
        {concepts.map(concept => <div className={styles.activationConcept} key={concept.id}>
          <label>Concepto<input value={concept.name} onChange={event => updateConcept(concept.id, { name: event.target.value })} /></label>
          <label>Importe en colones<input type="number" value={concept.amount} onChange={event => updateConcept(concept.id, { amount: Number(event.target.value) })} /></label>
          <button type="button" className="secondary" disabled={saving} onClick={() => setConcepts(current => current.filter(item => item.id !== concept.id))}>Quitar concepto</button>
        </div>)}
        <button type="button" className="secondary" disabled={saving} onClick={() => setConcepts(current => [...current, { id: crypto.randomUUID(), name: "Salario", amount: 0 }])}>Agregar concepto</button>
      </fieldset>

      <div className="review-box"><b>Pendiente que se activará: {display(amount)}</b><small>{estimate ? `Plantilla precargada: ${estimate.basis}` : "No hay una estimación histórica completa; la plantilla usa los valores disponibles para esta semana. Revísalos antes de guardar."}</small><small>Los ajustes estimados siguen siendo estimados; solo se incluyen los confirmados.</small></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className={styles.actions}>
        <button className="primary" type="button" disabled={!canSave} onClick={saveReviewedWeek}>{saving ? "Guardando…" : "Guardar semana pendiente"}</button>
        <button className="secondary" type="button" disabled={saving} onClick={() => setReviewOpen(false)}>Cancelar</button>
      </div>
    </div>}
    {error && !reviewOpen && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
