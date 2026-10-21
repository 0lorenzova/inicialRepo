import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activateSalaryPeriod,hasUnlinkedSalaryIncome,postHistoricalSalaryPayment,postSalaryPayment,recordStandardSalaryPayment,salaryAdjustments,salaryBatchCandidates,salaryExpected,salaryPeriodApplications,salaryPeriodForDate,salaryPeriodPresentation,salaryReceiptDefaults,salaryState,saveSalaryAdjustments,saveSalaryConfig,saveSalaryPeriod,standardSalaryAmount,standardSalaryReceipt} from '../lib/salary-tracking.ts';
import {distributeSavedIncome} from '../lib/distribute-saved-income.ts';
import {postDistributedIncome} from '../lib/income-distribution.ts';
import {totals} from '../lib/finance-ledger.ts';

const today='2026-10-19';
const base={accounts:[{id:'a',name:'Cuenta principal',type:'Banco',active:true,balance:0}],envelopes:[{id:'home',name:'Hogar',balance:0},{id:'savings',name:'Ahorro',balance:0}],movements:[],loans:[]};
const config={id:'employer',employer:'Empleador ficticio',name:'Pago semanal',currency:'CRC',base:100000,frequency:'Semanal',start:'2026-10-05',payOffset:1,calendarMode:'iso-workdays',workDays:[1,2,3,4,5],active:true};
const configured=saveSalaryConfig(base,config,null);
const periodFor=(ledger,date)=>salaryPeriodForDate(ledger,'employer',date);
const register=(ledger,period,id,date,accountId='a')=>recordStandardSalaryPayment(ledger,period,{id,date,accountId,method:'Transferencia',today});

// 1, 6, 9, 11: historical exact receipt, different from Saturday, paid badge, and unrelated weeks/saldos.
const past=periodFor(configured,'2026-10-08');
assert.equal(past.start,'2026-10-05');assert.equal(past.payDate,'2026-10-10');
assert.equal(standardSalaryReceipt(configured,past,today),null,'An unrecorded past week has no estimated quick-receipt amount');
assert.equal(standardSalaryAmount(configured,past,today),null);
const confirmedPastLedger=saveSalaryPeriod(configured,{...past,earned:true},null,today,'Importe histórico real confirmado');
const confirmedPast=salaryState(confirmedPastLedger).periods[0];
assert.equal(standardSalaryReceipt(confirmedPastLedger,confirmedPast,today)?.amount,100000,'A saved historical obligation keeps its confirmed amount');
let pastPaid=register(confirmedPastLedger,confirmedPast,'past-exact','2026-10-09T09:15');
assert.equal(pastPaid.movements[0].date,'2026-10-09T09:15');
assert.equal(pastPaid.salary.payments[0].applications[0].periodId,past.id);
assert.equal(salaryPeriodPresentation(pastPaid,past,today).fullyPaid,true);
assert.equal(salaryPeriodPresentation(pastPaid,past,today).tone,'paid');
assert.equal(totals(pastPaid).accounts,100000);
assert.equal(salaryState(pastPaid).payments.filter(payment=>payment.applications.some(item=>item.periodId===past.id)).length,1);
assert.equal(salaryState(pastPaid).payments.some(payment=>payment.applications.some(item=>item.periodId===periodFor(pastPaid,'2026-10-12').id)),false);
assert.equal(totals(pastPaid).assigned,0);
assert.deepEqual(salaryReceiptDefaults(pastPaid,'employer'),{accountId:'a',method:'Transferencia'});
const savedPast=salaryState(pastPaid).periods.find(item=>item.id===past.id);
assert.equal(standardSalaryAmount(pastPaid,savedPast,today),null,'A second click no longer sees an unpaid standard week');
assert.throws(()=>register(pastPaid,savedPast,'duplicate','2026-10-09T09:15'),/Esta semana necesita revisión/);

// 2: current week uses the actual current date and confirms the click as receipt.
const current=periodFor(configured,today);
let currentPaid=register(configured,current,'current-week','2026-10-19T10:20');
assert.equal(currentPaid.movements[0].date,'2026-10-19T10:20');
assert.equal(currentPaid.movements[0].amount,100000);
assert.equal(salaryPeriodPresentation(currentPaid,current,today).fullyPaid,true);
assert.equal(salaryState(currentPaid).periods.find(item=>item.id===current.id).earned,false,'A current week is not incorrectly marked as completed work');

// 3: a future week is an advance received today; a future effective date is rejected.
const future=periodFor(configured,'2026-10-29');
const advance=register(configured,future,'future-advance','2026-10-19T11:05');
assert.equal(advance.movements[0].date,'2026-10-19T11:05');
assert.equal(salaryPeriodPresentation(advance,future,today).fullyPaid,true);
assert.throws(()=>register(configured,future,'future-date','2026-10-29T12:00'),'A future week cannot create a future-dated receipt');

