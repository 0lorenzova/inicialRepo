import assert from 'node:assert/strict';
import {canConfirmSalaryPeriod,salaryLocalToday,SALARY_NOT_FINISHED} from '../lib/salary-dates.ts';
import {saveSalaryConfig,saveSalaryPeriod,postSalaryPayment,salaryPeriodPresentation,salaryPeriodTotals,correctSalaryPayment,deleteSalaryPeriod} from '../lib/salary-tracking.ts';
import {postMovement,totals} from '../lib/finance-ledger.ts';
import {importSalaryPeriods} from '../lib/salary-import.ts';
const empty={accounts:[{id:'a',name:'Cuenta local ficticia',type:'Banco',active:true,balance:0}],envelopes:[{id:'e',name:'Prueba',balance:0}],movements:[],loans:[]};
const cfg={id:'c',employer:'Ficticio',name:'Semanal',currency:'CRC',base:125000,frequency:'Semanal',start:'2026-10-12',payOffset:3,workDays:[1,2,3,4,5],active:true};
let d=saveSalaryConfig(empty,cfg,null);
const period={id:'p',configId:'c',frequency:'Semanal',start:'2026-10-12',end:'2026-10-16',payDate:'2026-10-19',earned:false,concepts:[{id:'base',name:'Salario',amount:125000}],notes:''};
d=saveSalaryPeriod(d,period,null,'2026-10-14','Período propuesto');
for(const day of ['2026-10-14','2026-10-16'])assert.throws(()=>saveSalaryPeriod(d,{...period,earned:true},period,day,'Confirmar antes de tiempo'),{message:SALARY_NOT_FINISHED});
assert.equal(canConfirmSalaryPeriod('2026-10-16','2026-10-16'),false);
assert.equal(canConfirmSalaryPeriod('2026-10-16','2026-10-17'),true);
assert.equal(salaryLocalToday(new Date('2026-10-17T05:59:59Z')),'2026-10-16');
assert.equal(salaryLocalToday(new Date('2026-10-17T06:00:00Z')),'2026-10-17');
assert.equal(canConfirmSalaryPeriod('2026-02-30','2026-03-02'),false);
assert.throws(()=>saveSalaryPeriod(d,{...period,workedDays:['2026-10-15']},period,'2026-10-14','Día futuro'),/no ser futuro/);
assert.throws(()=>saveSalaryPeriod(d,{...period,workedDays:['2026-10-10']},period,'2026-10-14','Fuera de período'),/dentro/);
d=saveSalaryPeriod(d,{...period,workedDays:['2026-10-12','2026-10-14']},period,'2026-10-14','Días confirmados individualmente');
assert.equal(d.salary.periods[0].earned,false);assert.equal(salaryPeriodTotals(d,d.salary.periods[0],'2026-10-14').earned,0);
const input={id:'advance',configId:'c',amount:50000,date:'2026-10-14T10:00',accountId:'a',method:'Transferencia',reference:'A1',notes:'Ficticio',applications:[{periodId:'p',conceptId:'base',amount:50000}],manual:{e:'10000'}};
assert.throws(()=>postSalaryPayment(d,input,'2026-10-14'),/Pago anticipado|devengado/);
d=postSalaryPayment(d,{...input,allowAdvance:true},'2026-10-14');
assert.equal(d.salary.periods[0].earned,false);assert.equal(d.movements.length,1);assert.equal(d.salary.payments.length,1);
assert.deepEqual(totals(d),{accounts:50000,assigned:10000,unassigned:40000});
let view=salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-14');assert.equal(view.state,'En curso');assert.equal(view.tone,'current');assert.equal(view.advances,50000);assert.equal(view.pending,0);assert.equal(view.projected,125000);
const stable=JSON.stringify(d);assert.throws(()=>postSalaryPayment(d,{...input,allowAdvance:true},'2026-10-14'),/Ya existe/);assert.equal(JSON.stringify(d),stable);
const worked=d.salary.periods[0];d=saveSalaryPeriod(d,{...worked,earned:true},worked,'2026-10-17','Semana completada');
view=salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-17');assert.equal(view.state,'Parcialmente pagado');assert.equal(view.pending,75000);assert.equal(view.advances,50000);assert.equal(view.tone,'partial');
assert.equal(salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-19').overdue,false,'Due date itself is not past due');
assert.equal(salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-20').tone,'overdue');
assert.equal(salaryPeriodPresentation(d,{...period,start:'2026-11-02',end:'2026-11-06'},'2026-10-14').tone,'neutral');
// A legacy prematurely earned flag must not make projected amounts count as debt.
assert.equal(salaryPeriodTotals(d,{...period,earned:true},'2026-10-14').earned,0);
let legacy={...d,salary:{...d.salary,periods:[{...period,earned:true}]}};
legacy=saveSalaryPeriod(legacy,{...period,earned:false},legacy.salary.periods[0],'2026-10-14','Corregir confirmación prematura');assert.equal(legacy.salary.periods[0].earned,false);assert.deepEqual(totals(legacy),totals(d));
// Past periods remain editable, and changing the future end cannot bypass devengo.
const existing=d.salary.periods[0];assert.throws(()=>saveSalaryPeriod(d,{...existing,end:'2026-11-01'},existing,'2026-10-17','Extender'),/todavía no ha finalizado/);
d=saveSalaryPeriod(d,{...existing,notes:'Nota histórica corregida'},existing,'2026-10-17','Corrección legítima');
d=postSalaryPayment(d,{...input,id:'final',amount:75000,date:'2026-10-19T09:00',reference:'A2',manual:{},applications:[{periodId:'p',conceptId:'base',amount:75000}]},'2026-10-19');
view=salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-20');assert.equal(view.tone,'paid');assert.equal(view.state,'Completamente pagado');assert.equal(view.advances,50000);assert.equal(view.paymentCount,2);
// Payment correction and deletion guards remain in place for allocated money.
assert.throws(()=>correctSalaryPayment(d,d.salary.payments[0],d.salary.payments[0],'2026-10-20','Anular',true),/asignado|asignaciones/);
assert.throws(()=>deleteSalaryPeriod(d,'p',d.salary.periods[0],'Eliminar'),/abonos/);
const ordinary=postMovement(empty,{id:'ordinary',type:'Ingreso',name:'Regalo',amount:1000,date:'2026-10-14T10:00',accountId:'a',envelopeAllocations:[]});assert.equal(ordinary.salary,undefined);assert.equal(totals(ordinary).accounts,1000);
// The importer reaches the same day-after-end domain guard before any batch is committed.
const fingerprint='a'.repeat(64),source=`xlsx:${fingerprint}:Hoja1:1`;
assert.throws(()=>importSalaryPeriods(saveSalaryConfig(empty,cfg,null),{fingerprint,warnings:[],periods:[{id:source,row:1,selected:true,start:period.start,end:period.end,payDate:period.payDate,earned:true,concepts:[{id:'c',included:true,name:'Salario',amount:'125000'}],receipts:[],warnings:[],notes:''}]},'c','2026-10-16'),/todavía no ha finalizado/);
for(const x of [d,legacy,ordinary]){const v=totals(x);assert.equal(v.accounts,v.assigned+v.unassigned);}
console.log('OK: day-after-close, Costa Rica midnight, all save/import routes, individual worked days, advance distinct from devengo, status/ribbon states/due dates, single movements, edits, ordinary incomes and money invariant.');
