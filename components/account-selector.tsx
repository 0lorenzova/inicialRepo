"use client";
import { useId, useRef, useState } from "react";
import type { Account } from "@/lib/finance-ledger";

export function AccountSelector({ label = "Cuenta", accounts, value, onChange, onCreate, display }: {
  label?: string; accounts: Account[]; value: string; onChange: (id: string) => void;
  onCreate: (name: string, type: string) => string; display: (amount: number) => string;
}) {
  const id = useId();
  const [creating, setCreating] = useState(false), [name, setName] = useState(""), [type, setType] = useState("Banco"), [error, setError] = useState("");
  const saving = useRef(false);
  function save() {
    if (saving.current) return;
    saving.current = true;
    try { const created = onCreate(name, type); onChange(created); setCreating(false); setName(""); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear la cuenta."); }
    finally { saving.current = false; }
  }
  return <div className="account-selector">
    <label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event=>onChange(event.target.value)}><option value="">Selecciona la cuenta</option>{accounts.filter(account=>account.active).map(account=><option key={account.id} value={account.id}>{account.name} · {display(account.balance)}</option>)}</select>
    {!creating ? <button type="button" className="text-btn" onClick={()=>setCreating(true)}>＋ Crear cuenta aquí</button> : <fieldset>
      <legend>Nueva cuenta</legend><label htmlFor={`${id}-name`}>Nombre de la nueva cuenta</label><input id={`${id}-name`} value={name} onChange={event=>setName(event.target.value)}/>
      <label htmlFor={`${id}-type`}>Tipo de cuenta</label><select id={`${id}-type`} value={type} onChange={event=>setType(event.target.value)}>{["Banco","Efectivo","Tarjeta","Otro"].map(type=><option key={type}>{type}</option>)}</select>
      <p className="flow-intro">Se crea con saldo cero y queda seleccionada. El movimiento actual se conserva.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div><button type="button" className="secondary" onClick={()=>{setCreating(false);setError("");}}>Cancelar creación</button><button type="button" className="primary" onClick={save}>Crear y seleccionar</button></div>
    </fieldset>}
  </div>;
}
