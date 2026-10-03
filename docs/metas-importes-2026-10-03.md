# Metas, importes y ampliaciones — 3 de octubre de 2026

## Estado

Implementado sobre la aplicación existente. El propietario autorizó publicar esta ampliación el 3 de octubre. Entrega mediante commit/push a main y despliegue automático de Vercel; comprobar el estado del despliegue asociado al commit para confirmar su disponibilidad. Sin SQL ejecutado, nuevas dependencias ni datos ficticios enviados a Supabase.

## Conservado

Motor financiero, fuente única de datos, saldos, movimientos, una meta económica por sobre, porcentajes superiores a 100 %, recurrencia y recordatorios, diseño de tarjetas, menú contextual, navegación Atrás/Adelante y almacenamiento/sincronización existentes.

## Cambios de los dos textos complementarios

1. **Colores:** un componente común verde/amarillo/rojo; todos los estados críticos comparten exactamente el mismo rojo. La instrucción posterior añade blanco para importes sin proximidad.
2. **Meta:** nombre opcional independiente del nombre del sobre; monto, fecha, porcentaje, excedente, barra y umbrales existentes conservados.
3. **Programación:** acción contextual «Programar importe a este sobre»; varios importes con ID, nombre, monto, fecha límite y umbrales. Crear o editar no mueve dinero.
4. **Acceso:** los indicadores abren el menú «Metas e importes de este sobre» reutilizando el menú actual y su ajuste al viewport.
5. **Consulta:** detalle separado de la edición; Atrás vuelve al listado del mismo sobre y conserva el filtro.
6. **Prioridad:** la primera versión usaba un único punto más urgente. La última instrucción sustituye esa presentación para importes por contadores por color; una meta sin importes conserva su acceso temporal.
7. **Dinero/tiempo:** solo la meta tiene progreso económico. Los importes tienen proximidad, sin barra automática.
8. **Privacidad individual:** «Ocultar/Mostrar saldo del sobre» en ⋮. `balanceHidden` se guarda con el sobre; global o individual ocultan el saldo. Desactivar privacidad global no desactiva la individual. Nombre, icono, indicadores y funciones permanecen.
9. **Trazabilidad:** desde un ingreso se consulta la distribución y desde una asignación se consulta su ingreso de origen. No se duplican movimientos.
10. **Temas:** Claro, Oscuro, Metálico y Orgánico/Naturaleza integrados en el proveedor actual, incluidos modales y menús MUI. Se conserva la preferencia con el mecanismo existente.
11. **Orden:** listado por fecha límite ascendente, con desempate estable; también al filtrar. Los pagos conservan su información.
12. **Contadores:** derivados de importes activos, pendientes y dentro de sus umbrales; categorías vacías no se renderizan. No hay contadores persistidos que puedan desactualizarse.
13. **Blanco:** cuando hay importes y ningún pendiente está dentro de un rango, se ofrece un punto blanco para consultar todos; también después de pagar el último próximo.
14. **Filtros:** tocar un contador muestra inicialmente solo sus importes. «Ver todos» retira el filtro e incluye los futuros y pagados, además de la meta.
15. **Pagado:** casilla → monto real → cuenta de pago → confirmación. El sobre es contextual. El monto pagado puede diferir del previsto.
16. **Reactividad:** cada guardado actualiza el mismo documento financiero, del cual se calculan saldo, resumen, actividad, lista y contadores. No requiere recargar.
17. **Compatibilidad:** nuevos campos opcionales; los documentos existentes conservan identificadores y contenido. No hay reset ni conversión destructiva.
18. **Responsive:** se reutilizan los menús que cambian de dirección y limitan tamaño; tarjetas en lista, dos/tres columnas y escritorio conservan su estructura.

## Cómo se registra el pago

`payScheduledAmount` utiliza `postMovement`: valida monto entero positivo, cuenta activa, fondos de la cuenta y del sobre. Registra un único `Gasto`, descuenta la cuenta y el sobre, y añade al importe `payment = {movementId, amount, date, accountId}`. El movimiento incluye `scheduledAmountId`.

El guardado se entrega como una sola actualización del estado. Si la validación falla, no se aplica ninguna parte. El ID de operación determinista y la marca de pago impiden pagar dos veces el mismo importe. Un importe pagado conserva su comprobante y no permite sobrescribirlo desde el editor de planificación. No se añadió una función de anulación de pagos.

## Cómo se conserva el origen del dinero

- La distribución inicial ya está en `Ingreso.allocations`; se reutiliza.
- Las nuevas asignaciones añaden `incomeSources: [{incomeId, amount}]` al mismo movimiento de asignación.
- El fondo sin asignar se reconstruye a partir del libro: se consume primero el dinero más antiguo, excluyendo lo ya asignado o gastado sin sobre.
- Un ingreso puede alimentar varias asignaciones y una asignación puede utilizar remanentes de varios ingresos.
- Los saldos iniciales o desasignados sin origen demostrable permanecen como fondo común sin vínculo inventado.
- Los movimientos antiguos sin relación explícita no se reescriben; la UI avisa cuando falta evidencia. El detalle distingue distribución registrada, remanente del ingreso y otros usos del fondo común.
- La distribución es histórica; no promete que el saldo actual del sobre sea el mismo que recibió del ingreso.

