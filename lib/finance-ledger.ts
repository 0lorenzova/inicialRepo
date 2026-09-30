export type Account = { id: string; name: string; type: string; balance: number; active: boolean };
export type LedgerEnvelope = { id: string; name: string; balance: number; archived?: boolean; goal?: number };
export type Loan = { id: string; sourceId: string; sourceName: string; targetId: string; targetName: string; amount: number; outstanding: number; status: "Pendiente" | "Parcial" | "Devuelto"; date: string };
export type LedgerMovement = { id: string; type: "Ingreso" | "Gasto" | "Asignación" | "Desasignación" | "Transferencia" | "Préstamo" | "Devolución"; name: string; amount: number; date: string; accountId?: string; accountName?: string; category?: string; description?: string; reference?: string; allocations: { name: string; amount: number }[]; loanId?: string; products?:{name:string;amount:number}[] };
export type Ledger = { accounts: Account[]; envelopes: LedgerEnvelope[]; loans: Loan[]; movements: LedgerMovement[] };
const validAmount=(amount:number)=>Number.isSafeInteger(amount)&&amount>0;

export function migrateLegacyBank(bank: number, movements: LedgerMovement[], accounts?: Account[]) {
  if (accounts?.length) return { accounts, movements };
  const oldRecurring = movements.filter((movement) => movement.type === "Ingreso" && movement.category === "Aporte recurrente");
  const restoredBalance = bank + oldRecurring.reduce((sum, movement) => sum + movement.amount, 0);
  return {
    accounts: [{ id: "main", name: "Cuenta corriente", type: "Banco", balance: restoredBalance, active: true }],
    movements: movements.map((movement) => oldRecurring.includes(movement) ? { ...movement, type: "Asignación" as const } : movement),
  };
}

export function totals(ledger: Ledger) {
  const accounts = ledger.accounts.filter((account) => account.active).reduce((sum, account) => sum + account.balance, 0);
  const assigned = ledger.envelopes.filter((envelope) => !envelope.archived).reduce((sum, envelope) => sum + envelope.balance, 0);
  return { accounts, assigned, unassigned: accounts - assigned };
}

export function commit(ledger: Ledger, movement: LedgerMovement, accounts = ledger.accounts, envelopes = ledger.envelopes, loans = ledger.loans): Ledger {
  if (ledger.movements.some((existing) => existing.id === movement.id)) throw new Error("El movimiento ya existe.");
  const next = { ...ledger, accounts, envelopes, loans, movements: [movement, ...ledger.movements].sort((a, b) => b.date.localeCompare(a.date)) };
  const { unassigned } = totals(next);
  if (unassigned < 0) throw new Error("La operación dejaría más dinero asignado que dinero real.");
  if (next.accounts.some((account) => account.balance < 0) || next.envelopes.some((envelope) => envelope.balance < 0)) throw new Error("No hay saldo suficiente para esta operación.");
  return next;
}

export function assign(ledger: Ledger, envelopeId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const envelope = ledger.envelopes.find((item) => item.id === envelopeId && !item.archived);
  if (!envelope || !validAmount(amount) || amount > totals(ledger).unassigned) throw new Error("No hay dinero sin asignar suficiente o el monto no es válido.");
  return commit(ledger, { id, type: "Asignación", name: `Asignación a ${envelope.name}`, amount, date, allocations: [{ name: envelope.name, amount }] }, ledger.accounts, ledger.envelopes.map((item) => item.id === envelopeId ? { ...item, balance: item.balance + amount } : item));
}

export function unassign(ledger: Ledger, envelopeId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const envelope = ledger.envelopes.find((item) => item.id === envelopeId && !item.archived);
  if (!envelope || !validAmount(amount) || amount > envelope.balance) throw new Error("El sobre no tiene saldo suficiente para desasignar o el monto no es válido.");
  return commit(ledger, { id, type: "Desasignación", name: `Dinero devuelto desde ${envelope.name}`, amount, date, allocations: [{ name: envelope.name, amount }] }, ledger.accounts, ledger.envelopes.map((item) => item.id === envelopeId ? { ...item, balance: item.balance - amount } : item));
}

export function transfer(ledger: Ledger, sourceId: string, targetId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const source = ledger.envelopes.find((item) => item.id === sourceId && !item.archived), target = ledger.envelopes.find((item) => item.id === targetId && !item.archived);
  if (!source || !target || sourceId === targetId || !validAmount(amount) || source.balance < amount) throw new Error("Revisa los sobres y el saldo disponible para transferir.");
  return commit(ledger, { id, type: "Transferencia", name: `${source.name} → ${target.name}`, amount, date, allocations: [{ name: source.name, amount }, { name: target.name, amount }] }, ledger.accounts, ledger.envelopes.map((item) => item.id === sourceId ? { ...item, balance: item.balance - amount } : item.id === targetId ? { ...item, balance: item.balance + amount } : item));
}

