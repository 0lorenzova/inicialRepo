"use client";
import { historyRangeError } from "@/lib/finance-history";
import styles from "./finance-history.module.css";
export function HistoryDateFilters({from,to,onChange,showClearButton=true}: {from:string;to:string;onChange:(value:{from:string;to:string})=>void;showClearButton?:boolean}) {
  const error=historyRangeError(from,to);
  return <><div className={styles.filters}><label>Desde<input type="date" value={from} onChange={event=>onChange({from:event.target.value,to})}/></label><label>Hasta<input type="date" value={to} onChange={event=>onChange({from,to:event.target.value})}/></label>{showClearButton&&(from||to)&&<button className="secondary" onClick={()=>onChange({from:"",to:""})}>Quitar fechas</button>}</div>{error&&<p className="form-error" role="alert">{error}</p>}</>;
}
