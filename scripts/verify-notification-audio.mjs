import assert from "node:assert/strict";
import { supportsNotificationAudio, playNotificationTone, stopNotificationAudio } from "../lib/notification-audio.ts";

assert.equal(supportsNotificationAudio(), false, "SSR no usa APIs del navegador");
assert.equal(await playNotificationTone("Suave"), false);
let starts = 0;
let resumes = 0;
const contexts = [];
class FakeAudioContext {
  state = "suspended";
  currentTime = 0;
  destination = {};
  constructor() { contexts.push(this); }
  async resume() { resumes++; this.state = "running"; }
  createOscillator() { return { frequency: { value: 0 }, connect() {}, disconnect() {}, start() { starts++; }, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
}
globalThis.AudioContext = FakeAudioContext;
globalThis.window = { AudioContext: FakeAudioContext };
assert.equal(await playNotificationTone("Suave"), false, "No autoplay antes de un gesto");
assert.equal(resumes, 0);
assert.equal(await playNotificationTone("Suave", true), true);
assert.equal(starts, 2);
assert.equal(resumes, 1);
assert.equal(await playNotificationTone("Breve"), true);
assert.equal(starts, 3);
contexts[0].state = "suspended";
assert.equal(await playNotificationTone("Campana"), false, "Una alerta automática nunca intenta desbloquear audio suspendido");
assert.equal(resumes, 1);
assert.equal(await playNotificationTone("Campana", true), true);
assert.equal(resumes, 2);
assert.equal(starts, 5);
stopNotificationAudio();
assert.equal(await playNotificationTone("Suave"), false, "Desactivar corta la autorización de audio automático");
let completeResume;
contexts[0].state = "suspended";
contexts[0].resume = () => new Promise(resolve => { completeResume = () => { contexts[0].state = "running"; resolve(); }; });
const waitingPreview = playNotificationTone("Suave", true);
stopNotificationAudio();
completeResume();
assert.equal(await waitingPreview, false, "Desactivar cancela una vista previa aún pendiente de permiso");
assert.equal(starts, 5);
contexts[0].state = "closed";
assert.equal(await playNotificationTone("Breve", true), true, "Un gesto nuevo recupera un contexto cerrado");
assert.equal(contexts.length, 2);
delete globalThis.window;
delete globalThis.AudioContext;
console.log("Audio: compatible con SSR, bloqueo de autoplay, gesto explícito y tres tonos correctos.");
