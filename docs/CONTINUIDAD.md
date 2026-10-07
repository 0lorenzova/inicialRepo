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
| Categorías editables | Pendiente; actualmente selector de categorías predefinidas. |
| Gastos: comercio, referencia y descripción | Implementado. Pendientes etiquetas, método de pago explícito y foto del recibo. |
| Monedas | CRC operativo. Multimoneda/cambio de moneda de las primeras referencias no implementado. Requiere definir conversión antes de sumar monedas diferentes. |
| Nombre automático/manual | Parcial. Selección y orden por activación funcionan; falta arrastre real, separador configurable, vista previa dedicada, ajustes independientes de gastos y aviso de nombre manual sin editar. Corregir también Semana: actualmente semana del mes, debe ser semana del año. |
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