// 4, 5: honor the saved/default account; when ambiguous, expose the known amount and ask for an account.
const twoAccounts={...confirmedPastLedger,accounts:[...confirmedPastLedger.accounts,{id:'b',name:'Otra cuenta',type:'Banco',active:true,balance:0}]};
assert.equal(standardSalaryReceipt(twoAccounts,confirmedPast,today)?.accountId,undefined,'No unconfigured account is guessed when there are several active accounts');
assert.equal(standardSalaryReceipt(twoAccounts,confirmedPast,today,'b')?.accountId,'b');
assert.equal(standardSalaryAmount({...confirmedPastLedger,accounts:[]},confirmedPast,today),100000);
assert.equal(standardSalaryReceipt({...confirmedPastLedger,accounts:[]},confirmedPast,today),null,'A missing account blocks one-click posting');

// 7: exact historical dates create a financial movement. Unknown/approximate dates stay explicitly historical.
const actualPast={...past,concepts:past.concepts.map(concept=>({...concept,amount:100000}))};
let unknownPrepared=activateSalaryPeriod(configured,actualPast,today);
const unknownApps=salaryPeriodApplications(unknownPrepared,'employer',past.id,100000);
const unknown=postHistoricalSalaryPayment(unknownPrepared,{id:'unknown-date',configId:'employer',date:today,source:'salary-quick:unknown-date',notes:'',applications:unknownApps,dateAccuracy:'unknown'},today);
assert.equal(unknown.movements.length,0);
assert.equal(unknown.salary.payments[0].dateAccuracy,'unknown');
assert.equal(salaryPeriodPresentation(unknown,past,today).tone,'paid');
let approximatePrepared=activateSalaryPeriod(configured,actualPast,today);
const approximateApps=salaryPeriodApplications(approximatePrepared,'employer',past.id,100000);
const approximate=postHistoricalSalaryPayment(approximatePrepared,{id:'approximate-date',configId:'employer',date:'2026-10-08',source:'salary-quick:approximate-date',notes:'',applications:approximateApps,dateAccuracy:'approximate'},today);
assert.equal(approximate.movements.length,0);
assert.equal(approximate.salary.payments[0].date,'2026-10-08');
assert.equal(approximate.salary.payments[0].dateAccuracy,'approximate');

// 8: saved and validated positive extras join the standard amount; estimates and deductions require detail.
const extraPeriod=periodFor(configured,'2026-10-08');
let withExtra=saveSalaryAdjustments(configured,extraPeriod,[{id:'bike',name:'Moto alquiler',amount:15000,sign:'add',status:'confirmed'}],salaryAdjustments(configured,extraPeriod));
const confirmedExtraLedger=saveSalaryPeriod(withExtra,{...extraPeriod,earned:true},null,today,'Importe histórico y extra reales confirmados');
const confirmedExtra=salaryState(confirmedExtraLedger).periods.find(item=>item.id===extraPeriod.id);
assert.equal(standardSalaryAmount(confirmedExtraLedger,confirmedExtra,today),115000);
const extraPaid=register(confirmedExtraLedger,confirmedExtra,'with-extra','2026-10-09T09:15');
assert.equal(extraPaid.movements[0].amount,115000);
assert.equal(extraPaid.salary.payments[0].applications.reduce((sum,item)=>sum+item.amount,0),115000);
const estimated=saveSalaryAdjustments(configured,extraPeriod,[{id:'estimated',name:'Extra pendiente',amount:15000,sign:'add',status:'estimated'}],salaryAdjustments(configured,extraPeriod));
assert.equal(standardSalaryAmount(estimated,extraPeriod,today),null);
const deduction=saveSalaryAdjustments(configured,extraPeriod,[{id:'deduction',name:'Deducción',amount:10000,sign:'subtract',status:'confirmed'}],salaryAdjustments(configured,extraPeriod));
assert.equal(standardSalaryAmount(deduction,extraPeriod,today),null);

// 9: partial payments and possible unlinked salary movements require the detailed reconciliation path.
const partialPeriod={...past,earned:true};
const partialBase=saveSalaryPeriod(configured,partialPeriod,null,today,'Semana ficticia confirmada');
const partialApps=salaryPeriodApplications(partialBase,'employer',partialPeriod.id,40000);
const partial=postSalaryPayment(partialBase,{id:'partial',configId:'employer',date:'2026-10-09T08:00',amount:40000,accountId:'a',method:'Transferencia',reference:'',notes:'',applications:partialApps},today);
assert.equal(standardSalaryAmount(partial,partialPeriod,today),null);
const unlinked=postDistributedIncome(configured,{id:'unlinked-salary',type:'Ingreso',amount:100000,accountId:'a',date:'2026-10-09T08:00',name:'Salario Empleador ficticio',category:'Salario'},today,{},[]);
assert.equal(hasUnlinkedSalaryIncome(unlinked,past,100000,'a'),true);

