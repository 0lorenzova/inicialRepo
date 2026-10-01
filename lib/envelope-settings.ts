import type { Recurrence } from "./finance-recurrence";

type EditableEnvelope = { id: string; name: string; icon: string; balance: number; archived?: boolean; goal?: number; recurrence?: Recurrence };
const editableFields = ["name", "icon", "goal", "recurrence"] as const;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const comparable = (field: typeof editableFields[number], value: unknown) => {
  if (field !== "recurrence" || !value) return value;
  const r = value as Recurrence;
  // snoozedUntil is not a form field; jsonb may also reorder object keys.
  return { amount: r.amount, frequency: r.frequency, nextDate: r.nextDate };
};

// A form edits planning fields, never the balance it saw when it opened.
export function saveEnvelopeSettings<T extends EditableEnvelope>(envelopes: T[], requested: T, original: T | null): T[] {
  if (!original) {
    if (envelopes.some(e => e.id === requested.id)) throw new Error("Este sobre ya existe. Vuelve a abrir el formulario.");
    return [...envelopes, { ...requested, balance: 0, archived: false }];
  }
  const current = envelopes.find(e => e.id === original.id);
  if (!current || current.archived) throw new Error("El sobre ya no está activo. Vuelve a la lista de sobres.");
  const patch: Partial<EditableEnvelope> = {};
  for (const field of editableFields) {
    if (same(comparable(field, requested[field]), comparable(field, original[field]))) continue;
    if (!same(comparable(field, current[field]), comparable(field, original[field]))) throw new Error("El sobre cambió mientras lo editabas. Cierra el formulario y vuelve a abrirlo.");
    Object.assign(patch, { [field]: requested[field] });
  }
  return envelopes.map(e => e.id === original.id ? { ...e, ...patch } : e);
}
