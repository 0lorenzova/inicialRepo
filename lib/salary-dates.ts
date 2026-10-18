import {validMovementDate} from "./finance-ledger";

export const SALARY_TIME_ZONE = "America/Costa_Rica";
export const salaryWeekdays=["Dm","Ln","Mt","Mc","Jv","Vi","Sb"] as const;
/** Use the period's saved schedule; never borrow today's employer configuration. */
export function salaryWorkEnd(period:{start:string;end:string;scheduledWorkDays?:number[]}) {
  if(!period.scheduledWorkDays?.length)return period.end;
  const date=new Date(`${period.end}T12:00:00Z`),start=Date.parse(`${period.start}T12:00:00Z`);
  for(let back=0;back<7&&date.getTime()>=start;back++,date.setUTCDate(date.getUTCDate()-1)) {
    if(period.scheduledWorkDays.includes(date.getUTCDay()))return date.toISOString().slice(0,10);
  }
  return period.end;
}
/** Civil date labels must not shift a day with the device's time zone. */
export function salaryDateLabel(value:string,year=true) {
  const civil=value.slice(0,10),date=new Date(`${civil}T12:00:00Z`);
  if(!validMovementDate(`${civil}T12:00`))return "Fecha no válida";
  return `${salaryWeekdays[date.getUTCDay()]} ${new Intl.DateTimeFormat("es-CR",{timeZone:"UTC",day:"numeric",month:"short",...(year?{year:"numeric" as const}:{})}).format(date)}`;
}
export function salaryWorkSchedule(period:{start:string;end:string;scheduledWorkDays?:number[]}) {
  const days=period.scheduledWorkDays;
  if(!days?.length)return "";
  const dates:string[]=[];
  for(let date=new Date(`${period.start}T12:00:00Z`);date.getTime()<=Date.parse(`${period.end}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+1)) {
    if(days.includes(date.getUTCDay()))dates.push(date.toISOString().slice(0,10));
    if(dates.length>7) return `Días: ${[1,2,3,4,5,6,0].filter(d=>days.includes(d)).map(d=>salaryWeekdays[d]).join(" · ")}`;
  }
  if(!dates.length)return "Sin días laborales configurados en este intervalo";
  const consecutive=dates.every((date,i)=>i===0||Date.parse(date)-Date.parse(dates[i-1])===86400000);
  return consecutive?`Trabajo previsto: ${salaryDateLabel(dates[0],false)}${dates.length>1?` — ${salaryDateLabel(dates.at(-1)!,false)}`:""}`:`Trabajo previsto: ${dates.map(d=>salaryDateLabel(d,false)).join(" · ")}`;
}
export const SALARY_NOT_FINISHED = "Este período todavía no ha finalizado. Podrás marcarlo como completamente devengado a partir del día siguiente al último día laboral del período.";
/** Civil dates follow the app's Costa Rica accounting zone, never UTC/device offsets. */
export function salaryLocalToday(now = new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:SALARY_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function canConfirmSalaryPeriod(period:string|{start:string;end:string;scheduledWorkDays?:number[]},today:string) {
  const end=typeof period==="string"?period:salaryWorkEnd(period);
  return validMovementDate(`${end}T12:00`)&&validMovementDate(`${today}T12:00`)&&end<today;
}
/** Orientation only: local civil day in the viewer's zone, without changing accounting dates. */
export function salaryViewerDay(now=new Date(),timeZone?:string) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
