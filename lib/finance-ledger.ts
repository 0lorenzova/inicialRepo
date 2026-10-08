import { normalizeExpenseDetails } from "./expense-details";
import { validatePurchaseProducts, type PurchaseProduct } from "./finance-products";
import { traceAssignmentSources, selectedIncomeSource, type IncomeSource } from "./income-trace";
export type Account = { id: string; name: string; type: string; balance: number; active: boolean };
export type LedgerEnvelope = { id: string; name: string; balance: number; archived?: boolean; goal?: number };
export type Loan = { id: string; sourceId: string; sourceName: string; targetId: string; targetName: string; amount: number; outstanding: number; status: "Pendiente" | "Parcial" | "Devuelto"; date: string };
export type LedgerAllocation = { envelopeId?: string; name: string; amount: number };
export type LedgerMovement = { id: string; type: "Ingreso" | "Gasto" | "Asignación" | "Desasignación" | "Transferencia" | "Préstamo" | "Devolución"; name: string; amount: number; date: string; accountId?: string; accountName?: string; category?: string; description?: string; merchant?: string; reference?: string; paymentMethod?: string; tags?: string[]; allocations: LedgerAllocation[]; loanId?: string; products?:PurchaseProduct[]; incomeSources?: IncomeSource[]; scheduledAmountId?: string; fundingTargets?: { envelopeId: string; itemId: string; kind: "goal" | "scheduled"; name: string; amount: number; deadline?: string }[] };
export type Ledger = { accounts: Account[]; envelopes: LedgerEnvelope[]; loans: Loan[]; movements: LedgerMovement[] };
const validAmount=(amount:number)=>Number.isSafeInteger(amount)&&amount>0;

function validMovementDate(value: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/.exec(value);
  if (!match || value.startsWith("0000")) return false;
  // Validate the civil day separately: Date otherwise normalizes February 30.
  const civil = new Date(`${match[1]}T12:00:00Z`);
  if (!Number.isFinite(civil.getTime()) || civil.toISOString().slice(0, 10) !== match[1]) return false;
  // A datetime-local input represents Costa Rica time; never use the host zone.
  return Number.isFinite(new Date(match[2] ? value : `${value}-06:00`).getTime());
}

export function archiveLedgerEnvelope(ledger: Ledger, envelopeId: string): Ledger {
  const current = ledger.envelopes.find(e => e.id === envelopeId && !e.archived);
  if (!current) throw new Error("El sobre ya no está activo.");
  if (current.balance !== 0) throw new Error("Desasigna o transfiere todo el saldo antes de archivar el sobre.");
  if (ledger.loans.some(l => l.outstanding > 0 && (l.sourceId === envelopeId || l.targetId === envelopeId))) throw new Error("Cierra los préstamos pendientes antes de archivar el sobre.");
  return { ...ledger, envelopes: ledger.envelopes.map(e => e.id === envelopeId ? { ...e, archived: true } : e) };
}

export function setAccountActive(ledger: Ledger, accountId: string, active: boolean): Ledger {
  const current = ledger.accounts.find(a => a.id === accountId);
  if (!current) throw new Error("La cuenta ya no existe.");
  if (current.balance !== 0) throw new Error("La cuenta debe tener saldo cero para cambiar su estado.");
  return { ...ledger, accounts: ledger.accounts.map(a => a.id === accountId ? { ...a, active } : a) };
}

// Los nombres son una instantánea del movimiento. El ID conserva su relación
// con el sobre aunque después se cambie de nombre o se archive.
export function movementHasEnvelope(movement: LedgerMovement, envelopeId: string) {
  return movement.allocations.some((allocation) => allocation.envelopeId === envelopeId);
}

