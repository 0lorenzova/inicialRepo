"use client";
import { financialReport } from "@/lib/finance-history";
import type { LedgerMovement } from "@/lib/finance-ledger";
import styles from "./finance-history.module.css";

export function FinanceReport({ movements, month, onMonth, display }: { movements: LedgerMovement[]; month: string; onMonth: (month: string) => void; display: (value:number)=>string }) {
  let report;
  try { report=financialReport(movements,month || undefined); } catch { report=null; }
  return <><div className={styles.filters}><label>Mes del reporte<input aria-label="Mes del reporte" type="month" value={month} onChange={event=>onMonth(event.target.value)} /></label><button className="secondary" onClick={()=>onMonth("")}>Ver todo el historial</button></div>
    {report ? <><p className="flow-intro">{month?"Resumen del mes seleccionado":"Resumen de todo el historial"} · {report.count} movimientos. Transferencias, asignaciones y préstamos internos no se suman como ingresos o gastos.</p>
    <div className="report-cards">{[["Ingresos",report.income,"Total recibido"],["Gastos",report.spent,"Total gastado"],["Ahorro",report.net,"Ingresos menos gastos"]].map(([label,value,foot])=><div key={String(label)} className={`summary-card ${label==="Ahorro"?"accent":""}`}><div className="summary-top"><span>{label}</span></div><b className="summary-value">{display(Number(value))}</b><small>{foot}</small></div>)}</div>
    <h2 className="subhead">Gasto por categoría</h2>{report.categories.map(([name,amount])=><div className="category-line" key={name}><span>{name}</span><b>{display(amount)}</b></div>)}
    <h2 className="subhead">Gasto por sobre</h2>{report.envelopes.map(envelope=><div className="category-line" key={envelope.id}><span>{envelope.name}</span><b>{display(envelope.spent)}</b></div>)}{report.withoutEnvelope>0&&<div className="category-line"><span>Sin sobre</span><b>{display(report.withoutEnvelope)}</b></div>}
    {!report.spent&&<p className="empty-state">No hay gastos en este período.</p>}</> : <p role="alert" className="form-error">Selecciona un mes válido.</p>}
  </>;
}
