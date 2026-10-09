# Continuidad del proyecto — 4 octubre 2026

## Cómo continuar
1. Leer este archivo primero. No repetir pruebas ya registradas salvo cambios que las afecten.
2. Mantener arquitectura, historial y diseño. La instrucción posterior sustituye solo el comportamiento que modifica.
3. Controlar los límites de cinco horas y semanal; publicar un bloque funcional cerca de 15 % restante o antes para asegurar margen. Confirmar Vercel. Al cerrar, actualizar este informe.
4. Consultar antes de ejecutar SQL. Las pruebas financieras son ficticias y únicamente locales, con Supabase desactivado.

## Respuesta al estado global
**Todavía no está terminado todo lo pedido a lo largo del chat.** La mayor parte de los prompts recientes está implementada; varias funciones de las imágenes originales siguen parciales. Los informes previos documentan su revisión, pero sus notas antiguas de despliegue ya no representan el estado actual.

## Avance del 4 de octubre
- Filtros Desde/Hasta inclusivos en Movimientos; validación de rango y fechas. Estado ligado a navegación para volver desde detalles.
- Búsqueda ampliada a descripción, referencia, comercio, cuenta y productos, sin exigir acentos.
- Cálculo de días y meses en Costa Rica para movimientos guardados con zona explícita o datetime-local.
- Reporte mensual y opción de historial completo: ingresos, gastos, ahorro, categorías y gasto por sobre. Préstamos y transferencias no se cuentan como ingresos/gastos.
- Catálogo de productos por sobre: nombre, icono, seguimiento activable, edición sin borrar compras anteriores.
- Varios productos por gasto, monto, cantidad y notas. Relación explícita con sobre y producto; ningún gasto se cuenta dos veces.
- Reporte mensual por producto: monto, porcentaje del gasto del sobre, número de compras, detalle y acceso al movimiento.
- Resto sin producto identificado y conservación de productos históricos sin atribuirlos por suposición.
- Dos columnas a 320 px y menús inferiores revisados en Claro/Oscuro/Metálico/Orgánico: dentro del viewport. Orden por teclado y persistencia revisados.

## Matriz consolidada de requisitos vigentes
| Área solicitada | Estado y alcance |
|---|---|
| Identidad Finanzas, iconos y accesos | Implementado; se conserva Mis sobres por instrucción posterior. |
| Git, Vercel, conexión Supabase y acceso de usuario | Implementado. No se crean contraseñas por cuenta del usuario; registro/inicio de sesión disponibles. |
| Fuente de datos visible y copia local | Implementado: estados Supabase/copia local, pendientes y conflictos. Copia local conservada por decisión del usuario. |
| Fecha exacta de compilación, Costa Rica y tiempo transcurrido | Implementado. Identifica compilación; no confunde ese momento con la confirmación posterior del proveedor. |
| Resumen financiero compacto y tres tarjetas horizontales | Implementado. En cuentas / Asignado / Sin asignar. |
| Tres paneles independientes, candados y privacidad inicial | Implementado; no hay candados por movimiento. |
| Lista, cuadrículas 2/3 y escritorio de 6 o más | Implementado. Tres se deshabilita con explicación si no cabe; escritorio depende del ancho. |
| Menús contextuales, contraste, botones y navegación móvil | Implementado; dos grupos con ajuste al grupo completo, menús dentro del viewport. |
| Reordenamiento | Implementado en icono, teclado y pulsación larga. Falta comprobación en teléfono táctil físico tras el ajuste de doble clic. |
| Doble clic | Solo icono → Entrada/Salida; sobre ya determinado. Sin nuevo gesto táctil. |
| Acciones de sobres, archivado y preservación de historial | Implementado; saldo/préstamos deben resolverse antes de archivar. |
| Cuentas y estados | Implementado: cuenta, tipo, saldo y estado. |
| Motor financiero | Implementado y probado: ingreso, gasto, asignación, desasignación, transferencia, préstamo y devolución parcial/completa. |
| Fuente única, atomicidad y duplicados | Implementado en libro financiero y operación local. Protección remota reforzada mediante RPC aún pendiente. |
| Recurrentes, recordatorios y posposición | Implementado; solo mueve dinero al confirmar; intervalos personalizados incluidos. |
| Metas y progreso mayor a 100 % | Implementado: nombre, monto, plazo, barra vertical, excedente y visibilidad independiente. |
| Indicadores por sobre y detalle | Implementado: blanco/verde/amarillo/rojo, contadores horizontales, filtros, tiempos compactos y vencidos. |
| Umbrales nuevos | Verde 15, amarillo 8; rojo conservado en 5. Pendiente solo si el propietario desea otro rojo. |
| Importes programados, pago y repetición | Implementado; diario/semanal/mensual con día original; conserva comprobante y siguiente ocurrencia sin duplicados. |
| Filtro global de proximidad | Implementado para pendientes; Ver todos incluye todos los pendientes. Los pagados siguen en cada sobre. Confirmar si se desean también en el global. |
| Privacidad global, por total y por saldo de sobre | Implementado, preferencias independientes. |
| Actividad, historial y trazabilidad de ingresos | Implementado; no se inventan vínculos para registros históricos ambiguos. |
| Reportes mensuales y fechas | Completado en esta entrega. |
| Historial separado ingreso/gasto y cronología gráfica | Parcial: filtro por tipo y orden cronológico disponibles; falta presentación separada/timeline de referencia. |
| Productos, cantidad/notas/seguimiento y reporte | Completado núcleo en esta entrega. Pendientes fotografía/imagen propia y gráfico comparativo entre meses. |
| Categorías editables | Implementado el 7 de octubre: crear, renombrar, archivar/restaurar y administrar desde el gasto sin perder borrador; historial conservado. |
| Gastos: comercio, referencia y descripción | Implementado. Pendientes etiquetas, método de pago explícito y foto del recibo. |
| Monedas | CRC operativo. Multimoneda/cambio de moneda de las primeras referencias no implementado. Requiere definir conversión antes de sumar monedas diferentes. |
| Nombre automático/manual | Implementado: ajustes independientes, selección/orden, asas de arrastre, flechas y teclado, separador, ejemplo, aviso manual, semana ISO y zona Costa Rica. Pendiente comprobar arrastre en dispositivo físico; flechas y teclado probados. |
| Plantillas de distribución y no asignados por ingreso | Parcial: asignación y trazabilidad funcionan; falta plantilla reutilizable y pantalla dedicada de no asignados por ingreso. |
| Editar distribución histórica de ingreso | Pendiente; requiere ajustes compensatorios para conservar coherencia del historial, no sobrescribir saldos. |
| Campana y sonidos | Implementado; avisos del sistema con la app abierta y permisos. Push con app cerrada no implementado; requiere decidir infraestructura. |
| Comentarios al desarrollador | Implementado vía correo. Destino modificable por variable de despliegue, sin panel administrativo. |
| Restablecimiento y respaldo | Implementado con elección conservar/completo, confirmación escrita y copia previa. No ejecutado en producción. |
| Deshacer operaciones | Parcial: respaldo/confirmación y preservación; falta reversión financiera explícita de movimientos. No borrar historial para simularla. |
| Funciones expresamente excluidas | No agregadas: inversiones, cripto, conexión bancaria, social, IA financiera, puntos ni dashboards complejos. |

