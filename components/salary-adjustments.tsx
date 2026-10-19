"use client";

import { useState } from "react";
import {
  salaryAdjustments,
  salaryCatalogAt,
  salaryExpected,
  salaryHistoricalEstimate,
  salaryMeasuredAmount,
  salaryPeriodPresentation,
  salaryState,
  saveSalaryAdjustments,
  type SalaryAdjustment,
  type SalaryCatalogConcept,
  type SalaryConfig,
  type SalaryLedger,
  type SalaryPeriod,
} from "@/lib/salary-tracking";
import styles from "./salary-planning.module.css";

type Props = {
  ledger: SalaryLedger;
  period: SalaryPeriod;
  today: string;
  display: (n: number) => string;
  onSave?: (operation: (current: SalaryLedger) => SalaryLedger) => void;
};

export function SalaryEstimation({ ledger, period, today, display }: Props) {
  const view = salaryPeriodPresentation(ledger, period, today);
  const estimate = salaryHistoricalEstimate(ledger, period);
  if (!view.historicalEmpty) return null;

  return (
    <details key={period.id} className={styles.panel}>
      <summary>Ver estimación</summary>
      {estimate ? (
        <>
          <p>Estimación histórica: <b>{display(estimate.amount)}</b></p>
          <small>Base de cálculo: {estimate.basis}</small>
        </>
      ) : (
        <p>Sin información suficiente para estimar este período.</p>
      )}
      <p>Esta cifra es una estimación; no representa un ingreso registrado ni una deuda confirmada.</p>
    </details>
  );
}

export function SalaryAdjustments({ ledger, period, display, onSave }: Props) {
  const original = salaryAdjustments(ledger, period);
  const [expanded, setExpanded] = useState(false);
  const adjustment = salaryExpected(ledger, period) - period.concepts.reduce((total, concept) => total + concept.amount, 0);
  const config = salaryState(ledger).configs.find(item => item.id === period.configId);
  const selectedCount = original.length;

  return (
    <section className={styles.extraPanel}>
      <label className={styles.extraToggle}>
        <input type="checkbox" checked={expanded} onChange={event => setExpanded(event.target.checked)} />
        <span>Conceptos extra{selectedCount ? ` · ${selectedCount} seleccionados · ${display(adjustment)}` : ""}</span>
      </label>
      {expanded && config && (
        <AdjustmentChecklist
          key={period.id}
          ledger={ledger}
          period={period}
          display={display}
          onSave={onSave}
          original={original}
          config={config}
        />
      )}
    </section>
  );
}

