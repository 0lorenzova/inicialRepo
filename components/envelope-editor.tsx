"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import { suggestEnvelopeIcons, validateEnvelopeIdentity } from "@/lib/envelope-icons";
import styles from "./envelope-editor.module.css";

type EnvelopeIdentity = { name: string; icon: string };

export function EnvelopeEditor({ envelope, onSave, onClose }: {
  envelope: EnvelopeIdentity | null;
  /** Save only these two fields against the latest envelope; throw to show an error. */
  onSave: (changes: EnvelopeIdentity) => void;
  onClose: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(envelope?.name ?? "");
  const [manualIcon, setManualIcon] = useState<string | null>(envelope?.icon ?? null);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const suggestions = suggestEnvelopeIcons(name);
  const icon = manualIcon ?? suggestions[0].icon;
  const previewIcon = Array.from(new Intl.Segmenter("es", { granularity: "grapheme" }).segment(icon.trim()))[0]?.segment || "📩";
  const title = envelope ? "Editar sobre" : "Crear sobre";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      onSave(validateEnvelopeIdentity({ name, icon }));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los cambios. Inténtalo de nuevo.");
      submitting.current = false;
    }
  }

  return <FinanceDialog label={title} onClose={onClose}>
    <div className="flow-modal">
      <header><div><h2>{title}</h2></div><button type="button" aria-label="Cerrar formulario" onClick={onClose}>×</button></header>
      <form className={`flow-body ${styles.form}`} onSubmit={submit} noValidate>
        <label htmlFor={`${id}-name`}>Nombre del sobre</label>
        <input id={`${id}-name`} autoFocus value={name} onChange={event => { setName(event.target.value); setError(""); }} placeholder="Por ejemplo, Alimentación" autoComplete="off" required />
        <fieldset className={styles.suggestions}>
          <legend>Iconos sugeridos</legend>
          {suggestions.map(option => <button key={option.icon} className={styles.iconButton} type="button" aria-label={`Elegir icono: ${option.label}`} aria-pressed={icon === option.icon} title={option.label} onClick={() => { setManualIcon(option.icon); setError(""); }}><span aria-hidden="true">{option.icon}</span></button>)}
        </fieldset>
        <label htmlFor={`${id}-icon`}>Icono personalizado</label>
        <input id={`${id}-icon`} value={icon} onChange={event => { setManualIcon(event.target.value); setError(""); }} aria-describedby={`${id}-hint`} autoComplete="off" required />
        <p id={`${id}-hint`} className={styles.hint}>Puedes elegir una sugerencia o escribir cualquier emoji.</p>
        <div className={styles.preview} aria-label="Vista previa del sobre"><span className={styles.previewIcon} aria-hidden="true">{previewIcon}</span><strong className={styles.previewName}>{name.trim() || "Nuevo sobre"}</strong></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><button className="primary" type="submit">{envelope ? "Guardar cambios en el sobre" : "Crear sobre"}</button><button className="secondary" type="button" onClick={onClose}>Cancelar</button></div>
      </form>
    </div>
  </FinanceDialog>;
}
