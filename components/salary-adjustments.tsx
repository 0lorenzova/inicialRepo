"use client";

import { useState } from "react";
import BeachAccessOutlined from "@mui/icons-material/BeachAccessOutlined";
import CardGiftcardOutlined from "@mui/icons-material/CardGiftcardOutlined";
import ChecklistOutlined from "@mui/icons-material/ChecklistOutlined";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import DirectionsBikeOutlined from "@mui/icons-material/DirectionsBikeOutlined";
import { uiCopyEs } from "@/lib/ui-copy";
import {
  salaryAdjustments,
  salaryCatalogAt,
  salaryExpected,
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

function conceptIcon(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("moto") || normalized.includes("transporte")) return <DirectionsBikeOutlined/>;
  if (normalized.includes("vacacion")) return <BeachAccessOutlined/>;
  if (normalized.includes("aguinaldo")) return <CardGiftcardOutlined/>;
  return <PaidOutlined/>;
}

type Props = {
  ledger: SalaryLedger;
  period: SalaryPeriod;
  today: string;
  display: (n: number) => string;
  onSave?: (operation: (current: SalaryLedger) => SalaryLedger) => void;
  appearance?: "receipt";
};

export function SalaryAdjustments({ ledger, period, today, display, onSave, appearance }: Props) {
  const original = salaryAdjustments(ledger, period);
  const [expanded, setExpanded] = useState(false);
  const adjustment = salaryExpected(ledger, period) - period.concepts.reduce((total, concept) => total + concept.amount, 0);
  const config = salaryState(ledger).configs.find(item => item.id === period.configId);
  const selectedCount = original.length;

  return (
    <section className={styles.extraPanel} data-appearance={appearance}>
      {appearance === "receipt" ? <button type="button" className={`${styles.extraToggle} ${styles.receiptExtraToggle}`} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        <ChecklistOutlined aria-hidden="true"/>
        <span><b>{uiCopyEs.salaryAdjustments.title}</b><small>{selectedCount ? uiCopyEs.salaryAdjustments.selectedCount(selectedCount) : uiCopyEs.salaryAdjustments.noneSelected}</small></span>
        <InfoOutlined className={styles.receiptInfo} titleAccess="Adicionales y beneficios estimados para esta semana."/>
        <ExpandMoreRounded className={`${styles.receiptChevron} ${expanded ? styles.receiptChevronOpen : ""}`}/>
      </button> : <label className={styles.extraToggle}>
        <input type="checkbox" checked={expanded} onChange={event => setExpanded(event.target.checked)} />
        <span>{selectedCount ? uiCopyEs.salaryAdjustments.selectionSummary(selectedCount, display(adjustment)) : uiCopyEs.salaryAdjustments.title}</span>
      </label>}
      {expanded && config && (
        <AdjustmentChecklist
          key={period.id}
          ledger={ledger}
          period={period}
          today={today}
          display={display}
          onSave={onSave}
          original={original}
          config={config}
          appearance={appearance}
        />
      )}
    </section>
  );
}

function AdjustmentChecklist({
  ledger,
  period,
  today,
  display,
  onSave,
  original,
  config,
  appearance,
}: Pick<Props, "ledger" | "period" | "today" | "display" | "onSave" | "appearance"> & { original: SalaryAdjustment[]; config: SalaryConfig }) {
  const [items, setItems] = useState(original.map(item => ({ ...item })));
  const [error, setError] = useState("");
  const catalog = salaryCatalogAt(config, period.start).filter(concept => concept.active);
  const catalogIds = new Set(catalog.map(concept => concept.id));
  const customItems = items.filter(item => !item.catalogId || !catalogIds.has(item.catalogId));
  const dirty = JSON.stringify(items) !== JSON.stringify(original);
  const expectedKnown = salaryPeriodPresentation(ledger, period, today).estimateKnown;
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
              <div className={`${styles.extraItem} ${appearance === "receipt" ? styles.receiptItem : ""}`} data-selected={Boolean(selected)} key={concept.id}>
                <label className={styles.extraCheck}>
                  <input
                    type="checkbox"
                    checked={Boolean(selected)}
                    disabled={!onSave}
                    onChange={event => toggleConcept(concept, event.target.checked)}
                  />
                  {appearance === "receipt" && <span className={styles.receiptConceptIcon} aria-hidden="true">{conceptIcon(concept.name)}</span>}
                  <span>{concept.name}{concept.recurring ? " · Recurrente" : ""}</span>
                </label>
                {selected && (
                  selected.unit && selected.rate !== undefined ? (
                    appearance === "receipt" ? <div className={styles.receiptMeasured}>
                      <label>
                        Unidades
                        <input type="number" inputMode="decimal" min="0.25" step="0.25" required value={selected.quantity ?? ""} disabled={!onSave} onChange={event => {
                          const quantity = event.target.value === "" ? undefined : Number(event.target.value);
                          let amount = 0;
                          if (quantity !== undefined) { try { amount = salaryMeasuredAmount(quantity, selected.rate!); } catch { /* Se completa cuando los datos sean válidos. */ } }
                          update(selected.id, { quantity, amount });
                        }}/>
                      </label>
                      <label>
                        Costo unitario
                        <div className={styles.unitRate}><span>₡</span><input type="number" inputMode="numeric" min="1" step="1" required value={selected.rate ?? ""} disabled={!onSave} onChange={event => {
                          const rate = event.target.value === "" ? undefined : Number(event.target.value);
                          let amount = 0;
                          if (rate !== undefined && selected.quantity !== undefined) { try { amount = salaryMeasuredAmount(selected.quantity, rate); } catch { /* Se completa cuando los datos sean válidos. */ } }
                          update(selected.id, { rate, amount });
                        }}/></div>
                      </label>
                      <div className={styles.receiptTotal}><small>Total</small><b>{display(selected.amount)}</b></div>
                    </div> : <>
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
        <div className={`${styles.extraItem} ${appearance === "receipt" ? styles.receiptItem : ""}`} data-selected="true" key={item.id}>
          <label className={styles.extraCheck}>
            <input
              type="checkbox"
              checked
              disabled={!onSave}
              onChange={() => setItems(current => current.filter(candidate => candidate.id !== item.id))}
            />
            {appearance === "receipt" && <span className={styles.receiptConceptIcon} aria-hidden="true">{conceptIcon(item.name)}</span>}
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

      <div className={`${styles.extraSummary} ${appearance === "receipt" ? styles.receiptSummary : ""}`}>
        <span>{appearance === "receipt" ? uiCopyEs.salaryAdjustments.expectedWeekTotal : uiCopyEs.salaryAdjustments.summaryAmount(display(delta))}</span>
        {appearance === "receipt"?<b>{expectedKnown?display(base + delta):"Sin proyección"}</b>:expectedKnown&&<b>{uiCopyEs.salaryAdjustments.expectedAmount(display(base + delta))}</b>}
        {appearance === "receipt"&&<small>{uiCopyEs.salaryAdjustments.receiptDetails(display(base), display(delta))}</small>}
      </div>
      {appearance !== "receipt"&&<small>Se guardan como estimación. No registran ingresos ni confirman una deuda.</small>}
      {measurementInvalid && <p role="alert">Completa las unidades y verifica que su costo produzca un importe entero en colones.</p>}
      {error && <p role="alert">{error}</p>}
      {dirty && onSave && (
        <button type="button" className="primary" disabled={measurementInvalid} onClick={save}>
          {uiCopyEs.salaryAdjustments.save}
        </button>
      )}
    </div>
  );
}
