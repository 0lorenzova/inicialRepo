import type { Ledger, LedgerMovement } from "./finance-ledger";

type Lot = { incomeId?: string; amount: number; date: string };
export type IncomeSource = { incomeId: string; amount: number };
const unassignedDelta = (m: LedgerMovement) => m.type === "Ingreso" ? m.amount - m.allocations.reduce((s,a)=>s+a.amount,0) : m.type === "Asignación" ? -m.amount : m.type === "Desasignación" ? m.amount : m.type === "Gasto" ? -(m.amount - m.allocations.reduce((s,a)=>s+a.amount,0)) : 0;

// Provenance of the common unassigned pool. Existing unlinked uses consume its
// oldest lots, but never acquire invented historical income relationships.
export function unassignedIncomeLots(ledger: Ledger): Lot[] {
  const actual = ledger.accounts.filter(a=>a.active).reduce((s,a)=>s+a.balance,0) - ledger.envelopes.filter(e=>!e.archived).reduce((s,e)=>s+e.balance,0);
  const initial = Math.max(0, actual - ledger.movements.reduce((s,m)=>s+unassignedDelta(m),0));
  const lots: Lot[] = initial ? [{ amount: initial, date: "", incomeId: undefined }] : [];
  const consume = (amount: number) => { for (const lot of lots) { const used=Math.min(amount,lot.amount);lot.amount-=used;amount-=used;if(amount<=0)break; } };
  for (const m of [...ledger.movements].reverse().sort((a,b)=>a.date.localeCompare(b.date))) {
    const delta=unassignedDelta(m);
    if (delta>0) lots.push({ incomeId:m.type==="Ingreso"?m.id:undefined, amount:delta, date:m.date });
    if (delta>=0) continue;
    let remaining=-delta;
    if(m.type==="Asignación")for(const source of m.incomeSources??[]) {
      const lot=lots.find(l=>l.incomeId===source.incomeId);
      if(!lot)continue;
      const used=Math.min(remaining,lot.amount,source.amount);lot.amount-=used;remaining-=used;
    }
    consume(remaining);
  }
  // Backdated legacy entries can precede the income that funded them. Cap the
  // reconstructed pool by the real ledger, never display more available money.
  consume(Math.max(0,lots.reduce((sum,lot)=>sum+lot.amount,0)-Math.max(0,actual)));
  return lots.filter(l=>l.amount>0);
}

export function traceAssignmentSources(ledger: Ledger, amount: number, date: string): IncomeSource[] {
  const sources: IncomeSource[]=[];
  for(const lot of unassignedIncomeLots(ledger)) {
    if(lot.date>date)continue;
    const used=Math.min(amount,lot.amount);
    if(lot.incomeId&&used>0)sources.push({incomeId:lot.incomeId,amount:used});
    amount-=used;if(amount<=0)break;
  }
  return sources;
}

// Explicit selection must consume this income, never silently fall back to FIFO.
export function selectedIncomeSource(ledger: Ledger, incomeId: string, amount: number, date: string): IncomeSource[] {
  const income = ledger.movements.find(movement => movement.id === incomeId && movement.type === "Ingreso");
  const available = unassignedIncomeLots(ledger).filter(lot => lot.incomeId === incomeId && lot.date <= date).reduce((sum, lot) => sum + lot.amount, 0);
  if (!income || !Number.isSafeInteger(amount) || amount <= 0 || amount > available) {
    throw new Error("Este ingreso ya no tiene suficiente dinero sin asignar para ese monto. Revisa su saldo disponible.");
  }
  return [{ incomeId, amount }];
}

export function incomeDistribution(ledger: Ledger, incomeId: string) {
  const income=ledger.movements.find(m=>m.id===incomeId&&m.type==="Ingreso");
  if(!income)return null;
  const distributions=income.allocations.map(a=>({...a,movementId:income.id,date:income.date}));
  for(const m of ledger.movements)if(m.type==="Asignación") {
    const amount=(m.incomeSources??[]).filter(s=>s.incomeId===incomeId).reduce((sum,s)=>sum+s.amount,0);
    if(amount>0&&m.allocations.length===1)distributions.push({...m.allocations[0],amount,movementId:m.id,date:m.date});
  }
  const unassigned=unassignedIncomeLots(ledger).filter(l=>l.incomeId===incomeId).reduce((s,l)=>s+l.amount,0);
  const assigned=distributions.reduce((s,a)=>s+a.amount,0);
  return {income,distributions,assigned,unassigned,otherUses:Math.max(0,income.amount-assigned-unassigned)};
}
