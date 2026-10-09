"use client";
import { useState } from "react";
import { ProductMonthlyComparison } from "./product-monthly-comparison";
import { FinanceDialog } from "./finance-dialog";
import { productReport, type ProductEnvelope, type PurchaseProduct, type TrackedProduct } from "@/lib/finance-products";
import type { LedgerMovement } from "@/lib/finance-ledger";
import styles from "./finance-products.module.css";

export type ProductDraft = { key:string; name:string; amount:string; quantity:string; notes:string; envelopeId:string; productId:string };
export function parseProductDrafts(items:ProductDraft[]):PurchaseProduct[] {
  return items.map(({name,amount,quantity,notes,envelopeId,productId})=>({name:name.trim(),amount:amount.trim()?Number(amount):NaN,quantity:quantity.trim()?Number(quantity):undefined,notes:notes.trim()||undefined,envelopeId:envelopeId||undefined,productId:productId||undefined}));
}
export function PurchaseProductsEditor({items,onChange,envelopes,total}: {items:ProductDraft[];onChange:(items:ProductDraft[])=>void;envelopes:ProductEnvelope[];total:number}) {
  const update=(key:string,patch:Partial<ProductDraft>)=>onChange(items.map(p=>p.key===key?{...p,...patch}:p));
  const used=items.reduce((sum,p)=>sum+(Number(p.amount)||0),0);
  return <div className={styles.editor}><h3>Productos en este gasto (opcional)</h3>{items.map((p,index)=><fieldset className={styles.card} key={p.key}><legend>Producto {index+1}</legend>
    <label>Sobre del producto<select aria-label="Sobre del producto" value={p.envelopeId} onChange={event=>update(p.key,{envelopeId:event.target.value,productId:""})}><option value="">Sin vincular a un sobre</option>{envelopes.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
    {(envelopes.find(e=>e.id===p.envelopeId)?.products??[]).some(product=>product.tracking)&&<label>Producto en seguimiento<select aria-label="Producto en seguimiento" value={p.productId} onChange={event=>{const product=envelopes.find(e=>e.id===p.envelopeId)?.products?.find(v=>v.id===event.target.value);update(p.key,{productId:product?.id??"",...(product?{name:product.name}:{})});}}><option value="">Escribir otro producto</option>{envelopes.find(e=>e.id===p.envelopeId)?.products?.filter(v=>v.tracking||v.id===p.productId).map(v=><option key={v.id} value={v.id}>{v.icon} {v.name}</option>)}</select></label>}
    <label>Nombre del producto<input value={p.name} readOnly={Boolean(p.productId)} onChange={event=>update(p.key,{name:event.target.value})}/></label>
    <div className={styles.row}><label>Monto del producto<input type="number" inputMode="numeric" min="0" value={p.amount} onChange={event=>update(p.key,{amount:event.target.value})}/></label><label>Cantidad (opcional)<input type="number" inputMode="decimal" min="0" step="any" value={p.quantity} onChange={event=>update(p.key,{quantity:event.target.value})}/></label></div>
    <label>Notas (opcional)<input value={p.notes} onChange={event=>update(p.key,{notes:event.target.value})}/></label><button type="button" className="secondary" onClick={()=>onChange(items.filter(v=>v.key!==p.key))}>Quitar producto {index+1}</button>
  </fieldset>)}<button type="button" className="secondary wide" onClick={()=>onChange([...items,{key:crypto.randomUUID(),name:"",amount:"",quantity:"",notes:"",envelopeId:envelopes.length===1?envelopes[0].id:"",productId:""}])}>＋ Agregar producto</button>
    {items.length>0&&<div className="review-box"><span>Total productos: ₡{used.toLocaleString("es-CR")}</span><span>Resto sin producto: ₡{(total-used).toLocaleString("es-CR")}</span>{used>total&&<span role="alert" className="negative">Los productos superan el monto del gasto.</span>}</div>}
  </div>;
}

export function EnvelopeProductsDialog({envelope,movements,today,display,privateMode,onSave,onClose,onMovement}: {envelope:ProductEnvelope;movements:LedgerMovement[];today:string;display:(value:number)=>string;privateMode:boolean;onSave:(product:TrackedProduct)=>void;onClose:()=>void;onMovement:(id:string)=>void}) {
  const [month,setMonth]=useState(today.slice(0,7)),[editing,setEditing]=useState<TrackedProduct|null>(null),[detail,setDetail]=useState<string|null>(null),[error,setError]=useState("");
  let report;try {report=productReport(movements,envelope.id,month);}catch {report=null;}
  const row=report?.products.find(p=>p.id===detail);
  const save=(product:TrackedProduct)=>{try{onSave(product);setEditing(null);setError("");}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo guardar el producto.");}};
  return <FinanceDialog label="Productos del sobre" onClose={onClose}><section className="flow-modal"><header><div><h2>Productos</h2><p>{envelope.name}</p></div><button type="button" aria-label="Cerrar productos" onClick={onClose}>×</button></header><div className="flow-body">
    {error&&<p className="form-error" role="alert">{error}</p>}
    {editing ? <form className={styles.editor} noValidate onSubmit={event=>{event.preventDefault();save(editing);}}><label>Nombre del producto<input value={editing.name} onChange={event=>setEditing({...editing,name:event.target.value})}/></label><label>Icono del producto<select aria-label="Icono del producto" value={editing.icon} onChange={event=>setEditing({...editing,icon:event.target.value})}>{["📦","🛒","🍷","🍽️","☕","🍫","🍕","🍎"].map(icon=><option key={icon}>{icon}</option>)}</select></label><label className="check-label"><input type="checkbox" checked={editing.tracking} onChange={event=>setEditing({...editing,tracking:event.target.checked})}/>Seguimiento</label><button type="submit" className="primary">Guardar producto</button><button type="button" className="secondary" onClick={()=>{setEditing(null);setError("");}}>Cancelar</button></form> : <>
      <button className="secondary wide" onClick={()=>{setEditing({id:crypto.randomUUID(),name:"",icon:"📦",tracking:true});setDetail(null);}}>＋ Nuevo producto</button>
      <div className={styles.editor}>{(envelope.products??[]).map(p=><div className={styles.catalog} key={p.id}><span>{p.icon} {p.name}</span><label><input type="checkbox" checked={p.tracking} onChange={event=>save({...p,tracking:event.target.checked})}/>Seguimiento de {p.name}</label><button className="secondary" aria-expanded={detail===p.id} onClick={()=>setDetail(detail===p.id?null:p.id)}>Ver evolución de {p.name}</button><button className="secondary" onClick={()=>setEditing({...p})}>Editar {p.name}</button></div>)}</div>
      <label>Mes del reporte de productos<input type="month" value={month} onChange={event=>setMonth(event.target.value)}/></label>
      {report ? <><div className="review-box"><span>Gasto total del sobre: {display(report.spent)}</span><span>Productos identificados: {display(report.identified)}</span><span>Resto sin producto identificado: {display(report.withoutProduct)}</span></div>
        <p className="flow-intro">Los productos anteriores sin sobre identificado se conservan en el gasto original. Activar seguimiento permite seleccionarlos en gastos nuevos.</p>
        {report.products.map(p=><button className="choice" key={p.id} aria-expanded={detail===p.id} onClick={()=>setDetail(detail===p.id?null:p.id)}><span>{p.name}</span><span>{display(p.amount)} · {new Intl.NumberFormat("es-CR",{maximumFractionDigits:1}).format(p.percentage)}% · {p.count} {p.count===1?"compra":"compras"}</span></button>)}
        {!report.products.length&&<p className="empty-state">No hay productos identificados para este sobre y mes.</p>}
        {detail&&<ProductMonthlyComparison movements={movements} envelopeId={envelope.id} productId={detail} name={envelope.products?.find(product=>product.id===detail)?.name??row?.name??"producto"} month={month} display={display} privateMode={privateMode}/>}
        {row&&<div className={styles.editor}><h3>Compras de {row.name}</h3>{row.purchases.map((purchase,index)=><button className="choice" key={`${purchase.movementId}:${index}`} onClick={()=>onMovement(purchase.movementId)}>{purchase.date.slice(0,10)} · {display(purchase.amount)}{purchase.quantity?` · Cantidad: ${purchase.quantity}`:""}{purchase.notes?` · ${purchase.notes}`:""}<span>Ver movimiento →</span></button>)}</div>}
      </>:<p className="form-error" role="alert">Selecciona un mes válido.</p>}
    </>}
  </div></section></FinanceDialog>;
}
