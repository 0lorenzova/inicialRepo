import type { Ledger, LedgerMovement } from "./finance-ledger";
import { movementInstant } from "./finance-history";

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
  for (const m of [...ledger.movements].reverse().sort((a,b)=>movementInstant(a.date)-movementInstant(b.date))) {
    const delta=unassignedDelta(m);
    if (delta>0) lots.push({ incomeId:m.type==="Ingreso"?m.id:m.type==="Desasignación"?m.distributionCorrection?.incomeId:undefined, amount:delta, date:m.date });
    if (delta>=0) continue;
    let remaining=-delta;
    if(m.type==="Asignación")for(const source of m.incomeSources??[]) {
      let sourceRemaining=source.amount;
      for(const lot of lots.filter(l=>l.incomeId===source.incomeId)) {
        const used=Math.min(remaining,lot.amount,sourceRemaining);lot.amount-=used;remaining-=used;sourceRemaining-=used;
        if(remaining<=0||sourceRemaining<=0)break;
      }
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
    if(lot.date&&movementInstant(lot.date)>movementInstant(date))continue;
    const used=Math.min(amount,lot.amount);
    if(lot.incomeId&&used>0)sources.push({incomeId:lot.incomeId,amount:used});
    amount-=used;if(amount<=0)break;
  }
  return sources;
}

// Explicit selection must consume this income, never silently fall back to FIFO.
export function selectedIncomeSource(ledger: Ledger, incomeId: string, amount: number, date: string): IncomeSource[] {
  const income = ledger.movements.find(movement => movement.id === incomeId && movement.type === "Ingreso");
  const available = unassignedIncomeLots(ledger).filter(lot => lot.incomeId === incomeId && movementInstant(lot.date) <= movementInstant(date)).reduce((sum, lot) => sum + lot.amount, 0);
  if (!income || !Number.isSafeInteger(amount) || amount <= 0 || amount > available) {
    throw new Error("El monto supera el saldo disponible para asignar de este ingreso. Revisa los datos.");
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
  for(const m of ledger.movements)if(m.type==="Desasignación"&&m.distributionCorrection?.incomeId===incomeId) {
    for(const a of m.allocations)distributions.push({...a,amount:-a.amount,movementId:m.id,date:m.date});
  }
  const unassigned=unassignedIncomeLots(ledger).filter(l=>l.incomeId===incomeId).reduce((s,l)=>s+l.amount,0);
  const assigned=distributions.reduce((s,a)=>s+a.amount,0);
  return {income,distributions,assigned,unassigned,otherUses:Math.max(0,income.amount-assigned-unassigned)};
}

// The full movement history can contain many salary payments. Build their
// trace summaries together so the presentation does not rescan the complete
// ledger once for every visible income.
export function incomeDistributions(ledger: Ledger, incomeIds: Iterable<string>) {
  const requested = new Set(incomeIds);
  const incomes = new Map(ledger.movements.filter(movement => movement.type === "Ingreso" && requested.has(movement.id)).map(income => [income.id, income]));
  if (!incomes.size) return new Map();
  const distributions = new Map([...incomes.keys()].map(id => [id, (incomes.get(id)?.allocations ?? []).map(allocation => ({ ...allocation, movementId: id, date: incomes.get(id)!.date }))]));

  for (const movement of ledger.movements) {
    if (movement.type === "Asignación" && movement.allocations.length === 1) {
      const amounts = new Map<string, number>();
      for (const source of movement.incomeSources ?? []) {
        if (requested.has(source.incomeId)) amounts.set(source.incomeId, (amounts.get(source.incomeId) ?? 0) + source.amount);
      }
      for (const [incomeId, amount] of amounts) {
        if (amount > 0) distributions.get(incomeId)?.push({ ...movement.allocations[0], amount, movementId: movement.id, date: movement.date });
      }
    }
    if (movement.type === "Desasignación" && movement.distributionCorrection && requested.has(movement.distributionCorrection.incomeId)) {
      for (const allocation of movement.allocations) {
        distributions.get(movement.distributionCorrection.incomeId)?.push({ ...allocation, amount: -allocation.amount, movementId: movement.id, date: movement.date });
      }
    }
  }

  const unassignedByIncome = new Map<string, number>();
  for (const lot of unassignedIncomeLots(ledger)) {
    if (lot.incomeId && requested.has(lot.incomeId)) unassignedByIncome.set(lot.incomeId, (unassignedByIncome.get(lot.incomeId) ?? 0) + lot.amount);
  }

  const result = new Map<string, NonNullable<ReturnType<typeof incomeDistribution>>>();
  for (const [incomeId, income] of incomes) {
    const incomeAllocations = distributions.get(incomeId) ?? [];
    const assigned = incomeAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    const unassigned = unassignedByIncome.get(incomeId) ?? 0;
    result.set(incomeId, { income, distributions: incomeAllocations, assigned, unassigned, otherUses: Math.max(0, income.amount - assigned - unassigned) });
  }
  return result;
}
