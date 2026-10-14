# Seguimiento salarial — continuidad, 14 octubre 2026

## Fuentes y alcance

Leídos los tres pedidos: correcciones/auditoría `fd447b8e`, motor salarial `75c55058` e interfaz `ddaa7693`. Excel original consultado en modo de lectura con openpyxl; no modificado, importado ni incorporado al repositorio. Este informe describe estructura, no publica salarios personales. Implementación salarial todavía PENDIENTE.

## Hallazgos del Excel

- Cuatro hojas: Hoja1, PRESUPUESTO #1, PRESUPUESTO #2 y Hoja2.
- Hoja1: 99 filas y 18 columnas de área usada; 33 filas con contenido. Seguimiento histórico en noviembre/diciembre de 2025, aunque el archivo se denomina 2026. No deducir el año del nombre del archivo.
- Bloques de ocho semanas: inicio/fin laboral en F/G; conceptos Salario y Moto en H; devengado en I; pagos en J:M; pendiente en N; fechas de pago en la fila anterior, cuando existen; notas en filas intermedias.
- Solo los primeros tres períodos tienen algunos importes. Los restantes tienen fechas y etiquetas, pero no acreditan salario devengado. Celdas vacías no equivalen a cero confirmado.
- J «Único» y K:M «Parcial» no representan pagos mutuamente excluyentes: un bloque tiene importes en J y K. Deben convertirse en una lista dinámica de abonos, sujetos a revisión.
- Algunos pagos carecen de fecha. No hay cuenta bancaria, empleador ni referencia inequívocos por pago. No inventarlos ni usar la fecha final de la semana como fecha de depósito.
- N tiene fórmulas solo en parte de los bloques; recalcular pendiente a partir de conceptos y aplicaciones, conservando discrepancias como incidencias de la vista previa.
- PRESUPUESTO #1 mezcla ingresos/salidas y planificación; contiene fechas textuales incompletas e inconsistencias entre encabezados de períodos y descripciones. PRESUPUESTO #2 es una proyección de distribución. Hoja2 mezcla proyección/realidad de gastos. Excluir las tres de la importación salarial automática.

## Modelo incremental propuesto

1. Configuración por empleador: ID, propietario, nombre, moneda, salario base, periodicidad, días laborables, vigencia, fecha habitual de pago, reglas de generación y estado.
2. Período: ID estable, configuración, inicio/fin, fecha prevista de cobro, estado de devengo, notas. Períodos futuros son proyecciones hasta confirmar devengo; no son deuda exigible ni dinero disponible.
3. Conceptos: salario, moto y otros; importe y ajustes justificados por período.
4. Pago recibido: ID/idempotencia, fecha/hora real, moneda, cuenta, medio, referencia, notas y movimiento financiero vinculado.
5. Aplicaciones: pago → período/concepto/importe. Un pago puede cubrir varias deudas; una deuda admite cualquier número de abonos. No redistribuir sin decisión explícita.
6. Devengado = conceptos confirmados; recibido = aplicaciones válidas; pendiente = devengado menos recibido. Separar totales proyectados.

## Integración y seguridad

- Reutilizar store por usuario, transporte Supabase y motor de entradas. Salarios pendientes jamás aumentan cuentas ni sobres.
- Confirmar un abono registra O vincula un único ingreso; después reutiliza Distribuir ahora/Guardar sin asignar. Aplicaciones y movimiento deben guardarse juntos; cancelar un formulario no escribe dinero.
- IDs estables, validaciones de importes/fechas, aplicaciones no superiores al pago o deuda, control de reintentos y conflictos. No eliminar historia; correcciones con trazabilidad y coherencia si se anula/corrige el ingreso vinculado.
- Generar períodos sin duplicación y sin reescribir excepciones históricas al editar la configuración.
- No añadir tablas ni ejecutar SQL durante el análisis. Evaluar si el JSON actual y su reconciliación admiten las nuevas colecciones antes de implementar. Si requiere migración, preparar propuesta y preguntar al propietario.

## Interfaz pendiente

- Acceso Seguimiento de salarios desde gestión de ingresos, sin navegación duplicada.
- Resumen Devengado/Recibido/Pendiente, empleador, configuración, período consultado y último pago.
- Configurar salario; cambios posteriores no reescriben historia sin confirmación.
- Períodos recientes primero, filas/tarjetas desplegables; filtros Todos/Pendientes/Parciales/Pagados. Deudas antiguas visibles y abono directo con contexto conservado.
- Detalle: fechas, conceptos, abonos cronológicos ilimitados, totales y notas editables.
- Registrar abono: importe, fecha/hora, empleador, cuenta, medio, referencia/notas; reparto explícito por concepto/período y resumen antes de confirmar.
- Historial con períodos/conceptos afectados, enlace al movimiento financiero y regreso contextual.
- Móvil sin tablas anchas, controles progresivos, temas y privacidad existentes; no gráficos decorativos.
- Importación: vista previa de períodos, conceptos, pagos, fechas, saldos e incidencias; confirmación obligatoria. No importar presupuestos ni proyecciones como cobros.

## Decisiones a resolver antes de guardar históricos

- Precisión: motor actual exige enteros CRC. El pedido salarial requiere precisión decimal apropiada. No redondear silenciosamente ni introducir una segunda aritmética incompatible; definir soporte de centavos/multimoneda antes de conectar esos casos al ingreso real.
- Importación histórica: identificar cuenta/empleador y fechas faltantes; elegir vinculación con ingresos ya existentes o registro de apertura/histórico sin duplicar patrimonio. No inferir que todo abono viejo deba sumarse al banco actual.
- Vacíos y contradicciones se resuelven en la vista previa, no modificando el Excel de origen.

## Orden de continuación y pruebas

1. Modelo y cálculos puros con datos ficticios: completo, parcial, sin pagos, varios abonos, depósito dividido, abono a deuda antigua, concepto adicional, ajustes, duplicados y persistencia.
2. Integración atómica con un único ingreso y sus correcciones/anulaciones; validar cuentas/sobres/reportes y no convertir devengado en saldo.
3. Pantallas y filtros reutilizando el modelo; verificar móvil/PC, privacidad y regreso contextual.
4. Importador con vista previa, incidencias, confirmación e idempotencia. No importar datos reales durante pruebas.
5. Publicar un bloque utilizable; informar límites exactos. No declarar completado el módulo con solo este documento.
