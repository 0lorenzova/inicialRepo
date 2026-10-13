import type { ExpenseCategory } from "./expense-categories";

export type CategoryDrafts = Record<string, Record<string, string>>;
export type ExpenseClassification = { envelopeId?: string; categoryId?: string; name: string; amount: number };

export function classifyExpense(amount:number, allocations:{id:string;amount:number}[], drafts:CategoryDrafts, categories:ExpenseCategory[]):ExpenseClassification[] {
  if(!Number.isSafeInteger(amount)||amount<=0)throw new Error("Escribe un monto entero mayor que cero.");
  if(!allocations.length)return [{name:"Sin categoría",amount}];
  if(allocations.reduce((sum,item)=>sum+item.amount,0)!==amount)throw new Error("Reparte exactamente el total del gasto entre los sobres seleccionados, o utiliza dinero sin asignar.");
  const result:ExpenseClassification[]=[];
  for(const allocation of allocations) {
    const selected=Object.entries(drafts[allocation.id]??{});
    if(!selected.length) {result.push({envelopeId:allocation.id,name:"Sin categoría",amount:allocation.amount});continue;}
    let total=0;
    for(const [categoryId,value] of selected) {
      const category=categories.find(item=>item.id===categoryId&&!item.archived&&item.envelopeIds?.includes(allocation.id));
      if(!category)throw new Error("Una categoría dejó de estar disponible para su sobre. Revisa la clasificación.");
      const part=selected.length===1?allocation.amount:Number(value);
      if(!Number.isSafeInteger(part)||part<=0)throw new Error("Indica un importe entero mayor que cero para cada categoría seleccionada.");
      result.push({envelopeId:allocation.id,categoryId,name:category.name,amount:part});total+=part;
    }
    if(total!==allocation.amount)throw new Error("La suma de categorías debe coincidir con el importe de su sobre.");
  }
  validateExpenseClassification(result,amount,allocations);
  return result;
}

export function validateExpenseClassification(items:ExpenseClassification[], amount:number, allocations:{id:string;amount:number}[]) {
  const seen=new Set<string>();
  const sums=new Map<string,number>();
  for(const item of items) {
    const key=JSON.stringify([item.envelopeId??null,item.categoryId??null]);
    if(seen.has(key)||!item.name.trim()||!Number.isSafeInteger(item.amount)||item.amount<=0)throw new Error("Hay categorías duplicadas o importes inválidos en el gasto.");
    seen.add(key);sums.set(item.envelopeId??"",(sums.get(item.envelopeId??"")??0)+item.amount);
  }
  const expected=new Map(allocations.filter(item=>item.amount>0).map(item=>[item.id,item.amount]));
  const unassigned=amount-allocations.reduce((sum,item)=>sum+item.amount,0);
  if(unassigned>0)expected.set("",unassigned);
  if(items.reduce((sum,item)=>sum+item.amount,0)!==amount||sums.size!==expected.size||[...expected].some(([id,total])=>sums.get(id)!==total))throw new Error("La clasificación debe coincidir exactamente con el gasto y sus sobres.");
}
