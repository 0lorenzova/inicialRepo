# Posponer recordatorios — versión 0.1.87

Implementación y validación: 25 de octubre de 2026. Publicación autorizada por el usuario al continuar esta tarea. El estado remoto se verifica después del envío; no se considera publicado por compilar o hacer push.

## Funcionalidad

- Posposición por días enteros positivos, fecha futura o siguiente recurrencia real.
- Identidad estable por ocurrencia, independiente de urgencia y fecha pospuesta.
- Fecha original visible; cancelar restaura el aviso sin modificar el evento.
- Estado compartido entre notificaciones, Calendario de aportes y metas, Recordatorios, planificación y detalle de sobres, editor de aportes y Préstamos entre sobres.
- Contadores y avisos de apertura respetan la posposición. La reactivación tiene una identidad estable para evitar entregas repetidas al cambiar la urgencia.
- Los eventos completados dejan de producir avisos y se limpian sus posposiciones. Guardar valida nuevamente contra el registro vigente.
- Las acciones existentes que cambian la programación se identifican como «Cambiar fecha programada», separadas de «Posponer recordatorio».

## Archivos y reutilización

| Área | Archivos |
| --- | --- |
| Lógica compartida y validación | `lib/reminder-snooze.ts` |
| Contexto, diálogo y controles | `components/reminder-snooze.tsx`, `components/reminder-snooze.module.css` |
| Persistencia y proyección de avisos | `app/page.tsx`, `lib/finance-notifications.ts`, `lib/finance-reset.ts` |
| Notificaciones y apertura | `components/finance-notifications.tsx`, `components/finance-notifications.module.css`, `components/opening-attention.tsx` |
| Pantallas de origen | `components/reminders-screen.tsx`, `components/envelope-planning.tsx`, `components/envelope-goal-editor.tsx`, `components/loans-screen.tsx` |
| Calendario | `components/planning-calendar.tsx`, `components/planning-calendar.module.css` |
| Distinción de reprogramación | `components/postpone-editor.tsx` |
| Pruebas | `scripts/verify-reminder-snooze.mjs` |
| Versión | `package.json`, `package-lock.json` |

Se reutilizan FinanceDialog, los registros derivados de recordatorios, las funciones de recurrencia, los tokens visuales y el estado de notificaciones sincronizado por FinanceSyncController. No hay dependencias nuevas, migraciones, modificaciones de fórmulas o registros financieros de producción.

## Pruebas realizadas

| Comprobación | Resultado |
| --- | --- |
| 62 scripts `verify-*.mjs` | Aprobados; salida en `pruebas-completas.txt` |
| Regresión focalizada de nueve suites | Aprobada; salida en `regresion.txt` |
| `npm run lint` | Código de salida 0 |
| `npm run build` | Código de salida 0; Next.js 16.3.6, compilación y TypeScript correctos |
| `tsc --noEmit` | Código de salida 0 |
| `git diff --check` | Sin errores de espacios |
| Posponer cinco días, cancelar y recargar | Probado en navegador con componentes reales y datos aislados |
| Fecha manual y siguiente recurrencia | Probadas; vencimiento original conservado |
| Cero días y evento no recurrente | Confirmación desactivada para cero; sin opción de recurrencia inventada |
| Notificaciones, calendario y Recordatorios | Mismo estado visible y contador actualizado |
| Completar evento antes del aviso pospuesto | Pago simulado en entorno aislado; aviso y control eliminados, un solo movimiento |
| Persistencia y sincronización | Controlador real con almacenamiento/transporte de prueba; reapertura sin conexión y dos clientes |
| Reactivación, cambios de urgencia y duplicados | Pruebas automatizadas aprobadas |
| Temas claro y oscuro | Revisión visual real; capturas incluidas |
| Anchos 320, 390 y 1280 px | Sin desbordamiento horizontal; diálogo de 296 px en viewport de 320 px |
| Consola del navegador | Sin errores en el recorrido aislado |

La ruta temporal de pruebas fue retirada antes de la compilación final. No se incluyeron datos de demostración en la aplicación ni se realizaron operaciones financieras reales.

## Límites comprobados

- No existe un modelo de turnos programados en los eventos actuales; «Siguiente turno» no se ofrece.
- Se conserva el mecanismo de notificaciones existente. No se ha añadido un servicio de avisos en segundo plano que garantice alertas con la aplicación completamente cerrada.
- La sincronización se probó con transporte aislado, sin modificar datos reales de Supabase.
- Se verificó móvil en navegador; no se probó un dispositivo Android físico ni su gesto nativo de retroceso.

## Evidencia visual

- `movil-claro.jpg`: diálogo real en 390 px.
- `movil-oscuro-320.jpg`: diálogo real en tema oscuro, 320 px.
- Los importes y nombres de estas capturas pertenecen exclusivamente al entorno de pruebas aislado.
