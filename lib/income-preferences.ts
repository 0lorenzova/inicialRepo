import type { Account } from "./finance-ledger";

export type IncomePreferences = { amount:string; incomeType:string; accountId:string; reference:string; description:string };
export const incomeReceptionMethods = ["Efectivo", "Transferencia", "SINPE Móvil", "Otro"] as const;
export function normalizeIncomeMethod(value?:string) {
  const method=value?.trim()||undefined;
  if(method&&!incomeReceptionMethods.some(item=>item===method))throw new Error("Selecciona un medio de recepción válido.");
  return { paymentMethod:method };
}
export function normalizeIncomePreferences(value?:Partial<IncomePreferences>|null):IncomePreferences {
  const text=(value:unknown)=>typeof value==="string"?value:"";
  return {amount:text(value?.amount),incomeType:text(value?.incomeType),accountId:text(value?.accountId),reference:text(value?.reference),description:text(value?.description)};
}
export function validateIncomePreferences(value:IncomePreferences,accounts:Account[]) {
  if(value.amount.trim()&&(!Number.isSafeInteger(Number(value.amount))||Number(value.amount)<=0))throw new Error("El monto sugerido debe ser entero y mayor que cero, o dejarse vacío.");
  if(value.accountId&&!accounts.some(account=>account.id===value.accountId&&account.active))throw new Error("Selecciona una cuenta activa o elimina la cuenta predeterminada.");
  return {...value};
}
export function incomeDefaults(value:Partial<IncomePreferences>|undefined,accounts:Account[]):IncomePreferences {
  const preferences=normalizeIncomePreferences(value);
  return {...preferences,amount:Number.isSafeInteger(Number(preferences.amount))&&Number(preferences.amount)>0?preferences.amount:"",incomeType:preferences.incomeType||"Ingreso",accountId:accounts.find(account=>account.active&&account.id===preferences.accountId)?.id??accounts.find(account=>account.active)?.id??""};
}
