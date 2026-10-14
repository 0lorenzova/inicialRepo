// Deliberately limited to the reviewed salary layout. Files stay in the browser;
// formulas, macros, links and budget sheets are never executed or imported.
export type SalaryImportConcept = {id:string;name:string;amount:string;included:boolean};
export type SalaryImportReceipt = {id:string;column:string;date:string;movementId:string;mode:"review"|"existing"|"historical";amounts:Record<string,string>};
export type SalaryImportPeriod = {id:string;row:number;selected:boolean;start:string;end:string;payDate:string;earned:boolean;notes:string;concepts:SalaryImportConcept[];receipts:SalaryImportReceipt[];warnings:string[]};
export type SalaryImportDraft = {fingerprint:string;filename:string;periods:SalaryImportPeriod[];warnings:string[]};
export type SalarySheetCell = {value:string;numeric:boolean;formula:boolean};
export type SalarySheet = Record<string,SalarySheetCell>;
const LIMIT=16*1024*1024;
function requireValue(condition:unknown,message:string):asserts condition {if(!condition)throw new Error(message);}

export function excelCivilDate(value:string,date1904=false) {
  if(/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value))return value.slice(0,10);
  if(!/^\d+(\.\d+)?$/.test(value))return "";
  const serial=Math.floor(Number(value));
  if(serial<0||serial>2958465||(!date1904&&serial===60))return "";
  const time=Date.UTC(date1904?1904:1899,date1904?0:11,date1904?1:31)+(serial-(!date1904&&serial>60?1:0))*86400000;
  const date=new Date(time);
  return Number.isFinite(time)&&date.getUTCFullYear()<=9999?date.toISOString().slice(0,10):"";
}

export function salarySheetPreview(sheet:SalarySheet,fingerprint:string,filename:string,date1904=false):SalaryImportDraft {
  const cell=(col:string,row:number)=>sheet[`${col}${row}`];
  const value=(col:string,row:number)=>cell(col,row)?.value??"";
  const date=(col:string,row:number)=>excelCivilDate(value(col,row),date1904);
  const rows=[...new Set(Object.keys(sheet).map(ref=>Number(ref.match(/\d+$/)?.[0])))].filter(Number.isFinite).sort((a,b)=>a-b);
  const starts=rows.filter(row=>date("F",row)&&date("G",row)&&value("H",row).trim());
  requireValue(starts.length>0,"No se reconoció el formato salarial: fechas en F/G y conceptos en H de Hoja1.");
  requireValue(starts.length<=120,"Importa como máximo 120 períodos por archivo.");
  const periods=starts.map((row,index)=>{
    const last=(starts[index+1]??Math.max(...rows)+1)-1;
    const id=`xlsx:${fingerprint}:Hoja1:${row}`,warnings:string[]=[];
    const conceptRows=rows.filter(r=>r>=row&&r<=last&&value("H",r).trim()&&!/^(total|pendiente|abono|devengado|concepto)/i.test(value("H",r).trim()));
    const concepts=conceptRows.map(r=>{const c=cell("I",r);if(!c?.value)warnings.push(`I${r}: importe devengado vacío; no equivale a cero.`);if(c?.formula)warnings.push(`I${r}: resultado guardado de una fórmula; comprueba su vigencia.`);return {id:`${id}:H${r}`,name:value("H",r).trim(),amount:c?.value??"",included:true};});
    const receipts=["J","K","L","M"].flatMap(column=>{
      const amounts=Object.fromEntries(conceptRows.flatMap((r,i)=>{const c=cell(column,r);if(c?.formula)warnings.push(`${column}${r}: abono calculado; revisar el resultado guardado.`);return c&&(c.value!==""&&c.value!=="0"||c.formula&&c.value==="")?[[concepts[i].id,c.value]]:[];}));
      if(!Object.keys(amounts).length)return [];
      const paymentDate=date(column,row-1);
      if(!paymentDate)warnings.push(`${column}${row-1}: falta la fecha real del abono.`);
      return [{id:`${id}:payment:${column}`,column,date:paymentDate,movementId:"",mode:"review" as const,amounts}];
    });
    for(const [i,r] of conceptRows.entries()){
      const saved=value("N",r),earned=Number(concepts[i].amount),received=receipts.reduce((sum,p)=>sum+Number(p.amounts[concepts[i].id]??0),0);
      if(saved!==""&&concepts[i].amount!==""&&Number.isFinite(Number(saved))&&Number(saved)!==earned-received)warnings.push(`N${r}: el pendiente del archivo no coincide con devengado menos abonos. Se recalculará al confirmar.`);
    }
    return {id,row,selected:false,start:date("F",row),end:date("G",row),payDate:"",earned:false,concepts,receipts,warnings,notes:rows.filter(r=>r>row&&r<=last&&!date("F",r)).map(r=>value("F",r).trim()).filter(Boolean).join("\n")};
  });
  return {fingerprint,filename,periods,warnings:["Solo se revisa Hoja1. Las hojas de presupuestos y proyecciones quedan excluidas.","Ningún período ni abono está confirmado. Revisa fechas e importes; las celdas vacías no se sustituyen por cero."]};
}

