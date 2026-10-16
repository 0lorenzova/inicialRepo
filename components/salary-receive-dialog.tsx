"use client";

import { useRef, useState, type FormEvent } from "react";
import { AccountSelector } from "@/components/account-selector";
import { FinanceDialog } from "@/components/finance-dialog";
import { IncomeDistribution } from "@/components/income-distribution";
import { incomeDefaults, incomeReceptionMethods, type IncomePreferences } from "@/lib/income-preferences";
import { isoWeek } from "@/lib/iso-week";
import { salaryPaymentTiming, salaryPeriodApplications, salaryPeriodForDate, salaryPeriodLabel, salaryPeriodRemaining, salaryPaymentValid, salaryState, preferredSalaryConfigId, postSalaryPayment, type SalaryApplication, type SalaryLedger, type SalaryPeriod } from "@/lib/salary-tracking";
import type { PlanningEnvelope } from "@/lib/envelope-planning";
import type { FundingSelection } from "@/lib/income-distribution";
import styles from "./salary-receive-dialog.module.css";

type Props = {
  ledger: SalaryLedger;
  envelopes: (PlanningEnvelope & { icon: string })[];
  today: string;
  incomePreferences?: Partial<IncomePreferences>;
  display: (amount: number) => string;
  initialConfigId?: string;
  initialPeriodId?: string;
  error?: string;
  onClose: () => void;
  onConfigure: () => void;
  onCreateAccount: (name: string, type: string) => string;
  onSave: (operation: (current: SalaryLedger) => SalaryLedger) => boolean;
};