// 12, 13: consecutive weeks can be independent payments or one deposit shared across their applications.
let weekOne=periodFor(configured,'2026-10-08'),weekTwo=periodFor(configured,'2026-10-15');
let confirmedWeeks=configured;
for(const week of [weekOne,weekTwo])confirmedWeeks=saveSalaryPeriod(confirmedWeeks,{...week,earned:true},null,today,'Semana ficticia confirmada');
weekOne=salaryState(confirmedWeeks).periods.find(item=>item.id===weekOne.id);
weekTwo=salaryState(confirmedWeeks).periods.find(item=>item.id===weekTwo.id);
assert.equal(salaryBatchCandidates(confirmedWeeks,'employer','2026-10-05','2026-10-18',today).length,2);
let independent=register(confirmedWeeks,weekOne,'independent-one','2026-10-19T12:00');
independent=register(independent,weekTwo,'independent-two','2026-10-19T12:10');
assert.equal(independent.movements.filter(item=>item.type==='Ingreso').length,2);
assert.equal(totals(independent).accounts,200000);
const sharedApplications=[...salaryPeriodApplications(confirmedWeeks,'employer',weekOne.id,100000),...salaryPeriodApplications(confirmedWeeks,'employer',weekTwo.id,100000)];
const shared=postSalaryPayment(confirmedWeeks,{id:'one-deposit-two-weeks',configId:'employer',date:'2026-10-19T12:00',amount:200000,accountId:'a',method:'Transferencia',reference:'',notes:'',applications:sharedApplications},today);
assert.equal(shared.movements.filter(item=>item.type==='Ingreso').length,1);
assert.equal(shared.salary.payments.length,1);
assert.equal(shared.salary.payments[0].applications.length,2);
assert.equal(totals(shared).accounts,200000,'A shared deposit increments the account once');
assert.equal(salaryPeriodPresentation(shared,weekOne,today).fullyPaid,true);
assert.equal(salaryPeriodPresentation(shared,weekTwo,today).fullyPaid,true);

// 14: post-registration envelope allocation reuses the saved income without adding it again.
const distribution=distributeSavedIncome(currentPaid,{incomeId:'salary-income:current-week',id:'allocation',date:'2026-10-19T12:00',today,manual:{home:'30000'},selections:[]});
assert.equal(distribution.movements.filter(item=>item.type==='Ingreso').length,1);
assert.equal(distribution.salary.payments.length,1);
assert.equal(totals(distribution).accounts,100000);
assert.equal(totals(distribution).assigned,30000);

// 10, 15, 16: visible copy, detailed exceptions, post-save distribution, preserved extras, and responsive layout hooks.
const component=readFileSync(new URL('../components/salary-tracking.tsx',import.meta.url),'utf8');
const receiptDialog=readFileSync(new URL('../components/salary-receipt-dialog.tsx',import.meta.url),'utf8');
const receiveDialog=readFileSync(new URL('../components/salary-receive-dialog.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../components/salary-tracking.module.css',import.meta.url),'utf8');
assert.match(component,/Salario completo recibido/);
assert.match(component,/✓ Pagada/);
assert.match(component,/Ver pago/);
assert.match(component,/Registro detallado/);
assert.match(component,/onSave=\{onSaveConfirmed\} onConfirmSave=\{onConfirmSave\}/);
assert.match(component,/Fecha aproximada/);assert.match(component,/Fecha desconocida/);
assert.match(component,/AccountSelector label="Cuenta donde recibiste el salario"/);
assert.match(component,/<SalaryAdjustments ledger=\{ledger\} period=\{p\}/,'The rendered week continues to use its extra-concept editor');
assert.match(receiptDialog,/¿Deseas distribuir el ingreso entre sobres\?/);
assert.match(receiptDialog,/Continuar sin asignar/);
assert.match(css,/@media\(max-width:600px\)/);
assert.match(css,/\.quickReceipt input\{[^}]*width:22px/);
assert.match(component,/date:""/,'Historical grouped payments start without an invented date');
assert.match(receiveDialog,/presentation\?\.historicalEmpty\|\|reviewingPeriod/,'The historical checkbox stays visible while its review form is open');
assert.match(receiveDialog,/checked=\{Boolean\(presentation\?\.confirmed\|\|reviewingPeriod\)\}/,'The inline checkbox reflects the open historical review');
assert.equal(salaryExpected(withExtra,extraPeriod),115000,'The existing adjustment amount remains attached to the period');

console.log('OK: standard past/current/future receipts, actual dates, account defaults and missing-account fallback, approximate/unknown history, duplicate prevention, confirmed extras, partial/ambiguous reconciliation, independent/shared multi-week deposits, one-time envelope distribution, paid-state/actions, and mobile/desktop layout hooks.');
