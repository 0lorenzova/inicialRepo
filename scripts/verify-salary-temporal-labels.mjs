import assert from 'node:assert/strict';
import {salaryTemporalLabel,salaryPeriodForDate,shiftSalaryDate} from '../lib/salary-tracking.ts';
import {salaryViewerDay} from '../lib/salary-dates.ts';
const config={id:'c',employer:'Ficticio',name:'Salario',currency:'CRC',base:125000,frequency:'Semanal',start:'2026-10-12',payOffset:0,workDays:[1,2,3,4,5],active:true};
const ledger={accounts:[],envelopes:[],movements:[],loans:[],salary:{configs:[config],periods:[],payments:[],audit:[]}};
const original=JSON.stringify(ledger),today='2026-10-15';
for(const [offset,expected] of [[0,'Hoy'],[-1,'La semana pasada'],[-2,'Hace 2 semanas'],[-3,'Hace 3 semanas'],[-1000,'Hace 1000 semanas'],[1,'La próxima semana'],[2,'Dentro de 2 semanas'],[1000,'Dentro de 1000 semanas']]){
 const date=shiftSalaryDate(today,offset*7);assert.equal(salaryTemporalLabel(ledger,salaryPeriodForDate(ledger,'c',date),today),expected);
}
assert.equal(salaryTemporalLabel(ledger,salaryPeriodForDate(ledger,'c','2026-12-21'),'2027-01-04'),'Hace 2 semanas');
assert.equal(salaryTemporalLabel(ledger,salaryPeriodForDate(ledger,'c','2027-01-04'),'2026-12-28'),'La próxima semana');
for(const [frequency,start,date,expected] of [['Quincenal','2026-10-01','2026-09-16','La quincena pasada'],['Mensual','2026-01-31','2026-02-28','El mes pasado'],['Otra','2026-10-01','2026-09-11','Hace 2 períodos']]){
 const l={...ledger,salary:{...ledger.salary,configs:[{...config,frequency,start,intervalDays:10}]}};
 const reference=frequency==='Mensual'?'2026-04-01':'2026-10-05';assert.equal(salaryTemporalLabel(l,salaryPeriodForDate(l,'c',date),reference),expected);
}
const midnight=new Date('2027-01-04T05:30:00Z');assert.equal(salaryViewerDay(midnight,'America/Costa_Rica'),'2027-01-03');assert.equal(salaryViewerDay(midnight,'Europe/Madrid'),'2027-01-04');
assert.equal(salaryTemporalLabel(ledger,salaryPeriodForDate(ledger,'c','2026-12-28'),salaryViewerDay(midnight,'America/Costa_Rica')),'Hoy');
assert.equal(salaryTemporalLabel(ledger,salaryPeriodForDate(ledger,'c','2026-12-28'),salaryViewerDay(midnight,'Europe/Madrid')),'La semana pasada');
assert.equal(JSON.stringify(ledger),original);
console.log('OK: local-zone orientation, current/past/future periods, December/January, monthly anchors, quincenal/custom labels and no writes.');
