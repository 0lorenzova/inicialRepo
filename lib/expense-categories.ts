export type ExpenseCategory = { id: string; name: string; archived: boolean; envelopeIds?: string[] };
export const defaultExpenseCategories: ExpenseCategory[] = ["Alimentación", "Transporte", "Hogar", "Servicios", "Salud", "Educación", "Entretenimiento", "Ropa", "Mascotas", "Otros"].map((name, index) => ({ id: `category-${index}`, name, archived: false }));
export const expenseCategories = (saved?: ExpenseCategory[]) => saved ?? defaultExpenseCategories;
const normalized = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function saveExpenseCategory(current: ExpenseCategory[], requested: ExpenseCategory, original: ExpenseCategory | null): ExpenseCategory[] {
  const name = requested.name.trim().replace(/\s+/g, " ");
  if (!requested.id || !name || name.length > 60) throw new Error("Escribe un nombre de categoría de 1 a 60 caracteres.");
  if (normalized(name) === "sin categoria") throw new Error("«Sin categoría» ya está disponible para gastos sin clasificar.");
  const existing = current.find(category => category.id === requested.id);
  if (original ? !existing || existing.id !== original.id || existing.name !== original.name || existing.archived !== original.archived : existing) throw new Error("La categoría cambió. Vuelve a abrirla antes de guardar.");
  if (current.some(category => category.id !== requested.id && normalized(category.name) === normalized(name))) throw new Error("Ya existe una categoría con ese nombre. Puedes restaurarla si está archivada.");
  const saved: ExpenseCategory = { id: requested.id, name, archived: Boolean(requested.archived), ...(existing?.envelopeIds ? { envelopeIds: existing.envelopeIds } : {}) };
  return original ? current.map(category => category.id === requested.id ? saved : category) : [...current, saved];
}

// Associations change future choices only; movement snapshots retain their ID and name.
export function associateExpenseCategory(current: ExpenseCategory[], categoryId: string, envelopeId: string): ExpenseCategory[] {
  if (!envelopeId || !current.some(category=>category.id===categoryId&&!category.archived)) throw new Error("Selecciona una categoría activa.");
  return current.map(category=>category.id===categoryId?{...category,envelopeIds:[...new Set([...(category.envelopeIds??[]),envelopeId])]}:category);
}

export function categoriesForEnvelope(categories: ExpenseCategory[], envelopeId: string) {
  return categories.filter(category=>category.envelopeIds?.includes(envelopeId));
}
