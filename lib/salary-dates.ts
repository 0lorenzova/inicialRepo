import {validMovementDate} from "./finance-ledger";

export const SALARY_TIME_ZONE = "America/Costa_Rica";
export const SALARY_NOT_FINISHED = "Este período todavía no ha finalizado. Podrás marcarlo como completamente devengado a partir del día siguiente a su fecha final.";
/** Civil dates follow the app's Costa Rica accounting zone, never UTC/device offsets. */
export function salaryLocalToday(now = new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:SALARY_TIME_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function canConfirmSalaryPeriod(end:string,today:string) {
  return validMovementDate(`${end}T12:00`)&&validMovementDate(`${today}T12:00`)&&end<today;
}
