"use client";
import { useId, useState } from "react";
import type { DistributionTemplate } from "@/lib/distribution-templates";

export function DistributionTemplates({templates,onSave,onApply,onRemove,hasDraft}:{templates:DistributionTemplate[];onSave:(name:string)=>void;onApply:(id:string)=>void;onRemove:(id:string)=>void;hasDraft:boolean}) {
  const id=useId(),[selected,setSelected]=useState(""),[name,setName]=useState(""),[message,setMessage]=useState("");
  const attempt=(action:()=>void,success:string)=>{try{action();setMessage(success);}catch(cause){setMessage(cause instanceof Error?cause.message:"No se pudo utilizar la plantilla.");}};
  return <details className="distribution-templates"><summary>Distribuciones guardadas</summary><div>
    <p>Reutiliza montos por sobre. Aplicar una plantilla reemplaza la selección provisional; no registra pagos.</p>
    {!!templates.length&&<><label htmlFor={`${id}-selected`}>Plantilla</label><select id={`${id}-selected`} value={selected} onChange={event=>{setSelected(event.target.value);setMessage("");}}><option value="">Selecciona una distribución</option>{templates.map(template=><option key={template.id} value={template.id}>{template.name}</option>)}</select><button className="secondary" type="button" disabled={!selected} onClick={()=>{if(hasDraft&&!confirm("¿Reemplazar los montos y obligaciones seleccionados en este borrador por la plantilla?"))return;attempt(()=>onApply(selected),"Plantilla aplicada al borrador.");}}>Aplicar distribución</button><button className="danger-link" type="button" disabled={!selected} onClick={()=>{if(!confirm("¿Quitar esta plantilla? Los movimientos anteriores se conservan."))return;attempt(()=>{onRemove(selected);setSelected("");},"Plantilla retirada.");}}>Quitar plantilla</button></>}
    <label htmlFor={`${id}-name`}>Nombre para guardar esta distribución</label><input id={`${id}-name`} maxLength={80} value={name} onChange={event=>setName(event.target.value)} placeholder="Ej. Distribución semanal"/><button type="button" className="secondary" disabled={!hasDraft} onClick={()=>attempt(()=>{onSave(name);setName("");},"Distribución guardada.")}>Guardar distribución actual</button>
    {message&&<p role="status">{message}</p>}
  </div></details>;
}
