"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import { previewPostponement, type PostponeOption, type Recurrence } from "@/lib/finance-recurrence";
import styles from "./envelope-goal-editor.module.css";

const choices = [
  { key: "day", label: "1 día", option: { unit: "days", amount: 1 } },
  { key: "week", label: "1 semana", option: { unit: "days", amount: 7 } },
  { key: "fortnight", label: "1 quincena", option: { unit: "days", amount: 15 } },
  { key: "month", label: "1 mes", option: { unit: "months", amount: 1 } },
  { key: "custom", label: "Otro", option: null },
] as const;
const dateLabel = (date: string) => new Intl.DateTimeFormat("es-CR", { dateStyle: "long", timeZone: "America/Costa_Rica" }).format(new Date(`${date}T12:00:00Z`));

export function PostponeEditor({ envelope, today, onSave, onClose }: {
  envelope: { name: string; recurrence: Recurrence };
  today: string;
  onSave: (option: PostponeOption) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [selected, setSelected] = useState<typeof choices[number]["key"]>("day");
  const [days, setDays] = useState("");
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const option: PostponeOption = choices.find(choice => choice.key === selected)?.option ?? { unit: "days", amount: days.trim() ? Number(days) : NaN };
  let preview = "";
  try { preview = previewPostponement(today, option); } catch { /* Incomplete fields are validated when submitted. */ }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (selected === "custom" && !days.trim()) throw new Error("Debes ingresar cuántos días quieres posponer el aporte.");
      previewPostponement(today, option);
      onSave(option);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo posponer el aporte. Inténtalo de nuevo.");
      submitting.current = false;
    }
  }

  return <FinanceDialog label={`Posponer aporte de ${envelope.name}`} onClose={onClose}>
    <div className="flow-modal">
      <header><div><h2>Posponer aporte</h2><p className={styles.context}>{envelope.name}</p></div><button type="button" aria-label="Cerrar posposición" onClick={onClose}>×</button></header>
      <form className={`flow-body ${styles.form}`} onSubmit={submit} noValidate>
        <p className={styles.hint}>El plazo se cuenta desde hoy: {dateLabel(today)}.</p>
        <fieldset className={styles.choices}><legend>¿Cuánto tiempo quieres posponerlo?</legend>{choices.map(choice => <button type="button" key={choice.key} aria-pressed={selected === choice.key} onClick={() => { setSelected(choice.key); setError(""); }}>{choice.label}</button>)}</fieldset>
        {selected === "custom" && <><label htmlFor={`${id}-days`}>Cantidad de días a partir de hoy</label><input id={`${id}-days`} type="number" inputMode="numeric" min="1" step="1" value={days} onChange={event => { setDays(event.target.value); setError(""); }} autoFocus /></>}
        <div className={styles.preview} aria-live="polite"><strong>Nueva fecha del aporte</strong><span>{preview ? dateLabel(preview) : "Ingresa una cantidad válida de días para ver la fecha."}</span></div>
        <p className={styles.hint}>Solo cambia el recordatorio; el aporte seguirá necesitando tu confirmación.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><button className="primary" type="submit">Confirmar nueva fecha</button><button className="secondary" type="button" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  </FinanceDialog>;
}
