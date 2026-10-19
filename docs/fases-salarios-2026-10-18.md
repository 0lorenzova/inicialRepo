# Gestión salarial integral — entrega por fases, 18 octubre 2026

## Entrega 0.1.64: configuración y ajustes de interfaz

### Implementado y reutilizado
- Día de pago independiente por fuente: último día de la semana ISO (domingo), 0–6 días antes del cierre o día fijo de lunes a domingo. Sábado predeterminado en fuentes nuevas. Para otras periodicidades se usa el cierre del período y la última aparición del día elegido. La UI explica esta convención; no se interpreta el día previsto como un depósito real.
- Fuentes existentes conservan la regla anterior hasta modificación explícita. La regla nueva se guarda en las condiciones por vigencia. Se evita que una regla actual se filtre a versiones antiguas que no contenían ese campo. Períodos ya guardados conservan su fecha.
- Relación laboral: inicio, fin opcional, estado activo/finalizado. No se estiman semanas fuera de los límites explícitos ni semanas que cruzan esos límites sin información suficiente. Se mantienen los históricos guardados.
- Historial de condiciones consultable y plegado; reutiliza snapshots existentes. Moneda continúa CRC (limitación del motor existente).
- Catálogo compacto: nombre e importe alineados en una fila; edición individual plegada. Datos y ajustes históricos conservados. No aplica conceptos extraordinarios automáticamente.
- Registrar salario: Semana en curso, acceso de retorno a esa semana y conservación del retorno al último pendiente.
- Calendario reemplaza almanaque en todos los textos/etiquetas de app, components y lib.
- Cronograma: referencia relativa por período y por metas/aportes, incluidas Esta semana, La semana pasada, Hace X semanas y Faltan X semanas. Cálculo por semanas ISO y cambios de año.
- Continúan vigentes: navegación calculada sin escrituras; conceptos semanales; recibido/estimado/pendiente separados; activación explícita opcional; pagos y distribución existentes. No exigir activar para registrar un ingreso.

### Archivos
- lib/salary-tracking.ts, lib/salary-projection.ts, lib/planning-calendar.ts.
- components/salary-source-settings.tsx, salary-planning.module.css, salary-receive-dialog.tsx, salary-period-report.tsx, salary-period-calendar.tsx, planning-calendar.tsx, planning-calendar.module.css, envelope-planning.tsx.
- scripts/verify-salary-pay-rules.mjs, package.json, package-lock.json y documentación.

### Pruebas ejecutadas
- Nuevo verify-salary-pay-rules: siete días, sábado, cierre, días antes, validaciones, empleadores independientes, vigencias sin contaminación, fecha histórica guardada, fin laboral, año ISO, consultas sin escrituras, activación idempotente sin dinero y referencias relativas.
- Regresiones aprobadas: verify-salary-adjustments, verify-salary-navigation, verify-salary-states, verify-salary-calendar, verify-salary-receipt.
- TypeScript y build de producción aprobados.
- UI aislada localhost:3116, Supabase desactivado/Solo navegador: fuente ficticia, cambio a miércoles, concepto 10000, plegar, guardar y reabrir conservando valores. Selector de días antes muestra su campo. Cronograma actual/anterior correcto.
- Responsive: anchos 384 y 1280 CSS; página y diálogo sin overflow horizontal. Captura C:/Users/0lore/AppData/Local/Temp/finanzas-reglas-pago-20261018.png. No es prueba en teléfono físico ni sincronización real entre dispositivos.

### Persistencia y publicación
Campos opcionales en el documento financiero existente. Sin migraciones SQL nuevas ni cambios en datos de producción. Publicación autorizada expresamente para esta ronda; confirmar Production success del SHA antes de declararla publicada.

## Conciliación de lo pendiente del prompt integral
1. Fase 1 adicional: multimoneda real, condiciones a mitad de período y prorrateo de primeras/últimas semanas; no inventar importes. La regla nueva usa el día de la misma semana ISO, no el lunes posterior: si se requiere ese caso, añadir una opción explícita.
2. Fase 2 completada en 0.1.65–0.1.67: cantidad/tarifa explícitas por concepto, catálogo recurrente por fuente con versiones futuras, recibo rápido de semana estándar con revisión de cuenta/fecha real y sugerencias de cuenta/medio independientes por fuente. Aguinaldo/vacaciones no se repiten automáticamente.
3. Fase 3 parcial en 0.1.68–0.1.71: selección por rango y de 3/20/todos los períodos elegibles para preparar un solo depósito agrupado, con desglose precargado en la confirmación existente. Se excluyen pagos parciales/completos y períodos con ajustes no validados. La regresión cubre los límites 3/20, selección total y orden más reciente. Siguen pendientes múltiples depósitos independientes con fechas reales distintas, fecha aproximada/desconocida y operación masiva completa de pagos por registrar.
4. Fase 4: resumen de salarios confirmados por ciclo 1 de diciembre–30 de noviembre y rango personalizado implementado en 0.1.72. Solo cuenta períodos completos confirmados y asigna los abonos al período indicado por sus aplicaciones; informa y excluye períodos que cruzan límites o carecen de confirmación. No prorratea días, no presenta estos totales como cálculo legal de aguinaldo y no crea obligaciones ni movimientos. Pendientes: aguinaldo estimado/reconocido/recibido/pendiente; asignación del salario devengado por fecha en períodos que cruzan el ciclo; vacaciones acumuladas/disfrutadas/remuneradas/pendientes independientes. Antes de implementarlos hacen falta datos sobre régimen, salarios ordinarios/extraordinarios, especie, suspensiones/subsidios, disfrute y modalidad de pago.
   - Fuente oficial: el MTSS describe el aguinaldo privado como suma de salarios ordinarios y extraordinarios devengados del 1 dic al 30 nov ÷ 12; incluye horas extra y otros pagos salariales y distingue subsidios por suspensión. https://www.mtss.go.cr/temas-laborales/aguinaldo/preguntas_frecuentes.pdf
   - El MTSS indica un mínimo general de dos semanas tras 50 semanas continuas y fórmulas de vacaciones según modalidad; trabajo doméstico tiene una regla propia de 15 días y cálculo diferente. La app no registra actualmente el régimen necesario para elegir una fórmula. https://www.mtss.go.cr/temas-laborales/index.html · https://www.mtss.go.cr/temas-laborales/trabajo%20domestico/trabajo_domestico.html
