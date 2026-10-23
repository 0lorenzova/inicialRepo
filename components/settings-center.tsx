"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import PaletteOutlined from "@mui/icons-material/PaletteOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import LayersOutlined from "@mui/icons-material/LayersOutlined";
import TrackChangesOutlined from "@mui/icons-material/TrackChangesOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import CloudSyncOutlined from "@mui/icons-material/CloudSyncOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import styles from "./settings-center.module.css";

export const settingsCategoryIds = ["appearance", "accounts", "envelopes", "goals", "notifications", "privacy", "data", "advanced"] as const;
export type SettingsCategoryId = (typeof settingsCategoryIds)[number];

type Category = { id: SettingsCategoryId; title: string; description: string; icon: ReactNode; content: ReactNode };
type SearchItem = { category: SettingsCategoryId; target: string; name: string; description: string; keywords: string };

const categoryInfo: Omit<Category, "content">[] = [
  { id: "appearance", title: "Apariencia y pantalla", description: "Tema, tamaño de texto, colores y visualización.", icon: <PaletteOutlined aria-hidden="true"/> },
  { id: "accounts", title: "Cuentas y monedas", description: "Cuentas, moneda principal y preferencias de ingreso.", icon: <AccountBalanceWalletOutlined aria-hidden="true"/> },
  { id: "envelopes", title: "Sobres y distribución", description: "Organización, prioridades y reglas de asignación.", icon: <LayersOutlined aria-hidden="true"/> },
  { id: "goals", title: "Metas y aportes", description: "Puntos, metas, aportes recurrentes y programación.", icon: <TrackChangesOutlined aria-hidden="true"/> },
  { id: "notifications", title: "Notificaciones", description: "Avisos internos, del dispositivo y sonidos.", icon: <NotificationsOutlined aria-hidden="true"/> },
  { id: "privacy", title: "Privacidad y seguridad", description: "Visibilidad de saldos y estado de acceso.", icon: <SecurityOutlined aria-hidden="true"/> },
  { id: "data", title: "Datos y sincronización", description: "Supabase, copia local, respaldo y estado de datos.", icon: <CloudSyncOutlined aria-hidden="true"/> },
  { id: "advanced", title: "Opciones avanzadas", description: "Fuentes salariales y personalización de movimientos.", icon: <TuneOutlined aria-hidden="true"/> },
];

