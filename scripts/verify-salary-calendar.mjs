import assert from 'node:assert/strict';
import {saveSalaryConfig,saveSalaryPeriod,salaryPeriodForDate,adjacentSalaryPeriod,shiftSalaryDate,salaryPeriodPresentation,postSalaryPayment,correctSalaryPayment,salaryReceiptDefaults,salaryPaymentDuplicate,salaryPeriodPaymentLabel} from '../lib/salary-tracking.ts';
import {isoWeek} from '../lib/iso-week.ts';
import {totals} from '../lib/finance-ledger.ts';
const empty={accounts:[{id:'a',name:'Ficticia',type:'Banco',active:true,balance:0}],envelopes:[],movements:[],loans:[]};
const config={id:'c',employer:'Ficticio',name:'Salario',currency:'CRC',base:125000,frequency:'Semanal',start:'2026-10-12',payOffset:2,workDays:[1,2,3,4,5],active:true};
let d=saveSalaryConfig(empty,config,null);const original=JSON.stringify(d);
const before=salaryPeriodForDate(d,'c','1920-01-02');assert.ok(before.start<='1920-01-02'&&before.end>='1920-01-02');
const after=salaryPeriodForDate(d,'c','2400-01-02');assert.ok(after.start<='2400-01-02'&&after.end>='2400-01-02');
const p=salaryPeriodForDate(d,'c','2026-10-15');assert.equal(adjacentSalaryPeriod(d,p,-1).start,'2026-10-05');assert.equal(adjacentSalaryPeriod(d,p,1).start,'2026-10-19');assert.equal(JSON.stringify(d),original);
for(const [frequency,intervalDays] of [['Mensual',undefined],['Quincenal',undefined],['Otra',10]]){
 const cfg={...config,id:'other',name:frequency,frequency,intervalDays,start:'2026-01-31'};
 const l=saveSalaryConfig(empty,cfg,null),past=salaryPeriodForDate(l,'other','2024-02-29');
 assert.ok(past.start<='2024-02-29'&&past.end>='2024-02-29');
 assert.ok(adjacentSalaryPeriod(l,past,-1).end<past.start);assert.ok(adjacentSalaryPeriod(l,past,1).start>past.end);
 if(frequency==='Mensual'){assert.equal(past.start,'2024-02-29');assert.equal(past.end,'2024-03-30');}
}
assert.equal(shiftSalaryDate('2024-03-31',-1,'months'),'2024-02-29');assert.throws(()=>shiftSalaryDate('0001-01-01',-1),/rango/);assert.throws(()=>shiftSalaryDate('9999-12-31',1),/rango/);assert.equal(isoWeek('0001-01-01').week,1);
const shortened={...p,end:'2026-10-16'};d=saveSalaryPeriod(d,shortened,null,'2026-10-15','Período corto');assert.equal(adjacentSalaryPeriod(d,shortened,1).start,'2026-10-19','No stuck navigation on custom end');
assert.equal(salaryPeriodPresentation(d,shortened,'2026-10-15').tone,'neutral');
const receipt={id:'receipt',configId:'c',date:'2026-10-15T10:00',amount:50000,accountId:'a',method:'Efectivo',reference:'  PAGO   UNO ',notes:'',applications:[{periodId:p.id,conceptId:p.concepts[0].id,amount:50000}]};
d=postSalaryPayment(d,receipt,'2026-10-15');assert.equal(salaryPeriodPresentation(d,shortened,'2026-10-15').tone,'partial');assert.equal(d.movements.length,1);assert.equal(d.salary.periods[0].earned,false);
assert.deepEqual(salaryReceiptDefaults(JSON.parse(JSON.stringify(d))),{method:'Efectivo',accountId:'a'});
assert.equal(salaryReceiptDefaults({...d,accounts:[{...d.accounts[0],active:false}]}).accountId,'');
assert.equal(salaryPaymentDuplicate(d,{...receipt,reference:'pago uno'}),true);assert.equal(salaryPaymentDuplicate(d,{...receipt,date:'2026-10-16T10:00'}),false);
assert.throws(()=>postSalaryPayment(d,{...receipt,id:'duplicate',reference:'pago uno'},'2026-10-15'),/Ya existe un ingreso con estos mismos datos/);
const pay=d.salary.payments[0];d=correctSalaryPayment(d,pay,{...pay,amount:125000,applications:pay.applications.map(a=>({...a,amount:125000}))},'2026-10-15','Corregir importe');
let view=salaryPeriodPresentation(d,shortened,'2026-10-15');assert.equal(view.tone,'paid');assert.equal(view.state,'Completamente pagado');assert.equal(view.confirmed,false);assert.equal(salaryPeriodPaymentLabel(d,shortened),'Pago completo');assert.equal(d.movements.length,1);
const saved=d.salary.periods[0];d=saveSalaryPeriod(d,{...saved,earned:true},saved,'2026-10-17','Confirmar trabajo');assert.equal(salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-17').state,'Completamente pagado');
const full=d.salary.payments[0];d=correctSalaryPayment(d,full,full,'2026-10-17','Anular ingreso ficticio',true);
view=salaryPeriodPresentation(d,d.salary.periods[0],'2026-10-17');assert.equal(view.tone,'neutral','Earned but not due remains yellow');assert.equal(view.overdue,false);assert.equal(view.received,0);assert.equal(d.movements.length,0);
assert.equal(salaryPeriodPresentation(d,{...d.salary.periods[0],earned:false},'2026-10-17').tone,'neutral');
const v=totals(d);assert.equal(v.accounts,v.assigned+v.unassigned);
console.log('OK: unbounded historical/future navigation, monthly anchors/leap years, date bounds, shortened period navigation, shared colors, advance fully covered vs earned, corrections/annulment refresh, duplicate normalization, persisted receipt defaults and money invariant.');