// Read the central directory, not file-name guesses or local-header scanning.
export async function salaryZipEntries(buffer:ArrayBuffer):Promise<Map<string,Uint8Array>> {
  requireValue(buffer.byteLength<=8*1024*1024&&buffer.byteLength>=22,"Usa un archivo XLSX válido de hasta 8 MB.");
  const view=new DataView(buffer),bytes=new Uint8Array(buffer),decoder=new TextDecoder();
  let end=-1;
  for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===buffer.byteLength){end=i;break;}
  requireValue(end>=0,"El archivo no es un XLSX válido o está protegido.");
  const count=view.getUint16(end+10,true),directory=view.getUint32(end+16,true),size=view.getUint32(end+12,true);
  requireValue(view.getUint16(end+4,true)===0&&view.getUint16(end+6,true)===0&&count<2000&&directory+size<=end,"Archivo XLSX no compatible.");
  const output=new Map<string,Uint8Array>();let offset=directory,total=0;
  for(let i=0;i<count;i++){
    requireValue(offset+46<=end&&view.getUint32(offset,true)===0x02014b50,"Directorio XLSX incompleto.");
    const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),compressed=view.getUint32(offset+20,true),uncompressed=view.getUint32(offset+24,true),nameLength=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true),local=view.getUint32(offset+42,true);
    requireValue(offset+46+nameLength+extra+comment<=end,"Archivo XLSX incompleto.");
    const name=decoder.decode(bytes.subarray(offset+46,offset+46+nameLength));offset+=46+nameLength+extra+comment;
    if(!/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(name))continue;
    total+=uncompressed;
    requireValue(!(flags&1)&&[0,8].includes(method)&&uncompressed<=LIMIT&&total<=LIMIT&&!output.has(name),"Archivo protegido, duplicado o demasiado grande para revisar.");
    requireValue(local+30<=directory&&view.getUint32(local,true)===0x04034b50,"Contenido XLSX inválido.");
    const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
    requireValue(start+compressed<=directory,"Contenido XLSX truncado.");
    const packed=bytes.slice(start,start+compressed);
    if(method===0){requireValue(packed.length===uncompressed,"Tamaño XLSX incorrecto.");output.set(name,packed);continue;}
    const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader=stream.getReader(),chunks:Uint8Array[]=[];let length=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;requireValue(length<=uncompressed&&length<=LIMIT,"Contenido expandido excede el límite.");chunks.push(value);}}finally{await reader.cancel();}
    requireValue(length===uncompressed,"Contenido XLSX incompleto.");const data=new Uint8Array(length);let at=0;for(const chunk of chunks){data.set(chunk,at);at+=chunk.length;}output.set(name,data);
  }
  return output;
}

export async function readSalaryXlsx(file:File):Promise<SalaryImportDraft> {
  requireValue(/\.xlsx$/i.test(file.name)&&file.size<=8*1024*1024,"Selecciona un archivo .xlsx de hasta 8 MB.");
  const buffer=await file.arrayBuffer(),entries=await salaryZipEntries(buffer);
  const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buffer)),v=>v.toString(16).padStart(2,"0")).join("");
  const xml=(path:string,optional=false)=>{
    const content=entries.get(path);requireValue(content||optional,`No se encontró ${path} en el archivo.`);
    const source=content?new TextDecoder().decode(content):"<empty/>";
    requireValue(!/<!DOCTYPE|<!ENTITY/i.test(source),"El archivo contiene declaraciones XML no compatibles.");
    const document=new DOMParser().parseFromString(source,"application/xml");requireValue(!document.querySelector("parsererror"),"El archivo contiene XML inválido.");return document;
  };
  const elements=(node:Document|Element,name:string)=>Array.from(node.getElementsByTagNameNS("*",name));
  const workbook=xml("xl/workbook.xml"),sheet=elements(workbook,"sheet").find(s=>s.getAttribute("name")?.trim().toLowerCase()==="hoja1");
  requireValue(sheet,"El archivo no contiene Hoja1 con el seguimiento salarial esperado.");
  const relation=sheet.getAttribute("r:id")??sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id");
  const rel=elements(xml("xl/_rels/workbook.xml.rels"),"Relationship").find(r=>r.getAttribute("Id")===relation);
  const target=rel?.getAttribute("Target")??"";requireValue(rel?.getAttribute("TargetMode")!=="External"&&!target.includes(".."),"La hoja debe estar dentro del archivo.");
  const path=target.startsWith("/")?target.slice(1):`xl/${target.replace(/^\.\//,"")}`;
  requireValue(/^xl\/worksheets\/[^/]+\.xml$/.test(path),"La ruta de Hoja1 no es compatible.");
  const strings=elements(xml("xl/sharedStrings.xml",true),"si").map(si=>elements(si,"t").map(t=>t.textContent??"").join(""));
  const cells=elements(xml(path),"c");requireValue(cells.length<=100000,"La hoja contiene demasiadas celdas.");
  const result:SalarySheet={};
  for(const c of cells){const ref=c.getAttribute("r")??"";if(!/^[F-N]\d{1,5}$/.test(ref))continue;const type=c.getAttribute("t"),raw=elements(c,"v")[0]?.textContent??"";
    const value=type==="s"?(strings[Number(raw)]??""):type==="inlineStr"?elements(c,"t").map(t=>t.textContent??"").join(""):raw;
    result[ref]={value,numeric:!type||type==="n",formula:elements(c,"f").length>0};
  }
  return salarySheetPreview(result,fingerprint,file.name,elements(workbook,"workbookPr")[0]?.getAttribute("date1904")==="1"||elements(workbook,"workbookPr")[0]?.getAttribute("date1904")==="true");
}
