import assert from 'node:assert/strict';
import {saveSalaryConfig,saveSalaryPeriod,salaryPeriodForDate,adjacentSalaryPeriod,salaryPeriodPresentation,postSalaryPayment,salaryExpected,salaryAdjustments,salaryPeriodApplications} from '../lib/salary-tracking.ts';
const empty={accounts:[{id:'a',name:'Prueba local',type:'Banco',active:true,balance:0}],envelopes:[],movements:[],loans:[]};
const config={id:'c',employer:'Prueba',name:'Salario',currency:'CRC',base:125000,frequency:'Semanal',calendarMode:'iso-workdays',start:'2026-10-12',payOffset:1,workDays:[1,2,3,4,5],active:true,catalog:[{id:'extra',name:'Transporte',sign:'add',usualAmount:5000,recurring:true,active:true}]};
const ledger=saveSalaryConfig(empty,config,null),snapshot=JSON.stringify(ledger),today='2026-10-17';
const current=salaryPeriodForDate(ledger,'c',today),next=adjacentSalaryPeriod(ledger,current,1);
assert.equal(next.start,'2026-10-19');assert.equal(next.end,'2026-10-25');assert.equal(next.payDate,'2026-10-24');
assert.equal(next.earned,false);assert.deepEqual(next.scheduledWorkDays,config.workDays);assert.equal(next.concepts.length,1);assert.equal(salaryAdjustments(ledger,next)[0].name,'Transporte');assert.equal(salaryExpected(ledger,next),130000);
assert.equal(JSON.stringify(ledger),snapshot,'Opening, navigating or canceling must not persist a projection');
const saved=saveSalaryPeriod(ledger,next,null,today,'Proyección opcional');
for(const key of ['accounts','envelopes','movements','loans'])assert.deepEqual(saved[key],ledger[key]);
assert.equal(saved.salary.payments.length,0);assert.equal(saved.salary.periods.length,1);
assert.equal(salaryPeriodForDate(saved,'c',next.start).id,next.id);
assert.throws(()=>saveSalaryPeriod(saved,next,null,today,'Doble pulsación'),/cambió/);
assert.throws(()=>saveSalaryPeriod(saved,{...next,id:'duplicate'},null,today,'Solapado'),/superpone/);
assert.equal(salaryPeriodPresentation(saved,next,today).tone,'neutral');
const withPayment=postSalaryPayment(saved,{id:'p',configId:'c',date:today+'T10:00',amount:130000,accountId:'a',method:'Efectivo',reference:'prueba',notes:'',applications:salaryPeriodApplications(saved,'c',next.id,130000)},today);
assert.equal(withPayment.salary.periods.length,1);assert.equal(withPayment.movements.length,1);assert.equal(withPayment.accounts[0].balance,130000);
assert.equal(withPayment.salary.periods[0].earned,false);
const adjusted={...next,concepts:next.concepts.map(c=>({...c,amount:c.amount+1000}))};
const corrected=saveSalaryPeriod(saved,adjusted,next,today,'Ajustar conceptos');assert.equal(corrected.salary.periods.length,1);assert.equal(corrected.movements.length,0);
assert.equal(JSON.stringify(ledger),snapshot);
for(const frequency of ['Quincenal','Mensual','Otra']){
 const c={...config,frequency,intervalDays:10};const d=saveSalaryConfig(empty,c,null);const p=salaryPeriodForDate(d,'c',today);const following=adjacentSalaryPeriod(d,p,1);assert.ok(following.start>p.end);assert.equal(d.salary.periods.length,0);
}
console.log('OK: optional projection preview/cancel without writes; dates, concepts and workdays; explicit save without money; duplicate/overlap guards; later receipt reuses projection; corrections; all frequencies.');
