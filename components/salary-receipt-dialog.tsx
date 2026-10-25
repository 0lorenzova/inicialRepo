"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {FinanceDialog} from './finance-dialog';
import {IncomeDistribution} from './income-distribution';
import {incomeDistribution,type FundingSelection} from '@/lib/income-distribution';
import {incomeDistribution as traceIncome} from '@/lib/income-trace';
import {totals} from '@/lib/finance-ledger';
import {distributeSavedIncome} from '@/lib/distribute-saved-income';
import {uiCopyEs} from '@/lib/ui-copy';
import type {SalaryLedger} from '@/lib/salary-tracking';
import type {PlanningEnvelope} from '@/lib/envelope-planning';

export function SalaryReceiptDialog({ledger,envelopes,incomeId,today,display,onSave,onConfirmSave,onClose}:{ledger:SalaryLedger;envelopes:(PlanningEnvelope&{icon:string})[];incomeId:string;today:string;display:(n:number)=>string;onSave:(operation:(current:SalaryLedger)=>SalaryLedger)=>boolean;onConfirmSave:()=>Promise<void>;onClose:()=>void}) {
  const [stage,setStage]=useState<'saving'|'error'|'choice'|'distribution'>('saving');
  const [error,setError]=useState(''),[manual,setManual]=useState<Record<string,string>>({}),[selections,setSelections]=useState<FundingSelection[]>([]);
  const [id]=useState(()=>crypto.randomUUID());
  const started=useRef(false),busy=useRef(false),allocated=useRef(false);
  const confirm=useCallback(async()=>{
    if(busy.current)return;
    busy.current=true;setStage('saving');setError('');
    try{await onConfirmSave();if(allocated.current)onClose();else setStage('choice');}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo confirmar el guardado.');setStage('error');}
    finally{busy.current=false;}
  },[onConfirmSave,onClose]);
  useEffect(()=>{if(!started.current){started.current=true;void confirm();}},[confirm]);
  const trace=traceIncome(ledger,incomeId),available=Math.min(trace?.unassigned??0,totals(ledger).unassigned);
  const plan=incomeDistribution(envelopes,today,available,manual,selections);
  const distribute=()=>{
    if(busy.current||allocated.current)return;
    busy.current=true;setError('');
    try{
      if(!onSave(current=>distributeSavedIncome(current,{incomeId,id,date:new Date().toISOString(),today,manual,selections})))throw new Error('No se pudo guardar la distribución. Revisa el aviso de la aplicación.');
      allocated.current=true;busy.current=false;void confirm();
    }catch(cause){setError(cause instanceof Error?cause.message:'No se pudo distribuir el dinero.');busy.current=false;}
  };
  const title=stage==='choice'?'Salario registrado correctamente':stage==='distribution'?'Distribuir salario recibido':stage==='saving'?'Confirmando guardado':'Guardado pendiente de confirmar';
  return <FinanceDialog label={title} onClose={onClose} maxWidth={stage==='distribution'?620:480}><section className="flow-modal"><header><h2>{title}</h2><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></header><div className="flow-body">
    {stage==='saving'&&<p role="status">Confirmando el guardado. No registres nuevamente este salario.</p>}
    {stage==='error'&&<><p>El registro se conserva en la aplicación mientras se confirma la sincronización. Reintentar no crea otro ingreso.</p><button className="primary wide" onClick={()=>void confirm()}>Reintentar confirmación</button><button className="secondary wide" onClick={onClose}>Cerrar</button></>}
    {stage==='choice'&&<><p>¿Distribuir ahora entre sobres o continuar sin asignar?</p><p>{uiCopyEs.money.availableFromIncome}: <b>{display(available)}</b></p><button className="primary wide" disabled={available<=0} onClick={()=>setStage('distribution')}>Distribuir ahora entre sobres</button><button className="secondary wide" onClick={onClose}>Continuar sin asignar</button></>}
    {stage==='distribution'&&<><IncomeDistribution envelopes={envelopes} today={today} amount={available} manual={manual} selections={selections} onManual={setManual} onSelections={setSelections} display={display}/><button className="primary wide" disabled={plan.total<=0||plan.errors.length>0} onClick={distribute}>Confirmar distribución</button><button className="secondary wide" onClick={onClose}>Cancelar distribución</button></>}
    {error&&<p role="alert" className="form-error">{error}</p>}
  </div></section></FinanceDialog>;
}