## Reglas anteriores sustituidas
- Punto único de urgencia → contadores por color y blanco cuando corresponde.
- Solo tres colores → cuatro estados con blanco fuera de rangos monitoreados.
- Predeterminados 60/20/5 → nuevos 15/8/5; conservar configuraciones existentes.
- Solo dos columnas → alternancia 2/3 y densidad adaptable en escritorio.
- Publicar solo tras cada autorización puntual → autorización permanente para publicar antes del agotamiento.
- Eliminar sobres → archivar conservando historial.
- Guardar exclusivamente en servidor → conservar copia local e informar la fuente.
- Doble clic en tarjeta → únicamente icono para Entrada/Salida.

## Pruebas y resultados del 4 de octubre
- verify-finance-history: límites de día en Costa Rica, rango inclusivo/inválido, meses bisiestos, búsqueda y reportes correctos.
- verify-finance-products: productos múltiples, límites por sobre y gasto, cantidades, seguimiento, histórico, atomicidad y conservación del dinero correctos.
- verify-finance-ledger: 18 escenarios y archivado correctos. Se corrigió una incompatibilidad descubierta con el producto vacío de monto cero permitido anteriormente.
- verify-app-navigation: escenarios existentes correctos. TypeScript y compilación correctos; lint revisado y variable sin uso retirada.
- Navegador local: creó Café de prueba en Alimentación, ingreso ficticio 10000 y gasto 3000; productos 1500 + 1000, resto 500; reporte identifica 50 % y 33,3 %, una compra por producto, detalle con cantidad/notas.
- Reporte mensual: ingreso 10000, gasto 3000, ahorro 7000; gasto de Alimentación 3000.
- Pruebas sin Supabase y sin datos reales modificados. No se ejecutó SQL.

## Próxima sesión: orden recomendado
1. Completar nombres automáticos (semana del año, separador, vista previa y gastos independientes); respetar configuraciones existentes.
2. Completar categorías editables y filtros por sobre desde el historial; conservar acceso contextual existente.
3. Completar detalles de gastos: método, etiquetas y recibo; decidir almacenamiento adecuado de archivos antes de cargar imágenes.
4. Ampliar reportes de productos con evolución por mes y foto propia.
5. Plantillas de distribución y no asignados por ingreso; diseñar ajustes/reversión de historial con operaciones compensatorias.
6. Verificar gesto en un teléfono físico cuando esté disponible. No certificar gestos reales usando solo viewport.
7. Coordinar migración SQL y prueba integrada de sincronización separadamente.

## SQL y decisiones del propietario
- Esta entrega añade campos opcionales al JSON existente: no requiere SQL.
- La migración propuesta `supabase/migrations/202610010001_finance_revision.sql` aún NO se ejecutó. Revoca escrituras directas del cliente actual: NO ejecutarla aisladamente.
- Antes de aplicarla: cliente compatible, base de prueba, respaldo y autorización explícita. Referencia: docs/sync-migration.md.
- Definir rojo solo si se cambia 5 días; decidir alcance multimoneda y push cerrado cuando se aborden.

## Actualización incremental — 5 octubre 2026
El despliegue de 0834a15 fue confirmado exitoso. Esta entrega continúa ese estado.

### Completado del adjunto incremental
1. Blanco solo cuando existe contenido pendiente fuera de los colores activos; vacío sin punto y mensaje exacto. Explicación usa el umbral verde del elemento.
2. Indicadores anclados a la derecha, orden visual rojo/amarillo/verde; blanco solo si no hay proximidad activa, sin contador blanco ni huecos.
3. Mostrar proximidad guarda preferencia y oculta puntos y filtros. No cambia cálculos, metas ni notificaciones.
4. Pagar desde la consulta abre la confirmación existente y usa payScheduledAmount/postMovement. No se creó otro motor de pagos.
5. Botón + en el diálogo permite configurar meta o crear importe conservando el sobre.
6. Diálogo ampliable a 960 px con tarjetas en columnas adaptables; móvil mantiene lectura vertical.
10–11. Silver agregado al sistema de temas; Orgánico reforzado con superficies y tonos naturales.
13. Nuevo movimiento se muestra completo también en teléfono.
14. Configuración inicia plegada con encabezados visibles y un único control Plegar/Desplegar todo.
15. Semana del año ISO 8601, incluidos cambios de año y fechas en Costa Rica. Conserva la clave Semana en preferencias antiguas.
16. Filtros de proximidad separados en su propia línea también en escritorio.
18. Reutilizados cálculo de proximidad, pagos, navegación contextual, formularios y proveedor de temas.