const searchItems: SearchItem[] = [
  { category: "appearance", target: "setting-theme", name: "Tema y colores", description: "Elige uno de los temas disponibles.", keywords: "claro oscuro metálico orgánico paleta color" },
  { category: "appearance", target: "setting-size", name: "Tamaño de interfaz", description: "Cambia el tamaño de texto y controles.", keywords: "texto fuente letra grande accesibilidad" },
  { category: "appearance", target: "setting-header", name: "Encabezado fijo", description: "Mantén accesos rápidos visibles al desplazarte.", keywords: "inicio fijar sticky todas pantallas" },
  { category: "appearance", target: "setting-proximity", name: "Puntos de proximidad", description: "Muestra u oculta indicadores de fechas.", keywords: "fechas sobres proximidad puntos" },
  { category: "appearance", target: "setting-envelope-view", name: "Vista de sobres", description: "Lista o cuadrícula y número de columnas.", keywords: "cuadrícula lista columnas visualización" },
  { category: "appearance", target: "setting-panel-locks", name: "Fijar paneles de Inicio", description: "Usa los candados originales de cada panel.", keywords: "candado resumen actividad recent panels" },
  { category: "accounts", target: "setting-accounts", name: "Cuentas", description: "Administra cuentas, estados y saldos desde Cuentas.", keywords: "banco efectivo activa agregar editar" },
  { category: "accounts", target: "setting-currency", name: "Moneda principal", description: "La aplicación usa colones costarricenses (CRC).", keywords: "moneda divisa crc colón ₡ conversión" },
  { category: "accounts", target: "setting-income-defaults", name: "Preferencias para nuevos ingresos", description: "Monto, tipo, cuenta y textos sugeridos.", keywords: "cuenta sugerida depósito referencia descripción salario" },
  { category: "envelopes", target: "setting-envelope-order", name: "Orden y prioridades de sobres", description: "Reordena sobres y ajusta opciones en su pantalla.", keywords: "sobre ordenar prioridad déficit negativo" },
  { category: "envelopes", target: "setting-distribution-templates", name: "Plantillas de distribución", description: "Gestiona plantillas desde un borrador de ingreso real.", keywords: "distribución reparto asignar automático manual plantilla" },
  { category: "goals", target: "setting-goals", name: "Metas y puntos", description: "Abre los sobres para editar metas y seguimiento.", keywords: "meta objetivo progreso puntos sobre" },
  { category: "goals", target: "setting-contributions", name: "Aportes recurrentes", description: "Configura importes y frecuencias por sobre.", keywords: "aporte recurrente semanal quincenal mensual anual personalizado" },
  { category: "goals", target: "setting-calendar", name: "Cronograma", description: "Consulta metas, aportes y pagos por fecha.", keywords: "calendario programados fecha vencimiento" },
  { category: "goals", target: "setting-reminders", name: "Recordatorios", description: "Gestiona compromisos próximos y vencidos.", keywords: "recordatorio próximo vencido realizado posponer" },
  { category: "notifications", target: "setting-notifications", name: "Avisos internos y del dispositivo", description: "Conserva los permisos y opciones disponibles en el navegador.", keywords: "notificación alerta sistema dispositivo navegador" },
  { category: "notifications", target: "setting-notifications", name: "Importes y sonidos", description: "Visibilidad, tono y prueba de audio.", keywords: "monto saldo privacidad sonido tono campana" },
  { category: "privacy", target: "setting-global-privacy", name: "Ocultar todos los montos", description: "Usa el mismo control de privacidad del encabezado.", keywords: "privacidad ocultar mostrar visibilidad saldo importe" },
  { category: "privacy", target: "setting-summary-privacy", name: "Privacidad del resumen", description: "Controla por separado los importes de Inicio.", keywords: "cuentas asignado sin asignar panel resumen" },
  { category: "privacy", target: "setting-envelope-privacy", name: "Visibilidad por sobre", description: "Se conserva en las opciones de cada sobre.", keywords: "ocultar saldos privacidad sobre" },
  { category: "privacy", target: "setting-session", name: "Cuenta y sesión", description: "Consulta la cuenta conectada y cierra sesión.", keywords: "seguridad autenticación acceso salir correo" },
  { category: "data", target: "setting-sync", name: "Supabase y sincronización", description: "Estado, cambios pendientes y reintento.", keywords: "nube conexión error datos locales remotos" },
  { category: "data", target: "setting-backup", name: "Copia de respaldo", description: "Descarga el respaldo real disponible.", keywords: "backup exportar descargar copia" },
  { category: "data", target: "setting-clear-local", name: "Limpiar copia local", description: "Conserva intactos los datos de Supabase.", keywords: "borrar local navegador limpiar" },
  { category: "data", target: "setting-reset", name: "Restablecer datos", description: "Abre el flujo con respaldo y confirmación explícita.", keywords: "borrar saldos movimientos borrar restablecer eliminar" },
  { category: "data", target: "setting-version", name: "Versión y compilación", description: "Consulta la versión e información disponible.", keywords: "build actualización fecha" },
  { category: "advanced", target: "setting-salary-sources", name: "Empleadores y condiciones salariales", description: "Configura fuentes, períodos y conceptos salariales.", keywords: "salario empleador ingreso fuente conceptos jornada" },
  { category: "advanced", target: "setting-expense-categories", name: "Categorías de gastos", description: "Crea, edita, archiva o restaura categorías.", keywords: "categoría gasto clasificar" },
  { category: "advanced", target: "setting-movement-names", name: "Nombres de movimientos", description: "Personaliza nombres nuevos de ingresos y gastos.", keywords: "nombre automático manual campo separador movimiento" },
  { category: "advanced", target: "setting-feedback", name: "Enviar sugerencia", description: "Abre el formulario existente de comentarios.", keywords: "ayuda soporte comentarios sugerencia" },
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CR").trim();

export function SettingsCenter({ content, hidden = false, onSubpageChange }: {
  content: Record<SettingsCategoryId, ReactNode>;
  hidden?: boolean;
  onSubpageChange: (subpage: boolean) => void;
}) {
  const [categoryId, setCategoryId] = useState<SettingsCategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const categories = useMemo(() => categoryInfo.map(category => ({ ...category, content: content[category.id] })), [content]);
  const active = categories.find(category => category.id === categoryId);
  const results = useMemo(() => {
    const term = normalize(query);
    if (!term) return [];
    return searchItems.filter(item => {
      const category = categoryInfo.find(value => value.id === item.category)!;
      return normalize([item.name, item.description, item.keywords, category.title, category.description].join(" ")).includes(term);
    }).slice(0, 18);
  }, [query]);

  useEffect(() => onSubpageChange(categoryId !== null), [categoryId, onSubpageChange]);
  useEffect(() => {
    if (!target || !categoryId) return;
    const element = document.getElementById(target);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    element?.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]")?.focus({ preventScroll: true });
  }, [categoryId, target]);

  function openCategory(id: SettingsCategoryId, targetId?: string) {
    setTarget(targetId ?? null);
    setCategoryId(id);
  }
  function goBack() { setCategoryId(null); setTarget(null); }

  return <section className={styles.root} hidden={hidden} aria-label="Centro de configuración">
    {!active ? <>
      <label className={styles.search} htmlFor="settings-search"><SearchOutlined aria-hidden="true"/><input id="settings-search" type="search" placeholder="Buscar configuración…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off"/><span className={styles.searchShortcut} aria-hidden="true">⌕</span></label>
      {query.trim() ? results.length ? <div className={styles.results} role="list" aria-label="Resultados de configuración">{results.map((item,index) => {
        const category = categoryInfo.find(value => value.id === item.category)!;
        return <button type="button" className={styles.result} role="listitem" key={`${item.category}:${item.target}:${index}`} onClick={() => openCategory(item.category,item.target)}><span><b>{item.name}</b><small>{item.description}</small></span><em>{category.title}</em><ChevronRightOutlined aria-hidden="true"/></button>;
      })}</div> : <p className={styles.noResults}>No encontramos opciones para «{query.trim()}».</p>
        : <div className={styles.categoryList}>{categories.map(category => <button type="button" className={styles.category} key={category.id} onClick={() => openCategory(category.id)}><span className={styles.icon}>{category.icon}</span><span className={styles.copy}><b>{category.title}</b><small>{category.description}</small></span><ChevronRightOutlined aria-hidden="true"/></button>)}</div>}
      <p className={styles.persistNote}>Cada opción conserva el método de guardado que ya utiliza.</p>
    </> : <>
      <div className={styles.subpageHeading}><button type="button" className={styles.back} onClick={goBack}><ArrowBackOutlined aria-hidden="true"/><span>Configuración</span></button><h2>{active.title}</h2><p>{active.description}</p></div>
      {categories.map(category => <div className={styles.categoryContent} key={category.id} hidden={category.id !== categoryId}>{category.content}</div>)}
    </>}
  </section>;
}
