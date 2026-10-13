"use client";
import type { LedgerMovement } from "@/lib/finance-ledger";
import { envelopeLabel, envelopeMovementLabel } from "@/lib/envelope-label";
import { movementDate, movementFields, movementMoney, movementSign } from "@/lib/movement-presentation";
import { FinanceDialog } from "./finance-dialog";
import styles from "./movement-detail.module.css";

export function MovementDetails({movement,hidden,allocations=true}:{movement:LedgerMovement;hidden:boolean;allocations?:boolean}) {
  const label=movement.type === "Ingreso" ? "Detalle del ingreso" : movement.type === "Gasto" ? "Detalle del gasto" : "Detalle del movimiento";
  const color=movement.type === "Ingreso" ? "positive" : movement.type === "Gasto" ? "negative" : "";
  return <div className={styles.detail}>
    <strong className={`${styles.amount} ${color}`}>{movementSign(movement)} {hidden?"••••":movementMoney(movement)}</strong>
    <h3>{hidden?movement.type:envelopeMovementLabel(movement)}</h3>
    <h4>{label}</h4>
    {hidden?<p>Los detalles están ocultos por privacidad.</p>:<dl className={styles.fields}>{movementFields(movement).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}
    {hidden&&<p>{movementDate(movement.date)}</p>}
    {allocations&&!hidden&&movement.allocations.length>0&&<section><h4>Distribución registrada entre sobres</h4><dl className={styles.fields}>{movement.allocations.map((allocation,index)=><div key={`${allocation.envelopeId??allocation.name}-${index}`}><dt>{envelopeLabel(allocation.name)}</dt><dd>{movementMoney(movement,allocation.amount)}</dd></div>)}</dl><small>Importes de este movimiento; los saldos actuales pueden ser diferentes.</small></section>}
    {!hidden&&Boolean(movement.categoryAllocations?.length)&&<section><h4>Clasificación del gasto</h4><dl className={styles.fields}>{movement.categoryAllocations!.map((item,index)=><div key={index}><dt>{item.name}{item.envelopeId&&<small>{envelopeLabel(movement.allocations.find(a=>a.envelopeId===item.envelopeId)?.name)}</small>}</dt><dd>{movementMoney(movement,item.amount)}</dd></div>)}</dl></section>}
    {!hidden&&Boolean(movement.products?.length)&&<section><h4>Productos</h4><dl className={styles.fields}>{movement.products!.map((item,index)=><div key={index}><dt>{item.name}{item.quantity!==undefined&&<small>Cantidad: {item.quantity}</small>}{item.notes&&<small>{item.notes}</small>}</dt><dd>{movementMoney(movement,item.amount)}</dd></div>)}</dl></section>}
  </div>;
}
export function MovementDetailDialog({movement,hidden,onBack,onTrace}:{movement?:LedgerMovement;hidden:boolean;onBack:()=>void;onTrace:(id:string)=>void}) {
  return <FinanceDialog label="Detalle del movimiento" onClose={onBack}><section className="flow-modal"><header><button type="button" aria-label="Volver" onClick={onBack}>‹</button><h2>Detalle del movimiento</h2><button type="button" aria-label="Cerrar detalle" onClick={onBack}>×</button></header><div className="flow-body">{movement?<><MovementDetails movement={movement} hidden={hidden}/>{(movement.type==="Ingreso"||movement.type==="Asignación"||movement.distributionCorrection)&&<button className="secondary wide" onClick={()=>onTrace(movement.distributionCorrection?.incomeId??movement.id)}>Ver ruta del ingreso</button>}</>:<p>El movimiento ya no está disponible.</p>}<button className="secondary wide" onClick={onBack}>Volver</button></div></section></FinanceDialog>;
}
