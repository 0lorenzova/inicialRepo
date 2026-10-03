# Actualización de proximidad, repetición y restablecimiento — 3 octubre 2026

## Implementado
- Todos los importes activos muestran blanco, verde, amarillo o rojo; el rojo vencido y sus mensajes reutilizan el cálculo existente.
- Tiempo compacto debajo del punto: días, semanas o meses, sin repetir la condición. Meses compactos aproximados de 30 días; el mensaje y la fecha exacta permanecen visibles.
- Contadores por sobre en una fila, sin colores con cero elementos; blanco cuando no hay importes próximos.
- Filtro global en Mis sobres: cuatro colores y Ver todos. Usa los mismos estados que las tarjetas, con fechas ascendentes. Muestra importes pendientes de sobres activos; los pagados se consultan en Metas e importes del sobre y en Movimientos.
- Sin configuración temporal o indicador desactivado: blanco. No se exige configurar umbrales si el indicador está desactivado.
- Nuevos umbrales sugeridos: verde 15, amarillo 8, rojo 5 (valor previo conservado). Configuraciones guardadas no se reemplazan; las metas antiguas sin umbrales explícitos mantienen el comportamiento anterior.
- Repetir: diario, semanal o mensual. Conserva el día ancla: 31 enero → último día de febrero → 31 marzo. El pago crea la próxima ocurrencia dentro de la misma operación financiera, conserva el comprobante previo e impide duplicados.
- Restablecimiento con elección explícita, resumen final, escritura de BORRAR y respaldo local obligatorio previo. Bloqueado si hay errores/conflictos/cambios pendientes de sincronización.
- Conservar configuración: saldos cero, movimientos/préstamos/comprobantes y referencias de notificaciones eliminados; sobres, cuentas, metas, privacidad, orden, tema y preferencias conservados. De cada serie recurrente se conserva la última programación; los importes no recurrentes vuelven a estar pendientes.
- Restablecimiento completo: documento inicial, tema Claro y navegación reiniciada. Mantiene la sesión, el usuario, los respaldos y el contacto del desarrollador. No utiliza localStorage.clear ni elimina el usuario de Supabase.
- Doble clic únicamente sobre el icono abre Entrada / Salida. Conserva el sobre seleccionado y aplica todo el monto a ese sobre. No añade gestos táctiles; mantiene pulsación larga para ordenar.
- Recalcula con los datos vivos y el reloj existente, sin listas financieras paralelas.

## Archivos
- app/page.tsx y app/globals.css: integración y contexto de movimientos.
- lib/envelope-goals.ts, envelope-planning.ts, finance-recurrence.ts: estados compartidos, umbrales, calendario y pago atómico.
- lib/finance-reset.ts: separación entre datos financieros y configuración.
- lib/app-navigation.ts y components/use-app-navigation.ts: filtros y descarte de formularios anteriores al restablecimiento.
- components/use-finance-store.ts: respaldo antes del reemplazo y sincronización existente.
- components/envelope-collection.tsx y su CSS: contadores e icono contextual.
- components/envelope-planning.tsx, temporal-indicator.tsx y su CSS: detalle compartido y tiempo compacto.
- components/scheduled-amount-editor.tsx, envelope-goal-editor.tsx: formulario y valores sugeridos.
- components/proximity-filter.tsx y su CSS; finance-reset-dialog.tsx: controles globales y confirmación destructiva.
- scripts/verify-proximity-repetition-reset.mjs: escenarios nuevos A–Q.

## Validaciones realizadas
- TypeScript, ESLint de archivos afectados y compilación de producción: correctos.
- Escenarios A–Q automatizados en memoria: cuatro estados, días vencidos, contadores, filtros y orden, recurrencias diaria/semanal/mensual, años bisiestos, pago insuficiente sin cambios parciales, duplicados, igualdad financiera y ambos restablecimientos.
- Regresión focalizada: verify-planning-payments-trace, verify-envelope-planning y verify-finance-recurrence: correctos. No se repitió toda la batería anterior.
- Navegador aislado en localhost:3101, Supabase desactivado, estado Solo navegador. Ingreso ficticio 1000 y gasto 100 mediante doble clic en Hogar; selección del sobre preservada.
- Doble clic en nombre y saldo: no abre diálogo. En icono: abre Entrada / Salida (casos R/S).
- Creación de seis importes de colores, filtros blanco/verde/amarillo/rojo y Ver todos: contenido correcto y fechas ascendentes.
- Pago ficticio mensual desde el detalle: conserva comprobante y genera 28 febrero 2027 desde 31 enero 2027.
- Lista en 320 y 390 px; cuadrícula de tres en 390 px y adaptación en 768/1280 px: contadores en una fila y sin desborde del documento. En 320/360 px se conserva el aviso existente de ancho insuficiente para tres columnas.
- Restablecimiento local conservando: totales cero, seis sobres, privacidad y tema Metálico conservados. Completo: cinco sobres iniciales, paneles plegados y tema Claro, también después de recargar.
- Captura visual del filtro rojo revisada; punto y distancia compacta visibles.

## Pendientes y límites del avance publicado
- Definir un nuevo número para el umbral rojo si deseas cambiar el actual de 5 días.
- Revisión adicional del arrastre con pulsación larga en dispositivo táctil físico y de todas las combinaciones de dos columnas/temas. La publicación se adelanta por el umbral de créditos solicitado.
- La sincronización en Supabase sigue usando la arquitectura JSON existente. No se ejecutó un restablecimiento ni se insertaron datos ficticios en producción.
- Esta actualización NO requiere SQL. La propuesta anterior de migrar a revisión/RPC continúa pendiente de autorización y coordinación con el cliente compatible; no ejecutar aisladamente el SQL anterior.
