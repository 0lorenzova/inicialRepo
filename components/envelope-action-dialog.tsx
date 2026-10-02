"use client";
import { useRef, useState, type FormEvent } from "react";
import { FinanceDialog } from "@/components/finance-dialog";
import type { EnvelopeAction } from "@/lib/envelope-operation";

type Envelope = { id: string; name: string; icon: string; balance: number };
export function EnvelopeActionDialog({ kind, envelope, others, available, display, onSave, onClose }: {
  kind: EnvelopeAction; envelope: Envelope; others: Envelope[]; available: number; display: (amount: number) => string;
  onSave: (amount: number, counterpartyId: string) => void; onClose: () => void;
}) {
  const [amount,setAmount]=useState(""),[counterparty,setCounterparty]=useState(""),[error,setError]=useState("");
  const submitted=useRef(false);
  const needsOther=kind==="Transferir"||kind==="Prestar a otro sobre"||kind==="Pedir prestado";
  const borrowing=kind==="Pedir prestado";
  const submit=(event:FormEvent)=>{
    event.preventDefault();if(submitted.current)return;setError("");
    try{onSave(Number(amount),counterparty);submitted.current=true;onClose();}catch(cause){setError(cause instanceof Error?cause.message:"No se pudo guardar la operación. Inténtalo de nuevo.");}
  };
  return <FinanceDialog label={kind} onClose={onClose}><form className="flow-modal" noValidate onSubmit={submit}>
    <header><button type="button" aria-label="Cancelar" onClick={onClose}>‹</button><div><small>MIS SOBRES</small><h2>{kind}</h2></div><button type="button" aria-label="Cerrar diálogo" onClick={onClose}>×</button></header>
    <div className="flow-body"><label>{kind==="Asignar dinero"?"Asignar a":kind==="Desasignar"?"Retirar de":borrowing?"Recibe":"Desde"}</label>
      <div className="envelope-context"><b>{envelope.icon} {envelope.name}</b><small>{kind==="Asignar dinero"?`Sin asignar: ${display(available)}`:`Saldo: ${display(envelope.balance)}`}</small></div>
      {needsOther&&<><label htmlFor="envelope-counterparty">{borrowing?"Pedir a":"Hacia"}</label><select id="envelope-counterparty" value={counterparty} onChange={e=>setCounterparty(e.target.value)}><option value="">{borrowing?"Selecciona de dónde pedir dinero":"Selecciona el destino"}</option>{others.filter(e=>e.id!==envelope.id).map(e=><option key={e.id} value={e.id}>{e.name} · {display(e.balance)}</option>)}</select>{!others.some(e=>e.id!==envelope.id)&&<p className="flow-intro">Crea otro sobre para realizar esta operación.</p>}</>}
      <label htmlFor="envelope-action-amount">Monto</label><div className="currency-input"><span>₡</span><input id="envelope-action-amount" type="number" inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></div>
      {borrowing&&counterparty&&<p className="flow-intro">Disponible en {others.find(e=>e.id===counterparty)?.name}: {display(others.find(e=>e.id===counterparty)?.balance??0)}.</p>}
      {(borrowing||kind==="Prestar a otro sobre")&&<p className="flow-intro">Quedará pendiente una devolución entre estos sobres.</p>}
      {error&&<p className="form-error" role="alert">{error}</p>}<button className="primary wide">{kind==="Asignar dinero"?"Confirmar asignación":kind==="Desasignar"?"Confirmar desasignación":kind==="Transferir"?"Confirmar transferencia":"Confirmar préstamo"}</button>
    </div>
  </form></FinanceDialog>;
}