### Pendientes del adjunto (NO implementados en esta entrega)
7. Crear cuenta sin abandonar operaciones.
8. Mover metas/importes conservando identidad; no mover comprobantes pagados sin definir tratamiento histórico.
9. Confirmación de asignación con déficit separado del efectivo; no alterar saldos para simular dinero. Aún se conserva validación que impide sobregiros de asignación.
12. Zoom global de tres niveles, persistente y responsive.
17. Cronograma Día/Semana/Mes/Año sobre los mismos datos.
19. Informe completo de estos puntos debe ampliarse al implementarlos.
También siguen pendientes las funciones anteriores de la matriz, salvo la corrección de semana ISO ya completada.

### Validación y archivos
TypeScript, lint de archivos afectados, compilación y pruebas de proximidad/repetición/pagos existentes correctos. Nuevo scripts/verify-incremental-ui.mjs prueba semana ISO, límites Costa Rica, blanco vacío/futuro/pagado y orden de urgencia.
Navegador local sin Supabase: Configuración plegada/desplegada, Silver, ocultación de filtros, diálogo vacío, + contextual, creación ficticia de importe futuro y acceso a Pagar. Diálogo de pago a 320 px dentro del viewport, sin scroll horizontal. Se revisó a 390 y 1280 px; ampliación de ancho del diálogo ajustada tras la revisión.
Archivos: app/page.tsx, app/globals.css; components/envelope-collection.tsx y CSS; components/envelope-planning.tsx y CSS; components/finance-dialog.tsx; components/theme-provider.tsx; components/settings-groups.tsx; lib/envelope-planning.ts; lib/iso-week.ts; scripts/verify-incremental-ui.mjs.

### PENDIENTES DE CONFIRMACIÓN DEL USUARIO
- SQL RPC anterior: todavía NO ejecutarlo; requiere cliente compatible, prueba y autorización. Esta entrega NO requiere SQL.
- Si se desea trasladar importes ya pagados, definir si solo se mueve planificación futura o también atribución histórica; no se supone una respuesta.
- Mantener decisiones previas pendientes sobre multimoneda y notificaciones con app cerrada.

### Retomar después
Priorizar cuentas contextuales, traslado seguro de pendientes, deuda separada, zoom y cronograma. Después continuar la matriz anterior. No repetir pruebas aprobadas salvo cambios que las afecten. Se cerró este bloque al llegar a 15 % semanal para publicar con margen.

## Continuación — cuentas contextuales y traslado de importes (5 octubre)
- Completado punto 7: crear y seleccionar cuenta desde Ingreso, Gasto y Pago programado, sin salir ni perder el borrador. Saldo inicial cero. La sección Cuentas y los selectores comparten addFinanceAccount.
- Punto 8 parcialmente completado: traslado de importes programados pendientes, conservando ID, monto, fecha, rangos y repetición. Una actualización del mismo JSON, sin duplicación ni cambios de saldos. Pagos posteriores utilizan el sobre destino; pagos anteriores no se trasladan.
- El traslado de METAS todavía falta; el modelo actual guarda una meta por sobre y su editor comparte ajustes de recurrencia del sobre. No sobrescribir metas del destino ni mover aportes sin definir esa separación.
- Pruebas: nuevo verify-context-accounts-planning valida cuentas con saldo cero, IDs duplicados, traslado atómico e inmutable, conflictos, pagos históricos bloqueados, recurrencia y pago en destino conservando igualdad financiera. TypeScript, lint y build aprobados.
- Navegador local sin Supabase a 320px: se creó Cuenta ficticia contextual desde un ingreso, conservando nombre y monto 1250. Sin overflow horizontal. Se trasladó un importe ficticio Hogar → Ahorro y el detalle actualizó el contexto. No se hicieron escrituras de prueba en producción.
- Archivos: lib/finance-accounts.ts, components/account-selector.tsx, lib/envelope-planning.ts, components/envelope-planning.tsx, app/page.tsx, app/globals.css, scripts/verify-context-accounts-planning.mjs.
- Sin cambios SQL. Sigue pendiente la migración RPC; NO ejecutarla sin cliente compatible y autorización.
- Retomar: traslado de metas, deuda separada, zoom global, cronograma y después los restantes puntos de la matriz. No repetir pruebas anteriores que no hayan sido afectadas. Esta sesión comenzó ya bajo el umbral semanal de 15%; se publica un bloque corto para conservar margen.

