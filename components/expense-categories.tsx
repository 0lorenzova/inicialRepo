"use client";
import { useId, useState } from "react";
import type { ExpenseCategory } from "@/lib/expense-categories";
import styles from "./expense-categories.module.css";

type SaveCategory = (requested: ExpenseCategory, original: ExpenseCategory | null) => void;
export function ExpenseCategoryManager({ categories, onSave }: { categories: ExpenseCategory[]; onSave: SaveCategory }) {
  const id = useId();
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const save = () => { try { onSave({ id: editing?.id || crypto.randomUUID(), name, archived: editing?.archived ?? false }, editing); setName(""); setEditing(null); setError(""); setNotice("Categoría guardada. El historial conserva sus nombres originales."); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la categoría."); } };
  return <div className={styles.manager}>
    <p className="flow-intro">Agrega o renombra categorías para próximos gastos. Archivar las oculta del selector; los movimientos anteriores conservan su categoría original.</p>
    <label htmlFor={`${id}-name`}>{editing ? `Editar categoría: ${editing.name}` : "Nueva categoría"}</label>
    <input id={`${id}-name`} value={name} maxLength={60} onChange={event => setName(event.target.value)} onKeyDown={event => { if(event.key==="Enter") { event.preventDefault(); save(); } }} placeholder="Ej. Viajes"/>
    <div className={styles.actions}><button className="primary" type="button" onClick={save}>{editing ? "Guardar categoría" : "Agregar categoría"}</button>{editing && <button className="secondary" type="button" onClick={() => { setEditing(null); setName(""); setError(""); }}>Cancelar edición</button>}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className={styles.notice} role="status">{notice}</p>
    <label className="check-label"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)}/>Mostrar categorías archivadas</label>
    <ul className={styles.list}>{categories.filter(category => showArchived || !category.archived).map(category => <li key={category.id}><span>{category.name}{category.archived && <small>Archivada</small>}</span><div className={styles.actions}><button className="secondary" type="button" aria-label={`Editar categoría ${category.name}`} onClick={() => { setEditing({ ...category }); setName(category.name); setError(""); setNotice(""); }}>Editar</button><button className="secondary" type="button" aria-label={`${category.archived ? "Restaurar" : "Archivar"} categoría ${category.name}`} onClick={() => { try { onSave({ ...category, archived: !category.archived }, category); setError(""); setNotice(category.archived ? "Categoría restaurada." : "Categoría archivada; puedes restaurarla aquí."); } catch(cause) { setError(cause instanceof Error ? cause.message : "No se pudo cambiar la categoría."); } }}>{category.archived ? "Restaurar" : "Archivar"}</button></div></li>)}</ul>
  </div>;
}

export function ExpenseCategorySelect({ categories, value, onChange, onSave }: { categories: ExpenseCategory[]; value: string; onChange: (value: string) => void; onSave: SaveCategory }) {
  const id=useId();
  return <><label htmlFor={id}>Categoría</label><select id={id} value={value} onChange={event=>onChange(event.target.value)}><option value="">Sin categoría</option>{value&&!categories.some(category=>!category.archived&&category.name===value)&&<option value={value} disabled>{value} (no disponible)</option>}{categories.filter(category=>!category.archived).map(category=><option key={category.id} value={category.name}>{category.name}</option>)}</select>
    <details className={styles.inline}><summary>Administrar categorías</summary><ExpenseCategoryManager categories={categories} onSave={(requested,original)=>{onSave(requested,original);if(!original||original.name===value)onChange(requested.archived?"":requested.name.trim().replace(/\s+/g," "));}}/></details></>;
}
