import assert from 'node:assert/strict';
import { postSalaryPayment, salaryCycleSummary, salaryDefaultCycle, salaryPeriodApplications, salaryPeriodForDate, saveSalaryConfig, saveSalaryPeriod } from '../lib/salary-tracking.ts';

const config={id:'cycle',employer:'Empleador de prueba',name:'Salario de prueba',currency:'CRC',base:100,frequency:'Semanal',start:'2025-12-29',payOffset:0,calendarMode:'iso-workdays',workDays:[1,2,3,4,5],active:true};
const account={id:'account',name:'Cuenta ficticia',type:'Banco',active:true,balance:0};
let ledger=saveSalaryConfig({accounts:[account],envelopes:[],movements:[],loans:[]},config,null);
const today='2026-02-06';
const add=(date,earned)=>{
  const period=salaryPeriodForDate(ledger,'cycle',date);
  ledger=saveSalaryPeriod(ledger,{...period,earned},null,today,earned?'Devengo ficticio confirmado':'Período ficticio sin confirmar');
  return period;
};
const crossingStart=add('2025-12-29',true);
const firstIncluded=add('2026-01-05',true);
add('2026-01-12',false);
add('2026-01-19',true);
const crossingEnd=add('2026-01-26',true);
assert.equal(crossingStart.start,'2025-12-29');
assert.equal(crossingEnd.end,'2026-02-01');
const applications=salaryPeriodApplications(ledger,'cycle',firstIncluded.id,40);
ledger=postSalaryPayment(ledger,{id:'receipt',configId:'cycle',date:`${today}T09:00`,amount:40,accountId:'account',method:'Transferencia',reference:'',notes:'',applications},today);

const summary=salaryCycleSummary(ledger,'cycle','2026-01-01','2026-01-31',today);
assert.deepEqual(summary.periods.map(item=>item.period.start),['2026-01-05','2026-01-19']);
assert.equal(summary.crossingCount,2,'Periods crossing either range boundary stay out instead of being prorated');
assert.equal(summary.unconfirmedCount,1,'Unconfirmed periods do not enter the earned total');
assert.equal(summary.earned,200);
assert.equal(summary.received,40,'Receipts are grouped by the periods they were applied to');
assert.equal(summary.pending,160);
assert.deepEqual(salaryDefaultCycle('2026-10-18'),{from:'2025-12-01',to:'2026-11-30'});
assert.deepEqual(salaryDefaultCycle('2026-12-01'),{from:'2026-12-01',to:'2027-11-30'});
assert.throws(()=>salaryCycleSummary(ledger,'cycle','2026-02-01','2026-01-31',today),/anterior o igual/);
assert.equal(salaryCycleSummary(JSON.parse(JSON.stringify(ledger)),'cycle','2026-01-01','2026-01-31',today).earned,200,'Read-only summaries survive JSON persistence');
console.log('OK: salary cycle defaults, fully contained confirmed periods, boundary exclusions, unconfirmed exclusions, period-applied receipts, pending totals, range validation and JSON round-trip.');
