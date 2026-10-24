"use client";

import { useMemo, useRef, useState } from "react";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import EventRepeatOutlined from "@mui/icons-material/EventRepeatOutlined";
import MoreVertOutlined from "@mui/icons-material/MoreVertOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { uiCopyEs } from "@/lib/ui-copy";
import { FinanceDialog } from "@/components/finance-dialog";
import { deriveReminderRecords, summarizeReminders, type ReminderRecord, type ReminderStatus } from "@/lib/finance-reminders";
import type { LedgerMovement } from "@/lib/finance-ledger";
import type { ReminderEnvelope } from "@/lib/finance-reminders";
import styles from "./reminders-screen.module.css";

type Filter = "all" | "upcoming" | "overdue" | "completed";
type Sort = "soonest" | "latest" | "high" | "low";
type PostponeTarget = { item: ReminderRecord; date: string } | null;
type OmitTarget = ReminderRecord | null;
type ContributionTarget = { item: ReminderRecord; amount: string } | null;

const labels: Record<ReminderStatus, string> = { upcoming: "Próximo", overdue: "Vencido", partial: "Abono parcial", completed: "Realizado", postponed: "Pospuesto", omitted: "Omitido" };
const kindLabels = { contribution: "Aporte a sobre", payment: "Pago programado", goal: "Meta financiera" };
const dayDistance = (date: string, today: string) => Math.round((new Date(`${date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86400000);
const dateLabel = (date?: string) => date ? new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeZone: "America/Costa_Rica" }).format(new Date(`${date}T12:00:00Z`)) : "Sin fecha definida";
const relativeDate = (date: string | undefined, today: string) => {
  if (!date) return "Sin fecha definida";
  const distance = dayDistance(date, today);
  return distance === 0 ? "Hoy" : distance > 0 ? `En ${distance} ${distance === 1 ? "día" : "días"}` : `Hace ${Math.abs(distance)} ${Math.abs(distance) === 1 ? "día" : "días"}`;
};

export function RemindersScreen({ envelopes, movements, today, display, available, privateMode, reminderEnvelopeId, onClearEnvelope, onCalendar, onOpenPayment, onOpenGoal, onConfirmContribution, onPostponeContribution, onSkipContribution, onPostponeScheduled, onSkipScheduled, onOpenMovement }: {
  envelopes: ReminderEnvelope[];
  movements: LedgerMovement[];
  today: string;
  display: (amount: number) => string;
  available: number;
  privateMode: boolean;
  reminderEnvelopeId: string | null;
  onClearEnvelope: () => void;
  onCalendar: (date?: string) => void;
  onOpenPayment: (envelopeId: string, itemId: string) => void;
  onOpenGoal: (envelopeId: string) => void;
  onConfirmContribution: (envelopeId: string, expectedDate: string, amount: number) => boolean;
  onPostponeContribution: (envelopeId: string) => void;
  onSkipContribution: (envelopeId: string, expectedDate: string) => void;
  onPostponeScheduled: (envelopeId: string, itemId: string, date: string) => void;
  onSkipScheduled: (envelopeId: string, itemId: string, date: string) => void;
  onOpenMovement: (movementId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("soonest");
  const [pageSize, setPageSize] = useState(20);
  const [postpone, setPostpone] = useState<PostponeTarget>(null);
  const [omit, setOmit] = useState<OmitTarget>(null);
  const [contribution, setContribution] = useState<ContributionTarget>(null);
  const contributionSubmitting = useRef(false);
  const records = useMemo(() => deriveReminderRecords(envelopes, movements, today).filter(item => !reminderEnvelopeId || item.envelopeId === reminderEnvelopeId), [envelopes, movements, today, reminderEnvelopeId]);
  const summary = useMemo(() => summarizeReminders(records, today), [records, today]);
  const shown = useMemo(() => {
    const matchesFilter = (item: ReminderRecord) => {
      if (filter === "all") return true;
      if (filter === "upcoming") return (item.status === "upcoming" || item.status === "postponed" || item.status === "partial") && Boolean(item.date && item.date >= today && dayDistance(item.date, today) <= 30);
      if (filter === "overdue") return item.status === "overdue";
      return item.status === "completed" && (item.kind === "goal" || Boolean(item.performedDate));
    };
    const filtered = records.filter(matchesFilter);
    const statusOrder: Record<ReminderStatus, number> = { overdue: 0, upcoming: 1, partial: 2, postponed: 3, completed: 4, omitted: 5 };
    return [...filtered].sort((a, b) => {
      if (filter === "all") {
        const delta = statusOrder[a.status] - statusOrder[b.status];
        if (delta) return delta;
      }
      if (sort === "high") return b.amount - a.amount || (a.date ?? "9999").localeCompare(b.date ?? "9999");
      if (sort === "low") return a.amount - b.amount || (a.date ?? "9999").localeCompare(b.date ?? "9999");
      const delta = (a.date ?? "9999").localeCompare(b.date ?? "9999");
      return sort === "latest" ? -delta : delta;
    });
  }, [records, filter, sort, today]);
  const visible = shown.slice(0,pageSize);

  function relativeAmount(item: ReminderRecord) {
    return display(item.amount);
  }
  function requestOmit(item: ReminderRecord) { setOmit(item); }
  function confirmOmit() {
    if (!omit) return;
    if (omit.kind === "contribution" && omit.expectedDate) onSkipContribution(omit.envelopeId, omit.expectedDate);
    else if (omit.kind === "payment" && omit.itemId) onSkipScheduled(omit.envelopeId, omit.itemId, today);
    setOmit(null);
  }
  function openContribution(item: ReminderRecord) {
    const amount = Math.min(item.amount, Math.max(0, available));
    setContribution({ item, amount: amount > 0 ? String(amount) : "" });
  }
  function confirmContribution() {
    if (!contribution?.item.expectedDate || contributionSubmitting.current) return;
    const amount = Number(contribution.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > Math.min(contribution.item.amount, Math.max(0, available))) return;
    contributionSubmitting.current = true;
    try { if (onConfirmContribution(contribution.item.envelopeId, contribution.item.expectedDate, amount)) setContribution(null); }
    finally { contributionSubmitting.current = false; }
  }
  function confirmPostpone() {
    if (!postpone) return;
    if (postpone.item.kind === "contribution") onPostponeContribution(postpone.item.envelopeId);
    else if (postpone.item.kind === "payment" && postpone.item.itemId) onPostponeScheduled(postpone.item.envelopeId, postpone.item.itemId, postpone.date);
    setPostpone(null);
  }

  return <section className={`section page-panel ${styles.screen}`}>
    <div className={styles.topline}>
      <button type="button" className={styles.calendarLink} onClick={() => onCalendar()}><CalendarMonthOutlined aria-hidden="true"/>{uiCopyEs.calendarActions.reminderLink}<span aria-hidden="true">›</span></button>
    </div>
    {reminderEnvelopeId && <div className={styles.contextFilter}><span>Filtrando por sobre: {privateMode ? "Sobre oculto" : envelopes.find(item => item.id === reminderEnvelopeId)?.name ?? "Sobre"}</span><button type="button" onClick={onClearEnvelope}>Ver todos</button></div>}

    <div className={styles.summary} aria-label="Resumen de compromisos">
      <button type="button" className={`${styles.summaryCard} ${styles.next}`} aria-pressed={filter === "upcoming"} onClick={() => setFilter(filter === "upcoming" ? "all" : "upcoming")}>
        <span className={styles.summaryIcon}><EventRepeatOutlined aria-hidden="true"/></span><span className={styles.summaryCopy}><b>{summary.upcoming.count}</b><strong>Próximos</strong><em>{display(summary.upcoming.amount)}</em><small>En los próximos 30 días</small></span><span className={styles.summaryChevron}>›</span>
      </button>
      <button type="button" className={`${styles.summaryCard} ${styles.late}`} aria-pressed={filter === "overdue"} onClick={() => setFilter(filter === "overdue" ? "all" : "overdue")}>
        <span className={styles.summaryIcon}><WarningAmberOutlined aria-hidden="true"/></span><span className={styles.summaryCopy}><b>{summary.overdue.count}</b><strong>Vencidos</strong><em>{display(summary.overdue.amount)}</em><small>Requieren atención</small></span><span className={styles.summaryChevron}>›</span>
      </button>
      <button type="button" className={`${styles.summaryCard} ${styles.done}`} aria-pressed={filter === "completed"} onClick={() => setFilter(filter === "completed" ? "all" : "completed")}>
        <span className={styles.summaryIcon}><CheckCircleOutlineOutlined aria-hidden="true"/></span><span className={styles.summaryCopy}><b>{summary.completed.count}</b><strong>Realizados</strong><em>{display(summary.completed.amount)}</em><small>Pagos y aportes · este mes</small></span><span className={styles.summaryChevron}>›</span>
      </button>
    </div>
    <p className={styles.summaryNote}>Los totales cuentan pagos y aportes; las metas se muestran como objetivos, no como deudas.</p>

    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Filtrar compromisos">
        {([ ["all", "Todos"], ["upcoming", "Próximos"], ["overdue", "Vencidos"], ["completed", "Realizados"] ] as [Filter, string][]).map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>
      <label className={styles.sort}>Ordenar<select value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="soonest">Fecha más próxima</option><option value="latest">Fecha más reciente</option><option value="high">Importe mayor</option><option value="low">Importe menor</option></select></label>
    </div>

    <div className={styles.list}>
      {visible.map(item => {
        const pending = item.status === "upcoming" || item.status === "overdue" || item.status === "postponed" || item.status === "partial";
        const envelopeName = privateMode ? "Sobre oculto" : item.envelopeName;
        const title = privateMode ? kindLabels[item.kind] : item.title;
        const insufficient = item.kind === "contribution" && (item.status === "overdue" || item.status === "partial") && available < item.amount;
        return <article className={styles.card} key={item.key} data-status={item.status}>
          <span className={styles.envelopeIcon} aria-hidden="true">{privateMode ? "◷" : item.envelopeIcon}</span>
          <div className={styles.copy}>
            <div className={styles.titleLine}><h3>{title}</h3><span className={styles.status} data-status={item.status}>{labels[item.status]}</span></div>
            <p className={styles.envelopeName}>{envelopeName} · {kindLabels[item.kind]}</p>
            {item.date && <p className={styles.dateLine}><CalendarMonthOutlined aria-hidden="true"/><time dateTime={item.date}>{dateLabel(item.date)}</time><span>{item.status === "completed" ? item.kind === "goal" ? "Meta" : "Registrado" : relativeDate(item.date, today)}</span></p>}
            {item.detail && <p className={styles.detail}>{privateMode ? "Detalle oculto por privacidad." : item.detail}</p>}
            {insufficient && <p className={styles.warning}>{uiCopyEs.availableFunds.reminderShortage(display(item.amount - available))}</p>}
            {item.kind === "goal" && item.progress !== undefined && <div className={styles.progress} aria-label={`Progreso de la meta ${Math.round(item.progress)}%`}><span style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}/></div>}
          </div>
          <div className={styles.amountArea}><strong>{relativeAmount(item)}</strong>{item.kind === "goal" && <small>restante</small>}</div>
          <div className={styles.actions}>
            {item.status === "completed" && item.kind === "payment" && item.itemId ? <button type="button" className={styles.secondaryAction} onClick={() => onOpenPayment(item.envelopeId, item.itemId!)}>Ver historial de pagos</button>
              : item.status === "completed" && item.movementId ? <button type="button" className={styles.secondaryAction} onClick={() => onOpenMovement(item.movementId!)}>Ver movimiento</button>
              : pending && item.kind === "payment" && item.itemId ? <button type="button" className="primary" onClick={() => onOpenPayment(item.envelopeId, item.itemId!)}>Registrar pago</button>
              : pending && item.kind === "contribution" && item.expectedDate ? <button type="button" className="primary" onClick={() => openContribution(item)}>Registrar aporte</button>
              : pending && item.kind === "contribution" ? <button type="button" className={styles.secondaryAction} onClick={() => onCalendar(item.date)}>{uiCopyEs.calendarActions.view}</button>
              : item.kind === "goal" ? <button type="button" className={styles.secondaryAction} onClick={() => onOpenGoal(item.envelopeId)}>Ver meta</button>
              : item.kind === "payment" && item.itemId ? <button type="button" className={styles.secondaryAction} onClick={() => onOpenPayment(item.envelopeId, item.itemId!)}>Ver detalle</button> : null}
            {pending && (item.kind === "payment" || (item.kind === "contribution" && Boolean(item.expectedDate))) && <details className={styles.more}><summary aria-label="Más opciones"><MoreVertOutlined aria-hidden="true"/></summary><div className={styles.moreMenu}><button type="button" onClick={() => setPostpone({ item, date: "" })}>Posponer esta ocasión</button><button type="button" onClick={() => requestOmit(item)}>Omitir esta ocasión</button></div></details>}
          </div>
        </article>;
      })}
      {shown.length > pageSize && <button type="button" className={styles.secondaryAction} onClick={() => setPageSize(value=>value+20)}>Mostrar 20 más</button>}
      {!shown.length && <div className={styles.empty}><span aria-hidden="true">◷</span><b>{records.length ? "No hay compromisos en este filtro." : "No tienes recordatorios pendientes."}</b><small>{records.length ? "Prueba otro filtro o consulta el calendario." : "Los próximos aportes, pagos y metas aparecerán aquí cuando tengan una fecha configurada."}</small><button type="button" className={styles.secondaryAction} onClick={() => onCalendar()}>{uiCopyEs.calendarActions.open}</button></div>}
    </div>
    <details className={styles.info}><summary>¿Cómo funcionan los recordatorios?</summary><p>Los aportes y pagos requieren tu confirmación. Asignar dinero a un sobre no se registra como gasto; los pagos usan el flujo existente. Las metas solo muestran progreso y no mueven dinero automáticamente.</p></details>

    {postpone && <FinanceDialog label="Posponer compromiso" onClose={() => setPostpone(null)}><section className="flow-modal"><header><div><h2>Posponer esta ocasión</h2><p>{privateMode ? "Compromiso" : postpone.item.title}</p></div><button type="button" aria-label="Cerrar" onClick={() => setPostpone(null)}>×</button></header><div className="flow-body"><p className="flow-intro">Solo cambia esta ocurrencia. No se registra ningún movimiento ni se desplaza la serie futura.</p>{postpone.item.kind === "contribution" ? <><p>Elige un plazo; la siguiente fecha de la serie permanece igual.</p><button type="button" className="primary wide" onClick={() => { onPostponeContribution(postpone.item.envelopeId); setPostpone(null); }}>Elegir plazo</button></> : <><label htmlFor="reminder-new-date">Nueva fecha</label><input id="reminder-new-date" type="date" min={today} value={postpone.date} onChange={event => setPostpone({ ...postpone, date: event.target.value })}/><button type="button" className="primary wide" disabled={!postpone.date || postpone.date <= (postpone.item.date ?? today)} onClick={confirmPostpone}>Guardar nueva fecha</button></>}<button type="button" className="secondary wide" onClick={() => setPostpone(null)}>Cancelar</button></div></section></FinanceDialog>}
    {omit && <FinanceDialog label="Omitir compromiso" onClose={() => setOmit(null)}><section className="flow-modal"><header><div><h2>Omitir esta ocasión</h2><p>{privateMode ? "Compromiso" : omit.title}</p></div><button type="button" aria-label="Cerrar" onClick={() => setOmit(null)}>×</button></header><div className="flow-body"><p className="flow-intro">{(omit.paidAmount ?? 0) > 0 ? `Se conservarán los abonos de ${privateMode ? "••••••" : display(omit.paidAmount!)} y se omitirá solo el saldo pendiente. No se registrará un reembolso.` : "Se conservará en el historial y no se registrará ningún movimiento financiero."} La siguiente fecha de la serie se mantendrá.</p><div className="review-box"><b>{privateMode ? "Importe oculto" : display(omit.amount)}</b><span>Fecha programada: {dateLabel(omit.date)}</span><span>Sobre: {privateMode ? "Sobre oculto" : omit.envelopeName}</span></div><button type="button" className="primary wide" onClick={confirmOmit}>Confirmar omisión</button><button type="button" className="secondary wide" onClick={() => setOmit(null)}>Cancelar</button></div></section></FinanceDialog>}
    {contribution && <FinanceDialog label="Registrar aporte programado" onClose={() => setContribution(null)}><section className="flow-modal"><header><div><h2>Registrar aporte</h2><p>{privateMode ? "Sobre oculto" : contribution.item.envelopeName}</p></div><button type="button" aria-label="Cerrar" onClick={() => setContribution(null)}>×</button></header><div className="flow-body"><p className="flow-intro">{uiCopyEs.availableFunds.contributionInstructions}</p><div className="review-box"><b>Programado: {privateMode ? "••••••" : display(contribution.item.amount + (contribution.item.paidAmount ?? 0))}</b>{(contribution.item.paidAmount ?? 0) > 0 && <span>Abonado: {privateMode ? "••••••" : display(contribution.item.paidAmount!)} · Pendiente: {privateMode ? "••••••" : display(contribution.item.amount)}</span>}<span>{uiCopyEs.money.availableToAssign}: {privateMode ? "••••••" : display(Math.max(0, available))}</span><span>Fecha de la ocurrencia: {dateLabel(contribution.item.date)}</span></div><label htmlFor="reminder-contribution-amount">Importe a asignar</label><div className="currency-input"><span>₡</span><input id="reminder-contribution-amount" type={privateMode ? "password" : "number"} inputMode="numeric" min="1" max={Math.min(contribution.item.amount, Math.max(0, available))} step="1" value={contribution.amount} onChange={event => setContribution({ ...contribution, amount: event.target.value })}/></div>{available < contribution.item.amount && <p className={styles.warning}>{available > 0 ? uiCopyEs.availableFunds.partialContribution(privateMode ? "••••••" : display(available)) : uiCopyEs.availableFunds.noContributionFunds}</p>}<button type="button" className="primary wide" disabled={!Number.isSafeInteger(Number(contribution.amount)) || Number(contribution.amount) <= 0 || Number(contribution.amount) > Math.min(contribution.item.amount, Math.max(0, available))} onClick={confirmContribution}>Confirmar asignación</button><button type="button" className="secondary wide" onClick={() => setContribution(null)}>Cancelar</button></div></section></FinanceDialog>}
  </section>;
}
