import type { NotificationTone } from "./finance-notifications";

let context: AudioContext | undefined;
let activated = false;
let generation = 0;
const voices = new Set<OscillatorNode>();

export function supportsNotificationAudio() {
  return typeof window !== "undefined" && typeof window.AudioContext === "function";
}

export async function playNotificationTone(tone: NotificationTone, userGesture = false): Promise<boolean> {
  if (!supportsNotificationAudio()) return false;
  // Never attempt to resume suspended audio from an automatic notification.
  if (!userGesture && (!activated || context?.state !== "running")) return false;
  const startedGeneration = generation;
  try {
    if (userGesture) {
      if (!context || context.state === "closed") context = new AudioContext();
      if (context.state === "suspended") await context.resume();
      if (generation !== startedGeneration) return false;
      activated = context.state === "running";
    }
    if (!context || !activated || context.state !== "running") return false;
    const notes = tone === "Campana" ? [660, 880] : tone === "Breve" ? [880] : [440, 554];
    const start = context.currentTime;
    for (const [index, frequency] of notes.entries()) {
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      const at = start + index * 0.16;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0, at);
      volume.gain.linearRampToValueAtTime(0.075, at + 0.015);
      volume.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
      oscillator.connect(volume);
      volume.connect(context.destination);
      voices.add(oscillator);
      oscillator.start(at);
      oscillator.stop(at + 0.24);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); volume.disconnect(); };
    }
    return true;
  } catch {
    activated = false;
    return false;
  }
}

export function stopNotificationAudio() {
  generation++;
  activated = false;
  for (const oscillator of voices) {
    try { oscillator.stop(); oscillator.disconnect(); } catch { /* Already ended. */ }
  }
  voices.clear();
}
