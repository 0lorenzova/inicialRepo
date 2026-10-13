import type { LedgerMovement } from "./finance-ledger";
import { movementInstant } from "./finance-history";

// Existing records use CRC. Honor an explicit currency in imported/legacy records.
export function movementMoney(movement: LedgerMovement & { currency?: string }, amount = movement.amount): string {
  const currency = movement.currency || "CRC";
  try { return new Intl.NumberFormat("es-CR", { style:"currency", currency, maximumFractionDigits:currency === "CRC" ? 0 : 2 }).format(amount); }
  catch { return `${amount.toLocaleString("es-CR")} ${currency}`; }
}
export function movementDate(value: string): string {
  const instant = movementInstant(value);
  return Number.isFinite(instant) ? new Intl.DateTimeFormat("es-CR", {dateStyle:"medium",timeStyle:"short",timeZone:"America/Costa_Rica"}).format(instant) : "Fecha no disponible";
}
export function movementSign(movement: LedgerMovement): string {
  return movement.type === "Ingreso" ? "+" : movement.type === "Gasto" ? "−" : "↔";
}
export function movementFields(movement: LedgerMovement): [string,string][] {
  const fields: [string,string | undefined][] = [
    ["Cuenta", movement.accountName],
    [movement.type === "Ingreso" ? "Medio de recepción" : "Método de pago", movement.paymentMethod],
    ["Fecha y hora · Costa Rica", movementDate(movement.date)],
    [movement.type === "Ingreso" ? "Tipo de ingreso" : "Categoría", movement.category],
    ["Referencia", movement.reference], ["Descripción", movement.description],
    ["Comercio / lugar", movement.merchant], ["Etiquetas", movement.tags?.join(" · ")],
  ];
  return fields.filter((field): field is [string,string] => Boolean(field[1]));
}
