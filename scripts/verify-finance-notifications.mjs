import assert from "node:assert/strict";
import { normalizeNotificationState, notificationDetail, deriveFinanceNotifications, initializeNotifications, visibleNotifications, pendingNotificationDelivery, markNotifications, saveNotificationUpdate } from "../lib/finance-notifications.ts";
const today="2026-10-19", thresholds={green:15,yellow:8,red:5};
const movement={id:"income",type:"Ingreso",name:"Salario",date:`${today}T10:00`,amount:10000,allocations:[]};
assert.deepEqual(deriveFinanceNotifications([movement],[],today),[],"Ordinary movements never create notifications");
const base={name:"Pago",amount:100,active:true,timingEnabled:true,thresholds};
const envelope={id:"home",name:"Hogar",balance:0,goal:1000,goalDate:"2026-10-07",goalThresholds:thresholds,scheduledAmounts:[
  {...base,id:"today",deadline:today}, {...base,id:"critical",deadline:"2026-10-21"},
  {...base,id:"future",deadline:"2026-12-01"}, {...base,id:"yellow",deadline:"2026-10-26"},
  {...base,id:"paid",deadline:"2026-10-01",payment:{movementId:"p",amount:100,date:today,accountId:"a"}}]};
const seed=JSON.stringify(envelope);
const events=deriveFinanceNotifications([movement],[envelope],today);
assert.equal(events.length,4);assert.equal(events[0].tone,"purple");
assert.deepEqual(events.map(e=>e.destination.itemId),["goal","today","critical","yellow"]);
assert.equal(events[1].tone,"red");assert.equal(events[1].destination.page,"Cronograma");
assert.equal(deriveFinanceNotifications([], [{...envelope,archived:true}],today).length,0);
const defaults=normalizeNotificationState();
assert.equal(defaults.internal,true);assert.equal(defaults.sound,false);
let state=initializeNotifications(defaults,events);
assert.equal(pendingNotificationDelivery(state,events).length,4);
assert.equal(initializeNotifications(state,events),state);
state=markNotifications(state,"deliveredIds",events.map(e=>e.id));
assert.equal(pendingNotificationDelivery(state,events).length,0);
state=markNotifications(state,"readIds",[events[0].id]);assert.equal(visibleNotifications(state,events).length,4);
state=markNotifications(state,"dismissedIds",[events[0].id]);assert.equal(visibleNotifications(state,events).length,3);
const tomorrow=deriveFinanceNotifications([], [envelope],"2026-10-20");
assert.equal(pendingNotificationDelivery(state,tomorrow).length,1,"Today becomes overdue once, not a daily duplicate");
const later=deriveFinanceNotifications([], [envelope],"2026-10-21");
assert.ok(later.some(e=>e.destination.itemId==="critical"&&e.id.endsWith(":today")));
const recurrence={id:"r",name:"Ahorro",balance:0,recurrence:{amount:100,frequency:"Mensual",nextDate:today}};
assert.equal(deriveFinanceNotifications([], [recurrence],today)[0].tone,"red");
assert.equal(deriveFinanceNotifications([], [recurrence],"2026-10-20")[0].tone,"purple");
const upcomingRecurrence=deriveFinanceNotifications([], [{...recurrence,recurrence:{...recurrence.recurrence,snoozedUntil:"2026-10-26"}}],today);
assert.equal(upcomingRecurrence.length,1,"The configured recurrence creates an in-app notice within its upcoming warning window");
assert.equal(upcomingRecurrence[0].title,"Aporte próximo");
const partialContribution={id:"partial-contribution",type:"Asignación",name:"Asignación a Ahorro",date:`${today}T09:00`,amount:40,reference:`Aporte recurrente · ${today}`,allocations:[{envelopeId:"r",name:"Ahorro",amount:40}]};
const partialNotice=deriveFinanceNotifications([partialContribution],[recurrence],today);
assert.equal(partialNotice[0].amount,60,"An overdue recurring contribution notice shows only its remaining amount");
assert.equal(deriveFinanceNotifications([], [{...recurrence,recurrence:{...recurrence.recurrence,amount:-1}}],today).length,0);
assert.equal(JSON.stringify(envelope),seed);
assert.match(saveNotificationUpdate(()=>{throw new Error("storage");},s=>s),/No se pudo guardar/);
assert.equal(normalizeNotificationState({tone:"unknown"}).tone,"Suave");
console.log("OK: upcoming and overdue notifications, purple/today/critical transitions, recurrence, paid exclusion, stable IDs, read/dismiss and immutable financial data.");

