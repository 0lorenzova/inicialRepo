# Gestión salarial — entrega del 15 de octubre de 2026

Esta entrega continúa la integración de Entrada del commit 8b83745. No importa automáticamente el Excel ni modifica datos de producción durante las pruebas.

## Requisitos y estado

| Requisito | Estado |
| --- | --- |
| Entrada salarial integrada | Implementado: empleador, período y un único ingreso real; conserva distribución y dinero sin asignar. |
| Gestión salarial independiente | Implementado en navegación principal. Movimientos conserva su historial; herramientas salariales dentro del nuevo apartado. Se conserva la URL `vista=Salarios`. |
| Configuración | Empleador, nombre, base CRC entera, días laborales, inicio, desfase de cobro, frecuencia semanal/quincenal/mensual/personalizada y conceptos adicionales manuales. No calcula prestaciones legales. |
| Períodos | Semana/año ISO de la fecha inicial; fechas configuradas intactas. Quincenas de 15 días consecutivos y mes identificado por fecha inicial. La periodicidad se conserva en períodos anteriores al editar configuración. |
| Sugerencias | Último período finalizado y devengado con deuda. Si está pagado o no confirmado, lo explica y exige elegir otra opción. Ofrece período en curso y deuda anterior. |
| Crear desde Entrada | Permite agregar un período revisado sin abandonar Entrada; incluye conceptos configurados. No genera dinero al crearlo. |
| Parciales / múltiples / excedentes | Permite importes por concepto y varios períodos en un depósito. El excedente requiere destino explícito; no se reparte automáticamente ni se acepta dinero sin aplicación salarial completa. |
| Adelantos | Requieren confirmación; aplicables a períodos que ya comenzaron. No confirman devengo ni generan deuda de períodos futuros. El cobro real sí incrementa la cuenta una sola vez. |
| Estados | Proyectado, adelanto, devengado sin pagos, parcial, pagado. Filtro adicional Con saldo pendiente incluye deudas parciales. Cantidad de abonos por período. |
| Lista/cuadrícula | Botón único, información equivalente, preferencia guardada en JSON por usuario. |
| Correcciones | Fecha, importe, notas, referencia, nombre del ingreso y aplicaciones a conceptos/períodos. Actualización atómica del abono y movimiento. Históricos editables sin cambios bancarios. |
| Eliminación | Períodos sin abonos activos; anulación de cobros históricos; cobros reales solo con dinero íntegramente sin asignar/utilizar y sin vínculos de asignación. Motivo y auditoría obligatorios; copias originales conservadas. |
| Duplicados | Configuración normalizada, períodos superpuestos, ID estable de abono, ingreso vinculado y referencia compuesta. Mensaje de duplicación confirmado unificado. No bloquea pagos iguales en semanas o fechas diferentes. |
| Consistencia financiera | Las cuentas/sobres/reportes siguen usando movimientos reales. Proyecciones no suman patrimonio. Correcciones protegen saldos y trazabilidad de otros ingresos. Persistencia conserva control de revisión Supabase existente. |
| Colores | Recibido azul, pendiente ocre/ámbar, devengado texto principal, proyección secundario. No se modifican colores de proximidad; Recibido se diferencia de Sin asignar. |
| Más opciones | Mover a otro sobre queda dentro de un desplegable cerrado en el detalle de metas/importes. Se conserva su operación existente. |
| Importador | Conservado dentro de Herramientas salariales: revisión explícita, conciliación, ingreso existente o histórico, procedencia y no modificación del archivo original. |
| Proyecciones | Frecuencia y conceptos configurados, fecha prevista, sin movimiento real ni devengo automático. |

## Verificaciones

- `verify-salary-management.mjs`: sugerencia tras semana trabajada, semana ISO en cambio de año, parciales/completo, varios períodos, adelanto, devengo posterior, corrección de fecha/importe/nombre/período, eliminación segura, históricos, rechazo de edición obsoleta y dinero asignado, frecuencia personalizada, conceptos, persistencia y conservación de dinero.
- `verify-salary-tracking.mjs`: regresión del motor e integración Entrada, duplicados de configuraciones/períodos/pagos, repetición semanal legítima y distribución.
- `verify-salary-import.mjs`: importación histórica y mixta, conciliación, duplicados y ausencia de nuevos ingresos bancarios.
- Lint y compilación de producción (incluye TypeScript). Un intento de build restringido falló por permisos en `.next`; la repetición autorizada compiló correctamente.
- UI local, Supabase desactivado, origen `127.0.0.1:3111`: configuración ficticia, proyección, confirmación de devengo, Entrada con sugerencia de semana anterior y abono75000 sobre125000 → pendiente50000; corrección a70000 → pendiente55000 y movimiento70000; recarga conserva datos y preferencia de cuadrícula.
- Lista y cuadrícula revisadas a360px y1280px, sin overflow horizontal en esas vistas. Temas claro y oscuro inspeccionados. Los últimos ajustes agregan nombre editable y mejor área táctil a selectores; no se declara verificado cada dispositivo físico ni cada tema.

## Límites y próxima continuación

1. Moneda disponible: CRC con importes enteros, conforme al motor actual. PENDIENTE decisión: monedas adicionales, centavos y reglas de conversión; no se mezclan saldos incompatibles.
2. Corregir/anular ingresos ya gastados o con asignaciones dependientes puede requerir revisar primero su distribución. Cambios de fecha que alteren trazabilidad de otros ingresos se bloquean. No hay una reversión general automática de operaciones posteriores.
3. El importador completo aún necesita prueba visual de selección/carga de archivo y confirmación; sus funciones de lectura y conciliación sí están probadas. No se importaron datos reales: usuario debe revisar y confirmar fechas, abonos y períodos.
4. PENDIENTE QA con Supabase en dos dispositivos reales. Se reutiliza compare-and-swap; no se añadió una restricción SQL semántica salarial. No hace falta ejecutar SQL por esta entrega.
5. Los ajustes de conceptos usan importes no negativos; las correcciones reducen el importe del concepto con controles de abonos. Deducciones firmadas o reglas legales automáticas no están implementadas.
6. El backlog anterior ajeno a Gestión salarial sigue en CONTINUIDAD y los informes previos; esta entrega no declara terminado todo el chat.
