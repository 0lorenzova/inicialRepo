export const paymentMethods = ["Efectivo", "Tarjeta", "Transferencia", "SINPE Móvil", "Otro"] as const;

export function normalizeExpenseDetails(method?: string, tags: string[] = []) {
  const paymentMethod = method?.trim() || undefined;
  if (paymentMethod && !paymentMethods.some(value=>value===paymentMethod)) throw new Error("Selecciona un método de pago válido.");
  const normalized: string[] = [];
  for (const value of tags) {
    const tag = value.trim().replace(/^#+/, "").trim();
    if (!tag) continue;
    if (tag.length > 40) throw new Error("Cada etiqueta puede tener hasta 40 caracteres.");
    if (!normalized.some(existing=>existing.toLocaleLowerCase("es-CR")===tag.toLocaleLowerCase("es-CR"))) normalized.push(tag);
  }
  if (normalized.length>12) throw new Error("Puedes añadir hasta 12 etiquetas por gasto.");
  return { paymentMethod, tags: normalized.length ? normalized : undefined };
}