## Continuación — detalles de gastos e historial (5 octubre)
- Completado: selector global de sobres en Movimientos, incluidos archivados. Reutiliza el filtro por ID existente y conserva filtros de fecha, tipo y búsqueda.
- Completado: método de pago opcional (Efectivo, Tarjeta, Transferencia, SINPE Móvil, Otro) y etiquetas en gastos; se guardan en el movimiento existente, se muestran en historial y participan en búsqueda. Modo privado los oculta.
- Normalización central: etiquetas sin duplicados, hasta 12 de 40 caracteres, espacios y prefijo # normalizados. Datos antiguos siguen siendo válidos sin estos campos.
- Pruebas: verify-expense-details aprobado (validación, persistencia JSON, búsqueda combinada, atomicidad y equilibrio financiero), TypeScript, lint y build aprobados. Navegador: selector Ahorro y formulario de gasto con SINPE Móvil/etiquetas a 390 y 320 px, sin overflow horizontal. No se guardó gasto en producción.
- Archivos: app/page.tsx, lib/finance-ledger.ts, lib/finance-history.ts, lib/expense-details.ts y scripts/verify-expense-details.mjs.
- No requiere SQL. Foto del recibo sigue pendiente, al igual que categorías editables.
- Retomar todavía: traslado de metas, deuda separada, zoom global, cronograma y pendientes anteriores de la matriz. Esta continuación comenzó con 7 % semanal restante; se publica antes de agotar el margen.

## Entrega — calendario, traslado de metas y accesibilidad (7 octubre 2026)
- Completado: cronograma Día/Semana/Mes/Año accesible desde Recordatorios, sobre los mismos datos de planificación. Incluye metas con fecha, importes pendientes y próxima ocurrencia registrada de aportes recurrentes. No genera pagos ni proyecciones ficticias. Los pagados siguen en Movimientos.
- Completado: traslado de metas con identidad estable, monto, fecha, rangos y configuración. No mueve dinero. Protege metas existentes del destino y cambios concurrentes. Permite trasladar explícitamente el aporte recurrente; por defecto permanece en el origen.
- Completado: control global A+ con Normal/Grande/Muy grande, persistencia local, tipografía y áreas táctiles ampliadas; cuadrículas ajustan densidad al espacio y tamaño elegidos.
- Correcciones adicionales: explicación de umbrales de metas antiguas coherente con su cálculo; retorno contextual al cronograma; controles del calendario con colores del tema; límites de fechas protegidos.
- Pruebas automatizadas: calendario (semanas, cambio de año, febrero bisiesto, pagados excluidos, aplazamientos), traslado de meta inmutable, recurrencia opcional, conflictos, identidad, saldos intactos y ciclo de tamaños. Navegación, TypeScript, lint y compilación revisados.
- Navegador local sin Supabase: lista/cuadrícula y escala Muy grande en ancho efectivo 320 px; calendario anual móvil, semanal en tablet 769 px y diario/mensual en escritorio 1280 px. Sin desbordamiento horizontal del documento en esos tamaños. Meta ficticia trasladada Hogar → Ahorro y reflejada en calendario; persistencia de datos y tamaño comprobada al recargar. No escrituras de prueba en producción. No equivale a prueba exhaustiva de todos los formularios ni a arrastre en un teléfono físico.
- Archivos principales: app/page.tsx y globals.css; components/planning-calendar y envelope-planning; theme-provider, envelope-collection y estilos compartidos; lib/planning-calendar, move-envelope-goal, interface-size, envelope-goals, envelope-planning y app-navigation; scripts/verify-calendar-goal-move.mjs.
- SQL: estos cambios NO requieren SQL. Sigue pendiente la migración RPC 202610010001_finance_revision.sql; NO ejecutarla aisladamente porque revoca escrituras del cliente actual. Primero cliente compatible, base de prueba, respaldo y autorización del propietario.
- Retomar: déficit/asignación excepcional separado del dinero real; configuración completa de nombres (orden, separador, vista previa y gastos independientes); categorías editables; fotos de recibos/productos; comparación mensual de productos; plantillas de distribución; vista dedicada de no asignados por ingreso; correcciones históricas mediante movimientos compensatorios; vistas separadas de ingresos/gastos. Mantener decisiones pendientes de multimoneda y notificaciones con app cerrada.
- Sin decisión aún: traslado de elementos pagados y tratamiento histórico, incluir pagados en filtro global. No modificar por suposición.
- Publicación de checkpoint al detectar 8% restante del límite de cinco horas; semanal 86% restante. No comenzar otra función antes de cerrar este despliegue.

## Entrega — nombres configurables y categorías (7 octubre 2026, continuación)
- Nombres: configuración independiente de ingresos/gastos, automático editable o manual con confirmación, orden por selección/arrastre/flechas/teclado, cuatro separadores y vista previa con datos de ejemplo. Preferencias anteriores migradas conservando orden y modo; no se renombra el historial.
- Campos: fecha/hora de Costa Rica, monto, tipo de ingreso o categoría, semana ISO, comercio para gastos y consecutivo por tipo. Tipo de ingreso editable; nombres sugeridos cambian con el borrador hasta la edición manual; botón para recuperar sugerencia. Borrar texto ya no lo repone mientras se escribe.
- Aviso manual: pide confirmación si se conserva la sugerencia o se deja vacío. Volver y editar conserva monto y demás datos. Guardar confirmado usa el motor financiero existente.
- Categorías: catálogo persistente dentro del mismo JSON, creación/edición/archivado/restauración. Disponible en Configuración y dentro del gasto. Crear desde el gasto selecciona automáticamente la nueva categoría; renombrar la seleccionada actualiza el borrador. Los gastos históricos conservan la categoría registrada.
- Validación: nombres de categorías normalizados, duplicados incluso con diferencias de acentos/mayúsculas bloqueados, edición obsoleta rechazada, Sin categoría reservado como opción del selector.
- Corrección adicional: --pale definido para modo oscuro, evitando fondo claro con texto claro en la vista previa y superficies que comparten esa variable.
- Pruebas: verify-movement-names y verify-expense-categories aprobados, TypeScript, lint y compilación final correctos. Navegador offline: ajustes independientes, orden por flechas/teclado, separador y persistencia tras recargar; aviso manual, volver sin perder monto e ingreso ficticio 10000 confirmado. Gasto ficticio 1250 con categoría contextual Viajes locales y nombre automático; renombrada a Vacaciones, archivada/restaurada; historial mantiene Viajes locales. Sin escrituras en producción.
- Responsive: formularios y ajustes revisados a 384px; vista de nombres/categorías a 320px sin overflow horizontal, contraste oscuro corregido. No se certifica arrastre táctil físico; quedan alternativas accesibles probadas.
- Archivos: app/page.tsx, app/globals.css; components/movement-name-settings.tsx y CSS, components/expense-categories.tsx y CSS; lib/movement-names.ts, lib/expense-categories.ts; scripts/verify-movement-names.mjs, scripts/verify-expense-categories.mjs.
- SQL: NO requiere SQL. Migración RPC anterior sigue pendiente y NO debe ejecutarse aisladamente: requiere cliente compatible, base de prueba, respaldo y permiso del propietario.
- Retomar: déficit separado de efectivo; foto de recibo/imagen de producto (definir almacenamiento); gráfico mensual de productos; plantillas de distribución; no asignados por ingreso; ajustes compensatorios y presentación separada/timeline de historial. Multimoneda, push con app cerrada y traslado de pagados requieren decisiones previas.
- Cierre al detectar 15% restante del límite de cinco horas, 71% semanal restante. Publicar este bloque y confirmar Vercel antes de iniciar otro.

