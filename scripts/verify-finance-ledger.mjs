import assert from "node:assert/strict";
import { archiveLedgerEnvelope, setAccountActive, assign, lend, migrateEnvelopeReferences, migrateLegacyBank, movementHasEnvelope, postMovement, repay, totals, transfer, unassign } from "../lib/finance-ledger.ts";

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

// 11: todas las operaciones conservan el ID del sobre y el nombre histórico.
for (const movement of [...ledger.movements, ...fullyAssigned.movements]) {
  for (const allocation of movement.allocations) {
    assert.ok(allocation.envelopeId, `Falta ID en ${movement.type}`);
    assert.equal(allocation.name, seed().envelopes.find((envelope) => envelope.id === allocation.envelopeId).name);
  }
}
assert.deepEqual(ledger.movements.find((movement) => movement.id === "repay-1").allocations.map((allocation) => allocation.envelopeId), ["food", "savings"]);
assert.deepEqual(ledger.movements.find((movement) => movement.id === "transfer-1").allocations.map((allocation) => allocation.envelopeId), ["savings", "food"]);

// 12: renombrar, archivar, repetir un nombre y reabrir no cambia el historial.
const beforeRenameIds = ledger.movements.filter((movement) => movementHasEnvelope(movement, "savings")).map((movement) => movement.id);
const renamed = JSON.parse(JSON.stringify({ ...ledger, envelopes: [
  ...ledger.envelopes.map((envelope) => envelope.id === "savings" ? { ...envelope, name: "Reserva familiar", archived: true } : envelope),
  { id: "another-savings", name: "Ahorro", balance: 0 },
] }));
assert.deepEqual(renamed.movements.filter((movement) => movementHasEnvelope(movement, "savings")).map((movement) => movement.id), beforeRenameIds);
assert.equal(renamed.movements.filter((movement) => movementHasEnvelope(movement, "another-savings")).length, 0);
assert.equal(renamed.movements.find((movement) => movement.id === "assign-1").allocations[0].name, "Ahorro");
assert.equal(migrateEnvelopeReferences(renamed.movements, renamed.envelopes, renamed.loans), renamed.movements);

// 13: migración conservadora, inmutable e idempotente; no se adivinan nombres.
const legacyMovement = (id, name, extra = {}) => ({ id, type: "Asignación", name: `Asignación histórica ${name}`, amount: 100, date: "2026-09-29T12:00", allocations: [{ name, amount: 100 }], ...extra });
const legacyMovements = [legacyMovement("unique", "Comida"), legacyMovement("duplicate", "Ahorro"), legacyMovement("missing", "Nombre desaparecido")];
const migrationEnvelopes = [...seed().envelopes, { id: "old-savings", name: "Ahorro", balance: 0, archived: true }];
const legacySnapshot = JSON.stringify(legacyMovements);
const withIds = migrateEnvelopeReferences(legacyMovements, migrationEnvelopes);
assert.equal(withIds[0].allocations[0].envelopeId, "food");
assert.equal(withIds[1].allocations[0].envelopeId, undefined);
assert.equal(withIds[2].allocations[0].envelopeId, undefined);
assert.equal(JSON.stringify(legacyMovements), legacySnapshot);
assert.equal(migrateEnvelopeReferences(withIds, migrationEnvelopes), withIds);
assert.deepEqual(withIds.map((movement) => movement.allocations[0].name), legacyMovements.map((movement) => movement.allocations[0].name));
const historicalAlias = [legacyMovement("known-alias", "Reserva", { allocations: [{ envelopeId: "savings", name: "Reserva", amount: 100 }] }), legacyMovement("old-alias", "Reserva")];
assert.equal(migrateEnvelopeReferences(historicalAlias, seed().envelopes)[1].allocations[0].envelopeId, "savings");
assert.equal(migrateEnvelopeReferences(historicalAlias, [...seed().envelopes, { id: "new-reserve", name: "Reserva", balance: 0 }])[1].allocations[0].envelopeId, undefined);

// 14: un préstamo relacionado permite recuperar referencias anteriores al cambio de nombre.
const legacyLoan = { id: "legacy-loan", sourceId: "savings", sourceName: "Fondo anterior", targetId: "food", targetName: "Comida", amount: 100, outstanding: 100, status: "Pendiente", date: "2026-09-29T12:00" };
const loanMovements = [legacyMovement("legacy-lend", "Fondo anterior", { type: "Préstamo", loanId: "legacy-loan" }), legacyMovement("legacy-unlinked", "Fondo anterior")];
const reusedNameEnvelopes = [...seed().envelopes, { id: "new-fund", name: "Fondo anterior", balance: 0 }];
const migratedLoanMovements = migrateEnvelopeReferences(loanMovements, reusedNameEnvelopes, [legacyLoan]);
assert.equal(migratedLoanMovements[0].allocations[0].envelopeId, "savings");
assert.equal(migratedLoanMovements[1].allocations[0].envelopeId, undefined);
const ambiguousLoan = { ...legacyLoan, sourceName: "Comida" };
assert.equal(migrateEnvelopeReferences([legacyMovement("ambiguous-loan", "Comida", { type: "Préstamo", loanId: "legacy-loan" })], seed().envelopes, [ambiguousLoan])[0].allocations[0].envelopeId, undefined);

