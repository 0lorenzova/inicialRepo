"use client";
import {useRef,useState} from "react";
import {activateSalaryPeriod,salaryExpected,salaryHistoricalEstimate,salaryPeriodPresentation,type SalaryLedger,type SalaryPeriod} from "@/lib/salary-tracking";
import styles from "./salary-planning.module.css";

export function SalaryPeriodActivation({ledger,period,today,display,onSave}:{ledger:SalaryLedger;period:SalaryPeriod;today:string;display:(amount:number)=>string;onSave:(operation:(current:SalaryLedger)=>SalaryLedger)=>void|boolean}) {
  const [error,setError]=useState("");
  const busy=useRef(false);
  const view=salaryPeriodPresentation(ledger,period,today);
  if(!view.historicalEmpty&&!(period.end<today&&view.confirmed&&!view.fullyPaid))return null;
  const known=salaryHistoricalEstimate(ledger,period)!==null;
  const amount=salaryExpected(ledger,period,true);
  const disabled=view.confirmed||!known||amount<=0;
  return <div className={styles.activation}>
    <label className="check-label"><input type="checkbox" checked={view.confirmed} disabled={disabled} onChange={()=>{
      if(busy.current)return;
      busy.current=true;setError("");
      try{if(onSave(current=>activateSalaryPeriod(current,period,today))===false)setError("No se pudo activar la semana. Inténtalo de nuevo.");}
      catch(cause){setError(cause instanceof Error?cause.message:"No se pudo activar la semana.");}
      finally{busy.current=false;}
    }}/><span>{view.confirmed?"Activado como pendiente":"Activar"}</span></label>
    {!view.confirmed&&<small>{!known?"Configura las condiciones vigentes de esta semana para activarla.":amount<=0?"Se necesita un importe mayor que cero para activar el pendiente.":`Reconoces ${display(amount)} como pendiente. No registra dinero recibido; puedes cobrarlo ahora o después. Los ajustes solo estimados no se confirman.`}</small>}
    {error&&<p className="form-error" role="alert">{error}</p>}
  </div>;
}