## Nueva actualización recibida — cinco estados y distribución (7 octubre)
Fuente íntegra: docs/ACTUALIZACION-CINCO-ESTADOS.md. Sustituye las reglas anteriores solo donde las modifica.
- Completados ahora: texto «Asignar pago a este sobre» en menú y diálogo; etiqueta exacta «Semana del año (ISO 8601)». El cálculo ISO ya existía y se conserva.
- Pendiente prioritario: ampliar fuente temporal central con púrpura para días negativos; día cero rojo; conservar umbrales existentes. Propagar los cinco estados a tarjetas, filtros, contadores (incluido blanco), calendario, notificaciones y futuros selectores. No naranja.
- Pendiente: contadores globales de metas Y pagos, blanco con contenido fuera de seguimiento, sin indicadores falsos en sobres vacíos. Mantener visibilidad independiente del cálculo.
- Pendiente: aviso inicial breve de vencidos/críticos y notificaciones solo de atención; retirar notificaciones de movimientos ordinarios. Añadir Saldo actual compacto.
- Pendiente: rango ISO lunes-domingo con meses textuales y acceso a calendario de consulta, reutilizando calendario existente.
- Pendiente: distribución de ingresos con obligaciones desplegables por sobre, orden temporal, selección provisional compartida con Cronograma de pagos, total seleccionado/restante únicos y confirmación final atómica. No generar movimientos al marcar/desmarcar.
- Decisiones del propietario: (1) texto definitivo de Asignar dinero a este sobre; conservar el actual. (2) confirmar si los nuevos checks únicamente reservan/asignan fondos o además registran pagos. El flujo actual de ingreso asigna a sobres; los pagos programados son gastos separados. No suponer que el checkbox paga.
- Retomar la implementación central antes de tocar pantallas: pruebas de ayer/hoy/mañana, umbrales, blanco, pagos realizados, independencia de visibilidad y coherencia entre todas las vistas. Después distribución, pruebas locales ficticias y reporte de los 28 puntos.
- Solo quedaba 3% del límite de cinco horas al recibir el prompt. Esta entrega contiene únicamente terminología y registro completo de requisitos; no afirmar que los cinco estados o la nueva distribución estén implementados.
- No requiere SQL esta entrega. Consultar antes de cualquier migración.

## Decisiones confirmadas por el propietario — distribución de ingresos
Estas decisiones posteriores resuelven las dos preguntas del prompt de cinco estados:
1. Texto definitivo: «Asignar dinero a este sobre». Usar exactamente este texto para esa acción.
2. Confirmar los checkboxes SOLO asigna fondos a los sobres. NO registra gastos, NO marca obligaciones como pagadas y NO descuenta dinero real de las cuentas por esas obligaciones. El ingreso y su distribución deben utilizar el motor financiero existente, con una única confirmación y protección contra duplicados.
La selección sigue siendo provisional hasta confirmar. Las obligaciones conservan su fecha, estado de pago y proximidad; los contadores de obligaciones pendientes no deben disminuir por una mera asignación. El pago continúa siendo una operación separada.
Ambas decisiones quedan resueltas; no volver a solicitarlas. La implementación de la nueva distribución y los cinco estados continúa pendiente.

