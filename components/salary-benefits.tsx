"use client";

import { useMemo, useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import { salaryBenefitEstimate, salaryBenefitPending, saveSalaryBenefit, shiftSalaryDate, type SalaryBenefitEntry, type SalaryLedger } from "@/lib/salary-tracking";
import styles from "./salary-benefits.module.css";

type Props={ledger:SalaryLedger;configId:string;today:string;display:(amount:number)=>string;onSave:(operation:(current:SalaryLedger)=>SalaryLedger)=>boolean};
type Draft={entry:SalaryBenefitEntry;original:SalaryBenefitEntry|null;estimate:number};
const day=(value:string)=>new Date(`${value}T12:00:00`).toLocaleDateString("es-CR",{year:"numeric",month:"short",day:"numeric"});
const days=(value:number)=>`${value.toLocaleString("es-CR",{maximumFractionDigits:2})} ${value===1?"día":"días"}`;

export function SalaryBenefits({ledger,configId,today,display,onSave}:Props){
  const salary=ledger.salary;
  const config=salary?.configs.find(item=>item.id===configId);
  const entries=(salary?.benefits??[]).filter(entry=>entry.configId===configId);
  const currentYear=Number(today.slice(0,4));
  const defaultClosingYear=Number(today.slice(5,7))===12?currentYear+1:currentYear;
  const historicYears=(salary?.periods??[]).filter(period=>period.configId===configId).map(period=>Number(period.start.slice(0,4)));
  const firstClosingYear=Math.max(1901,Math.min(currentYear-24,...historicYears));
  const cycleYears=Array.from({length:Math.max(1,defaultClosingYear-firstClosingYear+1)},(_,index)=>firstClosingYear+index);
  const [closingYear,setClosingYear]=useState(defaultClosingYear);
  const selectedClosingYear=cycleYears.includes(closingYear)?closingYear:defaultClosingYear;
  const aguinaldoFrom=`${selectedClosingYear-1}-12-01`,aguinaldoTo=`${selectedClosingYear}-11-30`;
  const aguinaldoAsOf=aguinaldoTo<today?aguinaldoTo:today;
  const aguinaldo=salaryBenefitEstimate(ledger,configId,"aguinaldo",aguinaldoFrom,aguinaldoTo,today);
  const aguinaldoEntry=entries.find(entry=>entry.kind==="aguinaldo"&&entry.from===aguinaldoFrom&&entry.to===aguinaldoTo);
  const [draft,setDraft]=useState<Draft|null>(null);
  const [error,setError]=useState("");
  const vacations=useMemo(()=>{
    if(!config?.employmentStart)return {cycles:[] as {from:string;to:string;due:string;estimate:number;complete:boolean;entry:SalaryBenefitEntry|undefined;days:number}[],nextDue:""};
    const cycles:{from:string;to:string;due:string;estimate:number|null;complete:boolean;entry:SalaryBenefitEntry|undefined;days:number}[]=[];
    let from=config.employmentStart,nextDue="";
    for(let index=0;index<80;index++){
      const due=shiftSalaryDate(from,350);
      if(due>today){if(!config.employmentEnd||config.employmentEnd>=due)nextDue=due;break;}
      if(config.employmentEnd&&due>config.employmentEnd)break;
      const to=shiftSalaryDate(due,-1),calculation=salaryBenefitEstimate(ledger,configId,"vacaciones",from,to,today);
      cycles.push({from,to,due,estimate:config.frequency==="Otra"?null:calculation.amount,complete:calculation.complete,entry:entries.find(entry=>entry.kind==="vacaciones"&&entry.from===from&&entry.to===to),days:config.workDays.length*2});
      from=due;
    }
    return {cycles,nextDue};
  },[config,configId,entries,ledger,today]);

  const openEditor=(kind:SalaryBenefitEntry["kind"],from:string,to:string,estimate:number,original:SalaryBenefitEntry|undefined)=>{
    setError("");
    setDraft({entry:original?{...original}:{id:crypto.randomUUID(),configId,kind,from,to,recognized:undefined,received:0,used:0,notes:""},original:original??null,estimate});
  };
  const close=()=>{setDraft(null);setError("");};
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!draft)return;
    if(onSave(current=>saveSalaryBenefit(current,draft.entry,draft.original)))close();
    else setError("No se pudo guardar. Revisa el aviso de la aplicación e inténtalo de nuevo.");
  };
  const update=(changes:Partial<SalaryBenefitEntry>)=>setDraft(current=>current?{...current,entry:{...current.entry,...changes}}:current);
  const noteFor=(estimate:{complete:boolean;periodCount:number;missingDays:number;crossingCount:number;unconfirmedCount:number;excludedBenefitCount:number})=>{
    const warnings:string[]=[];
    if(estimate.missingDays)warnings.push(`faltan registros para ${estimate.missingDays} días`);
    if(estimate.crossingCount)warnings.push(`${estimate.crossingCount} período(s) cruzan los límites y se excluyen`);
    if(estimate.unconfirmedCount)warnings.push(`${estimate.unconfirmedCount} período(s) o ajustes no están confirmados`);
    if(estimate.excludedBenefitCount)warnings.push(`${estimate.excludedBenefitCount} concepto(s) de beneficio u otro tipo se excluyen`);
    return <small className={estimate.complete?styles.complete:styles.incomplete}>{estimate.complete?`Cálculo completo con ${estimate.periodCount} períodos salariales confirmados.`:`Subtotal de períodos confirmados: ${estimate.periodCount}. El cálculo está incompleto: ${warnings.join("; ")||"no hay suficientes períodos salariales confirmados"}.`}</small>;
  };
  const trackedEntries=entries.filter(entry=>entry.kind==="aguinaldo"&&(entry.from!==aguinaldoFrom||entry.to!==aguinaldoTo)||entry.kind==="vacaciones"&&!vacations.cycles.some(cycle=>cycle.from===entry.from&&cycle.to===entry.to));

  if(!config)return null;
  return <>
    <details className={styles.panel}>
      <summary>Aguinaldo y vacaciones · Costa Rica, sector privado general</summary>
      <p>Estimaciones de control a partir de períodos salariales confirmados. No crean ingresos ni modifican cuentas; registra aquí lo reconocido y recibido para comparar.</p>
      <section className={styles.card}>
        <div className={styles.heading}><div><b>Aguinaldo</b><small>{day(aguinaldoFrom)} — {day(aguinaldoTo)}</small></div><label>Ciclo que termina en<select value={selectedClosingYear} onChange={event=>setClosingYear(Number(event.target.value))}>{cycleYears.map(year=><option key={year} value={year}>{year}</option>)}</select></label></div>
        <div className={styles.values}>
          <span>Estimado al {day(aguinaldoAsOf)}<strong>{display(aguinaldo.amount)}</strong></span>
          <span>Salarios incluidos<strong>{display(aguinaldo.wages)}</strong></span>
          <span>Reconocido por empleador<strong>{aguinaldoEntry?.recognized===undefined?"Sin dato":display(aguinaldoEntry.recognized)}</strong></span>
          <span>Recibido<strong>{display(aguinaldoEntry?.received??0)}</strong></span>
          <span>Pendiente estimado<strong>{display(Math.max(0,(aguinaldoEntry?.recognized??aguinaldo.amount)-(aguinaldoEntry?.received??0)))}</strong></span>
        </div>
        {noteFor(aguinaldo)}
        <button type="button" className="secondary" onClick={()=>openEditor("aguinaldo",aguinaldoFrom,aguinaldoTo,aguinaldo.amount,aguinaldoEntry)}>{aguinaldoEntry?"Actualizar reconocimiento y recibido":"Registrar reconocimiento y recibido"}</button>
      </section>
      <section className={styles.card}>
        <div className={styles.heading}><div><b>Vacaciones</b><small>Derecho de dos semanas por cada 50 semanas de labores continuas</small></div></div>
        {!config.employmentStart?<p>Para calcular las fechas, define la fecha de inicio laboral en la configuración salarial. No se inferirá a partir del primer registro.</p>:<>
          {vacations.nextDue&&<p>Próximo derecho estimado: <b>{day(vacations.nextDue)}</b>. El conteo supone continuidad desde la fecha laboral indicada.</p>}
          {config.employmentEnd&&<p>La relación terminó el {day(config.employmentEnd)}; el cálculo proporcional de liquidación queda para revisión manual.</p>}
          {vacations.cycles.length?vacations.cycles.map(cycle=>{
            const entry=cycle.entry,pending=salaryBenefitPending({...entry,id:entry?.id??"",configId,kind:"vacaciones",from:cycle.from,to:cycle.to,estimated:cycle.days,recognized:entry?.recognized,received:entry?.received??0,used:entry?.used??0,notes:entry?.notes??""});
            const estimate=salaryBenefitEstimate(ledger,configId,"vacaciones",cycle.from,cycle.to,today);
            return <article className={styles.card} key={cycle.from}>
              <div className={styles.heading}><b>Derecho cumplido: {day(cycle.due)}</b><small>{day(cycle.from)} — {day(cycle.to)}</small></div>
              <div className={styles.values}><span>Días hábiles estimados<strong>{days(cycle.days)}</strong></span><span>Valor de referencia<strong>{cycle.estimate===null?"Requiere revisión manual":display(cycle.estimate)}</strong></span><span>Disfrutados<strong>{days(entry?.used??0)}</strong></span><span>Pendientes estimados<strong>{days(pending)}</strong></span></div>
              {noteFor(estimate)}
              <button type="button" className="secondary" onClick={()=>openEditor("vacaciones",cycle.from,cycle.to,cycle.days,entry)}>{entry?"Actualizar días reconocidos y disfrutados":"Registrar días reconocidos y disfrutados"}</button>
            </article>;
          }):<p>Aún no se cumplen 50 semanas desde la fecha laboral indicada.</p>}
        </>}
      </section>
      <details className={styles.sources}><summary>Base del cálculo y límites</summary>
        <p>Aguinaldo: suma de salarios ordinarios y extraordinarios del 1 de diciembre al 30 de noviembre, dividida entre 12. Vacaciones: dos semanas después de 50 semanas; el monto de referencia usa el promedio salarial de las últimas 50 semanas.</p>
        <p>Solo se suman períodos confirmados que caben completos en el rango. Se excluyen ajustes aún estimados y conceptos catalogados como beneficio u otros. Los períodos faltantes o cruzados se informan como incompletos. El valor de vacaciones requiere pago semanal, quincenal o mensual; la modalidad “Otra” queda para revisión manual. No se modelan salario en especie, incapacidades, suspensiones, interrupciones, terminación laboral, acuerdos superiores a la ley ni casos especiales.</p>
        <a href="https://www.mtss.go.cr/temas-laborales/index.html" target="_blank" rel="noreferrer">MTSS · Aguinaldo y vacaciones</a>
        <a href="https://pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_articulo.aspx?nValor1=1&nValor2=8045&nValor3=109068&nValor5=47180&param1=NRA&strTipM=FA" target="_blank" rel="noreferrer">Código de Trabajo · artículo 153</a>
      </details>
      {trackedEntries.length>0&&<details className={styles.sources}><summary>Seguimientos anteriores guardados ({trackedEntries.length})</summary>{trackedEntries.map(entry=><article className={styles.legacy} key={entry.id}><b>{entry.kind==="aguinaldo"?"Aguinaldo":"Vacaciones"} · {day(entry.from)} — {day(entry.to)}</b><span>Reconocido: {entry.recognized===undefined?"sin dato":entry.kind==="aguinaldo"?display(entry.recognized):days(entry.recognized)} · Recibido: {entry.kind==="aguinaldo"?display(entry.received):days(entry.received)}{entry.kind==="vacaciones"?` · Disfrutado: ${days(entry.used??0)}`:""}</span>{entry.notes&&<small>{entry.notes}</small>}<button type="button" className="secondary" onClick={()=>openEditor(entry.kind,entry.from,entry.to,entry.estimated??entry.recognized??0,entry)}>Editar seguimiento</button></article>)}</details>}
    </details>
    {draft&&<FinanceDialog label={draft.entry.kind==="aguinaldo"?"Seguimiento de aguinaldo":"Seguimiento de vacaciones"} onClose={close} maxWidth={560}>
      <form className={`flow-modal flow-body ${styles.editor}`} onSubmit={submit}>
        <div className={styles.heading}><h2>{draft.entry.kind==="aguinaldo"?"Aguinaldo":"Vacaciones"}</h2><button type="button" className="secondary" aria-label="Cerrar" onClick={close}>×</button></div>
        <p>{day(draft.entry.from)} — {day(draft.entry.to)} · Estimación actual: {draft.entry.kind==="aguinaldo"?display(draft.estimate):days(draft.estimate)}</p>
        {draft.entry.kind==="aguinaldo"?<>
          <label>Importe reconocido por el empleador (CRC)<input type="number" min="0" step="1" value={draft.entry.recognized??""} onChange={event=>update({recognized:event.target.value===""?undefined:Number(event.target.value)})}/></label>
          <label>Importe recibido (CRC)<input type="number" min="0" step="1" required value={draft.entry.received} onChange={event=>update({received:Number(event.target.value)})}/></label>
          <p className={styles.balance}>Pendiente de la estimación: {display(Math.max(0,(draft.entry.recognized??draft.estimate)-draft.entry.received))}</p>
        </>:<>
          <label>Días reconocidos por el empleador (opcional)<input type="number" min="0" step="0.25" value={draft.entry.recognized??""} onChange={event=>update({recognized:event.target.value===""?undefined:Number(event.target.value)})}/></label>
          <label>Días disfrutados<input type="number" min="0" step="0.25" value={draft.entry.used??0} onChange={event=>update({used:Number(event.target.value)})}/></label>
          <label>Días pagados sin disfrute en una situación permitida<input type="number" min="0" step="0.25" value={draft.entry.received} onChange={event=>update({received:Number(event.target.value)})}/></label>
          <p className={styles.balance}>Pendiente estimado: {days(Math.max(0,(draft.entry.recognized??draft.estimate)-(draft.entry.used??0)-draft.entry.received))}</p>
        </>}
        <label>Notas<textarea value={draft.entry.notes} onChange={event=>update({notes:event.target.value})} placeholder="Opcional"/></label>
        {error&&<p className="form-error" role="alert">{error}</p>}
        <div className={styles.actions}><button type="button" className="secondary" onClick={close}>Cancelar</button><button type="submit" className="primary">Guardar seguimiento</button></div>
      </form>
    </FinanceDialog>}
  </>;
}
