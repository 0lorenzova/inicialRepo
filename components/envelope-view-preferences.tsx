"use client";

import { useThemeMode } from "@/components/theme-provider";
import { useEffect, useId, useRef, useState } from "react";
import { canShowThreeColumns, isAdaptiveEnvelopeGrid, type EnvelopeView } from "@/lib/envelope-view";

export function EnvelopeViewPreferences({ value, onChange }: {
  value: EnvelopeView;
  onChange: (view: EnvelopeView) => void;
}) {
  const {scale}=useThemeMode();
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const fitsThree = width !== null && canShowThreeColumns(width);
  const adaptive = isAdaptiveEnvelopeGrid(width);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width/scale));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [scale]);
  return <div ref={container} className="envelope-view-preferences">
    <label htmlFor={id}>Vista preferida</label>
    <select id={id} value={value.envelopesViewMode === "list" ? "list" : String(value.envelopesGridColumns)}
      aria-describedby={`${id}-hint`} onChange={event => onChange({ envelopesViewMode: event.target.value === "list" ? "list" : "grid", envelopesGridColumns: event.target.value === "3" ? 3 : 2 })}>
      <option value="list">Lista</option><option value="2">{adaptive ? "Cuadrícula cómoda · automática" : "Cuadrícula · 2 columnas"}</option>
      <option value="3" disabled={!fitsThree}>{adaptive ? "Cuadrícula compacta · automática" : `Cuadrícula · 3 columnas${!fitsThree ? " (necesita más espacio)" : ""}`}</option>
    </select>
    <p id={`${id}-hint`} className="flow-intro">Se comparte entre Inicio y Sobres. {adaptive ? "En pantallas amplias las columnas se ajustan al espacio disponible. Cómoda conserva la opción de dos columnas en móvil; compacta, la de tres." : !fitsThree ? "Gira el teléfono o utiliza una pantalla más ancha para elegir tres columnas. La preferencia guardada se conserva." : "Toca Cuadrícula en tus sobres para alternar entre dos y tres columnas. En computadora se aprovecha el ancho para mostrar más sobres."}</p>
  </div>;
}
