"use client";
import { useId } from "react";
import { plannedPaymentDelay, plannedPaymentDelayText } from "@/lib/envelope-planning";

export function PlannedPaymentField({value,deadline,onChange}: {value:string;deadline:string;onChange:(value:string)=>void}) {
  const id=useId(), delay=plannedPaymentDelay({deadline,plannedPaymentDate:value});
  return <>
    <label htmlFor={id}>Fecha prevista de pago (opcional)</label>
    <input id={id} type="date" min="0001-01-01" max="9999-12-31" value={value} aria-describedby={`${id}-hint`} onChange={event=>onChange(event.target.value)}/>
    <p id={`${id}-hint`} className="flow-intro" aria-live="polite">{delay?`${plannedPaymentDelayText(delay)}. El icono del sobre mostrará una advertencia.`:"Indica cuándo planeas pagar. No cambia la fecha límite ni registra un pago."} Puedes borrar esta fecha para cancelar la programación.</p>
  </>;
}
