"use client";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import SwapHorizRounded from "@mui/icons-material/SwapHorizRounded";
import {SalaryPeriodActivation} from "./salary-period-activation";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { salaryViewerDay, salaryDateLabel, salaryLocalDateTime, salaryWorkSchedule } from "@/lib/salary-dates";
import { SalaryAdjustments } from "./salary-adjustments";
import { activateSalaryPeriod, postHistoricalSalaryPayment, salaryExpected, salaryPaymentConcepts, salaryTemporalLabel, salaryPeriodPaymentLabel, latestSalaryPeriodPending, salaryAdjustments } from "@/lib/salary-tracking";
import { AccountSelector } from "@/components/account-selector";
import { FinanceDialog } from "@/components/finance-dialog";
import { SalaryReceiptDialog } from "./salary-receipt-dialog";
import { incomeDefaults, incomeReceptionMethods, type IncomePreferences } from "@/lib/income-preferences";
import { uiCopyEs } from "@/lib/ui-copy";
import { SalaryPeriodCalendar } from "./salary-period-calendar";
import { salaryPeriodPresentation, salaryConceptPaid, adjacentSalaryPeriod, shiftSalaryDate, salaryReceiptDefaults, salaryPaymentDuplicate, salaryPaymentTiming, salaryPeriodApplications, salaryPeriodForDate, salaryPeriodLabel, salaryPeriodRemaining, salaryState, preferredSalaryConfigId, postSalaryPayment, recordStandardSalaryPayment, standardSalaryReceipt, type SalaryApplication, type SalaryLedger, type SalaryPaymentDateAccuracy, type SalaryPeriod, type SalaryReceiptPlan } from "@/lib/salary-tracking";
import type { PlanningEnvelope } from "@/lib/envelope-planning";
import styles from "./salary-receive-dialog.module.css";
import statusStyles from "./salary-status.module.css";

type Props = {
  ledger: SalaryLedger;
  envelopes: (PlanningEnvelope & { icon: string })[];
  today: string;
  incomePreferences?: Partial<IncomePreferences>;
  display: (amount: number) => string;
  initialConfigId?: string;
  initialPeriodId?: string;
  initialApplications?: SalaryApplication[];
  initialReceiptPlan?: SalaryReceiptPlan|null;
  error?: string;
  onClose: () => void;
  onConfigure: () => void;
  onCreateAccount: (name: string, type: string) => string;
  onConfirmSave: () => Promise<void>;
  onSave: (operation: (current: SalaryLedger) => SalaryLedger) => boolean;
};

const localNow = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const dayLabel = salaryDateLabel;
const currentDateTime = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? value : `${value.slice(0, 10)}T12:00`;