export function migrateEnvelopeReferences<T extends LedgerMovement>(movements: T[], envelopes: LedgerEnvelope[], loans: Loan[] = []): T[] {
  const names = new Map<string, Set<string>>();
  const remember = (name: string, envelopeId: string) => {
    const ids = names.get(name) ?? new Set<string>();
    ids.add(envelopeId);
    names.set(name, ids);
  };
  for (const envelope of envelopes) remember(envelope.name, envelope.id);
  for (const movement of movements) {
    for (const allocation of movement.allocations) {
      if (allocation.envelopeId) remember(allocation.name, allocation.envelopeId);
    }
  }
  for (const loan of loans) {
    remember(loan.sourceName, loan.sourceId);
    remember(loan.targetName, loan.targetId);
  }
  const loanById = new Map(loans.map((loan) => [loan.id, loan]));
  let changed = false;
  const migrated = movements.map((movement) => {
    const loan = movement.loanId && (movement.type === "Préstamo" || movement.type === "Devolución") ? loanById.get(movement.loanId) : undefined;
    let movementChanged = false;
    const allocations = movement.allocations.map((allocation) => {
      if (allocation.envelopeId) return allocation;
      // Un préstamo enlazado explícitamente es evidencia más precisa que un
      // nombre reutilizado por otro sobre. Los nombres ambiguos no se adivinan.
      const loanCandidates = new Set<string>();
      if (loan?.sourceName === allocation.name) loanCandidates.add(loan.sourceId);
      if (loan?.targetName === allocation.name) loanCandidates.add(loan.targetId);
      const candidates = loanCandidates.size ? loanCandidates : names.get(allocation.name);
      if (candidates?.size !== 1) return allocation;
      movementChanged = true;
      return { ...allocation, envelopeId: [...candidates][0] };
    });
    if (!movementChanged) return movement;
    changed = true;
    return { ...movement, allocations };
  });
  return changed ? migrated : movements;
}

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

export function assign(ledger: Ledger, envelopeId: string, amount: number, date: string, id = crypto.randomUUID(), incomeId?: string): Ledger {
  const envelope = ledger.envelopes.find((item) => item.id === envelopeId && !item.archived);
  if (!envelope || !validAmount(amount) || amount > totals(ledger).unassigned) throw new Error("No hay dinero sin asignar suficiente o el monto no es válido.");
  if (!validMovementDate(date)) throw new Error("Selecciona una fecha y hora válidas para la asignación.");
  const incomeSources = incomeId === undefined ? traceAssignmentSources(ledger, amount, date) : selectedIncomeSource(ledger, incomeId, amount, date);
  return commit(ledger, { id, type: "Asignación", name: `Asignación a ${envelope.name}`, amount, date, incomeSources, allocations: [{ envelopeId: envelope.id, name: envelope.name, amount }] }, ledger.accounts, ledger.envelopes.map((item) => item.id === envelopeId ? { ...item, balance: item.balance + amount } : item));
}

export function unassign(ledger: Ledger, envelopeId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const envelope = ledger.envelopes.find((item) => item.id === envelopeId && !item.archived);
  if (!envelope || !validAmount(amount) || amount > envelope.balance) throw new Error("El sobre no tiene saldo suficiente para desasignar o el monto no es válido.");
  return commit(ledger, { id, type: "Desasignación", name: `Dinero devuelto desde ${envelope.name}`, amount, date, allocations: [{ envelopeId: envelope.id, name: envelope.name, amount }] }, ledger.accounts, ledger.envelopes.map((item) => item.id === envelopeId ? { ...item, balance: item.balance - amount } : item));
}

export function transfer(ledger: Ledger, sourceId: string, targetId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const source = ledger.envelopes.find((item) => item.id === sourceId && !item.archived), target = ledger.envelopes.find((item) => item.id === targetId && !item.archived);
  if (!source || !target || sourceId === targetId || !validAmount(amount) || source.balance < amount) throw new Error("Revisa los sobres y el saldo disponible para transferir.");
  return commit(ledger, { id, type: "Transferencia", name: `${source.name} → ${target.name}`, amount, date, allocations: [{ envelopeId: source.id, name: source.name, amount }, { envelopeId: target.id, name: target.name, amount }] }, ledger.accounts, ledger.envelopes.map((item) => item.id === sourceId ? { ...item, balance: item.balance - amount } : item.id === targetId ? { ...item, balance: item.balance + amount } : item));
}

export function lend(ledger: Ledger, sourceId: string, targetId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const source = ledger.envelopes.find((item) => item.id === sourceId && !item.archived), target = ledger.envelopes.find((item) => item.id === targetId && !item.archived);
  if (!source || !target || sourceId === targetId || !validAmount(amount) || source.balance < amount) throw new Error("Revisa los sobres y el saldo disponible para prestar.");
  const loanId = crypto.randomUUID(), loan: Loan = { id: loanId, sourceId, sourceName: source.name, targetId, targetName: target.name, amount, outstanding: amount, status: "Pendiente", date };
  return commit(ledger, { id, type: "Préstamo", name: `${source.name} prestó a ${target.name}`, amount, date, allocations: [{ envelopeId: source.id, name: source.name, amount }, { envelopeId: target.id, name: target.name, amount }], loanId }, ledger.accounts, ledger.envelopes.map((item) => item.id === sourceId ? { ...item, balance: item.balance - amount } : item.id === targetId ? { ...item, balance: item.balance + amount } : item), [loan, ...ledger.loans]);
}