## Entrega — cinco estados y atención (7 octubre 2026)
- Completado: fuente temporal única blanco/verde/amarillo/rojo/púrpura; hoy rojo, días negativos púrpura, umbrales previos conservados y distancia compacta en días.
- Contadores y filtros globales incluyen metas y pagos pendientes; blanco con contenido real y sin indicadores falsos en sobres vacíos. Los pagados se excluyen conservando historial.
- Visibilidad separada del cálculo: ocultar puntos no detiene alertas ni cálculo temporal. Tarjetas muestran Saldo actual. Acción contextual usa «Asignar dinero a este sobre».
- Notificaciones: críticos, vencimiento y vencidos; movimientos ordinarios ya no generan avisos. Eventos identificados por obligación/fecha/etapa para evitar repeticiones diarias; apertura muestra resumen breve y acceso contextual.
- Corrección central adicional: calendario, recordatorios y confirmación comparten fecha efectiva de aportes pospuestos, incluidos datos antiguos.
- Pruebas afectadas aprobadas: envelope-goals, envelope-planning, incremental-ui, planning-payments-trace, proximity-repetition-reset, finance-notifications, calendar-goal-move y finance-recurrence. TypeScript, lint y build comprobados. No repetición de toda la batería histórica.
- Navegador local sin Supabase: inicio vacío sin alertas, meta ficticia vencida, contador púrpura global y del sobre, filtro incluye la meta y aviso al recargar. Anchos 384 y 320 px sin overflow del documento; captura del aviso guardada. No se hicieron escrituras de prueba en producción. Ocultar indicadores tiene cobertura lógica, sin nueva comprobación visual completa en esta ronda.
- Pendiente prioritario: rango textual lunes-domingo ISO con calendario de consulta; distribución de ingresos por obligaciones con selección provisional compartida con cronograma, prioridad temporal, totales únicos y confirmación atómica. Las casillas SOLO asignarán fondos; no pagarán ni reducirán contadores de obligaciones.
- No afirmar que todo el prompt está completo: falta esa distribución (apartados 15–26) y rango ISO (13–14). El sistema de cinco estados queda listo para reutilizarlo allí. Préstamos no tienen vencimiento propio; no se inventaron fechas para notificarlos.
- Pendientes anteriores siguen vigentes salvo los explícitamente resueltos arriba: déficit separado del dinero real, fotos/almacenamiento, comparación de productos, plantillas, no asignados por ingreso, correcciones compensatorias y mejoras restantes de historial. Multimoneda y avisos con app cerrada requieren definición.
- SQL: NO se requiere para esta entrega. La migración RPC 202610010001_finance_revision.sql sigue pendiente y NO debe ejecutarse aisladamente; primero cliente compatible, prueba, respaldo y autorización del propietario.

## Entrega incremental — rango ISO y consulta (7 octubre 2026)
- Implementado: rango lunes–domingo con meses textuales y año, bajo la fecha del ingreso y en la configuración cuando se incluye Semana. Se actualiza con el borrador.
- Tocar el rango abre un calendario de consulta con la semana resaltada; muestra ambos meses si cruza un límite. No cambia fechas, saldos ni movimientos.
- Reutiliza isoWeek, movementDay (Costa Rica), calendarRange, calendarDays, FinanceDialog y los estilos del calendario existente.
- Verificación dirigida: semana 41 de 2026, cruce de año ISO 2020/2021, conversión Costa Rica, febrero bisiesto y fechas inválidas. Revisión visual interactiva del nuevo calendario queda pendiente para la siguiente ronda; no afirmar que fue realizada.
- No requiere SQL. La distribución provisional compartida con cronograma sigue pendiente; decisiones de texto y solo asignar fondos ya están resueltas.

## Entrega — calendario prioritario y distribución provisional (7 octubre 2026)
- Prioridad solicitada: calendario abierto desde la semana ISO con obligaciones reales por día, colores de proximidad y contador. Hoy/Esta semana/Este mes/Año, navegación por períodos y detalle diario. Comparte calendario, planificación y lógica temporal con Cronograma; no modifica la fecha del ingreso.
- Acceso rápido: icono de calendario junto a tema/privacidad/notificaciones. Abre Cronograma, desde donde se accede a la gestión existente de cada obligación. En el diálogo del ingreso se mantienen consultas sin operaciones financieras.
- Distribución: sobres desplegables y Cronograma de pagos (agenda cronológica) comparten selecciones en memoria. Se pueden sumar asignaciones manuales. Muestra ingreso, seleccionado, total y restante. Marcar/desmarcar y cambiar vista no escribe movimientos.
- Confirmación: revalida obligaciones contra el estado actual y llama al motor postMovement una sola vez. Bloquea exceso, duplicados, montos inválidos, sobres archivados y selecciones modificadas/pagadas. Guarda referencias de obligaciones en el ingreso para trazabilidad. No registra pagos ni reduce contadores por asignar fondos.
- Seleccionar usa el monto mostrado de la obligación/meta, sin descontar automáticamente el saldo previo del sobre; se explica en la pantalla. Las asignaciones adicionales se suman explícitamente.
- Pruebas automáticas aprobadas: verify-income-distribution (selección, cinco estados y calendario coherentes, confirmación atómica, duplicados, concurrencia, persistencia y ecuación financiera), verify-calendar-goal-move, TypeScript, lint de componentes afectados y compilación.
- Navegador local sin Supabase: calendario semanal con meta vencida púrpura en día 6; abrir día, Hoy, Año y Mes; fechas de ingreso conservadas. Ancho 320 px, documento y diálogos sin overflow. Calendario ISO previo revisado visualmente a 390 px. Distribución: marcar desde sobres, comprobar en agenda, desmarcar, monto excesivo bloquea confirmación, volver al paso anterior conserva selección, ingreso ficticio 5000 confirmado: cuenta 5000, sobres 1500 (Hogar 1000, Ahorro 500), sin asignar 3500; historial un ingreso y obligación púrpura sigue pendiente. No escrituras de prueba en producción.
- Alcance de comprobación visual: faltan prueba extensa de todos los colores simultáneos en un día, tablet/escritorio con esta variante y acceso nuevo de cabecera tras la última compilación. No presentarlas como ya realizadas.
- Requisitos 1–28 del prompt cinco estados: implementados en las superficies solicitadas, salvo alertas de deudas con vencimiento propio (modelo actual de préstamos no almacena fecha de vencimiento) y pruebas visuales adicionales arriba. Naranja no existe. El calendario se amplió por instrucciones posteriores del propietario; el cronograma dentro de distribución es una agenda con selección compartida, no una segunda base de datos.
- Retomar: revisión visual adicional indicada, pendientes históricos de continuidad (déficit separado, fotos/almacenamiento, comparación de productos, plantillas, no asignados por ingreso, compensaciones e historial). Multimoneda y notificaciones con app cerrada siguen necesitando definición. No repetir decisiones ya confirmadas sobre texto o solo asignar fondos.
- SQL: esta entrega NO requiere SQL, los metadatos opcionales viajan en el JSON existente. La migración RPC anterior no debe ejecutarse aisladamente; requiere cliente compatible, pruebas, respaldo y permiso del propietario.
- Publicación iniciada con 15% de la ronda disponible, por instrucción permanente del propietario.

