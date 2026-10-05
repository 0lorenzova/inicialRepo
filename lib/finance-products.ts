import type { LedgerMovement } from "./finance-ledger";
import { filterHistory, monthRange } from "./finance-history";
export type TrackedProduct = { id: string; name: string; icon: string; tracking: boolean };
export type ProductEnvelope = { id: string; name: string; archived?: boolean; products?: TrackedProduct[] };
export type PurchaseProduct = { name: string; amount: number; quantity?: number; notes?: string; envelopeId?: string; productId?: string };

export function saveTrackedProduct<T extends ProductEnvelope>(envelopes:T[], envelopeId:string, product:TrackedProduct):T[] {
  if (!product.id || !product.name.trim()) throw new Error("Escribe el nombre del producto.");
  const envelope=envelopes.find(e=>e.id===envelopeId&&!e.archived);
  if (!envelope) throw new Error("El sobre ya no está activo.");
  if (envelope.products?.some(p=>p.id!==product.id&&p.name.trim().toLocaleLowerCase()===product.name.trim().toLocaleLowerCase())) throw new Error("Ya existe un producto con ese nombre en este sobre.");
  const updated={...product,name:product.name.trim(),icon:product.icon.trim()||"📦"};
  return envelopes.map(e=>e.id===envelopeId?{...e,products:e.products?.some(p=>p.id===product.id)?e.products.map(p=>p.id===product.id?updated:p):[...(e.products??[]),updated]}:e);
}

export function validatePurchaseProducts(products:PurchaseProduct[], allocations:{id:string;amount:number}[], envelopes:ProductEnvelope[]):void {
  const assigned=new Map(allocations.map(a=>[a.id,a.amount]));
  const used=new Map<string,number>();
  for(const product of products) {
    if((product.amount > 0 || product.productId) && !product.name.trim()) throw new Error("Escribe el nombre de cada producto o retíralo del gasto.");
    if(product.quantity!==undefined&&(!Number.isFinite(product.quantity)||product.quantity<=0)) throw new Error("La cantidad del producto debe ser mayor que cero.");
    if(product.productId&&!product.envelopeId) throw new Error("Selecciona el sobre al que pertenece el producto.");
    if(product.envelopeId) {
      if(!assigned.has(product.envelopeId)) throw new Error("El producto debe pertenecer a uno de los sobres asignados a este gasto.");
      if(product.productId&&!envelopes.find(e=>e.id===product.envelopeId)?.products?.some(p=>p.id===product.productId)) throw new Error("El producto seleccionado ya no existe en ese sobre.");
      used.set(product.envelopeId,(used.get(product.envelopeId)??0)+product.amount);
    }
  }
  for(const [id,total] of used) if(total>assigned.get(id)!) throw new Error("Los productos de un sobre no pueden superar el monto asignado a ese sobre en el gasto.");
}

export function productReport(movements:LedgerMovement[],envelopeId:string,month:string) {
  const expenses=filterHistory(movements,{type:"Gasto",envelopeId,...monthRange(month)});
  const spent=expenses.reduce((sum,m)=>sum+m.allocations.filter(a=>a.envelopeId===envelopeId).reduce((s,a)=>s+a.amount,0),0);
  const rows=new Map<string,{id:string;name:string;amount:number;movementIds:Set<string>;purchases:{movementId:string;date:string;amount:number;quantity?:number;notes?:string}[]}>();
  for(const movement of expenses) for(const product of movement.products??[]) {
    // Unlinked legacy purchases are not attributed by guesswork to several envelopes.
    if(product.envelopeId!==envelopeId) continue;
    const id=product.productId??`name:${product.name.toLocaleLowerCase()}`;
    const row=rows.get(id)??{id,name:product.name,amount:0,movementIds:new Set<string>(),purchases:[]};
    row.amount+=product.amount;row.movementIds.add(movement.id);
    row.purchases.push({movementId:movement.id,date:movement.date,amount:product.amount,quantity:product.quantity,notes:product.notes});rows.set(id,row);
  }
  const products=[...rows.values()].map(({movementIds,...row})=>({...row,count:movementIds.size,percentage:spent?row.amount/spent*100:0})).sort((a,b)=>b.amount-a.amount);
  const identified=products.reduce((sum,p)=>sum+p.amount,0);
  return {spent,identified,withoutProduct:spent-identified,products};
}