export function lend(ledger: Ledger, sourceId: string, targetId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const source = ledger.envelopes.find((item) => item.id === sourceId && !item.archived), target = ledger.envelopes.find((item) => item.id === targetId && !item.archived);
  if (!source || !target || sourceId === targetId || !validAmount(amount) || source.balance < amount) throw new Error("Revisa los sobres y el saldo disponible para prestar.");
  const loanId = crypto.randomUUID(), loan: Loan = { id: loanId, sourceId, sourceName: source.name, targetId, targetName: target.name, amount, outstanding: amount, status: "Pendiente", date };
  return commit(ledger, { id, type: "Préstamo", name: `${source.name} prestó a ${target.name}`, amount, date, allocations: [{ name: source.name, amount }, { name: target.name, amount }], loanId }, ledger.accounts, ledger.envelopes.map((item) => item.id === sourceId ? { ...item, balance: item.balance - amount } : item.id === targetId ? { ...item, balance: item.balance + amount } : item), [loan, ...ledger.loans]);
}

export function repay(ledger: Ledger, loanId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const loan = ledger.loans.find((item) => item.id === loanId && item.outstanding > 0), target = loan && ledger.envelopes.find((item) => item.id === loan.targetId), source = loan && ledger.envelopes.find((item) => item.id === loan.sourceId);
  if (!loan || !target || !source || !validAmount(amount) || amount > loan.outstanding || amount > target.balance) throw new Error("El saldo del sobre no alcanza o el monto supera el préstamo pendiente.");
  const outstanding = loan.outstanding - amount, status: Loan["status"] = outstanding === 0 ? "Devuelto" : "Parcial";
  const nextLoans = ledger.loans.map((item) => item.id === loanId ? { ...item, outstanding, status } : item);
  return commit(ledger, { id, type: "Devolución", name: `Devolución de ${target.name} a ${source.name}`, amount, date, allocations: [{ name: target.name, amount }, { name: source.name, amount }], loanId }, ledger.accounts, ledger.envelopes.map((item) => item.id === target.id ? { ...item, balance: item.balance - amount } : item.id === source.id ? { ...item, balance: item.balance + amount } : item), nextLoans);
}

export function postMovement(ledger: Ledger, input: { id?: string; type: "Ingreso" | "Gasto"; amount: number; accountId: string; envelopeAllocations: { id: string; amount: number }[]; date: string; name: string; category?: string; description?: string; reference?: string; products?:{name:string;amount:number}[] }): Ledger {
  const account = ledger.accounts.find((item) => item.id === input.accountId && item.active);
  if (!account || !validAmount(input.amount)) throw new Error("Selecciona una cuenta activa y un monto entero válido.");
  const allocated = input.envelopeAllocations.reduce((sum, item) => sum + item.amount, 0);
  if (input.envelopeAllocations.some((allocation) => !ledger.envelopes.some((item) => item.id === allocation.id && !item.archived) || !Number.isSafeInteger(allocation.amount) || allocation.amount < 0)) throw new Error("Hay un sobre o monto inválido en la distribución.");
  const delta = input.type === "Ingreso" ? input.amount : -input.amount;
  if (input.type === "Gasto") {
    if (account.balance < input.amount) throw new Error("La cuenta no tiene saldo suficiente para este gasto.");
    const assignedSpend = input.envelopeAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    const unassignedSpend = input.amount - assignedSpend;
    if (unassignedSpend < 0 || unassignedSpend > totals(ledger).unassigned) throw new Error("Los sobres y el dinero sin asignar no cubren el gasto.");
    for (const allocation of input.envelopeAllocations) if ((ledger.envelopes.find((item) => item.id === allocation.id)?.balance || 0) < allocation.amount) throw new Error("Un sobre no tiene saldo suficiente.");
  } else if (allocated > input.amount || allocated < 0) throw new Error("La distribución no puede superar el ingreso.");
  const envChanges = new Map(input.envelopeAllocations.map((item) => [item.id, item.amount]));
  const envelopes = ledger.envelopes.map((item) => {
    const allocation = envChanges.get(item.id) || 0;
    if (!allocation) return item;
    return { ...item, balance: item.balance + (input.type === "Ingreso" ? allocation : -allocation) };
  });
  const accountName = account.name;
  const movement: LedgerMovement = { id: input.id || crypto.randomUUID(), type: input.type, name: input.name, amount: input.amount, date: input.date, accountId: account.id, accountName, category: input.category, description: input.description, reference: input.reference, products:input.products, allocations: input.envelopeAllocations.map((allocation) => ({ name: ledger.envelopes.find((item) => item.id === allocation.id)!.name, amount: allocation.amount })) };
  return commit(ledger, movement, ledger.accounts.map((item) => item.id === account.id ? { ...item, balance: item.balance + delta } : item), envelopes);
}