export function repay(ledger: Ledger, loanId: string, amount: number, date: string, id = crypto.randomUUID()): Ledger {
  const loan = ledger.loans.find((item) => item.id === loanId && item.outstanding > 0), target = loan && ledger.envelopes.find((item) => item.id === loan.targetId), source = loan && ledger.envelopes.find((item) => item.id === loan.sourceId);
  if (!loan || !target || !source || !validAmount(amount) || amount > loan.outstanding || amount > target.balance) throw new Error("El saldo del sobre no alcanza o el monto supera el préstamo pendiente.");
  const outstanding = loan.outstanding - amount, status: Loan["status"] = outstanding === 0 ? "Devuelto" : "Parcial";
  const nextLoans = ledger.loans.map((item) => item.id === loanId ? { ...item, outstanding, status } : item);
  return commit(ledger, { id, type: "Devolución", name: `Devolución de ${target.name} a ${source.name}`, amount, date, allocations: [{ envelopeId: target.id, name: target.name, amount }, { envelopeId: source.id, name: source.name, amount }], loanId }, ledger.accounts, ledger.envelopes.map((item) => item.id === target.id ? { ...item, balance: item.balance - amount } : item.id === source.id ? { ...item, balance: item.balance + amount } : item), nextLoans);
}

export function postMovement(ledger: Ledger, input: { id?: string; type: "Ingreso" | "Gasto"; amount: number; accountId: string; envelopeAllocations: { id: string; amount: number }[]; date: string; name: string; category?: string; description?: string; merchant?: string; reference?: string; paymentMethod?: string; tags?: string[]; products?:PurchaseProduct[] }): Ledger {
  const account = ledger.accounts.find((item) => item.id === input.accountId && item.active);
  if (!account || !validAmount(input.amount)) throw new Error("Selecciona una cuenta activa y un monto entero válido.");
  if (!validMovementDate(input.date)) throw new Error("Selecciona una fecha y hora válidas para el movimiento.");
  if (new Set(input.envelopeAllocations.map((allocation) => allocation.id)).size !== input.envelopeAllocations.length) throw new Error("Cada sobre debe aparecer una sola vez en la distribución.");
  const allocated = input.envelopeAllocations.reduce((sum, item) => sum + item.amount, 0);
  if (input.envelopeAllocations.some((allocation) => !ledger.envelopes.some((item) => item.id === allocation.id && !item.archived) || !Number.isSafeInteger(allocation.amount) || allocation.amount < 0)) throw new Error("Hay un sobre o monto inválido en la distribución.");
  if (input.products?.some((product) => !Number.isSafeInteger(product.amount) || product.amount < 0)) throw new Error("El monto de cada producto debe ser un entero mayor o igual que cero.");
  if (input.products?.some((product) => product.amount > 0 && !product.name.trim())) throw new Error("Escribe el nombre del producto que tiene un monto registrado.");
  if (input.type === "Gasto" && (input.products?.reduce((sum, product) => sum + product.amount, 0) ?? 0) > input.amount) throw new Error("El total de productos no puede superar el monto del gasto.");
  if (input.type === "Gasto") validatePurchaseProducts(input.products ?? [], input.envelopeAllocations, ledger.envelopes);
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
  const movement: LedgerMovement = { ...(input.type === "Gasto" ? normalizeExpenseDetails(input.paymentMethod, input.tags) : {}), id: input.id || crypto.randomUUID(), type: input.type, name: input.name, amount: input.amount, date: input.date, accountId: account.id, accountName, category: input.category, description: input.description, reference: input.reference, merchant: input.merchant?.trim() || undefined, products:input.products, allocations: input.envelopeAllocations.map((allocation) => ({ envelopeId: allocation.id, name: ledger.envelopes.find((item) => item.id === allocation.id)!.name, amount: allocation.amount })) };
  return commit(ledger, movement, ledger.accounts.map((item) => item.id === account.id ? { ...item, balance: item.balance + delta } : item), envelopes);
}