## Datos y SQL

Campos opcionales: `goalName`, `balanceHidden`, `scheduledAmounts[]`, `scheduledAmounts[].payment`, `LedgerMovement.incomeSources[]` y `scheduledAmountId`. Se guardan dentro de `user_finance_data.data`, mediante la sincronización existente. **Esta ampliación no requiere SQL.**

La migración antigua de revisión/RPC sigue pendiente y separada de estas funciones. Antes de aplicarla: preparar cliente compatible, probar contra una base de prueba, respaldo y autorización explícita del propietario. **No ejecutar el SQL propuesto por separado**, porque revoca las escrituras directas que utiliza el cliente actual. Referencia: `docs/sync-migration.md`.

## Archivos modificados

- `app/page.tsx`, `app/globals.css`: integración, acciones contextuales, temas, navegación y acceso a la trazabilidad.
- `components/envelope-collection.tsx`, `components/envelope-collection.module.css`: privacidad, contadores y acceso filtrado.
- `components/envelope-context-menu.tsx`: contenido reutilizable, título y dimensiones del listado.
- `components/envelope-goal-editor.tsx`, `components/envelope-goal-editor.module.css`: nombre y configuración compartida.
- `components/envelope-planning.tsx`, `components/envelope-planning.module.css`: listado, detalle, filtros y pago.
- `components/scheduled-amount-editor.tsx`: editor separado del importe.
- `components/temporal-indicator.tsx`, `components/temporal-indicator.module.css`: puntos y campos de umbral compartidos.
- `components/income-trace-dialog.tsx`: consulta en ambos sentidos.
- `components/envelope-action-dialog.tsx`: respeto del saldo oculto.
- `components/theme-provider.tsx`, `components/finance-dialog.tsx`: nuevas paletas en el sistema actual.
- `lib/envelope-goals.ts`, `lib/envelope-settings.ts`: cálculo temporal reutilizable y nombre de meta.
- `lib/envelope-planning.ts`: planificación, orden, contadores, guardado seguro y pago atómico.
- `lib/income-trace.ts`, `lib/finance-ledger.ts`: relaciones de origen sin duplicar movimientos.
- `lib/app-navigation.ts`: contextos de listado/detalle/editor/trazabilidad en el historial actual.
- `scripts/register-local-typescript.mjs`, `scripts/verify-envelope-planning.mjs`, `scripts/verify-planning-payments-trace.mjs`: pruebas dirigidas a lo nuevo.
- Este informe y actualización del informe anterior.

## Pruebas realizadas

- Pruebas nuevas: prioridad/umbrales; orden; contadores sin ceros; exclusión de pagados; persistencia JSON; ediciones concurrentes; conservación de saldos y recurrencia; navegación contextual.
- Pago: monto real distinto al programado, cuenta/sobre insuficientes, intento duplicado, conservación del comprobante, una sola operación y actualización inmediata de contadores.
- Trazabilidad: ingreso parcialmente distribuido, asignaciones posteriores, combinación de ingresos, gasto del fondo común, desasignación y datos antiguos sin vínculos.
- Identidad financiera comprobada después de cada escenario: cuentas = asignado + sin asignar.
- Se ejecutaron los 18 escenarios del motor porque esta ampliación afecta a asignaciones; no se repitió la auditoría completa anterior de UI.
- Navegador local aislado de Supabase: lista, cuadrículas de dos/tres columnas, 320/390 px, horizontal 844 × 390 y escritorio 1440 × 900. Menús dentro del viewport, detalle sin edición obligatoria, Atrás y guardar volviendo al mismo contexto.
- Dos pagos ficticios de ₡1.000: el rojo desapareció y luego reapareció el blanco. Los pagos quedaron visibles y persistieron tras recargar.
- Privacidad individual comprobada al recargar y al alternar privacidad global; tema Metálico en menú y Orgánico en formulario; trazabilidad desde una asignación ficticia de ₡1.000.
- Lint de archivos afectados, TypeScript y compilación de producción: comprobados.

## Límites y decisiones pendientes

- Publicación autorizada el 3 de octubre. La disponibilidad final se confirma con el estado del despliegue de Vercel asociado al commit.
- No se probó contra Supabase real ni en dispositivos físicos. No se alteraron datos de producción.
- La meta económica existente sigue siendo una por sobre; pueden coexistir varios importes programados. No se creó un sistema paralelo de múltiples metas.
- La protección completa frente a clientes antiguos que usen `upsert` requiere la migración/RPC pendiente, con autorización y cliente compatible.
- La confirmación final de Vercel del commit anterior `0faad11` sigue sin comprobar: la consulta fue bloqueada por el límite de revisión automática de permisos.

## Evidencia visual

Capturas con datos ficticios: [móvil](C:/Users/0lore/.codex/visualizations/2026/09/28/01a0e624-24b8-7600-adde-b88eb9742056/finanzas-planificacion-movil.png), [escritorio](C:/Users/0lore/.codex/visualizations/2026/09/28/01a0e624-24b8-7600-adde-b88eb9742056/finanzas-planificacion-escritorio.png). El punto blanco permitió consultar un importe de diciembre fuera de los rangos; el menú horizontal mantuvo acceso al último elemento mediante desplazamiento.
