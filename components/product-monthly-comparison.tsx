import type {LedgerMovement} from "@/lib/finance-ledger";
import {productMonthlyComparison} from "@/lib/finance-products";
import styles from "./finance-products.module.css";

const monthLabel=(month:string)=>new Intl.DateTimeFormat("es-CR",{timeZone:"America/Costa_Rica",month:"short",year:"numeric"}).format(new Date(`${month}-01T12:00:00Z`));
export function ProductMonthlyComparison({movements,envelopeId,productId,name,month,display,privateMode}:{movements:LedgerMovement[];envelopeId:string;productId:string;name:string;month:string;display:(value:number)=>string;privateMode:boolean}) {
  const comparison=productMonthlyComparison(movements,envelopeId,productId,month);
  const peak=Math.max(1,...comparison.months.map(item=>item.amount));
  return <section className={styles.comparison} aria-label="Comparación mensual del producto">
    <h3>Evolución de {privateMode?"producto":name}</h3>
    <p className="flow-intro">Últimos {comparison.months.length} meses hasta {monthLabel(month)}. Los meses en curso pueden estar incompletos.</p>
    {comparison.previous&&<div className="review-box"><span>Cambio frente a {monthLabel(comparison.previous.month)}</span><strong>{privateMode?"••••••":`${comparison.change!>0?"+":comparison.change!<0?"−":""}${display(Math.abs(comparison.change!))}`}</strong><span>{privateMode?"Comparación oculta por privacidad":comparison.percentage===null?"Sin gasto registrado en el mes anterior; no se calcula un porcentaje.":`${comparison.percentage>0?"+":""}${new Intl.NumberFormat("es-CR",{maximumFractionDigits:1}).format(comparison.percentage)}% respecto al mes anterior`}</span></div>}
    <ol className={styles.monthlySeries}>{comparison.months.map(item=><li key={item.month}>
      <span>{monthLabel(item.month)}</span><strong>{privateMode?"••••••":display(item.amount)}</strong>
      {!privateMode&&<><div className={styles.monthlyTrack} aria-hidden="true"><span style={{width:`${item.amount/peak*100}%`}}/></div><small>{item.count} {item.count===1?"compra":"compras"}</small></>}
    </li>)}</ol>
    {!privateMode&&!comparison.months.some(item=>item.count)&&<p className="empty-state">No hay compras registradas de este producto en el período.</p>}
  </section>;
}
