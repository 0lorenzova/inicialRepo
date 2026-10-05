import type { Account } from "./finance-ledger";

export function addFinanceAccount(accounts: Account[], input: { id: string; name: string; type: string }): Account[] {
  const name = input.name.trim();
  if (!name) throw new Error("Escribe el nombre de la cuenta.");
  if (!input.id || accounts.some(account => account.id === input.id)) throw new Error("La cuenta ya existe. Revisa la lista.");
  if (!["Banco", "Efectivo", "Tarjeta", "Otro"].includes(input.type)) throw new Error("Selecciona un tipo de cuenta válido.");
  return [...accounts, { ...input, name, balance: 0, active: true }];
}