assert.equal(defaults.showResponsibilityAmount,false);
assert.equal(normalizeNotificationState({showResponsibilityAmount:"true"}).showResponsibilityAmount,false);
const amountsEnabled=normalizeNotificationState({...state,showResponsibilityAmount:true});
assert.equal(normalizeNotificationState(JSON.parse(JSON.stringify(amountsEnabled))).showResponsibilityAmount,true);
assert.equal(notificationDetail(events[0],false,false),events[0].detail);
assert.match(notificationDetail(events[0],true,false),/Importe pendiente:/);
assert.ok(notificationDetail(events[0],true,false).includes(new Intl.NumberFormat("es-CR",{style:"currency",currency:"CRC",maximumFractionDigits:0}).format(events[0].amount)));
assert.equal(notificationDetail(events[0],true,true),"Los detalles están ocultos por privacidad.");
assert.equal(notificationDetail(events[0],false,true),notificationDetail(events[0],true,true));
const covered=deriveFinanceNotifications([], [{...envelope,balance:999999}],today);
assert.equal(covered[0].amount,events[0].amount,"Notification amount is obligation amount, not envelope balance or coverage shortfall");
assert.deepEqual(covered.map(event=>event.id),events.map(event=>event.id));
assert.equal(JSON.stringify(envelope),seed);
console.log("OK: amounts hidden by default, preference persistence, global privacy precedence, obligation amount independent of coverage and unchanged notification IDs.");

const loans=[
  {id:"today-loan",sourceId:"home",sourceName:"Hogar",targetId:"food",targetName:"Comida",amount:5000,outstanding:3000,status:"Parcial",date:"2026-10-01",dueDate:today},
  {id:"overdue-loan",sourceId:"food",sourceName:"Comida",targetId:"home",targetName:"Hogar",amount:9000,outstanding:9000,status:"Pendiente",date:"2026-10-01",dueDate:"2026-10-17"},
  {id:"future-loan",sourceId:"home",sourceName:"Hogar",targetId:"food",targetName:"Comida",amount:1000,outstanding:1000,status:"Pendiente",date:"2026-10-01",dueDate:"2026-10-20"},
  {id:"closed-loan",sourceId:"home",sourceName:"Hogar",targetId:"food",targetName:"Comida",amount:1000,outstanding:0,status:"Devuelto",date:"2026-10-01",dueDate:"2026-10-17"},
  {id:"undated-loan",sourceId:"home",sourceName:"Hogar",targetId:"food",targetName:"Comida",amount:1000,outstanding:1000,status:"Pendiente",date:"2026-10-01"},
  {id:"invalid-loan",sourceId:"home",sourceName:"Hogar",targetId:"food",targetName:"Comida",amount:1000,outstanding:1000,status:"Pendiente",date:"2026-10-01",dueDate:"2026-02-30"},
];
const loansSeed=JSON.stringify(loans);
const loanEvents=deriveFinanceNotifications([],[],today,loans);
assert.equal(loanEvents.length,2,"Only outstanding loans due today or earlier alert");
assert.deepEqual(loanEvents.map(event=>event.id),[
  "loan:overdue-loan:2026-10-17:overdue",
  "loan:today-loan:2026-10-19:today",
]);
assert.equal(loanEvents[0].tone,"purple");
assert.equal(loanEvents[0].destination.page,"Préstamos");
assert.match(loanEvents[0].detail,/Hogar debe devolver a Comida/);
assert.equal(loanEvents[0].amount,9000,"Optional amount is the outstanding responsibility");
assert.equal(loanEvents[1].tone,"red");
assert.equal(loanEvents[1].title,"Devolución de préstamo vence hoy");
assert.equal(notificationDetail(loanEvents[1],true,true),"Los detalles están ocultos por privacidad.");
assert.equal(JSON.stringify(loans),loansSeed,"Deriving notifications never mutates loan records");
const overdueTomorrow=deriveFinanceNotifications([],[],"2026-10-20",loans);
assert.ok(overdueTomorrow.some(event=>event.id==="loan:today-loan:2026-10-19:overdue"),"Due-today transitions to one overdue alert the next day");
const overdueLater=deriveFinanceNotifications([],[],"2026-10-21",loans);
assert.ok(overdueLater.some(event=>event.id==="loan:today-loan:2026-10-19:overdue"),"An overdue loan keeps the same event ID instead of generating daily duplicates");
const pendingLoans=pendingNotificationDelivery(markNotifications(initializeNotifications(defaults,loanEvents),"deliveredIds",loanEvents.map(event=>event.id)),overdueTomorrow);
assert.equal(pendingLoans.filter(event=>event.id.includes("today-loan")).length,1,"The due-today loan transitions once into its overdue stage");
assert.equal(pendingLoans.length,2,"The other new alert is for the separate loan that reaches its due date tomorrow");
console.log("OK: due-loan notices include due-today/overdue only, skip settled/undated/future/invalid loans, respect privacy and preserve immutable ledger data.");
