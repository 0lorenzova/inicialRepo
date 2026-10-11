"use client";
import { useState } from "react";
import { FinanceDialog } from "./finance-dialog";

export function ProximityVisibility({visible,onChange}:{visible:boolean;onChange:(visible:boolean)=>void}) {
  const [confirming,setConfirming]=useState(false);
  return <><label className="check-label"><input type="checkbox" checked={!visible} onChange={event=>event.target.checked?setConfirming(true):onChange(true)}/>Ocultar puntos de proximidad de fechas</label>
    {confirming&&<FinanceDialog label="Ocultar indicadores de proximidad" onClose={()=>setConfirming(false)}><section className="flow-modal"><header><h2>Ocultar indicadores de proximidad</h2></header><div className="flow-body"><p>Al ocultar los indicadores de proximidad de fechas, estos dejarán de mostrarse en las diferentes pantallas de la aplicación. Puedes volver a activarlos cuando quieras. ¿Deseas continuar?</p><button className="primary" onClick={()=>{onChange(false);setConfirming(false);}}>Confirmar</button><button className="secondary" onClick={()=>setConfirming(false)}>Cancelar</button></div></section></FinanceDialog>}
  </>;
}
