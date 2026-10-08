"use client";
import { useId, useRef, useState } from "react";
import { buildMovementName, fieldsFor, nameSeparators, reorderNameFields, type MovementNamingPreferences, type NameField, type NamingKind } from "@/lib/movement-names";
import styles from "./movement-name-settings.module.css";

export function MovementNameSettings({ value, onChange }: { value: MovementNamingPreferences; onChange: (kind: NamingKind, settings: MovementNamingPreferences[NamingKind]) => void }) {
  const [kind, setKind] = useState<NamingKind>("Ingreso");
  const [announcement, setAnnouncement] = useState("");
  const [dragTarget, setDragTarget] = useState<NameField | null>(null);
  const dragging = useRef<NameField | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const id = useId(), settings = value[kind];
  const ordered = [...settings.fields, ...fieldsFor(kind).filter(field => !settings.fields.includes(field))];
  const move = (source: NameField, target: NameField) => {
    onChange(kind, { ...settings, fields: reorderNameFields(settings.fields, source, target) });
    setAnnouncement(`${source} cambiado de posición.`);
  };
  const label = (field: NameField) => field === "Semana" ? "Semana del año (ISO 8601)" : field === "Número" ? "Número consecutivo" : field;
  const preview = buildMovementName(settings, { kind, date: "2026-09-27T10:24", amount: 125000, incomeType: "Salario", category: "Alimentación", merchant: "Soda La Plaza", sequence: 1 });
  return <div ref={root} className={styles.settings}>
    <label htmlFor={`${id}-kind`}>Configurar nombres de</label>
    <select id={`${id}-kind`} value={kind} onChange={event => { setKind(event.target.value as NamingKind); setAnnouncement(""); }}><option value="Ingreso">Ingresos</option><option value="Gasto">Gastos</option></select>
    <label htmlFor={`${id}-mode`}>Modo del nombre</label>
    <select id={`${id}-mode`} value={settings.manual ? "manual" : "auto"} onChange={event => onChange(kind, { ...settings, manual: event.target.value === "manual" })}><option value="auto">Automático editable</option><option value="manual">Manual con aviso si conservas la sugerencia</option></select>
    <p className="flow-intro">Selecciona los elementos en el orden deseado. Arrastra su asa o usa las flechas para reordenarlos. Los cambios se guardan automáticamente y solo afectan nuevos movimientos.</p>
    <ol className={styles.fields} aria-label={`Elementos del nombre de ${kind.toLowerCase()}`}>
      {ordered.map(field => {
        const position = settings.fields.indexOf(field), selected = position >= 0;
        return <li key={field} data-name-field={field} data-target={dragTarget === field}>
          <label><input type="checkbox" checked={selected} onChange={event => onChange(kind, { ...settings, fields: event.target.checked ? [...settings.fields, field] : settings.fields.filter(item => item !== field) })}/><span>{selected && <b aria-hidden="true">{position + 1}. </b>}{label(field)}</span></label>
          {selected && <div className={styles.actions}>
            <button type="button" aria-label={`Subir ${field}`} disabled={position === 0} onClick={() => move(field, settings.fields[position - 1])}>↑</button>
            <button type="button" aria-label={`Bajar ${field}`} disabled={position === settings.fields.length - 1} onClick={() => move(field, settings.fields[position + 1])}>↓</button>
            <button type="button" className={styles.grip} aria-label={`Arrastrar ${field}`} aria-describedby={`${id}-drag-help`} onKeyDown={event => { const target = event.key === "ArrowUp" ? settings.fields[position - 1] : event.key === "ArrowDown" ? settings.fields[position + 1] : undefined; if (target) { event.preventDefault(); move(field, target); } }}
              onPointerDown={event => { if (event.button !== 0) return; dragging.current = field; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={event => { if (!dragging.current) return; const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-name-field]"); const target = root.current?.contains(element ?? null) ? element?.dataset.nameField as NameField : undefined; setDragTarget(target && settings.fields.includes(target) ? target : null); }}
              onPointerUp={event => { if (dragging.current && dragTarget) move(dragging.current, dragTarget); dragging.current = null; setDragTarget(null); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={() => { dragging.current = null; setDragTarget(null); }}>⠿</button>
          </div>}
        </li>;
      })}
    </ol>
    <small id={`${id}-drag-help`}>En el asa también puedes usar las flechas del teclado.</small>
    <label htmlFor={`${id}-separator`}>Separador entre elementos</label>
    <select id={`${id}-separator`} value={settings.separator} onChange={event => onChange(kind, { ...settings, separator: event.target.value as typeof settings.separator })}>{nameSeparators.map((separator, index) => <option key={separator} value={separator}>{["Guion ( - )", "Punto ( · )", "Barra ( / )", "Espacio"][index]}</option>)}</select>
    <div className={styles.preview}><b>Vista previa · datos de ejemplo</b><output aria-live="polite">{preview}</output>{!settings.fields.length && <small>Sin elementos seleccionados, se utiliza el monto.</small>}</div>
    <p role="status" className={styles.status}>{announcement}</p>
  </div>;
}
