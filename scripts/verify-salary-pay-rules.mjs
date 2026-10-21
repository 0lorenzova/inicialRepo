import assert from 'node:assert/strict';
import {saveSalaryConfig,salaryPeriodForDate,salaryPeriodPresentation,saveSalaryPeriod,activateSalaryPeriod} from '../lib/salary-tracking.ts';
import {salaryProjection} from '../lib/salary-projection.ts';
import {calendarRelativeLabel} from '../lib/planning-calendar.ts';
const empty={accounts:[],envelopes:[],movements:[],loans:[]};
const base={id:'employer-a',name:'Principal',employer:'Empleador A',currency:'CRC',base:125000,frequency:'Semanal',start:'2026-01-05',employmentStart:'2026-01-05',payOffset:1,calendarMode:'iso-workdays',workDays:[1,2,3,4,5],active:true,payRule:{kind:'weekday',day:6}};
let ledger=saveSalaryConfig(empty,base,null);
const before=JSON.stringify(ledger);
let week=salaryPeriodForDate(ledger,base.id,'2026-10-14');
assert.equal(week.start,'2026-10-12');assert.equal(week.end,'2026-10-18');assert.equal(week.payDate,'2026-10-17');
assert.equal(salaryPeriodPresentation(ledger,week,'2026-10-26').tone,'neutral');
for(const [day,date] of [[1,'12'],[2,'13'],[3,'14'],[4,'15'],[5,'16'],[6,'17'],[0,'18']]){
 const d=saveSalaryConfig(empty,{...base,payRule:{kind:'weekday',day}},null);
 assert.equal(salaryPeriodForDate(d,base.id,'2026-10-14').payDate,`2026-10-${date}`);
}
for(const [rule,date] of [[{kind:'last-day'},'2026-10-18'],[{kind:'days-before',days:2},'2026-10-16']]){
 const d=saveSalaryConfig(empty,{...base,payRule:rule},null);assert.equal(salaryPeriodForDate(d,base.id,'2026-10-14').payDate,date);
}
assert.throws(()=>saveSalaryConfig(empty,{...base,payRule:{kind:'days-before',days:7}},null),/0 a 6/);
assert.throws(()=>saveSalaryConfig(empty,{...base,payRule:{kind:'weekday',day:9}},null),/lunes a domingo/);
assert.equal(JSON.stringify(ledger),before,'Queries must not persist anything');
// A new rule never leaks into previous terms (including terms without the new property).
let old=saveSalaryConfig(empty,{...base,payRule:undefined,payOffset:0},null);
const original=old.salary.configs[0];
const preserved=salaryPeriodForDate(old,base.id,'2026-10-05');
old=saveSalaryPeriod(old,preserved,null,'2026-10-26','Existing historical reference');
old=saveSalaryConfig(old,{...original,payRule:{kind:'weekday',day:1},effectiveFrom:'2026-10-19'},original);
assert.equal(salaryPeriodForDate(old,base.id,'2026-10-05').payDate,'2026-10-09');
assert.equal(salaryPeriodForDate(old,base.id,'2026-10-12').payDate,'2026-10-16');
assert.equal(salaryPeriodForDate(old,base.id,'2026-10-19').payDate,'2026-10-19');
ledger=saveSalaryConfig(ledger,{...base,id:'employer-b',name:'Segundo',employer:'Empleador B',payRule:{kind:'weekday',day:3}},null);
assert.equal(salaryPeriodForDate(ledger,'employer-a','2026-10-12').payDate,'2026-10-17');
assert.equal(salaryPeriodForDate(ledger,'employer-b','2026-10-12').payDate,'2026-10-14');
const current=ledger.salary.configs[0];
const ended=saveSalaryConfig(ledger,{...current,active:false,employmentEnd:'2026-10-11'},current);
const endedPeriod=salaryPeriodForDate(ended,base.id,'2026-10-12');assert.equal(salaryPeriodPresentation(ended,endedPeriod,'2026-10-18').estimateKnown,false);assert.equal(salaryPeriodPresentation(ended,endedPeriod,'2026-10-18').expected,0);
assert.equal(salaryProjection(ended,'2026-10-19','2026-11-30','2026-10-18',[base.id]).expected,0);
assert.throws(()=>saveSalaryConfig(ledger,{...current,employmentEnd:'2025-12-01'},current),/anterior al inicio/);
const year=salaryPeriodForDate(ledger,base.id,'2027-01-01');assert.equal(year.start,'2026-12-28');assert.equal(year.payDate,'2027-01-02');
// Explicit activation remains optional and never creates money.
const finances=JSON.stringify([ledger.accounts,ledger.envelopes,ledger.movements]);
week=salaryPeriodForDate(ledger,base.id,'2026-10-05');
const active=activateSalaryPeriod(ledger,week,'2026-10-18');
assert.equal(salaryPeriodPresentation(active,active.salary.periods[0],'2026-10-18').tone,'overdue');
assert.equal(JSON.stringify([active.accounts,active.envelopes,active.movements]),finances);
assert.equal(activateSalaryPeriod(active,week,'2026-10-18'),active);
assert.throws(()=>activateSalaryPeriod(ledger,salaryPeriodForDate(ledger,base.id,'2026-10-19'),'2026-10-18'),/semana pasada/);
assert.equal(calendarRelativeLabel('2026-10-12','2026-10-18'),'Esta semana');
assert.equal(calendarRelativeLabel('2026-10-05','2026-10-18'),'La semana pasada');
assert.equal(calendarRelativeLabel('2026-08-24','2026-10-18'),'Hace 7 semanas');
assert.equal(calendarRelativeLabel('2026-10-26','2026-10-18'),'Faltan 2 semanas');
assert.equal(calendarRelativeLabel('2027-01-01','2026-12-28'),'Esta semana');
assert.equal(calendarRelativeLabel('2027-01-04','2026-12-28'),'La próxima semana');
console.log('OK: seven weekdays, Saturday default, end/before-end rules, independent employers, historical terms preserved, employment boundaries, ISO year rollover, neutral unrecorded weeks, idempotent activation without money, relative period labels.');
