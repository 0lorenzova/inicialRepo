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
2. Fase 2: cantidades y reglas por concepto (horas/días); catálogo recurrente explícito por empleador que no convierta aguinaldo/vacaciones en cargos semanales. Registro rápido de semana estándar con confirmación de recepción y fecha efectiva; conservar distribución posterior y cuenta recordada, añadir preferencia por fuente si procede.
3. Fase 3: Pagos por registrar, selección por rango, 3/20 semanas, select-all elegibles, ingreso único agrupado frente a múltiples depósitos independientes, fechas reales por pago y tratamiento explícito de fecha aproximada/desconocida. Reutilizar aplicaciones de pagos a varias semanas, sin duplicar ingresos. Excluir pagadas, parciales, ajustes no validados e históricos sin condiciones fiables; operación atómica/idempotente y distribución del conjunto.
4. Fase 4: consulta por ciclo diciembre–noviembre predeterminado y rango personalizado; aguinaldo estimado/reconocido/recibido/pendiente; reparto de semanas por fechas de devengo; vacaciones acumuladas/disfrutadas/remuneradas/pendientes independientes. Antes de fórmulas, verificar fuentes oficiales vigentes y alcance laboral aplicable. No convertir vacaciones acumuladas en deuda exigible ni asumir un pago sin movimiento.
5. Fase 5: revisar importador existente y archivo real C:/Users/0lore/OneDrive/Seguimiento salarios 2026.xlsx antes de ampliar mapeo. Reutilizar vista previa, trazabilidad y pagos históricos sin dinero bancario existentes; correcciones, inconsistencias, deduplicación, conciliación y reportes por fuente/ciclo/concepto. No volver a importar lo ya importado.
6. Mantener estados compartidos e independientes de estimaciones; recordatorios de registro no son deudas. Revisar condición de atraso parcial no confirmado identificada en recomendaciones anteriores antes de ampliar el motor.
7. Pruebas pendientes específicas: horas/días extra/menos y vacaciones, casilla de cobro rápido, lotes 3/20, depósito agrupado, ciclos/vacaciones, nuevos informes/importación, UI y persistencia de esas fases; las pruebas de esta entrega no las certifican.

## Entrega 0.1.65 y siguiente paso
El catálogo y los ajustes semanales admiten cantidad por hora/día con tarifa explícita, y Registrar salario prepara el recibo estándar de la semana actual con fecha real, sin guardar hasta confirmación. Build y TypeScript aprobados; ESLint de los archivos afectados terminó correctamente. Los scripts salariales no pudieron arrancar con Node directamente por imports TS sin extensión; no alcanzaron los escenarios. No hubo QA visual ni SQL. Ver `docs/CONTINUIDAD.md`.

Pendiente: catálogo recurrente por empleador con historial de vigencias; evitar recalcular semanas anteriores sin datos guardados; preferencia por fuente en el recibo rápido; verificación de cantidades/días, fracciones y duplicados; revisión móvil y escritorio. El propietario autorizó publicar esta entrega; el siguiente paso es confirmar Production success por SHA.