## Continuación — revisión responsive y claridad (8 octubre 2026)
- Revisado en navegador local offline: calendario en tablet 768×1024 y escritorio 1280×900, temas claro/oscuro, acceso rápido de cabecera → día → detalle contextual → volver al cronograma. La revisión del icono de cabecera que figuraba pendiente en la entrega anterior queda cerrada.
- Distribución revisada en escritorio por sobres y tablet en agenda; formularios sin overflow horizontal, conservando el motor ya probado. Solo se abrió un borrador ficticio, sin confirmar nuevos movimientos.
- Correcciones: título mensual duplicado eliminado; subtítulo específico del cronograma; singular/plural de obligaciones y pendientes; controles nativos de fecha/hora con esquema oscuro para que el icono del calendario tenga contraste.
- No se repitieron pruebas financieras ya aprobadas: no hubo modificaciones en cálculos, persistencia ni SQL.
- Precisión del plan de pruebas: los cinco colores no pueden coexistir en el mismo día civil con una misma fecha actual. Un día pasado es púrpura para todas sus obligaciones; en una fecha futura sí pueden coexistir blanco/verde/amarillo/rojo según sus umbrales. Queda la comprobación visual de ese caso de cuatro colores; la coherencia de los cinco estados tiene pruebas lógicas anteriores.
- Retomar siguientes implementaciones anteriores: vista de dinero sin asignar por ingreso (reutilizar income-trace; no atribuir fondos sin evidencia), plantillas de distribución, comparación de productos, fotos/almacenamiento, déficit separado y compensaciones históricas. No considerar terminado todo el backlog.
- SQL: no ejecutar ningún SQL para esta revisión. La migración RPC anterior sigue requiriendo cliente compatible, pruebas, respaldo y autorización previa.

## Entrega — sin asignar por ingreso y puntos horizontales (8 octubre 2026)
- Prioridad posterior del propietario: puntos de proximidad siempre en una fila horizontal. Corregido el salto de línea en las tarjetas; mantienen controles de 44 px y desplazamiento horizontal interno en tarjetas estrechas. El filtro global conserva los cinco puntos juntos y Ver todos puede pasar a otra fila.
- Navegador local sin Supabase: lista y cuadrícula de dos columnas a 320 px, tres columnas a 430 px; todos los puntos de Hogar comparten coordenada vertical, documento sin overflow. El último punto se abre correctamente aunque requiera desplazar la fila. Datos ficticios con verde, amarillo, rojo y púrpura en el mismo sobre. Captura local .next/puntos-horizontales.png.
- Implementado Sin asignar por ingreso, accesible desde Resumen financiero y Movimientos. Muestra recibido, remanente, asignación y distribución histórica. El fondo común sin evidencia de ingreso aparece separado.
- Asignar desde un ingreso conserva su origen y solo pide sobre destino y monto. Usa assign y commit existentes, una sola operación; revalida saldo del ingreso y general, fecha, sobre activo y duplicados. Asignaciones generales conservan FIFO. La desasignación no inventa relaciones con ingresos anteriores.
- Pruebas dirigidas aprobadas: verify-unassigned-incomes y verify-planning-payments-trace, TypeScript, lint y compilación. No se repitió la batería histórica completa.
- Navegador offline: exceso 4000 bloqueado sobre un remanente de 3500; asignación ficticia de 500 a Transporte deja 3000 y aparece en la ruta del ingreso. Privacidad oculta nombre, cuenta y montos. Diálogo a 320 px sin overflow; vista de escritorio a 1280 px sin overflow. No pruebas financieras en producción.
- Texto de la ruta del ingreso actualizado para distinguir selección explícita de origen y asignación general FIFO.
- SQL: NO ejecutar SQL para esta entrega. Metadatos incomeSources ya compatibles con el JSON existente. Migración RPC anterior sigue pendiente de cliente compatible, base de prueba, respaldo y autorización; no ejecutarla aisladamente.
- Retomar: plantillas de distribución, comparación mensual de productos, fotos/almacenamiento, déficit separado y compensaciones históricas. Multimoneda, avisos con app cerrada y vencimientos propios de préstamos requieren definir alcance/modelo. Sigue pendiente comprobación visual de cuatro colores futuros en un mismo día del calendario; esta ronda comprobó varios colores en un sobre, no ese caso de calendario.
- Publicar este bloque antes de iniciar otro, conservando margen de cupo; autorización permanente del propietario vigente.

## Cierre breve — validación comprensible al asignar (8 octubre 2026)
- Monto de asignación desde un ingreso: mensaje inmediato para cero, negativos, fracciones y exceso sobre el remanente. El campo expone aria-invalid y vincula el mensaje accesible; no muestra el saldo en el aviso de privacidad.
- Mantiene el bloqueo y la validación del motor ya comprobados. Cambio exclusivo de feedback visual; sin SQL ni cambios de saldos.
- Comprobaciones: lint y TypeScript. No se repitió la prueba financiera ni la revisión responsive anteriores; no se realizó una nueva prueba visual de estos mensajes.
- Iniciada esta tarea con 14% de cupo; publicar este ajuste pequeño y retomar en la próxima ronda las plantillas, comparación de productos y demás pendientes de la entrega anterior.

