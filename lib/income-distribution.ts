import { globalPlanningItems, type PlanningEnvelope } from "./envelope-planning";
import { postMovement, type Ledger } from "./finance-ledger";

export type FundingSelection = {
  envelopeId: string;
  itemId: string;
  kind: "goal" | "scheduled";
  name: string;
  amount: number;
  deadline?: string;
};
export const fundingKey = (item: Pick<FundingSelection, "envelopeId" | "itemId" | "kind">) => JSON.stringify([item.envelopeId, item.kind, item.itemId]);

// Read-only projection of existing planning. Dates and colors come from the shared engine.
export function fundingOptions(envelopes: PlanningEnvelope[], today: string) {
  return globalPlanningItems(envelopes, today).map(entry => ({
    ...entry,
    selection: { envelopeId: entry.envelopeId, itemId: entry.item.id, kind: entry.item.kind, name: entry.item.name, amount: entry.item.amount, deadline: entry.item.deadline } satisfies FundingSelection,
  }));
}

export function incomeDistribution(envelopes: PlanningEnvelope[], today: string, amount: number, manual: Record<string, string>, selections: FundingSelection[]) {
  const options = new Map(fundingOptions(envelopes, today).map(option => [fundingKey(option.selection), option.selection]));
  const allocations = new Map<string, number>();
  const errors: string[] = [];
  const stale: FundingSelection[] = [];
  const seen = new Set<string>();
  let selected = 0;
  for (const choice of selections) {
    const key = fundingKey(choice), current = options.get(key);
    if (seen.has(key)) { errors.push("Hay una obligación seleccionada más de una vez."); continue; }
    seen.add(key);
    if (!current || current.amount !== choice.amount || current.deadline !== choice.deadline || current.name !== choice.name) stale.push(choice);
    if (!Number.isSafeInteger(choice.amount) || choice.amount <= 0) { errors.push("Una selección tiene un monto inválido."); continue; }
    selected += choice.amount;
    allocations.set(choice.envelopeId, (allocations.get(choice.envelopeId) ?? 0) + choice.amount);
  }
  if (stale.length) errors.push("Una obligación seleccionada cambió o ya no está pendiente. Quita esa selección y vuelve a revisarla.");
  for (const [id, text] of Object.entries(manual)) {
    if (!text.trim()) continue;
    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < 0) { errors.push("Las asignaciones adicionales deben ser montos enteros mayores o iguales a cero."); continue; }
    if (!value) continue;
    if (!envelopes.some(envelope => envelope.id === id && !envelope.archived)) errors.push("Un sobre con asignación adicional ya no está activo. Revisa la distribución.");
    allocations.set(id, (allocations.get(id) ?? 0) + value);
  }
  const total = [...allocations.values()].reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(amount) || amount <= 0) errors.push("Ingresa un monto entero mayor que cero.");
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(selected)) errors.push("La distribución supera el monto permitido.");
  else if (total > amount) errors.push("La distribución supera el ingreso. Reduce las asignaciones o desmarca una obligación.");
  return { selected, total, remaining: amount - total, errors: [...new Set(errors)], stale, allocations: [...allocations].map(([id, value]) => ({ id, amount: value })) };
}

// Validate against the latest ledger, then delegate the single atomic write to postMovement.
export function postDistributedIncome(ledger: Ledger, input: Omit<Parameters<typeof postMovement>[1], "type" | "envelopeAllocations">, today: string, manual: Record<string, string>, selections: FundingSelection[]): Ledger {
  const plan = incomeDistribution(ledger.envelopes, today, input.amount, manual, selections);
  if (plan.errors.length) throw new Error(plan.errors[0]);
  const next = postMovement(ledger, { ...input, type: "Ingreso", envelopeAllocations: plan.allocations });
  const id = input.id ?? next.movements.find(movement => !ledger.movements.some(existing => existing.id === movement.id))?.id;
  return { ...next, movements: next.movements.map(movement => movement.id === id ? { ...movement, fundingTargets: selections.map(choice => ({ ...choice })) } : movement) };
}
