"use client";
import { createContext, useContext, type ReactNode } from "react";
import { compactTemporalDistance, type GoalTemporalState } from "@/lib/envelope-goals";
import styles from "./temporal-indicator.module.css";

const TemporalDisplay = createContext({ visible:true, privateMode:false });
export const useTemporalDisplay = () => useContext(TemporalDisplay);
export function TemporalDisplayProvider({visible,privateMode,children}:{visible:boolean;privateMode:boolean;children:ReactNode}) {
  return <TemporalDisplay.Provider value={{visible,privateMode}}>{children}</TemporalDisplay.Provider>;
}

export function TemporalDot({ tone, covered, alert = false, late = false, lateLabel }: { tone: GoalTemporalState["tone"] | "white"; covered?:boolean; late?:boolean; lateLabel?:string; alert?:boolean }) {
  const {visible,privateMode}=useTemporalDisplay();
  if(!visible)return null;
  const state=privateMode||covered===undefined?"neutral":covered?"closed":"open";
  return <span className={styles.dot} title={late?(lateLabel || "Pago programado después del vencimiento"):undefined} data-late={late} data-tone={tone} data-alert={tone==="purple"&&alert} data-coverage={state} role={late?"img":undefined} aria-label={late?(lateLabel || "Pago programado después del vencimiento"):undefined} aria-hidden={!late}><svg viewBox="0 0 24 24" focusable="false">{state==="open"?<><path d="M2 10 12 2 22 10v12H2Z" fill="currentColor"/><path d="m2 10 10 7 10-7 M2 22l7-7 m6 0 7 7" fill="none" stroke="var(--paper, #fff)" strokeWidth="1.8" strokeLinejoin="round"/></>:<><rect x="2" y="5" width="20" height="15" rx="2" fill="currentColor"/><path d="m3 6 9 7 9-7" fill="none" stroke="var(--paper, #fff)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>}</svg></span>;
}

export function TemporalBadge({ tone, date, today, covered, late = false, lateLabel }: { tone: GoalTemporalState["tone"] | "white"; date?: string; today: string; covered?:boolean; late?:boolean; lateLabel?:string }) {
  const {visible}=useTemporalDisplay();
  const distance = compactTemporalDistance(date, today);
  return visible?<span className={styles.badge}><TemporalDot tone={tone} covered={covered} late={late} lateLabel={lateLabel} alert={Boolean(date&&date<today)}/>{distance && <small>{distance}</small>}</span>:null;
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
