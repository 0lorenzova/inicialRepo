import { movementInstant } from "./finance-history";
import { isoWeek } from "./iso-week";

export type NamingKind = "Ingreso" | "Gasto";
export const incomeNameFields = ["Fecha", "Hora", "Monto", "Tipo de ingreso", "Semana", "Número"] as const;
export const expenseNameFields = ["Categoría", "Fecha", "Hora", "Monto", "Comercio", "Número"] as const;
export type NameField = typeof incomeNameFields[number] | typeof expenseNameFields[number];
export const nameSeparators = [" - ", " · ", " / ", " "] as const;
export type NameSettings = { manual: boolean; fields: NameField[]; separator: typeof nameSeparators[number] };
export type MovementNamingPreferences = Record<NamingKind, NameSettings>;
type LegacyNaming = { fields?: string[]; customNames?: boolean; naming?: Partial<MovementNamingPreferences> };
export const fieldsFor = (kind: NamingKind): readonly NameField[] => kind === "Ingreso" ? incomeNameFields : expenseNameFields;

export function normalizeNaming(data: LegacyNaming): MovementNamingPreferences {
  const normalize = (kind: NamingKind): NameSettings => {
    const saved = data.naming?.[kind];
    const source = Array.isArray(saved?.fields) ? saved.fields : Array.isArray(data.fields) ? data.fields : ["Fecha", "Monto"];
    // Preserve order of legacy selections and map equivalent fields to each operation.
    const fields = [...new Set(source.map(field => kind === "Ingreso" && field === "Categoría" ? "Tipo de ingreso" : kind === "Gasto" && field === "Tipo de ingreso" ? "Categoría" : field))].filter((field): field is NameField => fieldsFor(kind).includes(field as NameField));
    return { manual: typeof saved?.manual === "boolean" ? saved.manual : data.customNames === true, fields,
      separator: nameSeparators.includes(saved?.separator as typeof nameSeparators[number]) ? saved!.separator : " - " };
  };
  return { Ingreso: normalize("Ingreso"), Gasto: normalize("Gasto") };
}

export function reorderNameFields(fields: NameField[], source: NameField, target: NameField): NameField[] {
  if (source === target || !fields.includes(source) || !fields.includes(target)) return fields;
  const result = fields.filter(field => field !== source);
  result.splice(fields.indexOf(target), 0, source);
  return result;
}

export type MovementNameContext = { kind: NamingKind; date: string; amount: number; category?: string; incomeType?: string; merchant?: string; sequence: number };
export function buildMovementName(settings: NameSettings, context: MovementNameContext): string {
  const instant = movementInstant(context.date), validDate = Number.isFinite(instant);
  const formatted = (options: Intl.DateTimeFormatOptions) => validDate ? new Intl.DateTimeFormat("es-CR", { timeZone: "America/Costa_Rica", ...options }).format(instant) : "";
  let week = "";
  try { week = `Semana ${isoWeek(context.date).week}`; } catch { /* Incomplete date while typing. */ }
  const amount = Number.isSafeInteger(context.amount) && context.amount >= 0 ? `₡${context.amount.toLocaleString("es-CR")}` : "";
  const parts: Record<NameField, string> = {
    Fecha: formatted({ day: "2-digit", month: "2-digit", year: "numeric" }),
    Hora: formatted({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    Monto: amount, "Tipo de ingreso": context.incomeType?.trim() || "Ingreso", Categoría: context.category?.trim() || "",
    Comercio: context.merchant?.trim() || "", Semana: week,
    Número: `#${String(Number.isSafeInteger(context.sequence) && context.sequence > 0 ? context.sequence : 1).padStart(3, "0")}`,
  };
  return settings.fields.map(field => parts[field]).filter(Boolean).join(settings.separator) || amount || context.kind;
}

export function needsNameConfirmation(settings: NameSettings, entered: string, suggested: string): boolean {
  return settings.manual && (!entered.trim() || entered.trim() === suggested.trim());
}
