import { totals, type Ledger } from "./finance-ledger";
import { unassignedIncomeLots } from "./income-trace";

export function unassignedIncomes(ledger: Ledger) {
  const lots = unassignedIncomeLots(ledger);
  const availableByIncome = new Map<string, number>();
  for (const lot of lots) if (lot.incomeId) availableByIncome.set(lot.incomeId, (availableByIncome.get(lot.incomeId) ?? 0) + lot.amount);
  const incomes = ledger.movements.filter(movement => movement.type === "Ingreso" && (availableByIncome.get(movement.id) ?? 0) > 0)
    .map(income => ({ income, available: availableByIncome.get(income.id)! }))
    .sort((a, b) => b.income.date.localeCompare(a.income.date));
  const total = totals(ledger).unassigned;
  const linked = incomes.reduce((sum, item) => sum + item.available, 0);
  return { total, incomes, common: Math.max(0, total - linked) };
}
