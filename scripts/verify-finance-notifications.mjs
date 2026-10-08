import assert from "node:assert/strict";
import { normalizeNotificationState, deriveFinanceNotifications, initializeNotifications, visibleNotifications, pendingNotificationDelivery, markNotifications, saveNotificationUpdate } from "../lib/finance-notifications.ts";
const today="2026-10-08", thresholds={green:15,yellow:8,red:5};
const movement={id:"income",type:"Ingreso",name:"Salario",date:`${today}T10:00`,amount:10000,allocations:[]};
assert.deepEqual(deriveFinanceNotifications([movement],[],today),[],"Ordinary movements never create notifications");
const base={name:"Pago",amount:100,active:true,timingEnabled:true,thresholds};
const envelope={id:"home",name:"Hogar",balance:0,goal:1000,goalDate:"2026-10-07",goalThresholds:thresholds,scheduledAmounts:[
 {...base,id:"today",deadline:today}, {...base,id:"critical",deadline:"2026-10-10"},
 {...base,id:"future",deadline:"2026-12-01"}, {...base,id:"yellow",deadline:"2026-10-15"},
 {...base,id:"paid",deadline:"2026-10-01",payment:{movementId:"p",amount:100,date:today,accountId:"a"}}]};
const seed=JSON.stringify(envelope);
const events=deriveFinanceNotifications([movement],[envelope],today);
assert.equal(events.length,3);assert.equal(events[0].tone,"purple");
assert.deepEqual(events.map(e=>e.destination.itemId),["goal","today","critical"]);
assert.equal(events[1].tone,"red");assert.equal(events[1].destination.page,"Cronograma");
assert.equal(deriveFinanceNotifications([], [{...envelope,archived:true}],today).length,0);
const defaults=normalizeNotificationState();
assert.equal(defaults.internal,true);assert.equal(defaults.sound,false);
let state=initializeNotifications(defaults,events);
assert.equal(pendingNotificationDelivery(state,events).length,3);
assert.equal(initializeNotifications(state,events),state);
state=markNotifications(state,"deliveredIds",events.map(e=>e.id));
assert.equal(pendingNotificationDelivery(state,events).length,0);
state=markNotifications(state,"readIds",[events[0].id]);assert.equal(visibleNotifications(state,events).length,3);
state=markNotifications(state,"dismissedIds",[events[0].id]);assert.equal(visibleNotifications(state,events).length,2);
const tomorrow=deriveFinanceNotifications([], [envelope],"2026-10-09");
assert.equal(pendingNotificationDelivery(state,tomorrow).length,1,"Today becomes overdue once, not a daily duplicate");
const later=deriveFinanceNotifications([], [envelope],"2026-10-10");
assert.ok(later.some(e=>e.destination.itemId==="critical"&&e.id.endsWith(":today")));
const recurrence={id:"r",name:"Ahorro",balance:0,recurrence:{amount:100,frequency:"Mensual",nextDate:today}};
assert.equal(deriveFinanceNotifications([], [recurrence],today)[0].tone,"red");
assert.equal(deriveFinanceNotifications([], [recurrence],"2026-10-09")[0].tone,"purple");
assert.equal(deriveFinanceNotifications([], [{...recurrence,recurrence:{...recurrence.recurrence,snoozedUntil:"2026-10-15"}}],today).length,0);
assert.equal(deriveFinanceNotifications([], [{...recurrence,recurrence:{...recurrence.recurrence,amount:-1}}],today).length,0);
assert.equal(JSON.stringify(envelope),seed);
assert.match(saveNotificationUpdate(()=>{throw new Error("storage");},s=>s),/No se pudo guardar/);
assert.equal(normalizeNotificationState({tone:"unknown"}).tone,"Suave");
console.log("OK: attention-only notifications, purple/today/critical transitions, recurrence, paid exclusion, stable IDs, read/dismiss and immutable financial data.");
