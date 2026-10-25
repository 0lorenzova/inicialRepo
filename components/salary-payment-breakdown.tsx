import type {SalaryPayment} from "@/lib/salary-tracking";
import styles from "./salary-payment-entry.module.css";

/** Receipt-time detail stays attributable even when the weekly catalog is renamed. */
export function SalaryPaymentBreakdown({payment,display}:{payment:SalaryPayment;display:(amount:number)=>string}){
  const breakdown=payment.receiptBreakdown;
  if(!breakdown)return null;
  return <dl className={styles.savedBreakdown} aria-label="Desglose del pago recibido">{breakdown.salaryAmount>0&&<div><dt>Salario recibido</dt><dd>{display(breakdown.salaryAmount)}</dd></div>}{breakdown.concepts.map(item=><div key={item.adjustmentId}><dt>{item.name}{item.sign==="subtract"?" · Deducción":""}</dt><dd>{item.sign==="subtract"?"−":"+"}{display(item.amount)}</dd></div>)}</dl>;
}
