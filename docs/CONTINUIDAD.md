## Entrega 0.1.69 · 18 octubre 2026
- Un abono parcial antes de confirmar la semana deja de activar el vencimiento rojo. El aviso de atraso empieza cuando hay deuda devengada confirmada pendiente después de la fecha prevista; el estado parcial conserva su color.
- Se mantiene el cálculo por jornada laboral guardada y fecha de vencimiento. Sin SQL ni cambios de importes/movimientos existentes; regresión de saldo parcial antes y después de confirmar. Suites salarial de ajustes, estados, cierre y reglas, TypeScript, ESLint y build aprobados; sin QA visual.

## Entrega 0.1.68 · 18 octubre 2026 — publicada
- Gestión salarial ofrece filtro por rango y selección de los 3/20/todos los períodos confirmados elegibles para preparar un depósito agrupado. Excluye pagos parciales/completos y ajustes sin validar; el ingreso único se revisa y confirma en el diálogo normal con cuenta y fecha real. Persistencia y movimientos siguen usando la operación existente; sin SQL.
- La subfase no implementa múltiples depósitos independientes con fechas distintas ni el tratamiento de fechas aproximadas/desconocidas. Ver fases y limitaciones en `docs/fases-salarios-2026-10-18.md`. Sin QA visual del flujo integrado.
- Las 14 suites `verify-salary-*.mjs`, TypeScript, ESLint afectado, `git diff --check` y build de producción pasaron. Vercel confirmó `success` / `Deployment has completed` para `30f1c5e`: https://vercel.com/myself-e673/inicial-repo/5BxSr9j4RMsAnJeZrDtFgLk1P1R6. La revisión visual queda pendiente; el navegador rechazó la URL local por política.

