# Cierre de períodos, anticipos y navegación salarial — 15 octubre 2026

## Implementado
- Devengo completo permitido desde el día civil siguiente al fin del período. Regla compartida por editor, creación desde Entrada, importador y motor. Se mantiene la zona contable de Costa Rica, solicitada anteriormente; no se agrega un selector de zona por usuario.
- Días efectivamente trabajados opcionales dentro del período y no futuros. Son un registro individual: no prorratean importes ni confirman el período completo.
- Corrección de períodos heredados confirmados prematuramente sin eliminar sus pagos. Los totales no contabilizan esos períodos como devengados antes del cierre.
- Pago anticipado explícito, con confirmación de recepción y fecha real. No confirma devengo. La recepción produce un único movimiento, conservando distribución o dinero sin asignar.
- Inicio → Nuevo movimiento: Recibir salario / Otro ingreso / Registrar salida. Formulario salarial adaptado sobre el motor existente. Se retiraron accesos genéricos redundantes de Inicio y Gestión salarial.
- Fichas con cinta de semana/año y estado: proyectado, en curso, por confirmar devengo, devengado sin pagos, parcialmente pagado, completamente pagado y pendiente vencido. El vencimiento considera la fecha esperada de cobro.
- Fichas muestran recibido, proyección/devengado, pendiente/proyección por cubrir, cantidad de abonos y anticipos. Consulta, corrección y eliminación conservan las guardas y auditoría existentes.
- Mensaje de confirmación pendiente del anticipo diferenciado del aviso de excedente; no exige falsamente seleccionar un período devengado.

## Archivos
- `app/page.tsx`: accesos y formulario de ingreso.
- `components/salary-tracking.tsx`, `components/salary-tracking.module.css`: fichas, filtros y días trabajados.
- `components/salary-earned-control.tsx`, `lib/salary-dates.ts`: control y fecha compartidos.
- `components/salary-income-link.tsx`, `components/salary-import.tsx`: validaciones en flujos alternativos.
- `lib/salary-tracking.ts`, `lib/salary-import.ts`: validación central, anticipos y conciliación.
- `scripts/verify-salary-closing.mjs`, `verify-salary-tracking.mjs`, `verify-salary-management.mjs`, `verify-salary-import.mjs`: escenarios y regresiones.
- `supabase/migrations/202610150001_salary_earned_guard.sql`: propuesta pendiente, NO ejecutada.

## Verificación
- Suite nueva de cierre: antes/durante/después del fin, cambio de día en Costa Rica, fechas inválidas, días individuales, anticipo, no duplicación, devengo posterior, pago parcial/completo, vencimiento según fecha de cobro, corrección heredada, guardas de eliminación e ingresos no salariales.
- Regresiones salariales de integración, administración e importación aprobadas. El importador ahora permite vincular un cobro real revisado sin exigir confirmar el devengo. No genera una segunda entrada.
- Lint, TypeScript y compilación de producción aprobados. La compilación final incorpora el ajuste del mensaje de anticipos.
- Navegador local sin Supabase (`127.0.0.1:3112`): tres accesos desde Inicio; formulario salarial; devengo deshabilitado para período abierto y fecha final de hoy; anticipo ficticio de 50000 sobre proyección 125000; ficha En curso, devengado 0, recibido 50000 y por cubrir 75000; un único ingreso en Movimientos.
- Lista y cuadrícula revisadas a 360 px; escritorio a 1280 px, sin overflow horizontal observado. No representa prueba en todos los dispositivos físicos o temas.
- No se modificaron datos financieros de producción ni se importó el Excel real.

## Pendiente explícito
1. El propietario decidió **dejar el SQL pendiente por ahora**. La app bloquea el devengo prematuro; las llamadas directas a Supabase aún no tienen esta nueva protección. No declarar el requisito de protección en base de datos como completado.
2. El trigger propuesto no está probado en un PostgreSQL real. Antes de aplicarlo, revisar períodos heredados futuros marcados como devengados: impediría guardar el documento hasta corregirlos. No ejecutar la propuesta antigua de revisión financiera como dependencia.
3. Se conserva la zona de Costa Rica. Cambiar la zona contable por usuario requiere una decisión y sincronizar validación del cliente y servidor.
4. Se mantienen pendientes previos ajenos a este bloque: QA Supabase entre dispositivos, importación visual integral del Excel real con revisión del usuario, multimoneda/centavos y reversión de ingresos utilizados con dependencias.
