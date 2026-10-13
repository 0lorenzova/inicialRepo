"use client";
import { createContext, useContext, type ReactNode } from "react";
import { compactTemporalDistance, type GoalTemporalState } from "@/lib/envelope-goals";
import styles from "./temporal-indicator.module.css";

const TemporalDisplay = createContext({ visible:true, privateMode:false });
export const useTemporalDisplay = () => useContext(TemporalDisplay);
export function TemporalDisplayProvider({visible,privateMode,children}:{visible:boolean;privateMode:boolean;children:ReactNode}) {
  return <TemporalDisplay.Provider value={{visible,privateMode}}>{children}</TemporalDisplay.Provider>;
}

export function TemporalDot({ tone, covered, alert = false }: { tone: GoalTemporalState["tone"] | "white"; covered?:boolean; alert?:boolean }) {
  const {visible,privateMode}=useTemporalDisplay();
  if(!visible)return null;
  const state=privateMode||covered===undefined?"neutral":covered?"closed":"open";
  return <span className={styles.dot} data-tone={tone} data-alert={tone==="purple"&&alert} data-coverage={state} aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">{state==="open"?<><path d="M2 10 12 2 22 10v12H2Z" fill="currentColor"/><path d="m2 10 10 7 10-7 M2 22l7-7 m6 0 7 7" fill="none" stroke="var(--paper, #fff)" strokeWidth="1.8" strokeLinejoin="round"/></>:<><rect x="2" y="5" width="20" height="15" rx="2" fill="currentColor"/><path d="m3 6 9 7 9-7" fill="none" stroke="var(--paper, #fff)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>}</svg></span>;
}

export function TemporalBadge({ tone, date, today, covered }: { tone: GoalTemporalState["tone"] | "white"; date?: string; today: string; covered?:boolean }) {
  const {visible}=useTemporalDisplay();
  const distance = compactTemporalDistance(date, today);
  return visible?<span className={styles.badge}><TemporalDot tone={tone} covered={covered} alert={Boolean(date&&date<today)}/>{distance && <small>{distance}</small>}</span>:null;
}

export function TemporalThresholdFields({ values, onChange }: {
  values: { green: string; yellow: string; red: string };
  onChange: (tone: keyof typeof values, value: string) => void;
}) {
  return <fieldset className={styles.thresholds}><legend>Días antes de la fecha límite</legend>
    {([ ["green", "Verde"], ["yellow", "Amarillo"], ["red", "Rojo"] ] as const).map(([tone, label]) => <label key={tone}><span className={styles.label}><TemporalDot tone={tone} />{label}</span><input type="number" inputMode="numeric" min="0" step="1" value={values[tone]} onChange={event => onChange(tone, event.target.value)} /></label>)}
    <p>Verde debe ser mayor que amarillo, y amarillo mayor que rojo. Antes de estos rangos se muestra blanco; el día del vencimiento, rojo; después, púrpura.</p>
  </fieldset>;
}
