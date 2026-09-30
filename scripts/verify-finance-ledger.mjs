import assert from "node:assert/strict";
import { assign, lend, migrateLegacyBank, postMovement, repay, totals, transfer, unassign } from "../lib/finance-ledger.ts";

const seed = () => ({
  accounts: [{ id: "checking", name: "Corriente", type: "Banco", balance: 0, active: true }],
  envelopes: [{ id: "savings", name: "Ahorro", balance: 0 }, { id: "food", name: "Comida", balance: 0 }],
  loans: [], movements: [],
});
const checkInvariant = (ledger) => {
  const { accounts, assigned, unassigned } = totals(ledger);
  assert.equal(accounts, assigned + unassigned);
  assert.ok(unassigned >= 0);
};
const income = (ledger, amount, id = "income") => postMovement(ledger, {
  id, type: "Ingreso", amount, accountId: "checking", envelopeAllocations: [], date: "2026-09-29T12:00",
  name: "Ingreso de prueba",
});

// 1: ingreso, asignación y gasto pagado desde sobre.
let ledger = income(seed(), 250_000);
ledger = assign(ledger, "savings", 79_000, "2026-09-29T12:01", "assign-1");
ledger = postMovement(ledger, { id: "expense-1", type: "Gasto", amount: 5_000, accountId: "checking", envelopeAllocations: [{ id: "savings", amount: 5_000 }], date: "2026-09-29T12:02", name: "Compra" });
assert.deepEqual(totals(ledger), { accounts: 245_000, assigned: 74_000, unassigned: 171_000 }); checkInvariant(ledger);

// 2: varias asignaciones, conservando el dinero real.
ledger = assign(ledger, "food", 20_000, "2026-09-29T12:03", "assign-2");
assert.equal(totals(ledger).accounts, 245_000); assert.equal(totals(ledger).assigned, 94_000); checkInvariant(ledger);

// 3: transferencia entre sobres, sin variar cuentas ni asignación total.
ledger = transfer(ledger, "savings", "food", 10_000, "2026-09-29T12:04", "transfer-1");
assert.equal(totals(ledger).assigned, 94_000); assert.equal(ledger.envelopes[0].balance, 64_000); checkInvariant(ledger);

// 4 y 5: préstamo completo y devolución parcial, luego cierre.
ledger = lend(ledger, "savings", "food", 20_000, "2026-09-29T12:05", "loan-1");
assert.equal(ledger.loans[0].outstanding, 20_000); checkInvariant(ledger);
ledger = repay(ledger, ledger.loans[0].id, 8_000, "2026-09-29T12:06", "repay-1");
assert.equal(ledger.loans[0].outstanding, 12_000); assert.equal(ledger.loans[0].status, "Parcial"); checkInvariant(ledger);
ledger = repay(ledger, ledger.loans[0].id, 12_000, "2026-09-29T12:07", "repay-2");
assert.equal(ledger.loans[0].outstanding, 0); assert.equal(ledger.loans[0].status, "Devuelto"); checkInvariant(ledger);

// 6: bloquear gasto mayor que cuenta/saldo disponible y préstamo/devolución inválidos.
assert.throws(() => postMovement(ledger, { id: "too-large", type: "Gasto", amount: 999_999, accountId: "checking", envelopeAllocations: [], date: "2026-09-29T12:08", name: "Inválido" }));
assert.throws(() => transfer(ledger, "savings", "food", 999_999, "2026-09-29T12:08", "bad-transfer"));
assert.throws(() => repay(ledger, "missing-loan", 1, "2026-09-29T12:08", "bad-repay"));
const fullyAssigned = postMovement(seed(), { id: "income-assigned", type: "Ingreso", amount: 10_000, accountId: "checking", envelopeAllocations: [{ id: "food", amount: 10_000 }], date: "2026-09-29T12:08", name: "Ingreso asignado" });
assert.throws(() => postMovement(fullyAssigned, { id: "unfunded", type: "Gasto", amount: 1, accountId: "checking", envelopeAllocations: [], date: "2026-09-29T12:08", name: "Sin fondos libres" }));
assert.throws(() => assign(ledger, "food", 1.5, "2026-09-29T12:08", "fractional"));

// 7: aporte recurrente confirmado equivale a asignar dinero disponible; sin doble débito.
const beforeAccounts = totals(ledger).accounts, beforeAssigned = totals(ledger).assigned;
ledger = assign(ledger, "savings", 25_000, "2026-09-29T12:09", "recurring-confirmed");
assert.equal(totals(ledger).accounts, beforeAccounts); assert.equal(totals(ledger).assigned, beforeAssigned + 25_000); checkInvariant(ledger);

// 8: movimientos consecutivos únicos y ordenados por fecha.
ledger = unassign(ledger, "savings", 5_000, "2026-09-29T12:10", "unassign-1");
assert.throws(() => unassign(ledger, "savings", 5_000, "2026-09-29T12:10", "unassign-1"));
assert.deepEqual(ledger.movements.map((movement) => movement.date), [...ledger.movements].map((movement) => movement.date).sort().reverse()); checkInvariant(ledger);

// 9: la serialización conserva saldos y préstamos al reabrir.
const reopened = JSON.parse(JSON.stringify(ledger));
assert.deepEqual(totals(reopened), totals(ledger)); assert.deepEqual(reopened.loans, ledger.loans); checkInvariant(reopened);

// 10: Inicio, Sobres, Movimientos y Reportes consultan estos mismos agregados.
assert.equal(totals(reopened).accounts, reopened.accounts.reduce((sum, account) => sum + account.balance, 0));
assert.equal(totals(reopened).assigned, reopened.envelopes.reduce((sum, envelope) => sum + envelope.balance, 0));

// Migración preserva el saldo anterior y repara aportes recurrentes antiguos que debitaban la cuenta indebidamente.
const migrated = migrateLegacyBank(750, [{ id: "old-recurring", type: "Ingreso", name: "Aporte recurrente", amount: 250, date: "2026-09-29T12:00", category: "Aporte recurrente", allocations: [{ name: "Ahorro", amount: 250 }] }]);
assert.equal(migrated.accounts[0].balance, 1_000);
assert.equal(migrated.movements[0].type, "Asignación");

console.log("OK: 10 escenarios del libro financiero verificados.");
