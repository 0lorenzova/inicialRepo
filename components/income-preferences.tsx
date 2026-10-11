"use client";
import { useId, useState } from "react";
import { normalizeIncomePreferences, validateIncomePreferences, type IncomePreferences } from "@/lib/income-preferences";
import type { Account } from "@/lib/finance-ledger";

export function IncomePreferenceSettings({value,accounts,onSave}:{value?:IncomePreferences;accounts:Account[];onSave:(value:IncomePreferences)=>void}) {
  const id=useId(),[draft,setDraft]=useState(()=>normalizeIncomePreferences(value)),[message,setMessage]=useState("");
  const change=(key:keyof IncomePreferences,value:string)=>{setDraft(current=>({...current,[key]:value}));setMessage("");};
  return <form className="income-preferences" onSubmit={event=>{event.preventDefault();try{onSave(validateIncomePreferences(draft,accounts));setMessage("Preferencias guardadas.");}catch(cause){setMessage(cause instanceof Error?cause.message:"No se pudieron guardar las preferencias.");}}}>
    <p>Son sugerencias editables para nuevos ingresos. Cambiar un ingreso no modifica estas preferencias.</p>
    <label htmlFor={`${id}-amount`}>Monto sugerido (opcional)</label><input id={`${id}-amount`} type="number" min="1" step="1" value={draft.amount} onChange={event=>change("amount",event.target.value)}/>
    <label htmlFor={`${id}-type`}>Tipo de ingreso sugerido</label><input id={`${id}-type`} maxLength={80} value={draft.incomeType} placeholder="Salario, venta…" onChange={event=>change("incomeType",event.target.value)}/>
    <label htmlFor={`${id}-account`}>Cuenta sugerida</label><select id={`${id}-account`} value={draft.accountId} onChange={event=>change("accountId",event.target.value)}><option value="">Sin preferencia</option>{accounts.filter(account=>account.active||account.id===draft.accountId).map(account=><option key={account.id} value={account.id} disabled={!account.active}>{account.name}{!account.active?" (inactiva)":""}</option>)}</select>
    <label htmlFor={`${id}-reference`}>Referencia sugerida</label><input id={`${id}-reference`} value={draft.reference} onChange={event=>change("reference",event.target.value)}/>
    <label htmlFor={`${id}-description`}>Descripción sugerida</label><textarea id={`${id}-description`} value={draft.description} onChange={event=>change("description",event.target.value)}/>
    {message&&<p role="status">{message}</p>}<button type="submit" className="primary">Guardar preferencias</button>
  </form>;
}