5. Auditoría del libro de prueba en 0.1.70: `Hoja1` corresponde a F/G/H/I/J:M/N y aporta ocho períodos; las hojas de presupuesto se excluyen, la vista previa conserva 17 importes devengados vacíos y dos fechas reales de abono ausentes. El importador avisa de fórmulas en fechas del período, concepto y fecha de recepción. Libro original no modificado ni importado; quedan pendientes conciliación/reportes y la revisión manual antes de confirmar filas.
6. Resuelto en 0.1.69: un pago parcial sin confirmación de devengo no marca atraso; el saldo confirmado sí vence después de su fecha prevista. Estados compartidos; recordatorios de registro siguen separados de deuda devengada.
7. Pruebas pendientes específicas: horas/días extra/menos y vacaciones, ciclos/vacaciones, nuevos informes/importación, QA visual y persistencia remota. La regresión de 0.1.68 verifica selección de elegibles, rangos, precarga de aplicaciones y exclusión de pagos parciales/ajustes estimados; no certifica el flujo integrado en navegador ni la fase completa de depósitos independientes.

## Entrega 0.1.65
El catálogo y los ajustes semanales admiten cantidad por hora/día con tarifa explícita, y Registrar salario prepara el recibo estándar de la semana actual con fecha real, sin guardar hasta confirmación. Publicada en Production; ver `docs/CONTINUIDAD.md` y `docs/versiones-publicadas.md`.

## Entrega 0.1.66
El catálogo recurrente por empleador conserva versiones con fecha de inicio en período futuro. El catálogo previo es base histórica sin repetición automática. Los conceptos recurrentes aparecen como ajustes estimados en cada período; se pueden modificar o quitar en una semana y no se vuelven deuda devengada hasta confirmar el ajuste de esa semana. Beneficios (incluidos aguinaldo y vacaciones) no se repiten automáticamente. Tarifas por hora/día requieren cantidad y tarifa habituales para estimar; no convierten el tiempo estimado en horas trabajadas confirmadas.

Verificaciones: las 14 suites `verify-salary-*.mjs`, ESLint afectado, `git diff --check`, TypeScript y build de producción aprobados. Sin SQL. La revisión visual en navegador quedó pendiente por falta de conexión entre el navegador y el servidor de pruebas aislado. Próximo alcance: pagos salariales por lote, ciclos/beneficios con base normativa vigente e informes/importación; no afirmar estas fases como implementadas.

## Entrega 0.1.67
Registrar salario conserva el último medio y cuenta usados para cada configuración salarial después de guardar un pago. Al cambiar de fuente sugiere la preferencia propia; registros antiguos sin esa preferencia continúan usando la última recepción global y una cuenta inactiva no se propone.

Verificaciones de 0.1.67: las 14 suites `verify-salary-*.mjs`, TypeScript, ESLint dirigido y build de producción aprobados. Sin SQL ni movimientos financieros durante las verificaciones. QA visual no realizado.

## Entrega 0.1.68
El selector de depósito agrupado trabaja con períodos salariales confirmados y totalmente pendientes dentro del rango elegido. Permite seleccionar los 3 últimos, 20 últimos o todos los elegibles; el diálogo normal abre con las aplicaciones y el total precargados y requiere revisar cuenta/medio y confirmar la fecha real antes de guardar un único ingreso.

Las 14 suites `verify-salary-*.mjs` pasan; `verify-salary-receipt.mjs` cubre elegibilidad y suma de aplicaciones, orden, rango, exclusión de ajustes estimados y períodos parciales. TypeScript, ESLint dirigido, `git diff --check` y build aprobados. Sin SQL ni escritura financiera externa; QA visual pendiente porque el navegador bloqueó la URL local. No se implementan aún depósitos separados ni fechas aproximadas/desconocidas.
