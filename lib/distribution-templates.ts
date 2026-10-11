export type DistributionTemplate = {id:string;name:string;allocations:{id:string;amount:number}[]};
type Envelope = {id:string;archived?:boolean};

export function templateAllocations(template:DistributionTemplate,envelopes:Envelope[],incomeAmount:number):Record<string,string> {
  if(!Number.isSafeInteger(incomeAmount)||incomeAmount<=0)throw new Error("Indica primero el monto del ingreso.");
  if(!template.allocations.length)throw new Error("La plantilla no tiene montos para distribuir.");
  const values:Record<string,string>={};let total=0;
  for(const allocation of template.allocations){
    if(!envelopes.some(envelope=>envelope.id===allocation.id&&!envelope.archived))throw new Error("La plantilla incluye un sobre que ya no está activo. Guarda una nueva distribución.");
    if(Object.hasOwn(values,allocation.id)||!Number.isSafeInteger(allocation.amount)||allocation.amount<=0)throw new Error("La plantilla contiene montos inválidos o sobres repetidos.");
    values[allocation.id]=String(allocation.amount);total+=allocation.amount;
  }
  if(!Number.isSafeInteger(total)||total>incomeAmount)throw new Error("Los montos de la plantilla superan este ingreso. Ajusta el ingreso o utiliza otra distribución.");
  return values;
}
export function createDistributionTemplate(existing:DistributionTemplate[],name:string,allocations:DistributionTemplate["allocations"],envelopes:Envelope[],id:string):DistributionTemplate[] {
  const title=name.trim();if(!title||title.length>80)throw new Error("Escribe un nombre de hasta 80 caracteres.");
  if(existing.some(item=>item.id===id||item.name.toLocaleLowerCase("es-CR")===title.toLocaleLowerCase("es-CR")))throw new Error("Ya existe una plantilla con ese nombre.");
  const template={id,name:title,allocations:allocations.map(item=>({...item}))};
  templateAllocations(template,envelopes,Number.MAX_SAFE_INTEGER);
  return [...existing,template];
}
