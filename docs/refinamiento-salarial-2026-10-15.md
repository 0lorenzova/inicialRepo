# Refinamiento salarial: almanaque y estados compartidos

## Implementado
- «Registrar salario» sustituye «Recibir salario» en accesos y formularios.
- Se conserva apertura del período actual, reutilización de proyecciones y creación persistente solo al confirmar.
- Navegación histórica y futura sin límite impuesto por el inicio de configuración; intervalos semanales, quincenales, mensuales y personalizados con límites técnicos de fecha.
- Corregido avance que podía quedarse en el mismo período cuando tenía una fecha final personalizada.
- Almanaque plegable con navegación por mes/año, selección resaltada que permanece al navegar y puntos accesibles por período.
- Calendario y fichas usan `salaryPeriodPresentation`: verde cubierto, amarillo parcial, rojo devengado sin pagos, neutro sin devengo ni pagos. El rojo ya no significa por sí solo vencido; el vencimiento sigue calculándose con la fecha prevista.
- Adelanto que cubre el total: «Importe previsto cubierto», manteniendo separado el devengo. Casilla marcada/deshabilitada y texto «Cubierto» cuando corresponda.
- Medio de recepción fuera de Más opciones. Último medio y cuenta activa válidos recordados tras guardar, dentro del JSON salarial existente.
- Duplicados: misma función para vista previa, registro y corrección; normalización de referencia y mensaje coherente.
- Totales del formulario reutilizan los cálculos centrales. Pago completo único continúa sin etiqueta de abono; no se duplican movimientos.

## Verificaciones realizadas
- `verify-salary-calendar.mjs`: navegación histórica/futura, bisiestos, anclas mensuales, límites de fecha, períodos acortados, estados, corrección/anulación, preferencia persistente, duplicados e invariante financiero.
- Regresiones `verify-salary-closing`, `verify-salary-tracking`, `verify-salary-management`, `verify-salary-import`: aprobadas.
- TypeScript, lint y compilación aprobados antes del último ajuste CSS para el selector mensual a 320 px; Vercel debe confirmar la compilación final.
- Navegador local sin Supabase: apertura actual desde Nuevo movimiento; retroceso anterior a configuración; cambios de mes/año sin cerrar ni perder selección; pago completo ficticio de 125000; ficha verde sin devengar, parcial amarillo de 50000, medio Efectivo recordado; coherencia del calendario con las fichas.
- Revisadas anchuras 320, 360 y 1280 px, sin overflow horizontal observado. En 320 px se detectó recorte del campo mensual y se añadió una fila completa para ese campo. Queda revisar visualmente ese último ajuste.
- El rojo y sus transiciones se probaron en el motor. No se completó la creación de un ejemplo rojo por navegador: la automatización de campos de fecha no mantuvo los valores; se canceló sin guardar. No afirmar que todos los colores se comprobaron visualmente.

## Pendiente
- SQL `202610150001_salary_earned_guard.sql` sigue sin ejecutar por decisión expresa del usuario. No hay migración nueva en este bloque.
- Diagnóstico del acceso «Failed to fetch»: Supabase respondió al chequeo sin credenciales y resolvió DNS, pero todavía no se comprobó la configuración del despliegue afectado ni la petición de autenticación. No se ha demostrado la causa ni corregido el acceso.
- Revisión visual final del campo mensual a 320 px, estado rojo y navegación inferior táctil física. El navegador de prueba no pudo pulsar Gestión salarial desde el grupo móvil fuera de vista; se continuó en escritorio.
- Persisten pendientes anteriores de QA entre dispositivos/Supabase, importación real revisada y multimoneda; no se declara terminado todo el proyecto.
- No se modificaron datos financieros de producción. Se preservaron los archivos locales ajenos a esta entrega.
