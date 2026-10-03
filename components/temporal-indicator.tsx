import type { GoalTemporalState } from "@/lib/envelope-goals";
import styles from "./temporal-indicator.module.css";

export function TemporalDot({ tone }: { tone: GoalTemporalState["tone"] | "white" }) {
  return <span className={styles.dot} data-tone={tone} aria-hidden="true" />;
}

export function TemporalThresholdFields({ values, onChange }: {
  values: { green: string; yellow: string; red: string };
  onChange: (tone: keyof typeof values, value: string) => void;
}) {
  return <fieldset className={styles.thresholds}><legend>Días antes de la fecha límite</legend>
    {([ ["green", "Verde"], ["yellow", "Amarillo"], ["red", "Rojo"] ] as const).map(([tone, label]) => <label key={tone}><span className={styles.label}><TemporalDot tone={tone} />{label}</span><input type="number" inputMode="numeric" min="0" step="1" value={values[tone]} onChange={event => onChange(tone, event.target.value)} /></label>)}
    <p>Verde debe ser mayor que amarillo, y amarillo mayor que rojo. El indicador aparece al entrar en el plazo verde.</p>
  </fieldset>;
}
