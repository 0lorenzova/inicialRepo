import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { repay, totals } from "../lib/finance-ledger.ts";
const hook=registerHooks({resolve(specifier,context,next){return next(specifier==="./finance-ledger"?"./finance-ledger.ts":specifier,context);}});
const {applyEnvelopeOperation}=await import("../lib/envelope-operation.ts");
hook.deregister();
let ledger={accounts:[{id:"bank",name:"Banco",type:"Banco",balance:100000,active:true}],envelopes:[{id:"default",name:"Hogar",balance:0},{id:"new",name:"Viaje creado por usuario",balance:0}],loans:[],movements:[]};
let index=0;
const run=(kind,envelopeId,amount,counterpartyId,dueDate)=>{
  const original=JSON.stringify(ledger);
  const result=applyEnvelopeOperation(ledger,{kind,envelopeId,counterpartyId,amount,date:"2026-10-02T10:00",id:`fixture-${++index}`,dueDate});
  assert.equal(JSON.stringify(ledger),original);
  ledger=result.ledger;
  const sum=totals(ledger);assert.equal(sum.accounts,sum.assigned+sum.unassigned);assert.equal(sum.accounts,100000);
  assert.ok(result.message.includes("correctamente"));return result;
};
run("Asignar dinero","new",20000);run("Asignar dinero","default",30000);
run("Desasignar","new",1000);run("Transferir","new",1000,"default");
run("Prestar a otro sobre","default",3000,"new","2026-10-20");
run("Pedir prestado","new",2000,"default");
assert.equal(ledger.envelopes[1].balance,23000);
assert.equal(ledger.loans[0].sourceId,"default");assert.equal(ledger.loans[0].targetId,"new");
const datedLoan=ledger.loans.find(item=>item.dueDate);assert.equal(datedLoan?.dueDate,"2026-10-20");
const partiallyRepaid=repay(ledger,datedLoan.id,500,"2026-10-03T10:00","repay-dated");assert.equal(partiallyRepaid.loans.find(item=>item.id===datedLoan.id)?.dueDate,"2026-10-20","Partial repayment preserves the due date");
assert.deepEqual(JSON.parse(JSON.stringify(partiallyRepaid.loans)),partiallyRepaid.loans,"The due date persists in the existing loan JSON");
for(const [kind,amount,other,message] of [["Asignar dinero",999999,undefined,/sin asignar/],["Asignar dinero",0,undefined,/ingresar un monto/],["Prestar a otro sobre",999999,"default",/saldo disponible/],["Pedir prestado",1,"new",/diferente/],["Pedir prestado",1,"",/dónde pedir/]]){
  const before=JSON.stringify(ledger);
  assert.throws(()=>applyEnvelopeOperation(ledger,{kind,envelopeId:"new",counterpartyId:other,amount,date:"2026-10-02T10:00",id:"invalid"}),message);
  assert.equal(JSON.stringify(ledger),before);
}
const beforeBadDue=JSON.stringify(ledger);assert.throws(()=>applyEnvelopeOperation(ledger,{kind:"Prestar a otro sobre",envelopeId:"default",counterpartyId:"new",amount:100,date:"2026-10-02T10:00",id:"invalid-due",dueDate:"2026-02-30"}),/fecha límite/);assert.equal(JSON.stringify(ledger),beforeBadDue,"An invalid due date cannot create a loan or change balances");
assert.throws(()=>applyEnvelopeOperation(ledger,{kind:"Prestar a otro sobre",envelopeId:"default",counterpartyId:"new",amount:100,date:"2026-10-02T10:00",id:"past-due",dueDate:"2026-10-01"}),/posterior/);
assert.throws(()=>applyEnvelopeOperation(ledger,{kind:"Transferir",envelopeId:"default",counterpartyId:"new",amount:100,date:"2026-10-02T10:00",id:"transfer-due",dueDate:"2026-10-20"}),/no tienen fecha/);
assert.deepEqual(JSON.parse(JSON.stringify(ledger)),ledger);
console.log("PASS: contexto de sobres nuevos/predeterminados, asignar/desasignar/transferir/prestar/pedir, fecha límite opcional válida, preservación al reembolsar, rechazo de fechas inválidas, atomicidad y conservación de dinero.");
