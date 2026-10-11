import assert from 'node:assert/strict';
import { incomeDefaults, normalizeIncomePreferences, validateIncomePreferences, normalizeIncomeMethod, incomeReceptionMethods } from '../lib/income-preferences.ts';
import { postMovement, totals } from '../lib/finance-ledger.ts';
const accounts=[{id:'a',name:'Banco',type:'Banco',balance:0,active:true},{id:'b',name:'Efectivo',type:'Efectivo',balance:0,active:true}];
assert.deepEqual(incomeDefaults(undefined,accounts),{amount:'',incomeType:'Ingreso',accountId:'a',reference:'',description:''});
const prefs={amount:'25000',incomeType:'Salario',accountId:'b',reference:'Semana',description:'Pago'};
const draft=incomeDefaults(prefs,accounts);draft.amount='5';draft.reference='';assert.equal(prefs.amount,'25000');assert.equal(prefs.reference,'Semana');
assert.equal(incomeDefaults(prefs,[accounts[0],{...accounts[1],active:false}]).accountId,'a');
assert.equal(incomeDefaults(prefs,[]).accountId,'');
assert.equal(incomeDefaults({...prefs,amount:'no'},accounts).amount,'');
assert.throws(()=>validateIncomePreferences({...prefs,amount:'0'},accounts));
assert.throws(()=>validateIncomePreferences({...prefs,accountId:'missing'},accounts));
assert.equal(validateIncomePreferences(normalizeIncomePreferences(),accounts).amount,'');
for(const paymentMethod of incomeReceptionMethods){const ledger={accounts,envelopes:[],loans:[],movements:[]};const result=postMovement(ledger,{id:paymentMethod,type:'Ingreso',accountId:'a',amount:100,name:'Prueba',date:'2026-10-10T12:00',envelopeAllocations:[],paymentMethod});assert.equal(result.movements[0].paymentMethod,paymentMethod);assert.equal(totals(result).accounts,100);assert.equal(totals(result).unassigned,100);assert.equal(ledger.accounts[0].balance,0);}
assert.throws(()=>normalizeIncomeMethod('Tarjeta'));assert.equal(normalizeIncomeMethod('').paymentMethod,undefined);
console.log('OK: optional/editable defaults, blank values, inactive account fallback, invalid values, receipt method persistence and conservation.');
