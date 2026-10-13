import type { LedgerMovement } from "./finance-ledger";

/** Display-only envelope reference. Never use this label as a stored name or identifier. */
export function envelopeLabel(name: string | null | undefined): string {
  if (!name) return "";
  return `✉︎\u00a0${name}`;
}

/** Decorate only known generated titles; user descriptions and historic data remain verbatim. */
export function envelopeMovementLabel(movement: LedgerMovement): string {
  const [source, target] = movement.allocations;
  if (!source) return movement.name;
  const title = (a: string, b: string) => {
    switch (movement.type) {
      case "Asignación": return `Asignación a ${a}`;
      case "Desasignación": return `Dinero devuelto desde ${a}`;
      case "Transferencia": return `${a} → ${b}`;
      case "Préstamo": return `${a} prestó a ${b}`;
      case "Devolución": return `Devolución de ${a} a ${b}`;
      default: return null;
    }
  };
  const original = title(source.name, target?.name ?? "");
  return original === movement.name ? title(envelopeLabel(source.name), envelopeLabel(target?.name))! : movement.name;
}
