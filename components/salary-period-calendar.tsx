"use client";
import {isoWeek} from "@/lib/iso-week";
import {salaryPeriodForDate,salaryPeriodLabel,salaryPeriodPresentation,shiftSalaryDate,type SalaryConfig,type SalaryLedger,type SalaryPeriod} from "@/lib/salary-tracking";
import styles from "./salary-receive-dialog.module.css";

export function SalaryPeriodCalendar({ledger,config,selected,today,month,onMonth,onSelect}:{ledger:SalaryLedger;config:SalaryConfig;selected:SalaryPeriod|null;today:string;month:string;onMonth:(month:string)=>void;onSelect:(date:string)=>void}) {
  const first=new Date(`${month}-01T12:00:00Z`),offset=(first.getUTCDay()+6)%7;
  const last=new Date(first);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
  const days=Array.from({length:Math.ceil((offset+last.getUTCDate())/7)*7},(_,i)=>{try{return shiftSalaryDate(`${month}-01`,i-offset);}catch{return null;}});
  const shiftMonth=(amount:number)=>{try{return shiftSalaryDate(`${month}-01`,amount,"months").slice(0,7);}catch{return null;}};
  const entries=days.map(date=>{try {if(!date)return null;const period=salaryPeriodForDate(ledger,config.id,date);return {date,period,view:salaryPeriodPresentation(ledger,period,today)};}catch{return null;}});
  const weeks=Array.from({length:days.length/7},(_,i)=>entries.slice(i*7,i*7+7));
  const description=(entry:NonNullable<typeof entries[number]>)=>`${salaryPeriodLabel(entry.period,config)}: ${entry.view.state}${entry.view.overdueLabel?` · ${entry.view.overdueLabel}`:""} · ${entry.view.workState}`;
  return <div className={styles.calendar} aria-label="Seleccionar período salarial">
    <div className={styles.calendarHeading}>
      {([-12,-1] as const).map(amount=><button key={amount} type="button" className="secondary" aria-label={amount===-12?"Año anterior":"Mes anterior"} disabled={!shiftMonth(amount)} onClick={()=>onMonth(shiftMonth(amount)!)}>{amount===-12?"«":"‹"}</button>)}
      <label>Mes y año<input aria-label="Mes y año del almanaque salarial" type="month" min="0001-01" max="9999-12" value={month} onChange={e=>{if(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value))onMonth(e.target.value);}}/></label>
      {([1,12] as const).map(amount=><button key={amount} type="button" className="secondary" aria-label={amount===12?"Año siguiente":"Mes siguiente"} disabled={!shiftMonth(amount)} onClick={()=>onMonth(shiftMonth(amount)!)}>{amount===12?"»":"›"}</button>)}
    </div>
    <div className={styles.calendarGrid}><span aria-hidden="true">Semana</span>{["L","M","X","J","V","S","D"].map((label,i)=><span key={i} aria-hidden="true">{label}</span>)}
      {weeks.map((week,row)=>{
        const firstEntry=week.find(Boolean),iso=firstEntry?isoWeek(firstEntry.date):null;
        const periods=[...new Map(week.filter(e=>e!==null).map(e=>[e.period.id,e])).values()];
        return <div className={styles.calendarWeek} key={row}>
          <div className={styles.weekNumber}>{iso&&<span>{iso.week} · {iso.year}</span>}
            <div className={styles.statusDots}>{periods.map(entry=><button key={entry.period.id} type="button" className={styles.periodStatus} aria-label={`Seleccionar ${description(entry)}`} title={description(entry)} aria-pressed={entry.period.id===selected?.id} onClick={()=>onSelect(entry.date)}><span className={`${styles.statusDot} ${styles[entry.view.tone]}`} aria-hidden="true"/></button>)}</div>
          </div>
          {week.map((entry,i)=>entry?<button type="button" key={i} className={styles.calendarDay} data-today={entry.date===today} aria-current={entry.date===today?"date":undefined} data-outside={entry.date.slice(0,7)!==month} data-selected={entry.period.id===selected?.id} aria-pressed={entry.period.id===selected?.id} aria-label={`${entry.date} · ${description(entry)}`} title={description(entry)} onClick={()=>onSelect(entry.date)}>{Number(entry.date.slice(-2))}</button>:<span key={i}/>)}
        </div>;
      })}
    </div>
    <div className={styles.calendarLegend}>{[["paid","Pagado"],["neutral","Proyectado / en curso"],["partial","Parcial"],["overdue","Devengado pendiente / vencido"]].map(([tone,label])=><span key={tone}><i className={`${styles.statusDot} ${styles[tone]}`} aria-hidden="true"/>{label}</span>)}</div><small>Selecciona una fecha o el indicador de la semana. Navegar no registra pagos.</small>
  </div>;
}
