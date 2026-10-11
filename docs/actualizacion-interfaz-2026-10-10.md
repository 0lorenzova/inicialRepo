# Actualización incremental — 10 octubre 2026

## Estado por requisito del prompt de 33e78611
1. Implementado: cuatro escalas (1 / 1.12 / 1.25 / 1.4), ciclo y persistencia existentes.
2. Implementado: propósito y colones, portada, barra lateral y metadata.
3. Implementado: engranajes del resumen conservan menú real Mostrar/Ocultar monto.
4. Implementado: selector reutilizado en encabezado Mis sobres, iconos compactos en móvil, lista/cuadrícula y preferencias actuales; cuadrícula mantiene reglas 2/3 y adaptación escritorio.
5. Implementado: ocultación global con confirmación y única preferencia showProximity; tarjetas, filtros, calendario, distribución, avisos y portales respetan la misma preferencia. No desactiva cálculo ni pagos.
6. Implementado: SVG pequeños de sobres abiertos/cerrados, cinco colores y parpadeo púrpura compartido. Leyendas, aportes recurrentes y vistas privadas usan icono de referencia sin revelar cobertura.
7. Implementado: saldo acumulativo en planningItems/allocatePlanningCoverage. Vencimientos anteriores primero; cada colón se reserva una sola vez; pagados y déficits excluidos. Empates conservan orden existente por identificador; prioridad configurable pendiente de definición.
8. Implementado: preferencias editables de monto, tipo, cuenta, referencia y descripción; guardadas en el JSON existente. Editar un ingreso no cambia los valores predeterminados.
9. Implementado: Efectivo/Transferencia bancaria/SINPE Móvil/Otro, independiente del tipo y cuenta. Reutiliza paymentMethod y se conserva en Movimientos.
10. Implementado: indicadores de color y cobertura sobre el subtotal por sobre; clic filtra obligaciones; el encabezado permite volver a todas.
11. Implementado: Expandir todos / Contraer todos; solo modifica el estado visual, preserva selección y montos.
12. Implementado: Calendario de distribución reutiliza PlanningCalendar, cuatro períodos, casillas por obligación y sección para metas sin fecha.
13. Implementado: tres vistas comparten selecciones y totales; contraer, cambiar filtro o período no elimina lo marcado.
14. Conservado: borrador provisional y confirmación existente, asignar no equivale a pagar.
15. Implementado: proyección desde saldo real después de operaciones confirmadas; el borrador no modifica cobertura.
16. Implementado: color temporal y forma de cobertura independientes; púrpura intermitente y accesibilidad de reducción de movimiento conservados.
17. Revisado en 320/390/768/1280 px sin overflow en las vistas nuevas, reutilizando estilos y componentes.
18. Pruebas automáticas y de navegador dirigidas aprobadas; ver evidencia y límites abajo.
19. Este registro y reporte final reúnen avance y pendientes.

## Complemento del menú (ea1b4d21)
- Cargar dinero, Descargar dinero, Transferir dinero entre sobres y Productos en seguimiento en este sobre.
- SVG reutilizable: sobres y flechas de carga/descarga/transferencia/préstamo. Iconos existentes MUI para otras opciones.
- Menú contextual y diálogo existentes; mantienen contexto, saldos, seguimiento, devoluciones y archivo. Ninguna opción eliminada.
- Los identificadores internos y movimientos históricos conservan sus tipos; etiquetas nuevas solo en presentación. Diálogo desde ingreso también muestra Cargar dinero.

## Nueva solicitud: pago desde avisos
- Formulario compartido inline Marcar como pagado en campana y aviso de apertura, para importes programados pendientes.
- Pide monto real y cuenta, confirma, llama payScheduledAmount; no navega a otra sección. Errores conservan formulario y no producen datos parciales.
- Metas y aportes recurrentes no se convierten en pagos: conservan su función actual.

## Datos y SQL
Esta entrega no necesita SQL ni cambia el esquema. El motor incorpora validación y persistencia del medio de recepción de ingresos; las operaciones y las sumas financieras se conservan. La migración RPC antigua sigue pendiente de cliente compatible, pruebas en otra base, respaldo y autorización: NO ejecutarla aisladamente.

## PENDIENTES DE CONFIRMACIÓN DEL USUARIO
- No existe prioridad configurable para obligaciones de igual fecha. Se conserva el orden determinista que ya tenía la app (fecha e identificador); definir si se desea orden manual para esos empates.
- Pendientes anteriores: almacenamiento de recibos/fotos, alcance de multimoneda, avisos con app cerrada y vencimientos de préstamos; conservar decisiones ya resueltas en el historial.

