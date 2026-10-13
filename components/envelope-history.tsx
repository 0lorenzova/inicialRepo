"use client";
import { useState } from "react";
import type { LedgerMovement } from "@/lib/finance-ledger";
import { envelopeHistorySections, movementDay } from "@/lib/finance-history";
import { MovementList } from "./movement-list";

export function EnvelopeHistory({items,envelopeId,hidden,onTrace,onDetail}:{items:LedgerMovement[];envelopeId?:string;hidden:boolean;onTrace:(id:string)=>void;onDetail?:(id:string)=>void}) {
  const [mode,setMode]=useState<"chronology"|"separate">("chronology");
  if (!envelopeId) return <MovementList items={items} hidden={hidden} onTrace={onTrace} onDetail={onDetail}/>;
  const days=new Map<string,LedgerMovement[]>();
  for(const item of items){const day=movementDay(item.date);days.set(day,[...(days.get(day)||[]),item]);}
  const sections=mode==="separate"?envelopeHistorySections(items):[...days].map(([day,rows])=>({title:day?new Intl.DateTimeFormat("es-CR",{timeZone:"UTC",dateStyle:"long"}).format(new Date(`${day}T12:00:00Z`)):"Fecha no disponible",items:rows}));
  return <div className="envelope-history">
    <div className="history-view-switch" role="group" aria-label="Vista del historial del sobre">
      <button className="secondary" aria-pressed={mode==="separate"} onClick={()=>setMode("separate")}>Ingresos y gastos</button>
      <button className="secondary" aria-pressed={mode==="chronology"} onClick={()=>setMode("chronology")}>Cronología</button>
    </div>
    <p className="flow-intro">Los importes corresponden a este sobre. Las transferencias y los préstamos conservan su tipo de operación.</p>
    {!items.length?<div className="empty-state"><b>No hay movimientos para estos filtros</b><small>Prueba otro período, tipo o búsqueda.</small></div>:sections.filter(section=>section.items.length).map(section=><section key={section.title} aria-label={section.title}>
      <h3 className="subhead">{section.title}</h3>
      <MovementList items={section.items} envelopeId={envelopeId} hidden={hidden} onTrace={onTrace} onDetail={onDetail}/>
    </section>)}
  </div>;
}
