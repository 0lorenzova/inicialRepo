"use client";
import { envelopeLabel } from "@/lib/envelope-label";
import { financialReport, reportMovements } from "@/lib/finance-history";
import type { LedgerMovement } from "@/lib/finance-ledger";
import { movementMoney, movementDate, movementSign } from "@/lib/movement-presentation";
import styles from "./finance-history.module.css";

export function FinanceReport({ movements, month, onMonth, display, kind, hidden, onKind, onBack, onDetail }: { movements: LedgerMovement[]; month: string; onMonth: (month: string) => void; display: (value:number)=>string; kind?:"Ingreso"|"Gasto"|null; hidden:boolean; onKind:(kind:"Ingreso"|"Gasto")=>void; onBack:()=>void; onDetail:(id:string)=>void }) {
  let report;
  try { report=financialReport(movements,month || undefined); } catch { report=null; }
  if(kind) {
    const items=report?reportMovements(movements,month||undefined,kind):[];
    return <div><button className="secondary" onClick={onBack}>‹ Volver a Reportes</button><h2 className="subhead report-list-title">{kind==="Ingreso"?"Ingresos registrados":"Gastos registrados"}</h2><p className="flow-intro">{month||"Todo el historial"} · {items.length} movimientos · Del más reciente al más antiguo</p><div className="report-movements">{items.map(m=><button className="report-movement" key={m.id} onClick={()=>onDetail(m.id)}><span><b>{hidden?m.type:m.name||m.reference||m.type}</b><small>{movementDate(m.date)}</small>{!hidden&&m.reference&&m.reference!==m.name&&<small>{m.reference}</small>}</span><strong className={kind==="Ingreso"?"positive":"negative"}>{movementSign(m)} {hidden?"••••":movementMoney(m)}</strong><span aria-hidden="true">›</span></button>)}</div>{!items.length&&<p className="empty-state">No hay {kind==="Ingreso"?"ingresos":"gastos"} en este período.</p>}</div>;
  }
  return <><div className={styles.filters}><label>Mes del reporte<input aria-label="Mes del reporte" type="month" value={month} onChange={event=>onMonth(event.target.value)} /></label><button className="secondary" onClick={()=>onMonth("")}>Ver todo el historial</button></div>
    {report ? <><p className="flow-intro">{month?"Resumen del mes seleccionado":"Resumen de todo el historial"} · {report.count} movimientos. Transferencias, asignaciones y préstamos internos no se suman como ingresos o gastos.</p>
    <div className="report-cards">{[["Ingresos",report.income,"Total recibido"],["Gastos",report.spent,"Total gastado"],["Ahorro",report.net,"Ingresos menos gastos"]].map(([label,value,foot])=>label==="Ahorro"?<div key={String(label)} className="summary-card accent"><div className="summary-top"><span>{label}</span></div><b className="summary-value">{display(Number(value))}</b><small>{foot}</small></div>:<button key={String(label)} className="summary-card report-card-link" onClick={()=>onKind(label==="Ingresos"?"Ingreso":"Gasto")} aria-label={`Ver ${String(label).toLowerCase()} del período`}><span className="summary-top">{label}<span aria-hidden="true">↗</span></span><b className={`summary-value ${label==="Ingresos"?"positive":"negative"}`}>{label==="Ingresos"?"+":"−"} {display(Number(value))}</b><small>{foot} · Ver detalle</small></button>)}</div>
    <h2 className="subhead">Gasto por categoría</h2>{report.categories.map(([name,amount])=><div className="category-line" key={name}><span>{name}</span><b>{display(amount)}</b></div>)}
    <h2 className="subhead">Gasto por sobre</h2>{report.envelopes.map(envelope=><div className="category-line" key={envelope.id}><span>{envelopeLabel(envelope.name)}</span><b>{display(envelope.spent)}</b></div>)}{report.withoutEnvelope>0&&<div className="category-line"><span>Sin sobre</span><b>{display(report.withoutEnvelope)}</b></div>}
    {!report.spent&&<p className="empty-state">No hay gastos en este período.</p>}</> : <p role="alert" className="form-error">Selecciona un mes válido.</p>}
  </>;
}