## Retomar después
Cobertura, indicadores, ocultación global, ingresos, calendario y plantillas quedan implementados. Retomar fotos/almacenamiento, déficit separado, compensaciones históricas y vistas pendientes del historial. Comparación mensual de productos ya publicada; queda revisión visual con compras de varios meses.

## Verificación de esta entrega
- Build Next.js y TypeScript correctos; lint correcto; git diff --check sin errores.
- verify-calendar-goal-move (cuatro escalas, ciclo y persistencia), verify-envelope-operation (carga/descarga/transferencia/préstamo, contexto y conservación) y verify-planning-payments-trace (atomicidad, duplicados y trazabilidad) aprobados.
- Un primer build falló por EPERM en archivos de Windows mientras mi servidor local usaba .next. Detenido ese servidor y recompilado correctamente.
- Navegador offline: a 320 px, selector del encabezado en fila; lista y cuadrícula de dos columnas; menú en Extra grande conserva opciones legibles. Detectado y corregido overflow de barra superior con flex-wrap. Resultado: ancho de documento 305 px en viewport 320.
- Extra grande persiste al recargar; regreso a Normal correcto. Tres columnas a 430 px, menú dentro del viewport y sin overflow; transferencia mantiene Hogar como origen y solo pide destino. Cargar dinero mantiene Hogar sin selector redundante.
- Pago inline de aviso de apertura: 999999 ficticios rechazados por saldo insuficiente; 100 ficticios confirmados, avisos 4→3 sin navegar. Segundo pago de 100 ficticios desde campana: avisos 3→2; misma vista permanece abierta. Supabase desactivado en esta compilación; no se modificaron datos productivos.
- Limitaciones de QA: no se repitieron todos los temas y pantallas históricos. Expandir/Contraer todos tiene revisión de código/compilación; queda prueba interactiva de conservar selecciones en todas las vistas. Pendiente revisión de escritorio de los nuevos iconos y montos de varios meses en comparación de productos.

## Ampliación — cobertura, ingresos, calendario y plantillas
- Plantillas reutilizables de montos fijos por sobre: guardar, aplicar con confirmación de reemplazo y quitar. No guardan pagos ni identificadores de obligaciones vencidas. Usan la distribución/confirmación existente; sobres archivados, exceso y duplicados se rechazan.
- Persistencia: incomePreferences y distributionTemplates son propiedades opcionales del JSON actual. Cobertura es derivada, nunca un saldo paralelo. Privacidad global o saldo oculto del sobre no revela cobertura monetaria.
- Componentes nuevos: income-preferences, proximity-visibility, distribution-templates. Reutilizados: TemporalDot/TemporalBadge, PlanningCalendar, IncomeDistribution, FinanceDialog, store, postMovement y postDistributedIncome.
- Archivos centrales: app/page.tsx y globals.css; lib/envelope-planning.ts, finance-ledger.ts, finance-notifications.ts, planning-calendar.ts, income-preferences.ts, distribution-templates.ts; componentes temporales, sobres, planificación, calendario, distribución, filtros, avisos y editor de metas.
- Pruebas nuevas: verify-planning-coverage, verify-income-preferences, verify-distribution-templates. Conservación, cinco colores, cobertura parcial, negativos, pagados, archivados, empates, inmutabilidad, privacidad, borrador/confirmación, persistencia de recepción, defaults editables y plantillas inválidas.
- Regresiones dirigidas: verify-income-distribution, verify-planning-payments-trace, verify-calendar-alerts; TypeScript, lint y build.
- Navegador local sin Supabase: cancelación de ocultar conserva indicadores; confirmar elimina SVG, leyenda/filtros y badges en calendario y campana, pero Marcar como pagado sigue disponible. Recargar conserva la preferencia; desmarcar reactiva al instante.
- Defaults 25000/Salario de prueba/cuenta/referencia/descripción rellenan un ingreso. Se cambió monto a 1500 y borró referencia; al volver a abrir seguían los defaults originales.
- Selección de meta de 1000 conservada al contraer/expandir y cambiar Sobres→Cronograma→Calendario; se agregó pago programado de 100 desde calendario. Total1100, restante400; cobertura siguió abierta antes de confirmar.
- Confirmación local: cuentas6300 = asignado2900 + sin asignar3400. Sobres rojo/púrpura pasan a cerrados; obligaciones siguen impagas. Historial guarda SINPE Móvil sin inventar una cuenta.
- Calendario embebido de distribución: diálogo281 px en viewport320, sin overflow; calendario general sin overflow a768/1280. No se repitió toda la batería histórica ni todos los temas.

- Plantillas en navegador: guardada Plantilla local 500, vaciado el borrador y aplicada de nuevo: Hogar500, restante24500 sobre ingreso25000. Nombre repetido rechazado; el calendario conserva el monto manual. No se confirmó ese ingreso de prueba. Diálogo a320 px sin overflow.
