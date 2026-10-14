"use client";

import { envelopeLabel } from "@/lib/envelope-label";
import { createPortal } from "react-dom";
import ViewListOutlined from "@mui/icons-material/ViewListOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import { useThemeMode } from "@/components/theme-provider";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { canShowThreeColumns, envelopeGridColumns, isAdaptiveEnvelopeGrid, type EnvelopeView } from "@/lib/envelope-view";
import { getEnvelopeGoal, type GoalSettings } from "@/lib/envelope-goals";
import { planningIndicatorGroups, planningItems, planningCoverage, proximityLabels, type ProximityFilter, type EnvelopePlanning } from "@/lib/envelope-planning";
import { TemporalDot } from "@/components/temporal-indicator";
import type { Recurrence } from "@/lib/finance-recurrence";
import styles from "./envelope-collection.module.css";

type EnvelopeItem = { id: string; name: string; icon: string; color: string; balance: number; recurrence?: Recurrence } & GoalSettings & EnvelopePlanning;
type Drag = { id: string; ids: string[]; original: string[]; keyboard: boolean };
type PendingPress = { x: number; y: number; pointerId: number; envelopeId: string; anchor: HTMLButtonElement; started: number; timer: ReturnType<typeof setTimeout> };

export function EnvelopeCollection({ envelopes, view, menuId, display, privateMode, today, onList, onGrid, onMenu, onPlanning, planningId, onCreate, onReorder, showProximity = true, viewAnchor }: {
  viewAnchor?: HTMLDivElement | null;
  showProximity?: boolean;
  envelopes: EnvelopeItem[];
  view: EnvelopeView;
  menuId?: string;
  display: (amount: number) => string;
  privateMode: boolean;
  today: string;
  onList: () => void;
  onGrid: () => void;
  onMenu: (id: string, anchor: HTMLButtonElement) => void;
  onPlanning: (id: string, anchor: HTMLButtonElement, filter?: ProximityFilter) => void;
  planningId?: string;
  onCreate: () => void;
  onReorder: (ids: string[]) => void;
}) {
  const {scale}=useThemeMode();
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const pending = useRef<PendingPress | null>(null);
  const drag = useRef<Drag | null>(null);
  const pointerType = useRef("mouse");
  const lastTap = useRef<{id:string;time:number;x:number;y:number}|null>(null);
  const [preview, setPreview] = useState<Drag | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [reorderError, setReorderError] = useState("");
  const grid = view.envelopesViewMode === "grid";
  const nextColumns = grid && view.envelopesGridColumns === 2 ? 3 : 2;
  const adaptive = isAdaptiveEnvelopeGrid(width);
  const columns = envelopeGridColumns(view.envelopesGridColumns, width);
  const nextVisibleColumns = envelopeGridColumns(nextColumns, width);
  const density = view.envelopesGridColumns === 3 ? "compacta" : "cómoda";
  const nextDensity = nextColumns === 3 ? "compacta" : "cómoda";
  const canUseThree = width !== null && canShowThreeColumns(width);
  const unavailableGrid = grid && view.envelopesGridColumns === 3 && !canUseThree;
  const blockedNext = nextColumns === 3 && !canUseThree;
  const byId = new Map(envelopes.map(envelope => [envelope.id, envelope]));
  const ordered = preview ? [...preview.ids.map(itemId => byId.get(itemId)).filter((item): item is EnvelopeItem => Boolean(item)), ...envelopes.filter(item => !preview.ids.includes(item.id))] : envelopes;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width/scale));
    observer.observe(element);
    return () => observer.disconnect();
  }, [scale]);
  useEffect(() => () => { if (pending.current) clearTimeout(pending.current.timer); }, []);

  function start(idToMove: string, keyboard: boolean) {
    setReorderError("");
    const ids = envelopes.map(envelope => envelope.id);
    drag.current = { id: idToMove, ids, original: [...ids], keyboard };
    setPreview(drag.current);
    setAnnouncement(`Reordenando ${byId.get(idToMove)?.name ?? "sobre"}. ${keyboard ? "Usa las flechas; pulsa Enter para guardar o Escape para cancelar." : "Arrastra hasta la posición deseada y suelta para guardar."}`);
  }

  function moveTo(targetIndex: number) {
    const active = drag.current;
    if (!active || targetIndex < 0) return;
    const currentIndex = active.ids.indexOf(active.id);
    const nextIndex = Math.max(0, Math.min(active.ids.length - 1, targetIndex));
    if (currentIndex === nextIndex) return;
    const ids = [...active.ids];
    ids.splice(currentIndex, 1);
    ids.splice(nextIndex, 0, active.id);
    drag.current = { ...active, ids };
    setPreview(drag.current);
    setAnnouncement(`Posición ${nextIndex + 1} de ${ids.length}.`);
  }

  function finish(save: boolean) {
    const active = drag.current;
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
    drag.current = null;
    setPreview(null);
    if (!active) return;
    const changed = active.ids.some((item, index) => item !== active.original[index]);
    if (save && changed) {
      try {
        onReorder(active.ids);
      } catch (error) {
        const storageError = error instanceof DOMException;
        const detail = !storageError && error instanceof Error ? ` ${error.message}` : " Revisa el espacio disponible y los permisos de almacenamiento del navegador.";
        setReorderError(`No se pudo guardar el orden. Se conserva el orden anterior.${detail}`);
        setAnnouncement("");
        return;
      }
    }
    setAnnouncement(save && changed ? "Orden de sobres guardado." : "Se conservó el orden anterior.");
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, envelopeId: string) {
    if (!event.isPrimary || event.button !== 0) return;
    pointerType.current = event.pointerType;
    if (drag.current || pending.current) finish(false);
    // Keep short clicks on the icon; capture switches to the collection only when sorting.
    event.currentTarget.setPointerCapture(event.pointerId);
    pending.current = {
      x: event.clientX, y: event.clientY, pointerId: event.pointerId, envelopeId, anchor:event.currentTarget, started:event.timeStamp,
      timer: setTimeout(() => { container.current?.setPointerCapture(event.pointerId); lastTap.current=null; start(envelopeId, false); }, 350),
    };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const press = pending.current;
    if (!press || press.pointerId !== event.pointerId) return;
    if (!drag.current) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {lastTap.current=null; finish(false); }
      return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-envelope-id]");
    if (!target || !container.current?.contains(target)) return;
    const targetId = target.dataset.envelopeId;
    if (targetId) moveTo(drag.current.ids.indexOf(targetId));
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pending.current?.pointerId !== event.pointerId) return;
    const press=pending.current;
    const stamp=event.timeStamp;
    const tap=event.pointerType==="touch"&&!drag.current&&stamp-press.started<350;
    const previous=lastTap.current;
    finish(true);
    if(tap) {
      if(previous?.id===press.envelopeId&&stamp-previous.time<350&&Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<24) {
        lastTap.current=null; onMenu(press.envelopeId,press.anchor);
      } else lastTap.current={id:press.envelopeId,time:stamp,x:event.clientX,y:event.clientY};
    } else lastTap.current=null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>, envelopeId: string) {
    const active = drag.current;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (active?.id === envelopeId) finish(true);
      else start(envelopeId, true);
      return;
    }
    if (active?.id !== envelopeId) return;
    if (event.key === "Escape") { event.preventDefault(); finish(false); return; }
    const index = active.ids.indexOf(envelopeId);
    const rowSize = grid ? columns : 1;
    const targets: Record<string, number> = { ArrowLeft: Math.max(0, index - 1), ArrowRight: index + 1, ArrowUp: Math.max(0, index - rowSize), ArrowDown: index + rowSize, Home: 0, End: active.ids.length - 1 };
    if (event.key in targets) { event.preventDefault(); moveTo(targets[event.key]); }
  }

  const nextIsList=grid&&(view.envelopesGridColumns===3||blockedNext);
  const nextViewLabel=nextIsList?"Lista":`Cuadrícula de ${nextVisibleColumns} columnas${adaptive?` · ${nextDensity}`:""}`;
  const viewSelector = <div className="view-switch" role="group" aria-label="Vista de sobres">
    <button type="button" onClick={nextIsList?onList:onGrid} aria-label={`Cambiar a ${nextViewLabel}`} title={`Cambiar a ${nextViewLabel}`}>
      {nextIsList?<ViewListOutlined aria-hidden="true"/>:<GridViewOutlined aria-hidden="true"/>}
      <span className="view-label">{nextIsList?"Lista":"Cuadrícula"}</span>
      {!nextIsList&&<span className="grid-column-count" aria-hidden="true">{nextVisibleColumns}</span>}
    </button>
  </div>;

  return <div ref={container} className={styles.wrapper} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => {lastTap.current=null;finish(false);}} onLostPointerCapture={event => { if (event.target === event.currentTarget && pending.current) finish(false); }}>
    {viewAnchor ? createPortal(viewSelector, viewAnchor) : viewSelector}
    {grid && !unavailableGrid && <p className="view-hint">{columns} sobres por fila{adaptive?` · Vista ${density}, adaptada al ancho disponible.`:""} · Siguiente vista: {nextViewLabel}.</p>}
    {blockedNext && <p id={`${id}-width-hint`} className="view-hint">Para ver tres columnas, gira el teléfono o utiliza una pantalla más ancha.</p>}
    <p id={`${id}-sort-hint`} className={styles.sortHint}>Para ordenar, mantén pulsado el icono y arrastra.<span className={styles.srOnly}> Con teclado: Enter para empezar, flechas para mover, Enter para guardar y Escape para cancelar.</span></p>
    <span className={styles.srOnly} role="status" aria-live="polite">{announcement}</span>
    {reorderError && <p className="form-error" role="alert">{reorderError}</p>}
    {unavailableGrid ? <div className={styles.widthNotice} role="status"><b>{width === null ? "Ajustando la vista…" : "La vista de tres columnas necesita más espacio."}</b><p>Gira el teléfono o elige Lista o Cuadrícula de dos columnas. Tu preferencia de tres columnas se conserva.</p><button className="secondary" type="button" onClick={onGrid}>Ver dos columnas</button></div>
      : envelopes.length ? <div className={`${styles.collection} ${grid ? styles.grid : styles.list}`} data-columns={grid ? columns : 1} data-adaptive={grid && adaptive} style={grid ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
        {ordered.map(envelope => {
          const goal = getEnvelopeGoal(envelope, today);
          const showGoal = goal.showProgress && !privateMode;
          const percentage = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(goal.percentage);
          const progressText = goal.reached && envelope.goalDisplay === "reached" ? "Meta alcanzada" : goal.reached && envelope.goalDisplay === "surplus" ? `Excedente: ${display(goal.surplus)}` : `${percentage}%`;
          const plans = planningItems(envelope, today);
          const indicators = showProximity ? planningIndicatorGroups(plans.filter(item=>item.timingEnabled)) : [];
          return <div className={`${styles.card} ${preview?.id === envelope.id ? styles.dragging : ""}`} key={envelope.id} data-envelope-id={envelope.id} data-goal={showGoal}>
            <button type="button" className={`emoji ${envelope.color} ${styles.dragHandle}`} aria-label={`Ordenar ${envelope.name}`} aria-describedby={`${id}-sort-hint`} aria-pressed={preview?.id === envelope.id}
              onDoubleClick={event => { event.stopPropagation(); if (pointerType.current === "touch") return; finish(false); onMenu(envelope.id,event.currentTarget); }}
              onPointerDown={event => pointerDown(event, envelope.id)}
              onKeyDown={event => keyDown(event, envelope.id)} onBlur={() => { if (drag.current?.keyboard) finish(false); }} title="Doble clic o doble toque: menú del sobre. Mantén pulsado para ordenar"><span aria-hidden="true">{envelope.icon}</span></button>
            <span className={styles.name}>{envelopeLabel(envelope.name)}</span>
            <b className={styles.balance}><small className={styles.balanceLabel}>Saldo actual</small>{(privateMode || envelope.balanceHidden) ? "••••••" : display(envelope.balance)}</b>
            <div className={`envelope-actions ${styles.actions}`}><button type="button" aria-label={`Opciones de ${envelope.name}`} aria-haspopup="menu"
              aria-expanded={menuId === envelope.id} aria-controls={menuId === envelope.id ? "envelope-context-menu" : undefined}
              onClick={event => onMenu(envelope.id, event.currentTarget)}>⋮</button></div>
            {(envelope.recurrence || showGoal || indicators.length > 0) && <div className={styles.details}>
              {envelope.recurrence && <small>Próximo aporte: {privateMode ? "••••" : display(envelope.recurrence.amount)} · {new Date(`${envelope.recurrence.nextDate}T12:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", timeZone: "America/Costa_Rica" })}</small>}
              {showGoal && <span className={styles.progressLabel} aria-label={`Meta de ${envelope.name}: ${percentage} por ciento. ${goal.reached ? "Meta alcanzada." : ""}`}>{progressText}</span>}
              <div className={styles.indicators}>{indicators.map(({tone,late,items}) => <button key={`${tone}-${late}`} className={styles.statusButton} type="button" aria-label={`Metas e importes de ${envelope.name}: ${proximityLabels[tone]}, ${items.length} elementos${late?", pago previsto con atraso":""}`} aria-haspopup="dialog" aria-expanded={planningId === envelope.id} aria-controls={planningId === envelope.id ? "envelope-planning-menu" : undefined} onClick={event => onPlanning(envelope.id, event.currentTarget, tone)}><TemporalDot tone={tone} alert late={late} covered={envelope.balanceHidden?undefined:planningCoverage(items)}/><span>{items.length}</span></button>)}</div>
            </div>}
            {showGoal && <div className={styles.progressTrack} aria-hidden="true"><span style={{ height: `${goal.fillPercentage}%` }} /></div>}
          </div>;
        })}
      </div> : <div className="empty-state"><b>No tienes sobres activos</b><small>Crea un sobre para organizar tu dinero.</small></div>}
    <button type="button" className="add-envelope" onClick={onCreate}>＋ Crear un sobre</button>
  </div>;
}
