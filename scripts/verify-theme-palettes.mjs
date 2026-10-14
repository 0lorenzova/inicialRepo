import assert from 'node:assert/strict';
import { additionalThemes, additionalThemeStyles } from '../lib/theme-palettes.ts';
import { plannedPaymentDelayText, plannedPaymentWarnings } from '../lib/envelope-planning.ts';
const luminance = hex => {
  const channels=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
};
const contrast = (a,b) => { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
assert.equal(Object.keys(additionalThemes).length,4);
for(const [id,p] of Object.entries(additionalThemes)) {
  for(const surface of [p.canvas,p.paper,p.raised,p.selected]) {
    for(const text of [p.ink,p.muted,p.accent]) assert.ok(contrast(text,surface)>=4.5,`${id}: ${text} on ${surface}`);
  }
  assert.ok(contrast('#ffffff',p.action)>=4.5,`${id}: action label`);
  assert.ok(contrast(p.accent,p.canvas)>=4.5,`${id}: MUI button label`);
  assert.ok(contrast(p.line,p.paper)>=3,`${id}: input outline`);
  assert.equal(additionalThemeStyles[`.theme-personality.theme-${id}`]['--paper'],p.paper);
}
assert.equal(new Set(Object.values(additionalThemes).map(p=>p.canvas)).size,4);
assert.equal(plannedPaymentDelayText(1),'Pago previsto con 1 día de atraso');
assert.equal(plannedPaymentDelayText(3),'Pago previsto con 3 días de atraso');
assert.equal(plannedPaymentDelayText(0),'');
const one={deadline:'2026-10-15',plannedPaymentDate:'2026-10-16'};
const three={deadline:'2026-10-15',plannedPaymentDate:'2026-10-18'};
assert.equal(plannedPaymentWarnings([one,three,one]),'Pago previsto con 1 día de atraso; Pago previsto con 3 días de atraso');
assert.equal(plannedPaymentWarnings([{...one,payment:{movementId:'paid'}},{...three,plannedPaymentDate:'2026-10-15'}]),'');
console.log('OK: four distinct palettes, WCAG AA text/actions, defined control borders, shared CSS tokens and precise grouped lateness.');