export function SalaryReceiveDialog({ ledger, envelopes, today, incomePreferences, display, initialConfigId, initialPeriodId, initialApplications, initialReceiptPlan, error: externalError, onClose, onConfigure, onCreateAccount, onSave, onConfirmSave }: Props) {
  const [viewerDay,setViewerDay]=useState(()=>salaryViewerDay());
  useEffect(()=>{const update=()=>setViewerDay(salaryViewerDay());const timer=window.setInterval(update,60000);window.addEventListener("focus",update);return()=>{window.clearInterval(timer);window.removeEventListener("focus",update);};},[]);
  const state = salaryState(ledger);
  const startingPeriod = state.periods.find(period => period.id === initialPeriodId);
  const startingConfigId = initialConfigId || startingPeriod?.configId || preferredSalaryConfigId(ledger);
  const startingConfig = state.configs.find(config => config.id === startingConfigId);
  let startingProjection: SalaryPeriod | null = null;
  try { if (startingConfig) startingProjection = startingPeriod ?? salaryPeriodForDate(ledger, startingConfig.id, today); } catch { /* The configuration can start in the future. */ }

  const [configId, setConfigId] = useState(startingConfigId);
  const [periodDate, setPeriodDate] = useState(startingProjection?.start ?? today);
  const suggest=(p:SalaryPeriod)=>p.end<viewerDay&&!state.periods.some(saved=>saved.id===p.id)?"":String(salaryPeriodRemaining(ledger,p));
  const [amount, setAmount] = useState(initialApplications?.length ? String(initialApplications.reduce((sum,item)=>sum+item.amount,0)) : startingProjection ? suggest(startingProjection) : "");
  const [accountId, setAccountId] = useState(salaryReceiptDefaults(ledger,startingConfigId).accountId || incomeDefaults(incomePreferences, ledger.accounts).accountId);
  const [receivedAt, setReceivedAt] = useState(()=>initialReceiptPlan?.dateAccuracy==="exact"&&initialReceiptPlan.date?`${initialReceiptPlan.date}T12:00`:localNow());
  const [method, setMethod] = useState<string>(salaryReceiptDefaults(ledger,startingConfigId).method);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [advanced, setAdvanced] = useState(Boolean(initialApplications?.length));
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [formExpanded, setFormExpanded] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState((startingProjection?.start ?? today).slice(0, 7));
  const [multiPeriod, setMultiPeriod] = useState(Boolean(initialApplications?.length));
  const [applications, setApplications] = useState<SalaryApplication[]>(()=>initialApplications?.map(item=>({...item}))??[]);
  const [receiptIncomeId,setReceiptIncomeId]=useState<string|null>(null);
  const [historicalSaved,setHistoricalSaved]=useState(false);
  const [quickCommitted,setQuickCommitted]=useState(false),[quickError,setQuickError]=useState(""),[quickReceiptMovementId,setQuickReceiptMovementId]=useState<string|null>(null);
  const [activationReviewPeriod,setActivationReviewPeriod]=useState<SalaryPeriod|null>(null);
  const [activationAmountEdited,setActivationAmountEdited]=useState(false);
  const [existingMovementId, setExistingMovementId] = useState("");
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty,setDirty]=useState(Boolean(initialApplications?.length||initialReceiptPlan));
  const savingRef = useRef(false);
  const periodGesture = useRef<{pointerId:number;x:number;y:number}|null>(null);
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
  const historicalAccuracy:SalaryPaymentDateAccuracy|undefined=initialReceiptPlan&&initialReceiptPlan.dateAccuracy!=="exact"?initialReceiptPlan.dateAccuracy:undefined;
  const historyDate=historicalAccuracy==="unknown"?today:initialReceiptPlan?.date??receivedDate;
  let timing = null;
  try { if (period && receivedAt) timing = salaryPaymentTiming(activationReviewPeriod?.id === period.id ? activationReviewPeriod : period, receivedAt); } catch { /* Keep the timing hint empty while a date is being edited. */ }

  let calculationLedger = ledger;
  if (period && !state.periods.some(item => item.id === period!.id)) calculationLedger = { ...ledger, salary: { ...state, periods: [...state.periods, period] } };
  const reviewingPeriod = period && activationReviewPeriod?.id === period.id ? activationReviewPeriod : null;
  const calculationReviewDate = reviewingPeriod && /^\d{4}-\d{2}-\d{2}$/.test(reviewingPeriod.payDate) ? reviewingPeriod.payDate : period?.payDate;
  const calculationPeriod = reviewingPeriod ? { ...reviewingPeriod, payDate: calculationReviewDate!, earned: true } : period;
  if (reviewingPeriod && period) {
    calculationLedger = { ...calculationLedger, salary: { ...salaryState(calculationLedger), periods: [...salaryState(calculationLedger).periods.filter(item => item.id !== period!.id), calculationPeriod!] } };
  }
  let calculatedApplications: SalaryApplication[] = [];
  let applicationError = "";
  if (period && numericAmount > 0 && Number.isSafeInteger(numericAmount)) {
    if (multiPeriod) calculatedApplications = applications;
    else {
      try { calculatedApplications = salaryPeriodApplications(calculationLedger, config!.id, calculationPeriod!.id, numericAmount); }
      catch (cause) { applicationError = cause instanceof Error ? cause.message : "El importe supera el saldo de este período."; }
    }
  }
  const applicationTotal = calculatedApplications.reduce((sum, item) => sum + item.amount, 0);
  const applicationBalance = numericAmount - applicationTotal;
  const presentation=calculationPeriod?salaryPeriodPresentation(calculationLedger,calculationPeriod,today):null;
  const temporalLabel=period?salaryTemporalLabel(ledger,period,viewerDay):"";
  const registrationTemporalLabel=temporalLabel==="Hoy"&&(period?.frequency??config?.frequency)==="Semanal"?"Semana en curso":temporalLabel;
  const expectedAmount=presentation?.expected??0;
  let lastPending:SalaryPeriod|null=null;
  try {if(config)lastPending=latestSalaryPeriodPending(ledger,config.id,viewerDay);}catch{/* Date boundary; ordinary navigation remains available. */}
  const receivedAmount=presentation?.received??0;
  const weekTone=presentation?.fullyPaid?"paid":presentation?.estimateKnown&&presentation.remaining>0?"overdue":"neutral";
  const selectedAccount = ledger.accounts.find(account => account.id === accountId && account.active);
  const isSavedPeriod = Boolean(period && state.periods.some(item => item.id === period!.id));
  const accountValid = Boolean(historicalAccuracy||linkedMovement||selectedAccount);
  const dateValid = historicalAccuracy==="unknown"||Boolean(historicalAccuracy==="approximate"?/^\d{4}-\d{2}-\d{2}$/.test(historyDate)&&historyDate<=today:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(receivedAt)&&receivedDate<=today);
  const duplicateExists = !historicalAccuracy&&!linkedMovement && salaryPaymentDuplicate(ledger,{configId,date:receivedAt,amount:numericAmount,accountId,reference,applications:calculatedApplications});
  const enoughApplications = numericAmount > 0 && applicationTotal === numericAmount;
  const canSave = Boolean(config && period && Number.isSafeInteger(numericAmount) && numericAmount > 0 && accountValid && dateValid && enoughApplications && (!reviewingPeriod || Boolean(reviewingPeriod.scheduledWorkDays?.length)) && !applicationError && !duplicateExists && !saving);
  const standardDetails=period?standardSalaryReceipt(ledger,period,today,incomeDefaults(incomePreferences,ledger.accounts).accountId):null;
  const quickStandardWeekAvailable=Boolean(standardDetails&&!historicalAccuracy&&!initialApplications?.length&&!initialReceiptPlan&&accountValid&&activationReviewPeriod?.id!==period?.id);
  const scheduledWorkLabel=calculationPeriod?salaryWorkSchedule(calculationPeriod).replace(/^Trabajo previsto:\s*/,""):"";
  const scheduledWorkCount=calculationPeriod?.scheduledWorkDays?.length??0;
  const receivedProgress=presentation?.estimateKnown&&expectedAmount>0?Math.max(0,Math.min(100,Math.round(receivedAmount/expectedAmount*100))):0;
  const currentPeriodApplied=calculationPeriod?calculatedApplications.filter(item=>item.periodId===calculationPeriod.id).reduce((sum,item)=>sum+item.amount,0):0;
  const projectedTotalValue=receivedAmount+(multiPeriod?currentPeriodApplied:numericAmount);
  const projectedTotal=Number.isSafeInteger(projectedTotalValue)?projectedTotalValue:null;
  const projectedPending=presentation?.estimateKnown&&projectedTotal!==null?Math.max(0,expectedAmount-projectedTotal):null;
  const projectedExcess=presentation?.estimateKnown&&projectedTotal!==null?Math.max(0,projectedTotal-expectedAmount):0;

  const confirmDiscard=()=>!dirty||window.confirm("Tienes cambios sin guardar. ¿Descartarlos?");
  const requestClose=()=>{if(!saving&&confirmDiscard())onClose();};

  const resetApplications = (nextPeriod: SalaryPeriod) => {
    setAmount(suggest(nextPeriod));
    setApplications([]);
    setMultiPeriod(false);
    setLocalError("");
    setActivationReviewPeriod(null);
    setActivationAmountEdited(false);
  };
  const updateActivationReview = (reviewed: SalaryPeriod | null) => {
    if (!reviewed) {
      setActivationReviewPeriod(null);
      setActivationAmountEdited(false);
      setFormExpanded(false);
      if (period) setAmount(suggest(period));
      setApplications([]);
      setMultiPeriod(false);
      setLocalError("");
      return;
    }
    const enteringReview = activationReviewPeriod?.id !== reviewed.id;
    const hasSavedPeriod=state.periods.some(saved=>saved.id===reviewed.id);
    const reviewTemplate=reviewed.end<today&&!hasSavedPeriod?{...reviewed,concepts:reviewed.concepts.map(concept=>({...concept,amount:0}))}:reviewed;
    setActivationReviewPeriod(reviewTemplate);
    if (enteringReview) {
      setAmount(hasSavedPeriod?String(salaryExpected(ledger, reviewTemplate, true)):"");
      setExistingMovementId("");
      setApplications([]);
      setMultiPeriod(false);
      setAdvanced(false);
      setFormExpanded(true);
      setActivationAmountEdited(false);
      setLocalError("");
    } else if (!activationAmountEdited) {
      setAmount(hasSavedPeriod?String(salaryExpected(ledger, reviewTemplate, true)):"");
    }
  };
  const selectPeriodDate = (date: string) => {
    if(!confirmDiscard())return;
    setDirty(false);
    try {
      const next = salaryPeriodForDate(ledger, config!.id, date);
      setPeriodDate(next.start);
      setCalendarMonth(next.start.slice(0,7));
      setCalendarOpen(false);
      setFormExpanded(true);

      resetApplications(next);

    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "No se pudo seleccionar el período."); }
  };
  const movePeriod = (direction: -1 | 1) => {
    if (!config || !period) return;
    if(!confirmDiscard())return;
    setDirty(false);
    try { const next=adjacentSalaryPeriod(ledger,period,direction);setPeriodDate(next.start);setCalendarMonth(next.start.slice(0,7));setCalendarOpen(false);setFormExpanded(true);resetApplications(next); }
    catch(cause) {setLocalError(cause instanceof Error?cause.message:"No se pudo cambiar de período.");}
  };
  const movePeriodMonth = (direction: -1 | 1) => {
    if (!config || !period) return;
    if(!confirmDiscard())return;
    setDirty(false);
    try { const date=shiftSalaryDate(period.start,direction,"months"),next=salaryPeriodForDate(ledger,config.id,date);setPeriodDate(next.start);setCalendarMonth(next.start.slice(0,7));setCalendarOpen(false);setFormExpanded(true);resetApplications(next); }
    catch(cause) {setLocalError(cause instanceof Error?cause.message:"No se pudo cambiar de mes.");}
  };
  const startPeriodGesture=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!event.isPrimary||event.button!==0||event.target instanceof Element&&event.target.closest("button,input,select,textarea,a,summary,label"))return;
    periodGesture.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const endPeriodGesture=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const start=periodGesture.current;
    if(!start||start.pointerId!==event.pointerId)return;
    periodGesture.current=null;
    const dx=event.clientX-start.x,dy=event.clientY-start.y,threshold=48;
    if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return;
    if(Math.abs(dx)>Math.abs(dy)*1.2)movePeriod(dx>0?-1:1);
    else if(Math.abs(dy)>Math.abs(dx)*1.2)movePeriodMonth(dy<0?-1:1);
  };
  const cancelPeriodGesture=(event:ReactPointerEvent<HTMLDivElement>)=>{if(periodGesture.current?.pointerId===event.pointerId)periodGesture.current=null;};

  const handleKeyboardNavigation = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLInputElement && !["checkbox", "radio"].includes(target.type))) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); movePeriod(-1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); movePeriod(1); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setFormExpanded(true); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setFormExpanded(false); }
  };

  const changeConfig = (nextConfigId: string) => {
    if(!confirmDiscard())return;
    setDirty(false);
    setConfigId(nextConfigId);
    setActivationReviewPeriod(null);
    setActivationAmountEdited(false);
    setFormExpanded(true);
    const receiptDefaults=salaryReceiptDefaults(ledger,nextConfigId);
    setAccountId(receiptDefaults.accountId||incomeDefaults(incomePreferences,ledger.accounts).accountId);
    setMethod(receiptDefaults.method);
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
      setAmount(suggest(target));
      setFormExpanded(true);
    } catch {
      const first = state.periods.filter(item => item.configId === nextConfig.id).sort((a, b) => a.start.localeCompare(b.start))[0];
      setPeriodDate(first?.start ?? nextConfig.start);
      setCalendarMonth((first?.start ?? nextConfig.start).slice(0, 7));
      setAmount(String(first ? salaryPeriodRemaining(ledger, first) : nextConfig.base + (nextConfig.extraConcepts ?? []).reduce((sum, item) => sum + item.amount, 0)));
      if(first)setFormExpanded(true);
    }
  };
  const toggleApplication = (periodId: string, conceptId: string, value: number) => {
    setDirty(true);
    setApplications(current => [...current.filter(item => item.periodId !== periodId || item.conceptId !== conceptId), ...(value > 0 ? [{ periodId, conceptId, amount: value }] : [])]);
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formExpanded || savingRef.current) return;
    setLocalError("");
    if (!config || !period) { setLocalError(periodError || "Selecciona un período salarial."); return; }
    if (!dateValid) { setLocalError(historicalAccuracy==="approximate"?"Indica una fecha aproximada igual o anterior a hoy.":"Indica la fecha real de recepción, igual o anterior a hoy."); setAdvanced(true); return; }
    if (!accountValid) { setLocalError("Selecciona una cuenta receptora activa."); return; }
    if (duplicateExists) { setLocalError("Ya existe un ingreso con estos mismos datos."); setAdvanced(true); return; }
    if (applicationError) { setLocalError(applicationError); setAdvanced(true); return; }
    if (applicationBalance !== 0) { setLocalError(`Distribuye todo el ingreso salarial entre períodos. Queda ${display(Math.abs(applicationBalance))} ${applicationBalance > 0 ? "por aplicar" : "aplicado de más"}.`); setAdvanced(true); return; }
    savingRef.current = true;
    setSaving(true);
    if(historicalAccuracy){
      const operation=(current:SalaryLedger)=>postHistoricalSalaryPayment(current,{id:paymentId,configId:config.id,date:historyDate,source:`salary-batch:${initialReceiptPlan?.groupId??paymentId}`,notes,applications:calculatedApplications,dateAccuracy:historicalAccuracy},today);
      try{operation(ledger);if(onSave(operation))setHistoricalSaved(true);else setLocalError("No se pudo guardar el pago histórico. Revisa el aviso de la aplicación e inténtalo de nuevo.");}
      catch(cause){setLocalError(cause instanceof Error?cause.message:"No se pudo registrar el pago histórico.");}
      finally{savingRef.current=false;setSaving(false);}
      return;
    }
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
      manual: {},
      selections: [],
      preparedPeriod: isSavedPeriod || reviewingPeriod ? undefined : period,
    };
    const operation = (current: SalaryLedger) => {
      const prepared = reviewingPeriod ? activateSalaryPeriod(current, reviewingPeriod, today) : current;
      return postSalaryPayment(prepared, input, today);
    };
    try {
      operation(ledger);
      if (onSave(operation)) { setDirty(false); setActivationReviewPeriod(null); setReceiptIncomeId(linkedMovement?.id ?? `salary-income:${paymentId}`); }
      else setLocalError("No se pudo guardar el pago. Revisa el aviso de la aplicación e inténtalo de nuevo.");
    } catch (cause) { setLocalError(cause instanceof Error ? cause.message : "No se pudo registrar el salario."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  const confirmQuickCommit=async()=>{
    setSaving(true);setQuickError("");
    try{await onConfirmSave();if(quickReceiptMovementId){setQuickCommitted(false);setReceiptIncomeId(quickReceiptMovementId);}else onClose();}
    catch(cause){setQuickError(cause instanceof Error?cause.message:"No se pudo confirmar la sincronización.");}
    finally{setSaving(false);}
  };
  const registerStandardSalary=()=>{
    if(!quickStandardWeekAvailable||!period||!standardDetails||!config||savingRef.current)return;
    savingRef.current=true;setSaving(true);setLocalError("");
    const id=crypto.randomUUID(),date=salaryLocalDateTime();
    const operation=(current:SalaryLedger)=>recordStandardSalaryPayment(current,period,{id,date,accountId:accountId||standardDetails.accountId,method:method||standardDetails.method,today});
    try{
      operation(ledger);
      if(!onSave(operation))throw new Error("No se pudo guardar el salario. Revisa el aviso de sincronización.");
       setQuickReceiptMovementId(`salary-income:${id}`);
       setQuickCommitted(true);
      savingRef.current=false;
      void confirmQuickCommit();
    }catch(cause){setLocalError(cause instanceof Error?cause.message:"No se pudo registrar el salario.");savingRef.current=false;setSaving(false);}
  };

  if(historicalSaved)return <FinanceDialog label="Pago histórico guardado" onClose={onClose}><section className={`flow-modal ${styles.dialog}`}><div className="flow-body"><h2>Pago histórico guardado</h2><p>{historicalAccuracy==="unknown"?"La fecha queda como desconocida.":`La fecha queda como aproximada: ${dayLabel(historyDate)}.`} El pago reduce el pendiente salarial, pero no crea un movimiento ni cambia cuentas o sobres.</p><button type="button" className="primary wide" onClick={onClose}>Listo</button></div></section></FinanceDialog>;
  if (receiptIncomeId) return <SalaryReceiptDialog ledger={ledger} envelopes={envelopes} incomeId={receiptIncomeId} today={today} display={display} onSave={onSave} onConfirmSave={onConfirmSave} onClose={onClose}/>;
  if (quickCommitted) return <FinanceDialog label="Salario ingresado" onClose={onClose}><section className={`flow-modal flow-body ${styles.dialog}`}><h2>Salario ingresado</h2><p>{uiCopyEs.salaryReceipt.alreadyRecordedUnassigned}</p>{quickError&&<p className="form-error" role="alert">{quickError}</p>}{quickError&&<button type="button" className="primary wide" disabled={saving} onClick={()=>void confirmQuickCommit()}>{saving?"Confirmando…":"Reintentar sincronización"}</button>}<button type="button" className="secondary wide" onClick={onClose}>Cerrar</button></section></FinanceDialog>;

  if (!state.configs.length) return <FinanceDialog label="Registrar salario" onClose={onClose}>
    <section className={`flow-modal ${styles.dialog}`}><header><h2>Registrar salario</h2><button type="button" aria-label="Cerrar" onClick={onClose}>×</button></header><div className="flow-body"><p>Configura primero tu salario habitual para preparar períodos y evitar ingresos duplicados.</p><button className="primary wide" onClick={onConfigure}>Configurar salario</button><button className="secondary wide" onClick={onClose}>Cancelar</button></div></section>
  </FinanceDialog>;

  return <FinanceDialog label="Registrar salario" onClose={requestClose} maxWidth={680}>
    <form className={`flow-modal flow-body ${styles.dialog}`} onSubmit={onSubmit} onKeyDown={handleKeyboardNavigation}>
      <header><div><small>INGRESO SALARIAL</small><h2>Registrar salario</h2><p className={styles.dialogSubtitle}>Registra un pago de tu salario y decide qué hacer con el dinero.</p></div><button type="button" aria-label="Cerrar" onClick={requestClose}>×</button></header>
      <label className={styles.configLabel}>Configuración salarial<select value={configId} disabled={Boolean(initialReceiptPlan)} onChange={event => changeConfig(event.target.value)}>{state.configs.map(item => <option key={item.id} value={item.id}>{item.employer} · {item.name}{item.active ? "" : " (inactiva)"}</option>)}</select></label>
      {historicalAccuracy&&<p className={styles.balance}>{historicalAccuracy==="unknown"?"Este depósito se guardará sin fecha conocida.":`Este depósito se guardará con fecha aproximada: ${dayLabel(historyDate)}.`} No creará un movimiento ni modificará los saldos de tus cuentas.</p>}
      {config && <>
        <section className={`${styles.periodCard} ${statusStyles.surface} ${statusStyles.weekSurface}`} data-tone={weekTone} aria-label="Período salarial">
          <div className={styles.salaryPeriodHeader} onPointerDown={startPeriodGesture} onPointerUp={endPeriodGesture} onPointerCancel={cancelPeriodGesture}>
            <div className={styles.periodTitleRow}>
              <button type="button" className={styles.periodArrow} aria-label="Período anterior" onClick={() => movePeriod(-1)} disabled={!period || period.start <= "0001-01-01"}><ChevronLeftRounded/></button>
              <div className={styles.periodTitle}>
                <strong>{period ? salaryPeriodLabel(period, config) : "Período salarial"}</strong>
                {period&&<span className={styles.temporalLabel}>{registrationTemporalLabel}</span>}
                {period&&<small>{dayLabel(period.start)} — {dayLabel(period.end)}</small>}
              </div>
              <button type="button" className={styles.periodArrow} aria-label="Período siguiente" onClick={() => movePeriod(1)} disabled={!period || period.end >= "9999-12-31"}><ChevronRightRounded/></button>
            </div>
            {period&&(presentation?.historicalEmpty||reviewingPeriod)&&<label className={styles.inlineActivation}><input type="checkbox" checked={Boolean(presentation?.confirmed||reviewingPeriod)} disabled={saving||Boolean(presentation?.confirmed&&!reviewingPeriod)} aria-expanded={Boolean(reviewingPeriod)} aria-controls={`salary-activation-review-${period.id}`} onChange={event=>updateActivationReview(event.target.checked?period:null)}/><span>Sin registros → Registrar</span></label>}
            {period&&!(presentation?.historicalEmpty||reviewingPeriod)&&<small className={styles.periodState} data-tone={weekTone}>{presentation?.state}{presentation?.overdueLabel?` · ${presentation.overdueLabel}`:""}</small>}
          </div>

          {period&&<div className={styles.periodFacts}>
            <div className={styles.periodFact}><div><AccountBalanceWalletOutlined/><span>Recibido</span></div><strong>{display(receivedAmount)}</strong></div>
            <div className={styles.periodFact}><div><PaidOutlined/><span>Salario esperado</span></div><strong>{presentation?.estimateKnown?display(expectedAmount):"Sin proyección"}</strong></div>
          </div>}

          {period&&presentation&&<div className={styles.periodProgress}>
            {presentation.estimateKnown&&expectedAmount>0&&<div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={receivedProgress} aria-label={`Recibido ${receivedProgress}% del salario esperado`}><span style={{width:`${receivedProgress}%`}}/></div>}
            <div className={styles.periodProgressFooter}>
              <span>{presentation.estimateKnown&&expectedAmount>0?`${receivedProgress}% recibido`:"Progreso no disponible"}</span>
              {calculationPeriod&&<details key={calculationPeriod.id} className={styles.weekDetail}>
              <summary><span><b>Ver detalles de la semana</b></span><ExpandMoreRounded aria-hidden="true"/></summary>
              <div className={styles.weekDetailBody}>
                <div><span>Trabajo previsto</span><b>{scheduledWorkLabel||"Sin horario configurado"}{scheduledWorkCount>0?` · ${scheduledWorkCount} días`:""}</b></div>
                <div><span>Pago previsto</span><b>{dayLabel(calculationPeriod.payDate ?? period.payDate)}</b></div>
                {calculationPeriod.concepts.map(concept=><div key={concept.id}><span>{concept.name}</span><b>{display(concept.amount)}</b></div>)}
                {salaryAdjustments(calculationLedger,calculationPeriod).map(item=><div key={item.id}><span>{item.name} · {item.status==="confirmed"?"Confirmado":"Estimado"}</span><b>{item.sign==="subtract"?"−":"+"}{display(item.amount)}</b></div>)}
                <div><span>Pagos registrados</span><b>{presentation.paymentCount?salaryPeriodPaymentLabel(calculationLedger,calculationPeriod):"Sin pagos"} · {display(receivedAmount)}</b></div>
                {period.notes&&<div><span>Notas</span><b>{period.notes}</b></div>}
                <div className={styles.weekDetailActions}>
                  <button type="button" className={styles.calendarButton} aria-expanded={calendarOpen} onClick={() => { setCalendarMonth((period?.start ?? today).slice(0, 7)); setCalendarOpen(value => !value); }}><CalendarMonthOutlined/>{calendarOpen?"Cerrar calendario":"Elegir en calendario"}</button>
                  <button type="button" className={styles.infoButton} aria-label={keyboardHelpOpen?"Ocultar información de navegación":"Información de navegación"} aria-expanded={keyboardHelpOpen} onClick={()=>setKeyboardHelpOpen(value=>!value)}>ⓘ</button>
                </div>
                {keyboardHelpOpen&&<div className={styles.helpMessage} role="note"><span>Arrastra: ←/→ cambia de semana y ↑/↓ cambia de mes. Teclado: ←/→ cambia de semana · ↓ muestra el formulario · ↑ lo oculta.</span><button type="button" className="text-btn" onClick={()=>setKeyboardHelpOpen(false)}>Ocultar esta información</button></div>}
                {calendarOpen&&<SalaryPeriodCalendar ledger={ledger} config={config} selected={period} today={today} month={calendarMonth} onMonth={setCalendarMonth} onSelect={selectPeriodDate}/>}
              </div>
              </details>}
            </div>
          </div>}

          {presentation?.historicalEmpty&&!reviewingPeriod&&<button type="button" className={styles.editPeriodButton} onClick={()=>updateActivationReview(period!)}><EditOutlined/> Ajustar semana</button>}
          {periodError && <p className="form-error" role="alert">{periodError}</p>}
          {period&&(viewerDay<period.start||viewerDay>period.end)&&<button type="button" className="secondary wide" onClick={()=>selectPeriodDate(viewerDay)}>Volver a la semana en curso</button>}
          {period && numericAmount>0 && timing&&<div className={styles.timingBanner} role="status"><CalendarMonthOutlined/><span>Si registras este pago: <b>{timing.label.replace("Pagado ","")}</b>{presentation?` · ${presentation.workState}`:""}</span></div>}
          {period&&(presentation?.historicalEmpty||!quickStandardWeekAvailable)&&<SalaryPeriodActivation key={`activate:${period.id}`} ledger={ledger} period={period} today={today} display={display} onSave={onSave} receiptMode hideTrigger={Boolean(presentation?.historicalEmpty||reviewingPeriod)} openReview={activationReviewPeriod?.id===period.id} onReviewChange={updateActivationReview}/>}
        </section>

        {!formExpanded&&<button type="button" className={styles.openFormButton} onClick={()=>setFormExpanded(true)}>Registro del pago <ChevronRightRounded/></button>}

        {formExpanded&&<fieldset className={styles.receiptFields} disabled={saving} aria-label="Datos del salario recibido">
          <div className={`${styles.fieldRow} ${styles.amountRow}`}>
            <label className={styles.fieldLabel} htmlFor="salary-received-amount"><PaidOutlined/>{uiCopyEs.salaryReceipt.newPaymentReceived}</label>
            <div className={styles.fieldControl}><div className={`currency-input ${styles.amountInput}`}><span>₡</span><input id="salary-received-amount" inputMode="numeric" type="number" min="1" step="1" required value={amount} onChange={event => { setAmount(event.target.value); setDirty(true); if (reviewingPeriod) setActivationAmountEdited(true); setLocalError(""); }}/><button type="button" aria-label={uiCopyEs.salaryReceipt.clearNewPaymentReceived} disabled={!amount||saving} onClick={()=>{setAmount("");setDirty(true);setLocalError("");if(reviewingPeriod)setActivationAmountEdited(true);}}><CloseRounded/></button></div>
              <div className={styles.receiptPreview} role="group" aria-label={uiCopyEs.salaryReceipt.projection}>
                <div><span>Recibido anteriormente</span><b>{display(receivedAmount)}</b></div>
                <div><span>{uiCopyEs.salaryReceipt.totalAfterRegister}</span><b>{projectedTotal===null?"—":display(projectedTotal)}</b></div>
                <div><span>{uiCopyEs.salaryReceipt.remainingPending}</span><b>{projectedPending===null?"Sin proyección":display(projectedPending)}</b></div>
              </div>
              <p className={styles.balance}>Pendiente confirmado ahora: {display(presentation?.pending??0)}{projectedExcess>0&&<strong className={styles.excess}> Excedente proyectado: {display(projectedExcess)}. Revisa la distribución entre períodos en Más opciones.</strong>}</p>
              {quickStandardWeekAvailable&&standardDetails&&<button type="button" className={styles.quickCommitLink} disabled={saving} onClick={registerStandardSalary}><CheckCircleOutlineRounded aria-hidden="true"/><span>Registrar salario completo · {display(standardDetails.amount)}<small>{ledger.accounts.find(item=>item.id===(accountId||standardDetails.accountId))?.name??"Cuenta receptora"} · {method||standardDetails.method}</small></span></button>}
            </div>
          </div>
          {period&&<SalaryAdjustments key={`adjust:${period.id}`} ledger={ledger} period={period} today={today} display={display} appearance="receipt" onSave={operation=>{if(!onSave(operation))throw new Error("No se pudieron guardar los ajustes.");}}/>}
          {!historicalAccuracy&&<>
            {linkedMovement?<div className={styles.fieldRow}><span className={styles.fieldLabel}><AccountBalanceWalletOutlined/>Cuenta del ingreso existente</span><div className={`${styles.fieldControl} ${styles.accountValue}`}><b>{ledger.accounts.find(account=>account.id===linkedMovement.accountId)?.name??"Cuenta histórica"}</b></div></div>:<div className={styles.receiverPair}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}><AccountBalanceWalletOutlined/>Cuenta receptora</span><div className={styles.fieldControl}><AccountSelector className={styles.inlineAccount} label="" ariaLabel="Cuenta receptora" accounts={ledger.accounts} value={accountId} onChange={value=>{setAccountId(value);setDirty(true);}} onCreate={onCreateAccount} display={display}/><small>El saldo mostrado es actual; el ingreso se suma al confirmar.</small></div></div>
              <label className={styles.fieldRow}><span className={styles.fieldLabel}><SwapHorizRounded/>Medio de recepción</span><select className={styles.fieldControl} value={method} onChange={event => {setMethod(event.target.value);setDirty(true);}}>{[...new Set([...incomeReceptionMethods, method])].filter(Boolean).map(item => <option key={item}>{item}</option>)}</select></label>
            </div>}
          </>}

          <details className={styles.moreOptions} open={advanced} onToggle={event => setAdvanced(event.currentTarget.open)}>
            <summary><span>Más opciones</span><ExpandMoreRounded/></summary>
            <div className={styles.advancedFields}>
              {!historicalAccuracy&&<><label>Fecha real de recepción<input type="datetime-local" max={localNow()} value={linkedMovement ? currentDateTime(linkedMovement.date) : receivedAt} disabled={Boolean(linkedMovement)} onChange={event => { setReceivedAt(event.target.value); setDirty(true); setLocalError(""); }}/></label>
              <label>Referencia<input value={linkedMovement?.reference ?? reference} disabled={Boolean(linkedMovement)} onChange={event => {setReference(event.target.value);setDirty(true);}} placeholder="Opcional"/></label></>}
              <label>Observaciones<textarea value={notes} onChange={event => {setNotes(event.target.value);setDirty(true);}} placeholder="Opcional"/></label>
              {!historicalAccuracy&&<label>Origen del ingreso<select value={existingMovementId} onChange={event => {
                const id = event.target.value;
                const movement = paymentMovements.find(item => item.id === id);
                setExistingMovementId(id);setDirty(true);
                if (movement) { setAmount(String(movement.amount ?? "")); setAccountId(movement.accountId ?? ""); setReceivedAt(currentDateTime(movement.date)); setMethod(movement.paymentMethod ?? "Transferencia"); setReference(movement.reference ?? ""); }
                setLocalError("");
              }}><option value="">Crear un movimiento al confirmar</option>{paymentMovements.map(movement => <option key={movement.id} value={movement.id}>Vincular {movement.name} · {dayLabel(movement.date)} · {display(movement.amount)}</option>)}</select><small>Vincular un ingreso existente lo relaciona con el período sin volver a sumar dinero.</small></label>}
              <label className="check-label"><input type="checkbox" checked={multiPeriod} onChange={event => { setMultiPeriod(event.target.checked); setApplications([]); setDirty(true); setLocalError(""); }}/>Aplicar este pago a varios períodos</label>
              {multiPeriod&&<small>Se registrará un solo ingreso por {display(numericAmount)} y se distribuirá entre los conceptos y períodos seleccionados.</small>}
              {multiPeriod && <div className={styles.applications}>
                {candidates.map(item => <fieldset key={item.id}><legend>{salaryPeriodLabel(item, config)} · {dayLabel(item.start)} — {dayLabel(item.end)}</legend>{salaryPaymentConcepts(ledger,item).map(concept => {
                  const pending = concept.amount - salaryConceptPaid(ledger,item.id,concept.id);
                  if (pending <= 0) return null;
                  const applied = applications.find(application => application.periodId === item.id && application.conceptId === concept.id)?.amount ?? "";
                  return <label key={concept.id}>{concept.name} · Pendiente {display(pending)}<input type="number" min="0" max={pending} step="1" value={applied} onChange={event => toggleApplication(item.id, concept.id, Number(event.target.value))}/></label>;
                })}</fieldset>)}
                <div className="review-box"><span>Recibido: {display(numericAmount)}</span><span>Aplicado: {display(applicationTotal)}</span><b>Por aplicar: {display(applicationBalance)}</b></div>
              </div>}
            </div>
          </details>

          {(localError || externalError || applicationError || duplicateExists) && <p className="form-error" role="alert">{localError || externalError || (duplicateExists ? "Ya existe un ingreso con estos mismos datos. Vincúlalo desde Más opciones para evitar duplicarlo." : applicationError)}</p>}
          <div className={styles.actionFooter}><button className={`primary wide ${styles.submitButton}`} type="submit" disabled={!canSave}><CheckCircleOutlineRounded/>{saving ? "Registrando…" : historicalAccuracy ? "Guardar pago histórico" : reviewingPeriod ? "Guardar semana y registrar salario" : linkedMovement ? "Vincular ingreso al salario" : "Confirmar y registrar salario"}{!saving&&!historicalAccuracy&&!linkedMovement&&<small>{display(numericAmount)} · {selectedAccount?.name??"Cuenta seleccionada"} · {method}</small>}</button>
          <button type="button" className="secondary wide" onClick={requestClose}>Cancelar</button></div>
        </fieldset>}
        {lastPending&&lastPending.id!==period?.id&&<button type="button" className={styles.lastPending} onClick={()=>selectPeriodDate(lastPending!.start)}><span aria-hidden="true">↶</span><b>Volver al último período pendiente</b><small>{salaryPeriodLabel(lastPending,config)}</small></button>}
      </>}
    </form>
  </FinanceDialog>;
}
