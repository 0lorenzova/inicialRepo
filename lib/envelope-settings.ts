import { validateRecurrence, type Recurrence } from "./finance-recurrence";
import { validateGoalSettings, type GoalSettings, type GoalThresholds } from "./envelope-goals";

type EditableEnvelope = { id: string; name: string; icon: string; balance: number; archived?: boolean; recurrence?: Recurrence } & GoalSettings;
const goalFields = ["goalName", "goal", "goalEnabled", "goalDate", "goalTimingEnabled", "goalProgressVisible", "goalDisplay", "goalThresholds", "recurrence"] as const;
const editableFields = ["name", "icon", ...goalFields] as const;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const comparable = (field: typeof editableFields[number], value: unknown) => {
  if (!value) return value;
  if (field === "goalThresholds") {
    const thresholds = value as GoalThresholds;
    return { green: thresholds.green, yellow: thresholds.yellow, red: thresholds.red };
  }
  if (field !== "recurrence") return value;
  const r = value as Recurrence;
  // snoozedUntil is not a form field; jsonb may also reorder object keys.
  return { amount: r.amount, frequency: r.frequency, nextDate: r.nextDate, intervalDays: r.frequency === "Personalizado" ? r.intervalDays : undefined };
};

// A form edits planning fields, never the balance it saw when it opened.
export function saveEnvelopeSettings<T extends EditableEnvelope>(envelopes: T[], requested: T, original: T | null): T[] {
  if (!original) {
    if (envelopes.some(e => e.id === requested.id)) throw new Error("Este sobre ya existe. Vuelve a abrir el formulario.");
    validateGoalSettings(requested);
    if (requested.recurrence) validateRecurrence(requested.recurrence);
    return [...envelopes, { ...requested, balance: 0, archived: false }];
  }
  return saveFields(envelopes, requested, original, editableFields);
}

// Goal settings cannot accidentally rename the envelope or change its icon.
export function saveGoalSettings<T extends EditableEnvelope>(envelopes: T[], requested: T, original: T): T[] {
  return saveFields(envelopes, requested, original, goalFields);
}

function saveFields<T extends EditableEnvelope>(envelopes: T[], requested: T, original: T, fields: readonly typeof editableFields[number][]): T[] {
  const current = envelopes.find(e => e.id === original.id);
  if (!current || current.archived) throw new Error("El sobre ya no está activo. Vuelve a la lista de sobres.");
  const patch: Partial<EditableEnvelope> = {};
  for (const field of fields) {
    if (same(comparable(field, requested[field]), comparable(field, original[field]))) continue;
    if (!same(comparable(field, current[field]), comparable(field, original[field]))) throw new Error("El sobre cambió mientras lo editabas. Cierra el formulario y vuelve a abrirlo.");
    Object.assign(patch, { [field]: requested[field] });
  }
  const updated = { ...current, ...patch };
  if (goalFields.some(field => field !== "recurrence" && Object.prototype.hasOwnProperty.call(patch, field))) validateGoalSettings(updated);
  if (Object.prototype.hasOwnProperty.call(patch, "recurrence") && updated.recurrence) validateRecurrence(updated.recurrence);
  return envelopes.map(e => e.id === original.id ? updated : e);
}