## Entrega 0.1.67 · 18 octubre 2026 — publicada
- Registrar salario recuerda por fuente la última cuenta y el medio de recepción usados tras guardar un pago. Al cambiar de empleador se cargan sus valores; fuentes antiguas sin preferencia específica conservan el último valor global y las cuentas inactivas no se sugieren.
- Preferencias opcionales en el JSON salarial existente, sin SQL ni cambios en movimientos/saldos. 14 suites `verify-salary-*.mjs`, TypeScript, ESLint dirigido y build de producción aprobados. Sin revisión visual en navegador.
- Vercel confirmó `success` / `Deployment has completed` para el commit `c785d32` (estado de commit: https://vercel.com/myself-e673/inicial-repo/3jPwCE4LUfq3TptcwgQJsKcuTz1G).

## Entrega 0.1.66 · 18 octubre 2026 — publicada
- Catálogo recurrente por fuente con versiones fechadas: cada nueva versión inicia en un período futuro y no recalcula las anteriores. El catálogo existente queda como base histórica no recurrente.
- Los conceptos recurrentes se muestran como estimaciones por período. Se pueden ajustar o quitar de una semana; solo la confirmación semanal los incluye en la deuda devengada. Aguinaldo, vacaciones y demás beneficios nunca se repiten automáticamente.
- Las cantidades habituales por hora/día permiten estimar únicamente cuando hay cantidad y tarifa explícitas. Sin SQL nuevo; sin crear movimientos ni acreditar dinero al configurar el catálogo.
- Las 14 suites `verify-salary-*.mjs` pasaron con el resolvedor de extensiones TS de Node; ESLint de los archivos afectados y `git diff --check` pasaron. Build/TypeScript también se habían confirmado para este código. La revisión visual en navegador no quedó completada porque el navegador no pudo acceder al servidor aislado.
- Datos ficticios locales, según confirma el propietario. Ver `docs/fases-salarios-2026-10-18.md` para lo implementado y lo que sigue pendiente. El SHA y estado de Production son la referencia de publicación.

## Entrega 0.1.65 · 18 octubre 2026 — publicada
- Catálogo y ajustes semanales admiten cantidad por hora/día y tarifa explícita; la cantidad habitual solo precarga. Cantidades en incrementos de 0,25, sin redondear fracciones de colón. Beneficios no admiten esa regla.
- Registrar salario prepara el importe estándar de la semana actual si la estimación es conocida y no hay pagos previos; precarga la fecha/hora real y requiere revisar y confirmar en el flujo existente.
- Build de producción y TypeScript aprobados; ESLint de los cuatro archivos afectados terminó correctamente. En la ronda siguiente se revalidaron las 14 suites `verify-salary-*.mjs` con el resolvedor de extensiones TS; no hubo QA visual. Sin SQL nuevo.
- El propietario confirma que la información usada actualmente es de prueba, aunque parezca realista; avisará cuando un dato sea real. No detener cambios solo por apariencia realista de los datos.
- Production success confirmado el 18 de octubre de 2026 a las 23:03:40 UTC para `c406fa9861b29fa4328facc4c3ecac40da13e66c`: https://inicial-repo-pa16xo9om-myself-e673.vercel.app. El catálogo recurrente con historial de vigencias se implementa en 0.1.66.

## Entrega 0.1.64 — reglas por empleador y catálogo compacto
- Ver `docs/fases-salarios-2026-10-18.md`: alcance real, pruebas, UI y conciliación de las cinco fases del prompt integral. Pago por día/cierre/días antes con vigencia; relación laboral; catálogo compacto; Calendario y etiquetas relativas. No afirmar que el registro masivo o los cálculos legales estén implementados. Próximo bloque: fase 2. Sin SQL nuevo.
- Publicación autorizada en esta ronda; build, TypeScript, seis suites y revisión UI 384/1280 aprobados. Confirmar Production success antes de reportar publicación.

## Entrega 0.1.63 · 18 octubre 2026
- Publicación autorizada explícitamente para este bloque: «Ahora sí quiero que publique estas mejoras». Incluye las mejoras compactas y textos locales descritos abajo, más Activar semana histórica pendiente.
- `activateSalaryPeriod` reutiliza saveSalaryPeriod y el campo earned: solo pasado sin cobros/obligación, con importe confirmado positivo y condiciones conocidas. No acredita ingresos ni modifica cuentas, sobres o movimientos. Reintentos de la misma activación no crean registros duplicados. Ajustes estimados continúan estimados.
- Casilla reutilizable en Registrar salario, Resumen del período y detalle de fichas de Gestión salarial. Guarda pendiente para cobrar ahora o después; colores/calendario compartidos actualizan la alerta vencida. Al registrar abono parcial conserva naranja; pago completo verde. Movimiento reducido respetado por CSS existente.
- Build y TypeScript aprobados. Sin migración SQL. No se ejecutaron pruebas automatizadas de escenarios ni revisión visual de este bloque; pendiente revisión del propietario. Confirmar Production success antes de afirmar publicación.
- Después de esta publicación vuelve a regir: no publicar nuevos cambios sin petición explícita.

## Norma vigente y cambios locales · 18 octubre 2026
- PUBLICACIÓN: el propietario autorizó continuar con los pendientes y publicar el trabajo listo sin preguntas intermedias. Esta instrucción sustituye para esta ronda la norma anterior de publicación revocada; confirmar Production por SHA.
- LOCAL, sin commit/push/despliegue: Registrar salario muestra «Esta semana», «Navegar en el calendario» y retorno al último período pendiente; ficha visible y formulario inferior plegado conservando valores. El sábado inicial ya existía; no se alteraron fechas históricas.
- LOCAL: fuente salarial con vigencias/jornada plegadas; resumen del período con base y abonos plegados; proyección con resultado arriba y cambio de intervalo plegado; detalle de movimiento con información adicional/productos/clasificación plegados. Catálogo, estimaciones y desgloses existentes reutilizados. Campos con validación nativa abren la sección al fallar. Sin cambios de motor o SQL.
- Comprobación TypeScript (`tsc --noEmit --incremental false`) aprobada. No se ejecutaron tests ni revisión visual de este bloque; pendiente revisión en navegador y teléfono. Conservar los cambios anteriores del formulario al continuar.

## Corrección de numeración · 18 octubre 2026
- Auditoría: 61 publicaciones Production exitosas (61 commits), 1 intento fallido. La corrección del contador corresponde a 0.1.62. Ver `docs/versiones-publicadas.md` para evidencia y norma de incremento; próxima entrega con cambios: 0.1.63.
- Reemplaza la numeración 0.1.1 de la nota anterior; no modifica datos ni SQL.

## Versión visible · 18 octubre 2026
- Añadida debajo de la compilación: versión centralizada en package.json (0.1.1) y revisión Git automática en Vercel. Conserva fecha Costa Rica y tiempo relativo.
- Build de producción y TypeScript completados correctamente. Sin cambios SQL ni financieros.

# Continuidad del proyecto — 4 octubre 2026

## Cómo continuar
 - PUBLICADO 18 octubre: commit f1e9618 en main/origin; GitHub deployment environment=Production, state=success confirmado para https://inicial-repo-mq6yw1l7a-myself-e673.vercel.app. Incluye la entrega 0.1.65; no repetir pruebas aprobadas salvo cambios relacionados.
 - BLOQUE 18 octubre implementado y probado: `docs/salarios-ajustes-estimaciones-2026-10-18.md`. Fuentes compartidas en Configuración, vigencias al inicio de período, catálogo y ajustes semanales independientes, estimaciones históricas con evidencia, estados neutros sin deuda, proyecciones de consulta y controles de calendario. Sustituye las notas de análisis pendiente del 17 octubre para este alcance. Compilación/lint/pruebas y revisión local 320/1280 CSS aprobadas; incluido en la entrega publicada 0.1.64. Sin SQL nuevo. Pendientes: conversión multimoneda, decisión de prorrateo dentro de período y QA remoto entre dispositivos.
 - RESUELTO EN 0.1.64: el prompt del 17 octubre sobre históricos sin registros, estimaciones con evidencia, deuda vencida confirmada y parciales naranjas quedó integrado en `docs/salarios-ajustes-estimaciones-2026-10-18.md` y publicado en el bloque salarial del 18 octubre. No confundir notas de análisis anteriores con pendientes de código actuales.
 - RESUELTO EN 0.1.64: fuentes compartidas, vigencias, ajustes semanales y proyecciones sustituyeron la prioridad de conciliación del 17 octubre. Ver `docs/conciliacion-fuentes-conceptos-2026-10-17.md` como referencia histórica; el SQL de esa entrega ya está aplicado y no se debe reejecutar. La decisión de prorrateo dentro de período sigue pendiente y no se asume.
 - CIERRE SQL 17 octubre: ambas migraciones APLICADAS en Supabase iljzewjvutigusmjmwhz mediante supabase/apply_pending_20261017.sql. Cliente f27d67f confirmado en Vercel Production. Respaldo privado finanzas_migration_backup.user_finance_data_20261017, comparación exacta de documentos aprobada. RPC, trigger, RLS y permisos verificados. NO volver a ejecutar el bundle. Esto sustituye notas previas de SQL pendiente/autorizado sin aplicar. Ver docs/migraciones-autorizadas-2026-10-17.md.
 - SQL autorizado el 17 octubre: propietario confirmó «Hazlas». Ver docs/migraciones-autorizadas-2026-10-17.md. Cliente compatible RPC y SQL probados en PostgreSQL/PGlite; NO aplicados en Supabase por falta de sesión administrativa (panel abierto en inicio de sesión). No pedir autorización SQL otra vez; obtener acceso, respaldo y revisar esquema/históricos antes de aplicar. Esta nota sustituye la posposición anterior.
 - Bloque 17 octubre: `docs/herramientas-salariales-2026-10-17.md`. Agregar período / Proyectar próximo período restaurados como herramientas opcionales, reutilizando reporte, calendario y editor. Consultar/cancelar no guarda; confirmación explícita conserva proyección sin ingresos. Motor, lint, build y UI local móvil/PC aprobados. No repetir este desarrollo. SQL sigue pendiente.
 - Ajuste pequeño posterior: filtro «Pago anticipado» usa hasAdvance del cálculo compartido (antes de fecha prevista O adelanto laboral). Incluye pagos laborales anticipados recibidos en la fecha esperada. Sin cambios financieros ni SQL. Regresión agregada en verify-salary-work-timing.mjs; retomar pendientes del informe de anticipos, no rehacer este filtro.
 - Último bloque: `docs/anticipos-laborales-2026-10-16.md`: distinción adelanto laboral/fecha prevista, cierre laboral de presentación y nueva paleta compartida; corregidas fechas históricas sin hora. Guarda explícita de devengo y SQL aún pendientes de alineación conjunta: no ejecutar migración antigua sin revisión/autorización. Motor probado; QA visual sigue pendiente.
 - Auditoría más reciente: `docs/auditoria-salarial-2026-10-16.md` cubre los 19 puntos del prompt 248d8439. No confundir implementado con nuevos cambios de criterio pendientes (paleta, devengo por día laboral, vigencia de configuración y herramientas manuales opcionales). Acceso rápido al último período pendiente y corrección del aviso con importe cero añadidos. Prioridades de continuación al final del informe.
 - Último cambio: `docs/salario-distribucion-posterior-2026-10-16.md`. Elección emergente después de registrar salario y confirmar persistencia, distribución de ingreso existente sin duplicarlo. Motor y sincronización probados; build aprobado. Retomar QA visual móvil/PC del nuevo diálogo y caminos cerrar/continuar/cancelar; navegador local bloqueado tras timeout. No repetir desarrollo ni pruebas lógicas salvo cambios relacionados.
 - Último bloque: `docs/navegacion-salarial-2026-10-16.md`. Corregida navegación hacia atrás con históricos personalizados; fechas con días abreviados y Abonos: 0. Completada revisión del reporte a 320/1280 px, orden lista/cuadrícula y persistencia tras recarga. No repetir esas pruebas salvo cambios relacionados. Limitación pendiente de QA: escritura automatizada del mes nativo; botones del almanaque y selección de fechas sí verificados.
 - Norma permanente reiterada por el propietario: publicar lo listo y verificar Vercel antes de agotar uso, salvo instrucción contraria. Reservar margen para commit, push y despliegue; no esperar al límite. Último bloque: `docs/estados-salariales-2026-10-16.md` (estados compartidos, alertas, semanas ISO, días laborales y almanaque).
0. Último bloque: `docs/cierre-salarial-2026-10-15.md`. Devengo desde el día siguiente al cierre, anticipos explícitos, Inicio salarial y fichas por estado. El usuario decidió dejar `202610150001_salary_earned_guard.sql` pendiente: NO ejecutarlo ni declarar completada la protección de escrituras directas. Esta nota sustituye los mensajes anteriores de “no hace falta SQL” para este requisito nuevo.
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

## Entrega incremental — 10 octubre 2026
- Ver docs/actualizacion-interfaz-2026-10-10.md: matriz completa de 19 requisitos, complemento del menú, pagos desde avisos, pruebas y pendientes. No afirmar que el prompt completo está implementado.
- Publicación anterior de comparación de productos a6c16ef confirmada success en GitHub/Vercel.
- Publicar esta entrega; priorizar próximos bloques de cobertura, ocultación global, ingresos y calendario. Sin SQL nuevo.

## Ampliación — sobres de proximidad, cobertura y distribución
- Reemplazo visual publicado como dbe582c y confirmado en Vercel. La ampliación integra forma abierto/cerrado por cobertura acumulativa, ocultación global, preferencias de ingreso, medio de recepción, filtros por sobre, calendario seleccionable y plantillas reutilizables.
- Matriz vigente y pruebas: docs/actualizacion-interfaz-2026-10-10.md. Las entradas antiguas que indican estos puntos pendientes quedan sustituidas.
- SQL: ninguno para esta entrega. No ejecutar migración RPC antigua aisladamente.
- Retomar: déficit separado de dinero real, compensaciones históricas y vistas de historial; fotos requieren decisión de almacenamiento. Prioridad configurable en empates, multimoneda y avisos con app cerrada siguen pendientes de definición.

## Entrega — historial contextual de sobres (11 octubre 2026)
- Implementadas vistas Ingresos y gastos / Cronología al filtrar por sobre o entrar desde su menú. Comparten filtros, registros y enlaces de trazabilidad existentes; no hay otra fuente de datos.
- Corregido el importe del historial de un sobre: muestra su asignación real dentro del ingreso/gasto dividido, no el total global. Signo según origen/destino en transferencias, préstamos y devoluciones. Datos antiguos ambiguos se indican sin inventar dirección.
- Ingresos/asignaciones, gastos y operaciones internas se agrupan por separado; transferencias y préstamos no se presentan como gastos. Cronología por fecha civil de Costa Rica, recientes primero. Actividad reciente reutiliza el mismo ordenador temporal.
- Archivos: components/envelope-history.tsx, components/movement-list.tsx (extraído y reutilizado), lib/finance-history.ts, app/page.tsx, app/globals.css y scripts/verify-envelope-history.mjs.
- Pruebas dirigidas: siete operaciones reales del motor con datos ficticios, importes parciales, signos, suma de efectos igual al saldo, grupos sin duplicados, ambiguos e inmutabilidad; verify-finance-history, TypeScript, lint y build aprobados.
- Navegador offline: historial de Hogar muestra 1100 de un ingreso total1500 y 1000 de un ingreso5000; ambas vistas y vacío con búsqueda comprobados. A320 px: documento305, botones44px; a1280: documento1265, sin overflow. Captura .next/historial-movil.png. No hubo nuevas escrituras financieras de navegador ni pruebas en producción. No se repitieron lista/cuadrícula u otras vistas sin cambios.
- No requiere SQL. Mantener pendiente migración RPC anterior; no ejecutarla sin cliente compatible, prueba, respaldo y autorización.
- Retomar: déficit separado del dinero real, correcciones con movimientos compensatorios, fotos/almacenamiento. Requieren definición/confirmación: multimoneda, avisos con app cerrada, vencimientos propios de préstamos y prioridad configurable para fechas empatadas. Pendiente QA visual de comparación de productos con varios meses, cuatro colores futuros en una misma fecha y arrastre físico.

## Entrega — corrección de distribución de ingresos (11 octubre 2026)
- Implementado el pendiente «Editar distribución histórica de ingreso» mediante operaciones compensatorias. En Ruta del ingreso → Corregir distribución se mantienen contexto, importes iniciales, motivo obligatorio, revisión y confirmación.
- El ingreso original nunca se sobrescribe. La diferencia crea Desasignación/Asignación con distributionCorrection {incomeId,batchId,reason}; fecha de la corrección actual. El bloque completo se publica en una única actualización del store, después de validar todos los pasos.
- Se rechazan insuficiencia de saldo actual, sobre archivado a modificar, referencias antiguas ambiguas, duplicados, cambios concurrentes, fechas anteriores al historial y montos imposibles. Cancelar no guarda. No se corrigen automáticamente fechas futuras: deben revisarse antes.
- La ruta del ingreso muestra distribución neta y lista de correcciones; cada movimiento compensatorio enlaza al ingreso correspondiente. No cambia cuentas, préstamos, pagos, productos ni obligaciones. Esto NO es una anulación general de gastos/préstamos.
- Los retiros compensatorios vuelven a lotes del mismo ingreso; retiros ordinarios siguen siendo fondo común. Consumo explícito contempla varios lotes del mismo ingreso. Orden/eligibilidad temporal compara instantes Costa Rica/UTC, no cadenas incompatibles.
- Archivos: lib/income-correction.ts, lib/income-trace.ts, lib/finance-ledger.ts; components/income-correction.tsx, income-trace-dialog.tsx, movement-list.tsx; app/page.tsx, globals.css; scripts/verify-income-correction.mjs.
- Pruebas nuevas: ingreso original inmutable, movimiento compensatorio doble/atómico, saldo y reportes conservados, múltiples lotes, duplicados, estado obsoleto, sobre archivado, datos ambiguos, motivo, fechas y zona horaria, insuficiencia por dinero gastado, falla en segundo paso sin datos parciales y persistencia.
- Regresiones afectadas: verify-unassigned-incomes, verify-finance-ledger (18 escenarios), verify-planning-payments-trace y verify-income-distribution. Lint y compilación revisados. No se repitieron las pruebas visuales de pantallas ajenas al cambio.
- Navegador local con Supabase desactivado: exceso999999 rechazado; ingreso ficticio1500 con Hogar1100 pasó a Hogar1000/Ahorro200/sin asignar300, generando descarga100+carga200. Original1500 conservado. Enlaces, motivo, cancelación posterior y recarga persistida comprobados. Diálogo320 y escritorio1280 sin overflow. Captura en visualizaciones/correccion-ingreso.png.
- SQL: ninguno para esta entrega; metadatos opcionales en JSON existente. Migración RPC202610010001 sigue pendiente de cliente compatible, base de prueba, respaldo y autorización del propietario; no ejecutarla aisladamente.
- Retomar: modo déficit al asignar más de lo disponible (prompt70919143 §9: usar solo dinero real y registrar faltante separado, confirmación explícita, sin amortización automática), fotos/recibos y almacenamiento. Pendientes de definición: multimoneda, notificaciones con app cerrada, vencimientos propios de préstamos y prioridad configurable entre obligaciones empatadas. QA histórica aún pendiente: productos con compras de varios meses, cuatro colores futuros en el mismo día y arrastre físico. Las vistas separada/cronológica del historial ya fueron publicadas en7a22e2f; no rehacerlas.

## Ajuste puntual — leyenda del almanaque (11 octubre 2026)
- Bajo «Fechas pendientes guardadas en tus sobres», los indicadores muestran su significado: fuera del período de seguimiento, con tiempo disponible, se acerca la fecha límite, fecha límite de hoy o tiempo crítico y fecha límite vencida.
- Leyenda, reseñas y etiquetas accesibles reutilizan el mismo texto. Colores, cobertura, parpadeo y cálculos conservados. Sin SQL.

## Ajuste puntual — Inicio móvil y selector único (11 octubre 2026)
- Inicio móvil: título Filtrar por proximidad arriba, cinco sobres en una fila debajo, casilla Activar filtro y Ver todos a su derecha. Desactivar impide abrir filtros por color; Ver todos sigue accesible. No oculta obligaciones ni desactiva alertas. Estado de la casilla durante la sesión del componente; no se agregó preferencia persistente.
- Un solo botón de vista en Inicio/Sobres: Lista → cuadrícula cómoda → compacta → Lista. Muestra icono y número de columnas de la siguiente vista. En teléfono demasiado angosto se omite la cuadrícula de tres columnas; escritorio conserva la cantidad adaptable. Preferencias existentes conservadas.
- TypeScript y lint dirigidos; sin nueva prueba visual interactiva de estos dos ajustes. Sin SQL. Publicar con el margen restante según instrucción del propietario.

## Entrega complementaria — Inicio, menú y categorías (11 octubre 2026)
- Sustituye la casilla temporal «Activar filtro» por preferencia local persistente de Inicio; resto de ámbitos independiente. Doble clic/doble toque del icono ahora abre menú personal. Nuevo gasto primero con icono propio.
- Gastos clasifican sobres y categorías con importes exactos, un único movimiento; edición/asociación de categorías por sobre sin cambiar historia. Ruta del ingreso desplegable con regreso contextual y botones de escritorio intercambiados.
- Informe completo, archivos conceptuales y pruebas: docs/actualizacion-complementaria-2026-10-11.md. Sin SQL nuevo. No ejecutar RPC antigua aisladamente.
- Retomar: prueba táctil física y backlog anterior descrito en el informe. Publicar al cerrar esta entrega según autorización del propietario.

## Encabezado configurable de Inicio — 12 octubre 2026
- Nueva sección Configuración → Inicio con «Mantener fijo el encabezado». Activado por defecto; no se añadió casilla a la pantalla principal.
- Preferencia opcional homeHeaderPinned guardada por el store existente (Supabase JSON y copia local). Solo fija la barra superior en Inicio; conserva A+, tema, privacidad, calendario, notificaciones y estado de sincronización.
- CSS sticky conserva altura natural y controles adaptables. No cambia los otros bloques fijables ni las demás vistas.
- Archivos: app/page.tsx, app/globals.css y este informe. Sin SQL nuevo.
- Verificado: lint, compilación de producción; móvil360x800 y escritorio1280x650 sin overflow, encabezado en top0 al desplazar; desactivado top negativo y persistido tras recarga; vista Sobres continúa estática. Configuración accesible mediante interruptor con etiqueta y descripción. Pruebas locales con Supabase desactivado.
- Captura: visualizaciones/configuracion-inicio.png. Esta petición está completa; permanecen los pendientes anteriores del informe complementario (QA táctil física, déficit separado, fotos/almacenamiento y decisiones ya documentadas).

## Entrega correctiva y temas — 12 octubre 2026
- Ingreso general: Distribuir ahora destacado sin preselección; solo al elegirlo aparecen Por sobres/Cronograma/Calendario. Guardar sin asignar oculta distribución; confirmación explícita. Motor financiero conservado.
- Configuración → Notificaciones: Mostrar saldo de la responsabilidad en las notificaciones, desactivado por defecto. Muestra importe pendiente real, no saldo del sobre; privacidad global prevalece en campana y aviso inicial. Persistencia en JSON existente; sin SQL.
- WhatsApp, Gmail y recordatorios por correo EXPLÍCITAMENTE POSPUESTOS; no bloquean entrega. Sugerencias al desarrollador por Gmail se conservan.
- Temas Oscuro, Silver y Orgánico: tokens y superficies reforzados en globals.css y ThemeProvider/MUI; mismos componentes y persistencia existente. Proximidad sin cambios. Oscuro negro profundo; Silver plata; Orgánico verde natural y tierra.
- Pruebas: notificaciones unitarias (preferencia, privacidad, identidad estable e importe), lint dirigido, compilación/TypeScript. Navegador offline: ingreso1200 guardado una vez sin asignar, cuenta6000→7200; modos explícitos; móvil360 y PC1280. Preferencia e importes persistidos después de recarga; privacidad en ambos avisos. Comparación visual de los tres temas en escritorio. Revisión visual móvil de temas pendiente; no afirmar cobertura visual total. Ajuste final CSS de interruptores/texto secundario revisado en código.
- Archivos: app/page.tsx, app/globals.css; components/finance-notifications.tsx y module.css, opening-attention.tsx, theme-provider.tsx; lib/finance-notifications.ts; scripts/verify-finance-notifications.mjs.
- NUEVO PEDIDO PENDIENTE (archivo 4c8dd345-1519-4249-a840-09ef702d3ff6/Texto pegado.txt): Reportes→Ingresos abre listado descendente con filtros/períodos y regreso; detalle textual reutilizado con cuenta/medio separados, moneda, signos +/− y distribución; mejora visual del calendario y tarjetas debajo de +Movimiento conservando acciones y proximidad; pruebas móvil/PC. Leído completo, implementación todavía no iniciada por prioridad de publicación antes del límite.
- Mantener backlog anterior y SQL RPC condicionado; no ejecutar migración antigua aisladamente. Archivo supabase/check_finance_migration.sql ajeno a esta entrega, no publicado.

## Referencias visuales a sobres — 13 octubre 2026
- Helper central lib/envelope-label.ts antepone icono de sobre a nombres visibles, sin modificar nombres almacenados ni IDs. Usado en listas/cuadrícula, selectores, contexto de acciones, reportes, productos, distribución/correcciones, préstamos, recordatorios, calendario, filtros y notificaciones.
- Títulos automáticos de asignación/transferencia/préstamo/devolución se decoran solo al coincidir exactamente con el formato generado; no se altera texto libre, historial ni operaciones. Iconos personalizados conservados; privacidad sigue ocultando la información correspondiente.
- Compilación/TypeScript y lint dirigido aprobados. Navegador local offline360: lista y cuadrícula muestran icono; ancho documento345≤360. Aviso inicial presenta referencia con icono. Sin escrituras financieras de prueba. Corregido contraste del importe de money-banner en los tres temas ajustados.
- Sin SQL. Publicar entrega. Retomar pedido anterior de Reportes/listado de ingresos, detalle textual y calendario (archivo4c8dd345), además de pendientes previamente documentados; no presentarlos como completados.

## Reportes, detalles y calendario — 13 octubre 2026
- Reportes → Ingresos/Gastos abre desglose descendente del mismo período (o historial completo), con nombre/referencia, fecha Costa Rica, +/− y colores. Atrás conserva el mes; no incluye transferencias/préstamos como entradas/salidas reales.
- Detalle textual compartido MovementDetails, reutilizado también en Ruta del ingreso. Importe destacado, cuenta y medio separados, categoría/tipo, referencia, descripción, comercio, etiquetas, distribución histórica, categorías por sobre y productos cuando existen. Accesible desde reportes, actividad e historial. Privacidad oculta importe y detalles. No se inventan campos ausentes. CRC es moneda del modelo actual; presentación respeta currency explícita si existe en datos importados, sin implementar conversión/multimoneda.
- Calendario: fecha actual con número destacado, selección diferenciada, días con eventos, tarjetas con sobre/fecha alineados, superficies por tema. Guía plegable conserva leyendas/explicaciones. Accesos de período en cuadrícula 2×2 móvil. Conservadas navegación día/semana/mes/año, apertura de obligaciones, alertas y fechas.
- Archivos centrales: components/finance-report.tsx, movement-detail.tsx y module.css, planning-calendar.tsx y module.css; movement-list/envelope-history/income-trace-dialog; lib/movement-presentation.ts, finance-history.ts, app-navigation.ts; app/page.tsx y globals.css; scripts/verify-report-details.mjs.
- Pruebas: nuevo verify-report-details (filtros/orden, límites Costa Rica, campos reales/ausentes, signos/moneda, navegación, inmutabilidad), verify-finance-history, verify-app-navigation, verify-calendar-alerts, verify-calendar-goal-move. Lint y compilación/TypeScript aprobados.
- Navegador offline:360 móvil y1280 escritorio; ingreso1200 y gasto300 previamente ficticios, distribución Hogar200/Ahorro100, detalles, ruta/regreso, diciembre vacío y todo historial. Calendario día/semana/año/mes/siguiente y acceso a meta; Oscuro/Orgánico/Silver visualizados; sin overflow horizontal (345/360 y1265/1280; diálogo321/321). Privacidad comprobada. No se registraron movimientos financieros nuevos. Ajuste final de alineación móvil de controles se compila con la entrega.
- Sin SQL. No ejecutar RPC antigua aisladamente. Bloque4c8dd345 implementado; permanecen backlog anterior (déficit, almacenamiento de fotos, definiciones de multimoneda, prioridad/vencimientos propios y QA física), sin confundirlo con esta entrega. Mensajería externa explícitamente pospuesta.

## Nueva petición — fecha prevista de pago (13 octubre 2026, estado anterior; resuelto en entrega siguiente)
- Ronda detectada al95% usado: priorizada entrega pequeña. Ajuste de tooltip: ancla de interacción siempre visible; alternancia púrpura afecta solo al icono. Tooltip interactivo permanece mientras el cursor está sobre el disparador o la reseña; breve margen de200ms al salir. Reduce-motion mantiene iconos visibles. Pendiente comprobación interactiva de este ajuste; no afirmar que fue realizada.
- PENDIENTE COMPLETO: fecha prevista de pago independiente de deadline en cada responsabilidad/ocurrencia; persistir en JSON. Inspección ya realizada: ScheduledAmount y PlanningItem en lib/envelope-planning.ts; edición en components/scheduled-amount-editor.tsx; GoalSettings/editor para metas. Continuar desde aquí, sin repetir análisis general.
- Implementar plannedPaymentDate opcional validada, mostrar diferencia de días sin alterar temporal/deadline. En repetidas, asociar a ocurrencia y no heredar una fecha absoluta a la siguiente al pagar. Revisar avance de ocurrencias, cancelación y movimientos de metas para no perder/trasladar erróneamente la fecha.
- Sobre: basta una responsabilidad activa/no pagada con fecha prevista posterior al límite para giro solo del icono cada2s. No depender de cobertura ni saldo ni color/visibilidad de proximidad. Detener al pagar todas las causantes, corregir fecha o cancelar programación. Mantener interacción/arrastre/doble clic. Reduce-motion: texto estático «Pago previsto con atraso». Probar móvil/PC, varias responsabilidades, fechaigual/anterior, verde/amarillo, con fondos, recurrencia y persistencia. No mover dinero automáticamente.
- Esta característica NO está implementada aún. No requiere previsiblemente SQL por JSON existente; confirmar al implementarla. Sigue vigente publicación autorizada antes del límite.


## Responsabilidades, calendario, configuración y productos — 13 octubre 2026
- Sustituye el estado pendiente de la sección anterior. Fecha prevista opcional en importes/responsabilidades y metas, independiente del vencimiento, validada y persistida en el JSON existente. Visible en formulario, resumen y detalle. Conflictos de edición y traslado incluyen el nuevo campo.
- Icono gráfico del sobre gira una vuelta cada2s si alguna responsabilidad activa/no pagada prevé atraso; saldo/cobertura/proximidad no interfieren. Solo se anima el gráfico interior, conservando el botón/arrastre. Texto estático accesible siempre disponible; media query reduce-motion elimina el giro.
- Pagos recurrentes: fecha prevista pertenece a cada ocurrencia; el historial pagado la conserva, la siguiente no hereda la fecha absoluta anterior. Corregir/borrar fecha, desactivar la responsabilidad o pagar elimina la condición si no hay otras causantes. Metas conservan su comportamiento de planificación, sin inventar pagos al alcanzar fondos.
- Calendario completo abre en semana actual (ISO), encabezado Semana N · mes/año; navegación inicialmente plegada con Ver/Ocultar navegación. Hoy/Esta semana/Este mes/Este año en una fila adaptable; selector Vista renombrado Navegación. Calendarios embebidos conservan el período contextual. Tooltip interactivo mantiene ancla estable mientras parpadea solo el indicador.
- Configuración: categorías independientes mediante details/summary, todas cerradas al entrar. Abrir/cerrar una conserva las demás y sus controles/preferencias. Se retira el antiguo control único Desplegar todo.
- Productos: reutilizadas casillas de seguimiento persistente, selección múltiple independiente, área táctil y estado seleccionado diferenciados, contador y explicación. No nuevas casillas redundantes ni operaciones financieras al seleccionar.
- Pruebas: verify-planned-payment NUEVO (persistencia JSON, atraso, cancelación/corrección, pagos, múltiples causas, recurrencia, cobertura, estados, movimientos de planificación, conflictos, selección múltiple e invariantes); regresiones verify-envelope-planning, verify-planning-payments-trace, verify-envelope-settings, verify-calendar-goal-move, verify-calendar-alerts y verify-finance-products aprobadas. Lint y build/TypeScript aprobados; primer build bloqueado por permisos Windows, repetido correctamente con permisos sobre archivos temporales.
- UI local con Supabase desactivado:320/360 móvil y1280 PC, sin overflow; semana42 actual, navegación cerrada, cuatro accesos y selector; categorías independientes y reinicio al entrar. Plan ficticio100 con límite25oct/prevista28oct, aviso3días, giro computado2s infinito y padre inmóvil; persistió tras recarga; corregir al25oct retiró giro. Dos productos ficticios seleccionables/desmarcables sin alterar el otro ni gastos. No pagos reales ni cambios de producción durante pruebas.
- No SQL nuevo. Mantener pendiente QA física de movimiento reducido/gestos y verificación de sincronización entre dos dispositivos reales; lógica y copia JSON probadas. Backlog anterior sigue separado: déficit, almacenamiento de fotos, multimoneda, vencimientos propios de préstamos/prioridad. Mensajería externa pospuesta; migración RPC antigua no ejecutar aisladamente.


## Correcciones de calendario, alertas y encabezado — 13 octubre 2026
- Pedido ba7da2c5 implementado: calendario proyecta ocurrencias virtuales únicamente para el período visible, sin almacenar movimientos ni pagos anticipados. Registros reales conservan acciones; previsiones son de consulta y se identifican como Recurrente/Previsión. Metas únicas conservan su fecha. Distribución no permite seleccionar IDs virtuales.
- Se reutiliza la aritmética civil de recurrencias; soporta diaria/semanal/mensual/anual para importes y semanal/quincenal/mensual/anual/personalizada para aportes. Salto directo al período para evitar recorrer años. Respeta endDate si está guardada, pagos existentes, cambios individuales con occurrenceDate, importes y tramos de serie; claves estables evitan duplicados. Las pantallas actuales no incluyen editor de fecha final: se respeta el dato cuando existe, sin inventar fechas.
- Ancla mensual de aportes guardada para que febrero no desplace permanentemente un aporte del día31; proyección y confirmación usan la misma aritmética. Cambiar la fecha de una ocurrencia de pago conserva su fecha nominal y no desplaza la serie. No se cambió aritmética de saldos.
- Advertencia corregida: ya no gira el emoji personalizado ni aparece texto permanente en la tarjeta. Solo el pequeño indicador de color gira con rotateY2000ms. Púrpura sin atraso previsto: parpadeo2s; coincidencia: secuencia4s (2s parpadeo,2s vuelta completa). Indicadores con condiciones distintas se separan aunque compartan color. Detalles/notificaciones reutilizan componente; movimiento reducido mantiene estado estático accesible y contorno. En calendario, la alerta combinada conserva su lugar para no superponer el eco1s a la vuelta2s.
- Configuración→Inicio: Mantener encabezado fijo + Fijar en todas las pantallas, subordinada/inactiva si la primera está apagada, sin borrar selección. Ambas usan el store persistente existente; se reutiliza sticky sin duplicar encabezado.
- Pruebas nuevas verify-calendar-futures: meses/años futuros, fechas bisiestas, fin de mes, anual/semanal/quincenal, finalización, excepción individual, sin duplicados/inmutabilidad, ancla de confirmación, alertas por condición y fases CSS. Regresiones verify-planned-payment, verify-finance-recurrence, verify-envelope-planning, verify-calendar-goal-move, verify-calendar-alerts, verify-finance-notifications, verify-envelope-settings aprobadas. Lint y build/TypeScript aprobados; ajustes finales de textos/validación y cobertura virtual revisados después.
- UI offline360/1280:12 previsiones del año2027, sin overflow; guardar recurrencia no cambia saldo1600; iconos personalizados animation:none, púrpura simple2s y combinado4s. Encabezado sticky fuera de Inicio top0 al desplazar, desactivar→static y opción subordinada deshabilitada conservando checked; alcance soloInicio deja Configuración estática; persistencia tras recarga comprobada. No acciones financieras reales.
- Archivos: app/page.tsx, app/globals.css; components/envelope-collection.tsx y module.css, envelope-goal-editor.tsx, envelope-planning.tsx, finance-notifications.tsx, opening-attention.tsx, planning-calendar.tsx y module.css, scheduled-amount-editor.tsx, temporal-indicator.tsx y module.css; lib/envelope-planning.ts, envelope-settings.ts, finance-notifications.ts, finance-recurrence.ts, move-envelope-goal.ts, planning-calendar.ts; scripts/verify-calendar-futures.mjs; este documento.
- Sin SQL nuevo. Pendiente QA física de movimiento reducido y sincronización entre dos dispositivos; otros pendientes históricos continúan según informes previos. Archivo SQL de diagnóstico ajeno conservado sin publicar.


## Temas adicionales, avisos precisos y análisis salarial — 14 octubre 2026
- Red Moon, Universe, Galaxy y River Water añadidos al selector/ciclo existentes; paletas centralizadas en lib/theme-palettes.ts para variables CSS y MUI/portales. Temas anteriores conservan sus valores. Fondos, superficies, bordes, textos y acentos distintos; sin imágenes/dependencias/animaciones decorativas. Importes +/- y acciones de error más legibles únicamente en nuevas paletas, conservando significado financiero y colores exactos de proximidad.
- Tema guardado localmente por ID de usuario autenticado; preferencia anterior como fallback y modo offline conserva color-mode. No sincroniza apariencia entre dispositivos vía Supabase; ese alcance y dos usuarios reales quedan explícitamente por comprobar. Las demás preferencias no cambian.
- Avisos de atraso usan diferencia civil entre fecha prevista y límite, con singular/plural; grupos muestran los días distintos sin atribuir un solo plazo a todas las responsabilidades. No hay leyenda permanente en tarjetas de Inicio. Filtro global gira si alguno de su grupo tiene atraso previsto; reutiliza secuencia púrpura y movimiento reducido existentes.
- Menú real Nuevo movimiento y accesos de Inicio muestran iconos MUI distintos para Entrada/Salida. Conservan textos, contexto y flujos.
- Pruebas: verify-theme-palettes (contraste>=4.5 en texto/acciones, bordes>=3, cuatro paletas distintas y días de atraso agrupados); regresiones calendar-futures, planned-payment y finance-notifications aprobadas. Lint dirigido y primera compilación aprobados; segunda compilación cubre aislamiento de preferencias y ajuste final de importes.
- UI local Supabase desactivado: cuatro temas en360/1280, Inicio, Sobres, Movimientos, Reportes, Calendario, menú MUI y formulario de ingreso en pantallas representativas. Ancho345<=360; persistencia de Galaxy tras recarga. Plan ficticio100 en Hogar, límite24oct/prevista27oct: aviso3días, filtro verde2s; corregir prevista24oct detiene giro sin cambiar contador/saldos. No se registraron ingresos/gastos reales; solo planificación ficticia local. No afirmar revisión exhaustiva de cada pantalla en cada tema.
- Excel salarial analizado en solo lectura; no copiado/importado/publicado. Hoja1 contiene histórico2025, ocho bloques con algunos vacíos y pagos sin fecha. Presupuestos separados. Mapeo, modelo propuesto, decisiones de precisión/conciliación e interfaz/pruebas pendientes en docs/plan-seguimiento-salarial.md.
- Auditoría disponible en docs/seguimiento-requisitos.md: evidencia previa reutilizada, requisitos nuevos y límites de QA señalados. Motor/UI/importador salarial todavía PENDIENTES; no presentar el plan como implementación.
- Sin SQL nuevo. Migración RPC antigua continúa condicionada a cliente compatible, base de prueba, respaldo y autorización; no ejecutarla aisladamente. supabase/check_finance_migration.sql ajeno no publicar.
- Retomar: primero motor salarial y enlace atómico con ingreso, luego UI/deudas antiguas e importación con vista previa; resolver precisión y manejo de depósitos históricos antes de guardar. Backlog déficit/fotos/multimoneda/QA física permanece en tabla; mensajería externa sigue pospuesta.


## Cierre incremental — 14 octubre 2026: salarios y calendario agregado
- Calendario: un representante por color, incluido aviso púrpura sin duplicados. Si cualquiera de sus responsabilidades tiene pago previsto con atraso, gira el representante; el detalle conserva la alerta individual. Mantiene el componente de animación y movimiento reducido existente.
- Movimientos → Seguimiento de salarios: configuraciones por empleador, períodos proyectados/devengados, conceptos editables con motivo, filtros, resúmenes, historial y abonos parciales repartidos explícitamente entre varios períodos/conceptos.
- Un abono crea un ingreso con distribución opcional o vincula uno existente sin sumar dinero. Validaciones atómicas/idempotencia, auditoría de ajustes, corrección de vinculaciones sin eliminar el ingreso. JSON por usuario en store/Supabase existente; NO requiere SQL nuevo.
- Restablecimiento financiero explícito limpia también períodos/abonos/auditoría salarial y conserva configuraciones si se elige conservar preferencias. Aviso del diálogo actualizado.
- Pruebas nuevas verify-salary-tracking.mjs y verify-calendar-indicator-groups.mjs; regresiones calendar-futures e income-distribution aprobadas. TypeScript, lint y build aprobados antes de los últimos ajustes menores. UI local offline: configuración ficticia, período devengado 2000, abono 500, pendiente1500; recarga conserva datos. Móvil efectivo300px y escritorio1067px (viewport solicitado360/1280 por zoom del navegador), sin overflow horizontal. Formulario de abono revisado en escritorio.
- PENDIENTE salarial: importador XLSX con vista previa e incidencias; resolver fechas/cuentas faltantes y estrategia de históricos sin duplicar patrimonio. No importar el Excel real automáticamente. Motor CRC entero; soporte centavos/multimoneda requiere decisión de modelo. Pruebas Supabase con dos usuarios/dispositivos reales aún pendientes.
- No declarar terminado todo el chat; consultar también plan-seguimiento-salarial.md y seguimiento-requisitos.md. Excluir supabase/check_finance_migration.sql ajeno y next-env.d.ts automático.


## Importación salarial revisable — 14 octubre 2026
- Movimientos → Seguimiento de salarios → Importar Excel. Lector XLSX acotado al formato revisado de Hoja1 (F/G fechas, H conceptos, I devengado, J:M abonos, N control). Archivo leído en navegador, sin subirlo ni ejecutar fórmulas/macros/enlaces. Presupuestos excluidos. Sin dependencias nuevas ni SQL.
- Vista previa con todos los períodos sin seleccionar, estado no devengado hasta confirmación, campos editables, avisos por fechas/importes vacíos, resultados almacenados de fórmulas y diferencias de pendientes. Vacío no equivale a cero. Vista de devengado/abonos/pendiente recalculado.
- Guardado atómico por selección: exige datos válidos y vincular TODOS los abonos del período a ingresos existentes; agrupa las aplicaciones de un ingreso entre conceptos/períodos. Conserva cuentas, sobres, movimientos y distribución; bloquea duplicados, reimportaciones, períodos superpuestos y abonos sin conciliar. Procedencia por SHA-256 + hoja/fila.
- Pruebas: verify-salary-import (ZIP comprimido/sintético/truncado, límites, fechas1900/1904, vacíos, fórmulas sin caché, discrepancias, revisión explícita, vinculación, errores sin escrituras parciales, duplicados); regresión verify-salary-tracking aprobada. Lint, TypeScript y build aprobados.
- Validación del mapeo contra XML del Excel original en solo lectura: reconoce8 períodos,3 con abonos, ninguno seleccionado, conserva vacíos. Archivo original intacto; no datos personales/Excel en Git ni importaciones financieras reales.
- Revisión visual del nuevo diálogo PENDIENTE: CUA rechazó el acceso a la pestaña local3108 por política de URL. No se usó un mecanismo alternativo para eludir el bloqueo. DOMParser en navegador y carga real mediante selector todavía requieren QA visual; ZIP y transformaciones verificadas por separado.
- PENDIENTE decisión consultada: permitir pagos históricos sin movimiento bancario para reducir deuda sin aumentar cuentas. La pregunta sigue sin respuesta; no implementar esa semántica aún. Esta entrega solo admite vinculación de ingresos existentes. Si faltan ingresos o fechas, dejar el período sin seleccionar; no recomendar recrear cobros que ya integran los saldos.
- PENDIENTE: centavos/multimoneda, QA Supabase entre dos dispositivos, backlog anterior. La fixture sintética de prueba solo está en Temp; captura anterior salarios-prueba-local.png y SQL ajeno siguen fuera del commit.


## Pagos históricos salariales autorizados — 14 octubre 2026
- El propietario confirmó conservar abonos antiguos sin ingreso asociado como pagos históricos que reducen deuda salarial sin incrementar cuentas/sobres. Esta decisión sustituye el pendiente de la sección anterior.
- Importar Excel ahora permite elegir explícitamente por abono: vincular ingreso existente o pago histórico sin ingreso en la app. Sigue sin seleccionar períodos ni tratamiento automáticamente; exige fecha real válida, importes completos y confirmación final.
- Los históricos guardan fecha civil (sin inventar hora), procedencia hoja/fila/columna/huella del archivo y fecha de registro. No tienen cuenta ni movimiento bancario ficticios. Participan en Recibido/Pendiente y se identifican en detalles e historial; sin botón Ver ingreso inexistente.
- Anular histórico exige motivo, conserva el registro y auditoría, reabre deuda y no modifica dinero. La misma validación de aplicaciones sirve para abonos bancarios e históricos; evita sobrepago, períodos no devengados, duplicados y reimportación. Importaciones mixtas son atómicas.
- Pruebas ampliadas verify-salary-import: histórico, persistencia JSON, fecha ausente/futura, exceso, duplicados por procedencia, vinculación incompatible, anulación, mezcla histórico+ingreso y cuentas/sobres/movimientos intactos. Regresión verify-salary-tracking, lint, TypeScript y build aprobados.
- No se importaron datos reales. No SQL nuevo: metadatos opcionales en JSON por usuario existente.
- PENDIENTES: QA visual del importador/historial en móvil y PC (bloqueo previo de navegador, no reintentado ni eludido); QA Supabase entre dispositivos; centavos/multimoneda. Anular histórico no ofrece todavía reedición/importación del mismo período: la corrección conserva la trazabilidad y puede requerir un futuro editor específico para históricos. Backlog general permanece en informes anteriores.

## Entrada salarial integrada y duplicados — 14 octubre 2026
- Entrada permite marcar abono salarial, seleccionar empleador/configuración y período devengado con pendiente. Aplica conceptos en orden y conserva nombre, distribución inmediata o dinero sin asignar. Ingreso y abono se guardan juntos sobre el último estado; un solo movimiento real.
- Configuraciones equivalentes normalizan espacios/mayúsculas por empleador y nombre; mensaje: «Ya existe un ingreso con estos mismos datos.». No elimina históricos. IDs estables previenen reintentos; abonos nuevos con referencia comparan configuración, fecha/hora, cuenta, importe y aplicaciones. Semanas distintas y pagos iguales en otras fechas siguen permitidos.
- Persistencia JSON por usuario mantiene comparación de revisión en Supabase para impedir escrituras concurrentes sobre una versión desactualizada. No requiere SQL nuevo. No se añadió una restricción SQL semántica de nombres.
- Pruebas aprobadas: verify-salary-tracking (integración, parciales, distribución, duplicados y semanas distintas), verify-salary-import, verify-income-distribution, TypeScript, lint y build. Sin datos financieros reales modificados.
- PENDIENTE: revisión visual del nuevo formulario en móvil/PC y concurrencia Supabase entre dispositivos reales. Entrada aplica a un período y rechaza importes superiores al pendiente; abonos de varios períodos continúan disponibles desde Seguimiento de salarios. Los pendientes del importador y del backlog anterior permanecen.

## Gestión salarial integral — 15 octubre 2026
- Informe de requisitos, pruebas y pendientes: docs/gestion-salarial-2026-10-15.md. Sustituye pendientes anteriores de selector Entrada limitado a un período, falta de adelantos, vistas y edición de históricos.
- Menú principal Gestión salarial (URL Salarios conservada), herramientas secundarias, lista/cuadrícula persistente, identificación ISO, resumen con importes diferenciados, filtro de pendientes incluidos parciales.
- Entrada: sugerencia último finalizado y devengado con deuda, no reasigna silenciosamente cuando ya está pagado; permite adelanto confirmado, deuda anterior, múltiples períodos/conceptos, creación contextual y excedente decidido por usuario.
- Motor: adelantos no devengan períodos; plantillas de conceptos, frecuencia personalizada, instantánea de periodicidad. Correcciones atómicas de cobros/históricos y eliminación con auditoría y guardas de saldo/trazabilidad.
- Mover a otro sobre ahora dentro de Más opciones inicialmente cerrado. Sin SQL nuevo ni importación real. No datos ficticios en producción.
- QA: nueva suite salary-management + salary-tracking + salary-import; lint y build. UI local Supabase desactivado verificó Entrada y corrección, una recepción real por abono, persistencia, lista/cuadrícula móvil360/escritorio1280, claro/oscuro, sin overflow observado.
- PENDIENTES: monedas/centavos (decisión), reversión de ingresos gastados con dependencias (bloqueada para conservar saldos), QA visual integral importador, QA Supabase entre dispositivos, backlog previo ajeno. Los históricos ya se pueden editar: no repetir ese desarrollo.
