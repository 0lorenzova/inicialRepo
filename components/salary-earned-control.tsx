"use client";
import {useEffect,useState} from "react";
import {canConfirmSalaryPeriod,salaryLocalToday,SALARY_NOT_FINISHED} from "@/lib/salary-dates";
export function useSalaryToday(initial:string) {
  const [today,setToday]=useState(initial);
  useEffect(()=>{const update=()=>setToday(salaryLocalToday());const timer=window.setInterval(update,30000);window.addEventListener("focus",update);return()=>{window.clearInterval(timer);window.removeEventListener("focus",update);};},[]);
  return today;
}
export function SalaryEarnedControl({end,today,checked,onChange}:{end:string;today:string;checked:boolean;onChange:(checked:boolean)=>void}) {
  const allowed=canConfirmSalaryPeriod(end,today);
  return <><label className="check-label"><input type="checkbox" checked={checked} disabled={!allowed&&!checked} onChange={e=>{if(!e.target.checked||allowed)onChange(e.target.checked);}}/>Confirmo que este período ya fue trabajado (devengado)</label>{!allowed&&<p role="note">{SALARY_NOT_FINISHED}{checked?" Desmarca la confirmación anterior para corregirla.":""}</p>}<small>Fechas en hora de Costa Rica. Confirmación desde el día siguiente al cierre; los días individuales no confirman todo el período.</small></>;
}