// 15: un mismo sobre no puede repetirse en una distribución ni producir débitos desiguales.
const beforeInvalid = JSON.stringify(ledger);
for (const type of ["Ingreso", "Gasto"]) {
  assert.throws(() => postMovement(ledger, { id: `duplicate-${type}`, type, amount: 1_000, accountId: "checking", envelopeAllocations: [{ id: "savings", amount: 500 }, { id: "savings", amount: 500 }], date: "2026-09-29T12:11", name: "Distribución inválida" }), /una sola vez/);
  assert.equal(JSON.stringify(ledger), beforeInvalid);
}
checkInvariant(ledger);

// 16: comercio y productos sobreviven al guardado y reapertura sin reescribir el historial.
const expenseInput = { id: "merchant-expense", type: "Gasto", amount: 5_000, accountId: "checking", envelopeAllocations: [], date: "2026-10-02T10:45", name: "Compra de prueba", merchant: "  Soda de prueba  ", products: [{ name: "Almuerzo", amount: 3_000 }, { name: "Producto sin precio", amount: 0 }] };
const sourceSnapshot = JSON.stringify(ledger);
const merchantLedger = postMovement(ledger, expenseInput);
assert.equal(merchantLedger.movements[0].merchant, "Soda de prueba");
assert.deepEqual(merchantLedger.movements[0].products, expenseInput.products);
const reopenedMerchant = JSON.parse(JSON.stringify(merchantLedger));
assert.equal(reopenedMerchant.movements[0].merchant, "Soda de prueba");
assert.deepEqual(reopenedMerchant.movements[0].products, expenseInput.products);
assert.deepEqual(reopenedMerchant.movements.slice(1), JSON.parse(sourceSnapshot).movements);
assert.equal(JSON.stringify(ledger), sourceSnapshot);
checkInvariant(reopenedMerchant);

// 17: productos opcionales en cero son compatibles; cantidades inválidas no cambian saldos.
for (const amount of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => postMovement(ledger, { ...expenseInput, products: [{ name: "Inválido", amount }] }), /entero/);
}
assert.throws(() => postMovement(ledger, { ...expenseInput, products: [{ name: "  ", amount: 1 }] }), /nombre/);
assert.throws(() => postMovement(ledger, { ...expenseInput, products: [{ name: "Uno", amount: 3_000 }, { name: "Dos", amount: 2_001 }] }), /total de productos/);
for (const products of [undefined, [], [{ name: "", amount: 0 }], [{ name: "Compra completa", amount: 5_000 }]]) {
  const validExpense = postMovement(ledger, { ...expenseInput, products });
  assert.equal(totals(validExpense).accounts, totals(ledger).accounts - 5_000);
  checkInvariant(validExpense);
}
assert.equal(JSON.stringify(ledger), sourceSnapshot);

// 18: nuevos registros requieren fecha/hora real, sea local, UTC o con offset.
const invalidDates = ["", "fecha", "2026-10-02", "2026-02-30T12:00", "2025-02-29T12:00", "2026-13-01T12:00", "2026-00-01T12:00", "2026-01-00T12:00", "2026-10-02T24:00", "2026-10-02T12:60", "2026-10-02T12:00:60", "2026-10-02T12:00+24:00", "2026-10-02T12:00+06:60", "0000-01-01T12:00"];
for (const type of ["Ingreso", "Gasto"]) {
  for (const date of invalidDates) {
    assert.throws(() => postMovement(ledger, { ...expenseInput, type, date }), /fecha y hora/);
    assert.equal(JSON.stringify(ledger), sourceSnapshot);
  }
}
for (const date of ["2026-10-02T12:00", "2026-10-02T12:00:30.125", "2024-02-29T23:59", "2026-10-02T12:00Z", "2026-10-02T12:00:30.125Z", "2026-10-02T12:00-06:00", "2026-10-02T12:00:30+05:30"]) {
  const withDate = postMovement(ledger, { ...expenseInput, date });
  assert.equal(withDate.movements.find(movement => movement.id === expenseInput.id).date, date);
  checkInvariant(withDate);
}
// Existing malformed historical dates stay untouched when a new valid record is saved.
const historicalDates = { ...ledger, movements: [{ ...ledger.movements[0], id: "legacy-without-date", date: "" }, ...ledger.movements] };
assert.equal(postMovement(historicalDates, expenseInput).movements.find(movement => movement.id === "legacy-without-date").date, "");

console.log("OK: 18 escenarios del libro financiero verificados.");

// Archivar/desactivar valida el estado vigente, no el saldo de un formulario abierto.
assert.throws(() => archiveLedgerEnvelope(ledger, "savings"), /saldo/);
const emptyLedger = seed();
assert.equal(archiveLedgerEnvelope(emptyLedger, "savings").envelopes[0].archived, true);
const loanOnly = { ...emptyLedger, loans: [{ sourceId: "savings", targetId: "food", outstanding: 1 }] };
assert.throws(() => archiveLedgerEnvelope(loanOnly, "savings"), /préstamos/);
assert.throws(() => setAccountActive(ledger, "checking", false), /saldo cero/);
assert.equal(setAccountActive(emptyLedger, "checking", false).accounts[0].active, false);
console.log("OK: archivado y estado de cuentas validan el saldo vigente.");