const localNow = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const dayLabel = (value: string) => new Intl.DateTimeFormat("es-CR", { timeZone: "UTC", dateStyle: "medium" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
const monthLabel = (value: string) => new Intl.DateTimeFormat("es-CR", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00Z`));
const addDays = (value: string, count: number) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
};
const monthDays = (month: string) => {
  const first = new Date(`${month}-01T12:00:00Z`);
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate();
  return Array.from({ length: Math.ceil((mondayOffset + count) / 7) * 7 }, (_, index) => addDays(addDays(`${month}-01`, -mondayOffset), index));
};
const currentDateTime = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? value : `${value.slice(0, 10)}T12:00`;

export function SalaryReceiveDialog({ ledger, envelopes, today, incomePreferences, display, initialConfigId, initialPeriodId, error: externalError, onClose, onConfigure, onCreateAccount, onSave }: Props) {
  const state = salaryState(ledger);
  const startingPeriod = state.periods.find(period => period.id === initialPeriodId);
  const startingConfigId = initialConfigId || startingPeriod?.configId || preferredSalaryConfigId(ledger);
  const startingConfig = state.configs.find(config => config.id === startingConfigId);
  let startingProjection: SalaryPeriod | null = null;
  try { if (startingConfig) startingProjection = startingPeriod ?? salaryPeriodForDate(ledger, startingConfig.id, today); } catch { /* The configuration can start in the future. */ }

  const [configId, setConfigId] = useState(startingConfigId);
  const [periodDate, setPeriodDate] = useState(startingProjection?.start ?? today);
  const [amount, setAmount] = useState(String(startingProjection ? salaryPeriodRemaining(ledger, startingProjection) : ""));
  const [accountId, setAccountId] = useState(incomeDefaults(incomePreferences, ledger.accounts).accountId);
  const [receivedAt, setReceivedAt] = useState(localNow);
  const [method, setMethod] = useState<string>("Transferencia");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState((startingProjection?.start ?? today).slice(0, 7));
  const [multiPeriod, setMultiPeriod] = useState(false);
  const [applications, setApplications] = useState<SalaryApplication[]>([]);
  const [distribute, setDistribute] = useState(false);
  const [manual, setManual] = useState<Record<string, string>>({});
  const [selections, setSelections] = useState<FundingSelection[]>([]);
  const [existingMovementId, setExistingMovementId] = useState("");
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [paymentId] = useState(() => crypto.randomUUID());

  const config = state.configs.find(item => item.id === configId);
  let period: SalaryPeriod | null = null;
  let periodError = "";
  try { if (config) period = salaryPeriodForDate(ledger, config.id, periodDate); } catch (cause) { periodError = cause instanceof Error ? cause.message : "El período no está disponible."; }

  const numericAmount = Number(amount);
  const existingPeriods = state.periods.filter(item => item.configId === config?.id);
  const periodOptions = [...existingPeriods];
  if (period && !periodOptions.some(item => item.id === period!.id)) periodOptions.push(period);
  periodOptions.sort((a, b) => b.start.localeCompare(a.start));
  const candidates = periodOptions.filter(item => salaryPeriodRemaining(ledger, item) > 0);
  const paymentMovements = ledger.movements.filter(movement => movement.type === "Ingreso" && !state.payments.some(payment => !payment.voidReason && payment.movementId === movement.id));
  const linkedMovement = paymentMovements.find(movement => movement.id === existingMovementId);
  const receivedDate = receivedAt.slice(0, 10);
  let timing = null;
  try { if (period && receivedAt) timing = salaryPaymentTiming(period, receivedAt); } catch { /* Keep the timing hint empty while a date is being edited. */ }

  let calculationLedger = ledger;
  if (period && !state.periods.some(item => item.id === period!.id)) calculationLedger = { ...ledger, salary: { ...state, periods: [...state.periods, period] } };
  let calculatedApplications: SalaryApplication[] = [];
  let applicationError = "";
  if (period && numericAmount > 0 && Number.isSafeInteger(numericAmount)) {
    if (multiPeriod) calculatedApplications = applications;
    else {
      try { calculatedApplications = salaryPeriodApplications(calculationLedger, config!.id, period.id, numericAmount); }
      catch (cause) { applicationError = cause instanceof Error ? cause.message : "El importe supera el saldo de este período."; }
    }
  }
  const applicationTotal = calculatedApplications.reduce((sum, item) => sum + item.amount, 0);
  const applicationBalance = numericAmount - applicationTotal;
  const expectedAmount = period?.concepts.reduce((sum, concept) => sum + concept.amount, 0) ?? 0;
  const receivedAmount = period ? (period.concepts.reduce((sum, concept) => sum + state.payments.filter(payment => salaryPaymentValid(ledger, payment)).flatMap(payment => payment.applications.filter(application => application.periodId === period!.id && application.conceptId === concept.id).map(application => application.amount)).reduce((total, value) => total + value, 0), 0)) : 0;
  const pendingAmount = Math.max(0, expectedAmount - receivedAmount);
  const selectedAccount = ledger.accounts.find(account => account.id === accountId && account.active);
  const isSavedPeriod = Boolean(period && state.periods.some(item => item.id === period!.id));
  const accountValid = Boolean(linkedMovement || selectedAccount);
  const dateValid = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(receivedAt) && receivedDate <= today;
  const applicationKey = (values: SalaryApplication[]) => JSON.stringify([...values].map(item => [item.periodId, item.conceptId, item.amount]).sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1]))));
  const duplicateExists = Boolean(!linkedMovement && period && state.payments.some(payment => !payment.historical && salaryPaymentValid(ledger, payment) && payment.configId === config?.id && payment.date === receivedAt && payment.amount === numericAmount && payment.accountId === accountId && applicationKey(payment.applications) === applicationKey(calculatedApplications) && (!reference.trim() && !payment.reference.trim() || payment.reference.trim().toLocaleLowerCase("es") === reference.trim().toLocaleLowerCase("es"))));
  const enoughApplications = numericAmount > 0 && applicationTotal === numericAmount;
  const canSave = Boolean(config && period && Number.isSafeInteger(numericAmount) && numericAmount > 0 && accountValid && dateValid && enoughApplications && !applicationError && !duplicateExists && !saving);

  const resetApplications = (nextPeriod: SalaryPeriod) => {
    setAmount(String(salaryPeriodRemaining(ledger, nextPeriod)));
    setApplications([]);
    setMultiPeriod(false);
    setLocalError("");
  };
  const selectPeriodDate = (date: string) => {
    try {
      const next = salaryPeriodForDate(ledger, config!.id, date);
      setPeriodDate(next.start);
      setCalendarMonth(next.start.slice(0, 7));
      resetApplications(next);
      setCalendarOpen(false);
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "No se pudo seleccionar el período."); }
  };
  const movePeriod = (direction: -1 | 1) => {
    if (!config || !period) return;
    try { selectPeriodDate(addDays(direction < 0 ? period.start : period.end, direction)); }
    catch { /* The calendar can reach the configured start or date limit. */ }
  };
  const changeConfig = (nextConfigId: string) => {
    setConfigId(nextConfigId);
    setExistingMovementId("");
    setApplications([]);
    setMultiPeriod(false);
    setLocalError("");
    const nextConfig = state.configs.find(item => item.id === nextConfigId);
    if (!nextConfig) return;
    try {
      const target = salaryPeriodForDate(ledger, nextConfig.id, today);
      setPeriodDate(target.start);
      setCalendarMonth(target.start.slice(0, 7));
      setAmount(String(salaryPeriodRemaining(ledger, target)));
    } catch {
      const first = state.periods.filter(item => item.configId === nextConfig.id).sort((a, b) => a.start.localeCompare(b.start))[0];
      setPeriodDate(first?.start ?? nextConfig.start);
      setCalendarMonth((first?.start ?? nextConfig.start).slice(0, 7));
      setAmount(String(first ? salaryPeriodRemaining(ledger, first) : nextConfig.base + (nextConfig.extraConcepts ?? []).reduce((sum, item) => sum + item.amount, 0)));
    }
  };
  const toggleApplication = (periodId: string, conceptId: string, value: number) => {
    setApplications(current => [...current.filter(item => item.periodId !== periodId || item.conceptId !== conceptId), ...(value > 0 ? [{ periodId, conceptId, amount: value }] : [])]);
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRef.current) return;
    setLocalError("");
    if (!config || !period) { setLocalError(periodError || "Selecciona un período salarial."); return; }
    if (!dateValid) { setLocalError("Indica la fecha real de recepción, igual o anterior a hoy."); setAdvanced(true); return; }
    if (!accountValid) { setLocalError("Selecciona una cuenta receptora activa."); return; }
    if (duplicateExists) { setLocalError("Ya existe un pago con estos datos. Revisa el historial o vincula el ingreso existente en Más opciones."); setAdvanced(true); return; }
    if (applicationError) { setLocalError(applicationError); setAdvanced(true); return; }
    if (applicationBalance !== 0) { setLocalError(`Distribuye todo el ingreso salarial entre períodos. Queda ${display(Math.abs(applicationBalance))} ${applicationBalance > 0 ? "por aplicar" : "aplicado de más"}.`); setAdvanced(true); return; }
    savingRef.current = true;
    setSaving(true);
    const input = {
      id: paymentId,
      configId: config.id,
      date: linkedMovement?.date ?? receivedAt,
      amount: linkedMovement?.amount ?? numericAmount,
      accountId: linkedMovement?.accountId ?? accountId,
      method: linkedMovement?.paymentMethod ?? method,
      reference: linkedMovement?.reference ?? reference,
      notes,
      name: linkedMovement?.name ?? `Salario · ${config.employer} · ${salaryPeriodLabel(period, config)}`,
      applications: calculatedApplications,
      existingMovementId: linkedMovement?.id,
      manual: distribute && !linkedMovement ? manual : {},
      selections: distribute && !linkedMovement ? selections : [],
      preparedPeriod: isSavedPeriod ? undefined : period,
    };
    const operation = (current: SalaryLedger) => postSalaryPayment(current, input, today);
    try {
      operation(ledger);
      if (onSave(operation)) onClose();
      else setLocalError("No se pudo guardar el pago. Revisa el aviso de la aplicación e inténtalo de nuevo.");
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "No se pudo registrar el salario."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const days = monthDays(calendarMonth);
  const calendarWeeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const configWeekday = config ? new Date(`${config.start}T12:00:00Z`).getUTCDay() : 1;

  if (!state.configs.length) return <FinanceDialog label="Recibir salario" onClose={onClose}>
    <section className={`flow-modal ${styles.dialog}`}><header><h2>Recibir salario</h2><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></header><div className="flow-body"><p>Configura primero tu salario habitual para preparar períodos y evitar ingresos duplicados.</p><button className="primary wide" onClick={onConfigure}>Configurar salario</button><button className="secondary wide" onClick={onClose}>Cancelar</button></div></section>
  </FinanceDialog>;

  return <FinanceDialog label="Recibir salario" onClose={onClose} maxWidth={620}>
    <form className={`flow-modal flow-body ${styles.dialog}`} onSubmit={onSubmit}>
      <header><div><small>INGRESO SALARIAL</small><h2>Recibir salario</h2></div><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></header>
      <label className={styles.configLabel}>Configuración salarial<select value={configId} onChange={event => changeConfig(event.target.value)}>{state.configs.map(item => <option key={item.id} value={item.id}>{item.employer} · {item.name}{item.active ? "" : " (inactiva)"}</option>)}</select></label>
      {config && <>
        <section className={styles.periodPicker} aria-label="Período salarial">
          <div className={styles.periodHeading}>
            <button type="button" className="secondary" aria-label="Período anterior" onClick={() => movePeriod(-1)} disabled={!period || period.start <= config.start && !state.periods.some(item => item.configId === config.id && item.end < period!.start)}>‹</button>
            <div><strong>{period ? salaryPeriodLabel(period, config) : "Período salarial"}</strong>{period && <small>{dayLabel(period.start)} — {dayLabel(period.end)}</small>}</div>
            <button type="button" className="secondary" aria-label="Período siguiente" onClick={() => movePeriod(1)} disabled={!period}>›</button>
            <button type="button" className="secondary" aria-expanded={calendarOpen} aria-label="Explorar períodos en calendario" onClick={() => { setCalendarMonth((period?.start ?? today).slice(0, 7)); setCalendarOpen(value => !value); }}>▦</button>
          </div>
          {period && <div className={styles.periodMeta}><span>Pago previsto: <b>{dayLabel(period.payDate)}</b></span><span>Referencia: <b>{display(expectedAmount)}</b></span></div>}
          {calendarOpen && config && <div className={styles.calendar} aria-label="Seleccionar período salarial">
            <div className={styles.calendarHeading}><button type="button" className="secondary" aria-label="Mes anterior" onClick={() => setCalendarMonth(addDays(`${calendarMonth}-01`, -1).slice(0, 7))}>‹</button><b>{monthLabel(calendarMonth)}</b><button type="button" className="secondary" aria-label="Mes siguiente" onClick={() => setCalendarMonth(addDays(`${calendarMonth}-28`, 4).slice(0, 7))}>›</button></div>
            <div className={styles.calendarGrid}><span aria-hidden="true">Sem.</span>{["L", "M", "X", "J", "V", "S", "D"].map((label, index) => <span key={index} aria-hidden="true">{label}</span>)}
              {calendarWeeks.map((week, row) => {
                const monday = week[0];
                const validDates = week.filter(date => date >= config.start);
                const targetDay = config.frequency === "Semanal" ? validDates.find(date => new Date(`${date}T12:00:00Z`).getUTCDay() === configWeekday) ?? validDates[0] : validDates[0];
                const iso = isoWeek(monday);
                return <div className={styles.calendarWeek} key={row}>
                  <button type="button" className={styles.weekNumber} aria-label={`Seleccionar semana ${iso.week} del año ${iso.year}`} disabled={!targetDay} onClick={() => targetDay && selectPeriodDate(targetDay)}>{iso.week} · {iso.year}</button>
                  {week.map(date => {
                    const inside = date.slice(0, 7) === calendarMonth;
                    const selected = Boolean(period && date >= period.start && date <= period.end);
                    return <button type="button" key={date} className={styles.calendarDay} data-outside={!inside} data-selected={selected} aria-label={`${dayLabel(date)}${selected ? ", período seleccionado" : ""}`} aria-pressed={selected} onClick={() => selectPeriodDate(date)}>{Number(date.slice(-2))}</button>;
                  })}
                </div>;
              })}
            </div>
            <small>Las semanas usan número ISO y año. Elegir una fecha o semana solo cambia la vista; no crea períodos.</small>
          </div>}
          {periodError && <p className="form-error" role="alert">{periodError}</p>}
          {period && <p className={styles.timing} role="status">{timing?.label}{period.start <= today && period.end >= today ? " · Período en curso" : period.start > today ? " · Período futuro" : " · Período finalizado"}</p>}
        </section>

        <label htmlFor="salary-received-amount">Importe recibido</label>
        <div className="currency-input"><span>₡</span><input id="salary-received-amount" autoFocus type="number" min="1" step="1" required value={amount} onChange={event => { setAmount(event.target.value); setLocalError(""); }}/></div>
        <p className={styles.balance}>Salario: {display(expectedAmount)} · Recibido: {display(receivedAmount)} · Pendiente: {display(pendingAmount)}</p>
        {linkedMovement?<div className={styles.accountValue}><span>Cuenta del ingreso existente</span><b>{ledger.accounts.find(account=>account.id===linkedMovement.accountId)?.name??"Cuenta histórica"}</b></div>:<AccountSelector label="Cuenta receptora" accounts={ledger.accounts} value={accountId} onChange={setAccountId} onCreate={onCreateAccount} display={display}/>}

        <details className={styles.moreOptions} open={advanced} onToggle={event => setAdvanced(event.currentTarget.open)}>
          <summary>Más opciones</summary>
          <div className={styles.advancedFields}>
            <label>Fecha real de recepción<input type="datetime-local" max={localNow()} value={linkedMovement ? currentDateTime(linkedMovement.date) : receivedAt} disabled={Boolean(linkedMovement)} onChange={event => { setReceivedAt(event.target.value); setLocalError(""); }}/></label>
            <label>Medio de recepción<select value={linkedMovement?.paymentMethod ?? method} disabled={Boolean(linkedMovement)} onChange={event => setMethod(event.target.value)}>{[...new Set([...incomeReceptionMethods, method])].filter(Boolean).map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Referencia<input value={linkedMovement?.reference ?? reference} disabled={Boolean(linkedMovement)} onChange={event => setReference(event.target.value)} placeholder="Opcional"/></label>
            <label>Observaciones<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Opcional"/></label>
            <label>Origen del ingreso<select value={existingMovementId} onChange={event => {
              const id = event.target.value;
              const movement = paymentMovements.find(item => item.id === id);
              setExistingMovementId(id);
              if (movement) { setAmount(String(movement.amount ?? "")); setAccountId(movement.accountId ?? ""); setReceivedAt(currentDateTime(movement.date)); setMethod(movement.paymentMethod ?? "Transferencia"); setReference(movement.reference ?? ""); setDistribute(false); }
              setLocalError("");
            }}><option value="">Crear un movimiento al confirmar</option>{paymentMovements.map(movement => <option key={movement.id} value={movement.id}>Vincular {movement.name} · {dayLabel(movement.date)} · {display(movement.amount)}</option>)}</select><small>Vincular un ingreso existente lo relaciona con el período sin volver a sumar dinero.</small></label>
            <label className="check-label"><input type="checkbox" checked={multiPeriod} onChange={event => { setMultiPeriod(event.target.checked); setApplications([]); setLocalError(""); }}/>Aplicar este pago a varios períodos</label>
            {multiPeriod && <div className={styles.applications}>
              {candidates.map(item => <fieldset key={item.id}><legend>{salaryPeriodLabel(item, config)} · {dayLabel(item.start)} — {dayLabel(item.end)}</legend>{item.concepts.map(concept => {
                const pending = concept.amount - state.payments.filter(payment => salaryPaymentValid(ledger, payment)).flatMap(payment => payment.applications.filter(application => application.periodId === item.id && application.conceptId === concept.id).map(application => application.amount)).reduce((sum, value) => sum + value, 0);
                if (pending <= 0) return null;
                const applied = applications.find(application => application.periodId === item.id && application.conceptId === concept.id)?.amount ?? "";
                return <label key={concept.id}>{concept.name} · Pendiente {display(pending)}<input type="number" min="0" max={pending} step="1" value={applied} onChange={event => toggleApplication(item.id, concept.id, Number(event.target.value))}/></label>;
              })}</fieldset>)}
              <div className="review-box"><span>Recibido: {display(numericAmount)}</span><span>Aplicado: {display(applicationTotal)}</span><b>Por aplicar: {display(applicationBalance)}</b></div>
            </div>}
            {!linkedMovement && <>
              <label>Distribución del dinero<select value={distribute ? "distribute" : "unassigned"} onChange={event => setDistribute(event.target.value === "distribute")}><option value="unassigned">Guardar sin asignar</option><option value="distribute">Distribuir ahora entre sobres</option></select></label>
              {distribute && <IncomeDistribution envelopes={envelopes} today={today} amount={numericAmount} manual={manual} selections={selections} onManual={setManual} onSelections={setSelections} display={display}/>}
            </>}
          </div>
        </details>

        {(localError || externalError || applicationError || duplicateExists) && <p className="form-error" role="alert">{localError || externalError || (duplicateExists ? "Ya existe un ingreso con estos mismos datos. Vincúlalo desde Más opciones para evitar duplicarlo." : applicationError)}</p>}
        <button className="primary wide" type="submit" disabled={!canSave}>{saving ? "Registrando…" : linkedMovement ? "Vincular ingreso al salario" : "Confirmar y registrar salario"}</button>
        <button type="button" className="secondary wide" onClick={onClose}>Cancelar</button>
      </>}
    </form>
  </FinanceDialog>;
}
