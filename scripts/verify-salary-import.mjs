import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {salarySheetPreview,salaryZipEntries,excelCivilDate} from '../lib/salary-xlsx.ts';
import {importSalaryPeriods,importPreviewTotals} from '../lib/salary-import.ts';
import {saveSalaryConfig,salaryPeriodTotals,salaryPaymentValid,unlinkSalaryPayment,postHistoricalSalaryPayment} from '../lib/salary-tracking.ts';
import {postMovement,totals} from '../lib/finance-ledger.ts';
const raw={F31:'2025-11-01',G31:'2025-11-07',H31:'Salario',I31:'1200',J31:'100',H32:'Moto',I32:'200',J32:'100',J30:'2025-11-08',N31:'999',F37:'2025-11-08',G37:'2025-11-14',H37:'Salario',H38:'Moto'};
const sheet=Object.fromEntries(Object.entries(raw).map(([k,value])=>[k,{value,numeric:/^\d+$/.test(value),formula:false}]));
const hash='a'.repeat(64),today='2026-10-14';
const draft=salarySheetPreview(sheet,hash,'fixture.xlsx');
assert.equal(draft.periods.length,2);assert.ok(draft.periods.every(p=>!p.selected&&!p.earned));
assert.equal(draft.periods[0].receipts.length,1);assert.equal(draft.periods[0].receipts[0].date,'2025-11-08');
assert.equal(draft.periods[1].concepts[0].amount,'');assert.equal(importPreviewTotals(draft.periods[1]),null);
assert.ok(draft.periods[0].warnings.some(w=>w.startsWith('N31')));
assert.deepEqual(importPreviewTotals(draft.periods[0]),{earned:1400,received:200,pending:1200});
assert.equal(excelCivilDate('61'),'1900-03-01');assert.equal(excelCivilDate('60'),'');assert.equal(excelCivilDate('0',true),'1904-01-01');
const config={id:'c',employer:'Prueba importación',name:'Salario',currency:'CRC',base:1200,frequency:'Semanal',start:'2025-11-01',payOffset:1,workDays:[1],active:true};
let ledger=saveSalaryConfig({accounts:[{id:'a',name:'Banco ficticio',type:'Banco',balance:0,active:true}],envelopes:[],movements:[],loans:[]},config,null);
ledger={...ledger,...postMovement(ledger,{id:'income',type:'Ingreso',name:'Abono de prueba',accountId:'a',amount:200,date:'2025-11-08T12:00',envelopeAllocations:[]})};
const original=JSON.stringify(ledger);
let reviewed=structuredClone(draft);reviewed.periods[0]={...reviewed.periods[0],selected:true,earned:true,payDate:'2025-11-08'};
assert.throws(()=>importSalaryPeriods(ledger,reviewed,'c',today),/ingreso existente/);
reviewed.periods[0].receipts[0]={...reviewed.periods[0].receipts[0],mode:'existing',movementId:'income'};
const imported=importSalaryPeriods(ledger,reviewed,'c',today);
assert.deepEqual(totals(imported),totals(ledger));assert.deepEqual(imported.movements,ledger.movements);
assert.equal(imported.salary.periods.length,1);assert.equal(imported.salary.payments.length,1);
assert.equal(salaryPeriodTotals(imported,imported.salary.periods[0]).pending,1200);
assert.equal(JSON.stringify(ledger),original);
assert.throws(()=>importSalaryPeriods(imported,reviewed,'c',today),/ya fue importado/);
for(const change of [p=>p.concepts[0].amount='',p=>p.concepts[0].amount='1.5',p=>p.receipts[0].date='2025-11-09',p=>p.receipts[0].amounts[p.concepts[0].id]='201']){
  const bad=structuredClone(reviewed);change(bad.periods[0]);assert.throws(()=>importSalaryPeriods(ledger,bad,'c',today));assert.equal(JSON.stringify(ledger),original);
}
const unconfirmed=structuredClone(reviewed);unconfirmed.periods[0].earned=false;
const unconfirmedImport=importSalaryPeriods(ledger,unconfirmed,'c',today);
assert.equal(unconfirmedImport.salary.periods[0].earned,false);
assert.equal(salaryPeriodTotals(unconfirmedImport,unconfirmedImport.salary.periods[0]).received,200);
assert.equal(salaryPeriodTotals(unconfirmedImport,unconfirmedImport.salary.periods[0]).earned,0);
assert.deepEqual(unconfirmedImport.movements,ledger.movements);
const historical=structuredClone(reviewed);
historical.periods[0].receipts[0].mode='historical';historical.periods[0].receipts[0].movementId='';
const history=importSalaryPeriods(ledger,historical,'c',today);
assert.equal(history.salary.payments[0].historical.source,`${historical.periods[0].id}:J`);
assert.equal(history.salary.payments[0].date,'2025-11-08');
assert.equal(history.salary.payments[0].movementId,'');assert.equal(history.salary.payments[0].accountId,'');
assert.deepEqual(history.accounts,ledger.accounts);assert.deepEqual(history.envelopes,ledger.envelopes);assert.deepEqual(history.movements,ledger.movements);
assert.equal(salaryPeriodTotals(history,history.salary.periods[0]).pending,1200);
const restored=JSON.parse(JSON.stringify(history));assert.equal(salaryPaymentValid(restored,restored.salary.payments[0]),true);
assert.equal(salaryPeriodTotals(restored,restored.salary.periods[0]).received,200);
const voided=unlinkSalaryPayment(restored,restored.salary.payments[0].id,'Importe histórico equivocado');
assert.equal(salaryPeriodTotals(voided,voided.salary.periods[0]).pending,1400);assert.deepEqual(totals(voided),totals(ledger));assert.equal(voided.salary.payments.length,1);
assert.throws(()=>importSalaryPeriods(history,historical,'c',today),/ya fue importado/);
for(const change of [p=>p.receipts[0].date='',p=>p.receipts[0].date='2028-01-01',p=>p.receipts[0].movementId='income',p=>p.receipts[0].amounts[p.concepts[0].id]='2000']) {
 const bad=structuredClone(historical);change(bad.periods[0]);assert.throws(()=>importSalaryPeriods(ledger,bad,'c',today));assert.equal(JSON.stringify(ledger),original);
}
const historicPayment=history.salary.payments[0];
assert.throws(()=>postHistoricalSalaryPayment(history,{id:'repeat',configId:'c',date:historicPayment.date,source:historicPayment.historical.source,notes:'',applications:historicPayment.applications},today),/ya fue registrado/);
const mixed=structuredClone(reviewed);mixed.periods[0].receipts.push({...historical.periods[0].receipts[0],id:'extra',column:'K',amounts:{[mixed.periods[0].concepts[0].id]:'100'}});
const combined=importSalaryPeriods(ledger,mixed,'c',today);
assert.equal(combined.salary.payments.length,2);assert.equal(salaryPeriodTotals(combined,combined.salary.periods[0]).received,300);assert.deepEqual(totals(combined),totals(ledger));assert.deepEqual(combined.movements,ledger.movements);
const formula=salarySheetPreview({...sheet,K31:{value:'',numeric:true,formula:true}},hash,'fixture.xlsx');
assert.equal(formula.periods[0].receipts.length,2,'Formula without cached result must not disappear');
assert.equal(importPreviewTotals(formula.periods[0]),null);
// A small synthetic OOXML fixture; no personal workbook data is used.
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function zip(files){const locals=[],centers=[];let offset=0;for(const [name,content] of Object.entries(files)){const data=Buffer.from(content),packed=deflateRawSync(data),n=Buffer.from(name),crc=crc32(data),local=Buffer.alloc(30),central=Buffer.alloc(46);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(n.length,26);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(n.length,28);central.writeUInt32LE(offset,42);locals.push(local,n,packed);centers.push(central,n);offset+=local.length+n.length+packed.length;}const directory=Buffer.concat(centers),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(centers.length/2,8);end.writeUInt16LE(centers.length/2,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,directory,end]);}
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const xmlCells=Object.entries(raw).map(([ref,v])=>`<c r="${ref}" t="inlineStr"><is><t>${v}</t></is></c>`).join('');
const files={'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Hoja1" sheetId="1" r:id="rId1"/></sheets></workbook>`,'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>','xl/worksheets/sheet1.xml':`<worksheet xmlns="${ns}"><sheetData><row>${xmlCells}</row></sheetData></worksheet>`};
const fixture=zip(files),buf=fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength);
const unzipped=await salaryZipEntries(buf);assert.equal(new TextDecoder().decode(unzipped.get('xl/workbook.xml')),files['xl/workbook.xml']);
await assert.rejects(()=>salaryZipEntries(new ArrayBuffer(23)));
const damaged=Buffer.from(fixture);damaged.writeUInt32LE(0xffffffff,damaged.length-6);await assert.rejects(()=>salaryZipEntries(damaged.buffer.slice(damaged.byteOffset,damaged.byteOffset+damaged.byteLength)));
if(process.argv.includes('--fixture')){const path=join(tmpdir(),'finanzas-salary-import-fixture.xlsx');await writeFile(path,fixture);console.log(`Fixture local: ${path}`);}
console.log('OK: historical payments without bank changes, mixed reconciliation, annulment/audit, persistence, duplicate guards; preview preserves blanks/formulas, dates, discrepancies, explicit confirmation, atomic linking without new money, duplicate protection and bounded XLSX decompression.');