function AdjustmentChecklist({
  ledger,
  period,
  display,
  onSave,
  original,
  config,
}: Pick<Props, "ledger" | "period" | "display" | "onSave"> & { original: SalaryAdjustment[]; config: SalaryConfig }) {
  const [items, setItems] = useState(original.map(item => ({ ...item })));
  const [error, setError] = useState("");
  const catalog = salaryCatalogAt(config, period.start).filter(concept => concept.active);
  const catalogIds = new Set(catalog.map(concept => concept.id));
  const customItems = items.filter(item => !item.catalogId || !catalogIds.has(item.catalogId));
  const dirty = JSON.stringify(items) !== JSON.stringify(original);
  const canEstimate = salaryHistoricalEstimate(ledger, period) !== null;
  const base = period.concepts.reduce((total, concept) => total + concept.amount, 0);
  const delta = items.reduce((total, item) => total + (item.sign === "subtract" ? -item.amount : item.amount), 0);
  const measurementInvalid = items.some(item => item.unit && (
    !item.rate || !item.quantity || item.quantity <= 0 ||
    !Number.isInteger(item.quantity * 4) || !Number.isSafeInteger(item.quantity * item.rate)
  ));

  const update = (id: string, change: Partial<SalaryAdjustment>) => {
    setItems(current => current.map(item => item.id === id ? { ...item, ...change } : item));
    setError("");
  };

  const toggleConcept = (concept: SalaryCatalogConcept, selected: boolean) => {
    if (!selected) {
      setItems(current => current.filter(item => item.catalogId !== concept.id));
      setError("");
      return;
    }

    const measured = Boolean(concept.unit && concept.rate);
    const quantity = measured ? 1 : undefined;
    let amount = concept.usualAmount ?? 0;
    if (measured) {
      try {
        amount = salaryMeasuredAmount(quantity!, concept.rate!);
      } catch {
        setError(`Revisa el costo configurado para ${concept.name}.`);
        return;
      }
    }

    setItems(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        catalogId: concept.id,
        name: concept.name,
        sign: concept.sign,
        amount,
        status: "estimated",
        ...(measured ? { unit: concept.unit, rate: concept.rate, quantity } : {}),
      },
    ]);
    setError("");
  };

  const save = () => {
    if (!onSave || measurementInvalid) return;
    try {
      onSave(current => saveSalaryAdjustments(current, period, items, original));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los conceptos.");
    }
  };

  return (
    <div className={styles.extraOptions}>
      {catalog.length > 0 ? (
        <div className={styles.extraList}>
          {catalog.map(concept => {
            const selected = items.find(item => item.catalogId === concept.id);
            return (
              <div className={styles.extraItem} key={concept.id}>
                <label className={styles.extraCheck}>
                  <input
                    type="checkbox"
                    checked={Boolean(selected)}
                    disabled={!onSave}
                    onChange={event => toggleConcept(concept, event.target.checked)}
                  />
                  <span>{concept.name}{concept.recurring ? " · Recurrente" : ""}</span>
                </label>
                {selected && (
                  selected.unit && selected.rate !== undefined ? (
                    <>
                      <div className={`${styles.two} ${styles.extraFields}`}>
                        <label>
                          Unidades
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0.25"
                            step="0.25"
                            required
                            value={selected.quantity ?? ""}
                            disabled={!onSave}
                            onChange={event => {
                              const quantity = event.target.value === "" ? undefined : Number(event.target.value);
                              let amount = 0;
                              if (quantity !== undefined) {
                                try { amount = salaryMeasuredAmount(quantity, selected.rate!); } catch { /* Se completa al ingresar unidades válidas. */ }
                              }
                              update(selected.id, { quantity, amount });
                            }}
                          />
                        </label>
                        <label>
                          Costo
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            required
                            value={selected.rate ?? ""}
                            disabled={!onSave}
                            onChange={event => {
                              const rate = event.target.value === "" ? undefined : Number(event.target.value);
                              let amount = 0;
                              if (rate !== undefined && selected.quantity !== undefined) {
                                try { amount = salaryMeasuredAmount(selected.quantity, rate); } catch { /* Se completa al ingresar un costo válido. */ }
                              }
                              update(selected.id, { rate, amount });
                            }}
                          />
                        </label>
                      </div>
                      <small className={styles.extraAmount}>
                        {selected.unit === "day" ? "Costo por día" : "Costo por hora"} · Total: {display(selected.amount)}
                      </small>
                    </>
                  ) : (
                    <label className={styles.extraAmountField}>
                      Importe
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={selected.amount}
                        disabled={!onSave}
                        onChange={event => update(selected.id, { amount: Number(event.target.value) })}
                      />
                    </label>
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p>Este empleador no tiene conceptos activos en su catálogo.</p>
      )}

      {customItems.map(item => (
        <div className={styles.extraItem} key={item.id}>
          <label className={styles.extraCheck}>
            <input
              type="checkbox"
              checked
              disabled={!onSave}
              onChange={() => setItems(current => current.filter(candidate => candidate.id !== item.id))}
            />
            <span>{item.name}{!item.catalogId ? " · Personalizado" : " · Inactivo en catálogo"}</span>
          </label>
          {item.unit && item.rate !== undefined ? (
            <small className={styles.extraAmount}>
              {item.quantity} unidades · {display(item.rate)} por {item.unit === "day" ? "día" : "hora"} · Total: {display(item.amount)}
            </small>
          ) : (
            <label className={styles.extraAmountField}>
              Importe
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={item.amount}
                disabled={!onSave}
                onChange={event => update(item.id, { amount: Number(event.target.value) })}
              />
            </label>
          )}
        </div>
      ))}

      <div className={styles.extraSummary}>
        <span>Conceptos extra: {display(delta)}</span>
        <b>Esperado: {canEstimate ? display(base + delta) : "Sin información suficiente"}</b>
      </div>
      <small>Se guardan como estimación. No registran ingresos ni confirman una deuda.</small>
      {measurementInvalid && <p role="alert">Completa las unidades y verifica que su costo produzca un importe entero en colones.</p>}
      {error && <p role="alert">{error}</p>}
      {dirty && onSave && (
        <button type="button" className="primary" disabled={measurementInvalid} onClick={save}>
          Guardar conceptos
        </button>
      )}
    </div>
  );
}