## Entrega — alerta alterna de atrasados y reseñas del calendario (8 octubre 2026)
- Solicitud puntual: púrpura alterna entre fecha original y hoy, cambiando de fase cada 1000 ms (ciclo completo 2 s). Una fase compartida sincroniza todos los puntos; no se alteran las fechas, saldos, movimientos ni contadores.
- Mes y semana muestran el aviso adicional en hoy; Año lo muestra en el mes actual. El origen sigue registrado en su día/mes. La consulta diaria separa los pendientes propios y los atrasados anteriores al día consultado, sin duplicarlos en el total diario.
- Reseñas flotantes en puntos de las celdas, leyenda y registros diarios: significado del color, cantidad, nombre/sobre y fecha original. Respeta privacidad; accesible por teclado y sin abrir la vista diaria. Hasta cuatro reseñas por punto más contador de restantes.
- La animación se pausa al leer una reseña y vuelve al cambiar período. Con prefers-reduced-motion se muestran indicadores fijos en ambos lugares; no hay temporizador de parpadeo.
- Pruebas dirigidas: verify-calendar-alerts (vencidos, hoy/futuro, pagados/archivados, privacidad, fechas y totales sin mutación), verify-calendar-goal-move, TypeScript, lint y build. No se repitió la batería financiera histórica.
- Navegador local sin Supabase: fases opuestas comprobadas por opacidad de los puntos del día 6 y hoy 8; reseñas abiertas mediante foco de teclado en Día/Semana/Mes/Año sin navegar. Consulta diaria muestra cero propios y una meta atrasada con fecha 6; no se asignan pagos automáticamente. Vista móvil 320 px sin overflow y tooltip de 280 px dentro del viewport. La activación por cursor usa Tooltip de MUI; en esta revisión se comprobó su apertura por teclado, no una interacción física con ratón. Captura .next/calendario-alerta-movil.png.
- Sin SQL. Conservados los pendientes históricos de plantillas, productos, almacenamiento, déficit y compensaciones. Esta solicitud puntual queda implementada; publicar ahora por instrucción del propietario, sin esperar al límite de créditos.

### Ajustes posteriores del propietario incorporados antes de publicar
- Sustituye la pausa y las reseñas de tarjetas descritas arriba: las tarjetas que ya muestran descripción NO tienen tooltip adicional. Las reseñas se conservan únicamente en los puntos/celdas y leyenda del almanaque.
- Púrpura parpadea de forma continua en el componente TemporalDot compartido, en toda la app, mientras exista. Un segundo visible y otro oculto. En celdas del almanaque se usa únicamente la fase origen/hoy, evitando superponer dos animaciones. Leer un tooltip ya no detiene el parpadeo. Se respeta reducción de movimiento del dispositivo.
- Retirado el scroll horizontal de indicadores de sobres y filtro global. Puntos más juntos y contadores debajo; ancho flexible, todos visibles en una fila, altura táctil mínima 44 px. Esto reemplaza expresamente la solución con scroll de la entrega anterior.
- Revisión local final: animación global infinita de 2 s confirmada en Inicio; tarjeta diaria enfocada sin tooltip duplicado. Cuadrícula de dos columnas a 320 px: fila 101 px y contenido 101 px; tres columnas a 430 px: fila 95 px y contenido 95 px, sin overflow del documento. Captura .next/puntos-sin-scroll.png. Build, TypeScript y lint correctos; último ajuste de especificidad del filtro global revisado en CSS.
- SQL: ninguno. Publicar todas estas correcciones juntas según solicitud explícita, sin iniciar otros pendientes.

## Entrega — comparación mensual de productos (8 octubre 2026)
- Añadida evolución de seis meses hasta el mes consultado, con barras, montos y número de compras por producto. Disponible desde Ver evolución en el catálogo y al abrir un producto del reporte mensual.
- Comparación con mes anterior: diferencia monetaria y porcentaje; cuando el mes anterior es cero se explica que no se calcula porcentaje. Meses sin compras aparecen en cero y se advierte que meses en curso pueden estar incompletos.
- Reutiliza productReport, historial y fechas de Costa Rica. Identidad por producto y sobre; nombres iguales no mezclan productos distintos. Renombrar el catálogo no modifica compras antiguas. Varias líneas del producto en un gasto cuentan una compra.
- Privacidad: la nueva comparación oculta nombre, cantidades, porcentajes, conteos y barras; no expone patrones mediante el ancho del gráfico. No cambia saldos ni persistencia.
- Pruebas aprobadas: verify-product-comparison (seis meses, cruces de año/zona horaria, ceros, diferencias, aislamiento, identidad estable, compras únicas, meses inválidos e inmutabilidad), verify-finance-products, TypeScript, lint y build.
- Navegador offline: creado producto ficticio en Hogar, abierto desde catálogo, estado sin compras correcto a 320 px; diálogo 281 px de contenido y ancho, sin overflow. Modo privado comprobado, gráfico y cantidades ocultos. Captura .next/comparacion-productos.png. Los escenarios con compras de varios meses tienen prueba automática; no se repitieron manualmente en navegador esta ronda.
- SQL: ninguno. Retomar plantillas de distribución, fotos/almacenamiento, déficit separado y correcciones compensatorias históricas. La comparación mensual queda implementada; ampliar QA visual con compras reales de varios meses en una futura revisión. No afirmar que se haya terminado todo el backlog.
- Publicar ahora con margen de cupo, por instrucción permanente del propietario.
