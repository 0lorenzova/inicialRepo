"use client";
import { useState } from "react";
import { ExpenseCategoryManager } from "./expense-categories";
import { categoriesForEnvelope, type ExpenseCategory } from "@/lib/expense-categories";
import { classifyExpense, type CategoryDrafts } from "@/lib/expense-classification";
import styles from "./expense-categories.module.css";

export type EnvelopeCategoryActions = {
  onSave:(requested:ExpenseCategory,original:ExpenseCategory|null,envelopeId:string)=>void;
  onAssociate:(categoryId:string,envelopeId:string)=>void;
};

export function EnvelopeExpenseCategories({envelopeId,categories,onSave,onAssociate}:{envelopeId:string;categories:ExpenseCategory[]}&EnvelopeCategoryActions) {
  const [selected,setSelected]=useState(""),[error,setError]=useState("");
  const available=categories.filter(category=>!category.archived&&!category.envelopeIds?.includes(envelopeId));
  return <div className={styles.manager}>
    <p className="flow-intro">Las categorías compartidas conservan el mismo nombre en sus sobres. Renombrarlas no modifica gastos anteriores.</p>
    {available.length>0&&<><label>Usar una categoría existente<select value={selected} onChange={event=>setSelected(event.target.value)}><option value="">Seleccionar categoría</option>{available.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label><button type="button" className="secondary" disabled={!selected} onClick={()=>{try{onAssociate(selected,envelopeId);setSelected("");setError("");}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo asociar la categoría.");}}}>Asociar al sobre</button></>}
    {error&&<p role="alert" className="form-error">{error}</p>}
    <ExpenseCategoryManager categories={categoriesForEnvelope(categories,envelopeId)} onSave={(requested,original)=>onSave(requested,original,envelopeId)}/>
  </div>;
}

export function ExpenseClassificationEditor({envelopes,amount,allocations,drafts,categories,display,onAllocations,onDrafts,onNext,onSave,onAssociate}:{
  envelopes:{id:string;name:string;icon:string;balance:number}[];amount:number;allocations:Record<string,string>;drafts:CategoryDrafts;categories:ExpenseCategory[];
  display:(amount:number)=>string;onAllocations:(value:Record<string,string>)=>void;onDrafts:(value:CategoryDrafts)=>void;onNext:()=>void;
}&EnvelopeCategoryActions) {
  const selected=envelopes.filter(envelope=>Object.hasOwn(allocations,envelope.id));
  const parts=Object.entries(allocations).map(([id,value])=>({id,amount:Number(value)}));
  const total=parts.reduce((sum,item)=>sum+item.amount,0);
  let error="";
  try {if(parts.some(item=>!Number.isSafeInteger(item.amount)||item.amount<=0))throw new Error("Indica cuánto se descontará de cada sobre seleccionado.");classifyExpense(amount,parts,drafts,categories);}catch(cause){error=cause instanceof Error?cause.message:"Revisa los importes.";}
  const toggle=(id:string,checked:boolean)=>{
    const next={...allocations};
    if(checked)next[id]=selected.length===0?String(amount):"";
    else {delete next[id];const remaining={...drafts};delete remaining[id];onDrafts(remaining);}
    onAllocations(next);
  };
  const changeCategory=(envelopeId:string,categoryId:string,checked:boolean)=>{
    const next={...drafts[envelopeId]};
    if(checked)next[categoryId]="";else delete next[categoryId];
    onDrafts({...drafts,[envelopeId]:next});
  };
  return <div className={styles.manager}>
    <p className="flow-intro">Selecciona los sobres del gasto y reparte {display(amount)}. Después puedes clasificar el importe de cada sobre.</p>
    {envelopes.map(envelope=>{
      const chosen=Object.hasOwn(allocations,envelope.id);
      const choices=drafts[envelope.id]??{};
      const count=Object.keys(choices).length;
      return <section className={styles.envelope} key={envelope.id}>
        <label className={styles.selection}><input type="checkbox" checked={chosen} onChange={event=>toggle(envelope.id,event.target.checked)}/><span>{envelope.icon} {envelope.name}<small>Disponible {display(envelope.balance)}</small></span></label>
        {chosen&&<><label>Importe de {envelope.name}<input type="number" min="1" step="1" max={amount} value={allocations[envelope.id]} onChange={event=>onAllocations({...allocations,[envelope.id]:event.target.value})}/></label>
          <details className={styles.inline} open><summary>Categorías de {envelope.name}</summary>
            {categoriesForEnvelope(categories,envelope.id).filter(category=>!category.archived).map(category=><div key={category.id} className={styles.categoryRow}>
              <label className={styles.selection}><input type="checkbox" checked={Object.hasOwn(choices,category.id)} onChange={event=>changeCategory(envelope.id,category.id,event.target.checked)}/><span>{category.name}</span></label>
              {Object.hasOwn(choices,category.id)&&(count>1?<label>Importe · {category.name}<input type="number" min="1" step="1" value={choices[category.id]} onChange={event=>onDrafts({...drafts,[envelope.id]:{...choices,[category.id]:event.target.value}})}/></label>:<small>{display(Number(allocations[envelope.id])||0)}</small>)}
            </div>)}
            {!count&&<small>El importe quedará sin categoría hasta que selecciones una.</small>}
            {count>1&&<p className="flow-intro">Repartido en categorías: {display(Object.values(choices).reduce((sum,value)=>sum+(Number(value)||0),0))} de {display(Number(allocations[envelope.id])||0)}</p>}
            <details className={styles.inline}><summary>＋ Nueva categoría / asociar existente</summary><EnvelopeExpenseCategories envelopeId={envelope.id} categories={categories} onSave={onSave} onAssociate={onAssociate}/></details>
          </details></>}
      </section>;
    })}
    <div className="allocation-total">En sobres <b>{display(total)} / {display(amount)}</b></div>
    <button type="button" className="secondary wide" onClick={()=>{onAllocations({});onDrafts({});}}>Usar dinero sin asignar</button>
    {!selected.length&&<p className="flow-intro">Se descontarán {display(amount)} de la cuenta y del dinero sin asignar.</p>}
    {error&&<p className="form-error" role="status">{error}</p>}
    <button type="button" className="primary wide" disabled={Boolean(error)} onClick={onNext}>Siguiente →</button>
  </div>;
}
