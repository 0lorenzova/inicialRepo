import { assign, lend, totals, transfer, unassign, type Ledger } from "./finance-ledger";

export type EnvelopeAction = "Asignar dinero" | "Desasignar" | "Transferir" | "Prestar a otro sobre" | "Pedir prestado";
const money = (amount: number) => `₡${amount.toLocaleString("es-CR")}`;

export function applyEnvelopeOperation(ledger: Ledger, input: { kind: EnvelopeAction; envelopeId: string; counterpartyId?: string; amount: number; date: string; id: string }) {
  const { kind, amount, date, id } = input;
  const envelope = ledger.envelopes.find(e => e.id === input.envelopeId && !e.archived);
  if (!envelope) throw new Error("Este sobre ya no está activo. Vuelve a la lista.");
  if (!amount) throw new Error("Debes ingresar un monto.");
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Ingresa un monto entero mayor que cero.");
  if (kind === "Asignar dinero") {
    if (amount > totals(ledger).unassigned) throw new Error("Intentas asignar más dinero del disponible sin asignar.");
    return { ledger: assign(ledger, envelope.id, amount, date, id), message: `${money(amount)} asignados correctamente a ${envelope.name}.` };
  }
  if (kind === "Desasignar") {
    if (amount > envelope.balance) throw new Error(`Intentas retirar más dinero del disponible en ${envelope.name}.`);
    return { ledger: unassign(ledger, envelope.id, amount, date, id), message: `${money(amount)} desasignados correctamente de ${envelope.name}.` };
  }
  const other = ledger.envelopes.find(e => e.id === input.counterpartyId && !e.archived);
  if (!other) throw new Error(kind === "Pedir prestado" ? "Selecciona de dónde pedir el dinero." : "Selecciona el destino del dinero.");
  if (other.id === envelope.id) throw new Error("Selecciona un sobre diferente como contraparte.");
  const source = kind === "Pedir prestado" ? other : envelope, target = kind === "Pedir prestado" ? envelope : other;
  if (amount > source.balance) throw new Error(`El monto que intentas ${kind === "Transferir" ? "transferir" : "prestar"} es mayor que el saldo disponible en ${source.name}.`);
  return {
    ledger: kind === "Transferir" ? transfer(ledger, source.id, target.id, amount, date, id) : lend(ledger, source.id, target.id, amount, date, id),
    message: `${money(amount)} ${kind === "Transferir" ? "transferidos" : "prestados"} correctamente de ${source.name} a ${target.name}.`,
  };
}
