# Actualización incremental — 10 octubre 2026

## Estado por requisito del prompt de 33e78611
1. Implementado: cuatro escalas (1 / 1.12 / 1.25 / 1.4), ciclo y persistencia existentes.
2. Implementado: propósito y colones, portada, barra lateral y metadata.
3. Implementado: engranajes del resumen conservan menú real Mostrar/Ocultar monto.
4. Implementado: selector reutilizado en encabezado Mis sobres, iconos compactos en móvil, lista/cuadrícula y preferencias actuales; cuadrícula mantiene reglas 2/3 y adaptación escritorio.
5. PENDIENTE: ocultación global de proximidad con confirmación, usando showProximity existente. Hoy solo parte de las pantallas lo respeta.
6. PENDIENTE: reemplazar puntos temporales por sobres abiertos/cerrados. No confundir con los SVG de acciones del menú incluidos ahora.
7. PENDIENTE: motor único de cobertura acumulativa por saldo y vencimiento, sin contar el mismo saldo varias veces.
8. PENDIENTE: preferencias de registro de ingresos (monto/tipo/cuenta/referencia/descripción).
9. PENDIENTE: medio de recepción distinto del tipo de ingreso (Efectivo/Transferencia/SINPE/Otro).
10. PENDIENTE: indicadores por color y cobertura en distribución por sobre.
11. Implementado: Expandir todos / Contraer todos; solo modifica el estado visual, preserva selección y montos.
12. PENDIENTE: tercera vista Calendario con selección de obligaciones.
13. Parcial: sobres y cronograma comparten selección; falta incorporar Calendario a esa misma selección.
14. Conservado: borrador provisional y confirmación existente, asignar no equivale a pagar.
15. PENDIENTE: integrar recálculo de cobertura en las vistas sin contar el borrador.
16. Conservados cinco colores y púrpura intermitente; falta representación abierto/cerrado.
17. Revisión incremental móvil; preservar compacto y no introducir scroll de puntos.
18. Pruebas dirigidas a los cambios de esta entrega; no afirmar aceptación del prompt completo.
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
Esta entrega no necesita SQL ni cambia el esquema o el motor financiero. La migración RPC antigua sigue pendiente de cliente compatible, pruebas en otra base, respaldo y autorización: NO ejecutarla aisladamente.

## PENDIENTES DE CONFIRMACIÓN DEL USUARIO
- Al implementar cobertura: verificar si existe prioridad configurable para obligaciones de igual fecha. Si no existe, solicitar criterio; no inventar prioridad financiera.
- Pendientes anteriores: almacenamiento de recibos/fotos, alcance de multimoneda, avisos con app cerrada y vencimientos de préstamos; conservar decisiones ya resueltas en el historial.

## Retomar después
Primero cobertura compartida e indicadores, ocultación global, preferencias de ingresos y calendario de distribución. Luego backlog previo: plantillas de distribución, fotos, déficit separado y compensaciones históricas. Comparación mensual de productos ya publicada; queda revisión visual con compras de varios meses.

## Verificación de esta entrega
- Build Next.js y TypeScript correctos; lint correcto; git diff --check sin errores.
- verify-calendar-goal-move (cuatro escalas, ciclo y persistencia), verify-envelope-operation (carga/descarga/transferencia/préstamo, contexto y conservación) y verify-planning-payments-trace (atomicidad, duplicados y trazabilidad) aprobados.
- Un primer build falló por EPERM en archivos de Windows mientras mi servidor local usaba .next. Detenido ese servidor y recompilado correctamente.
- Navegador offline: a 320 px, selector del encabezado en fila; lista y cuadrícula de dos columnas; menú en Extra grande conserva opciones legibles. Detectado y corregido overflow de barra superior con flex-wrap. Resultado: ancho de documento 305 px en viewport 320.
- Extra grande persiste al recargar; regreso a Normal correcto. Tres columnas a 430 px, menú dentro del viewport y sin overflow; transferencia mantiene Hogar como origen y solo pide destino. Cargar dinero mantiene Hogar sin selector redundante.
- Pago inline de aviso de apertura: 999999 ficticios rechazados por saldo insuficiente; 100 ficticios confirmados, avisos 4→3 sin navegar. Segundo pago de 100 ficticios desde campana: avisos 3→2; misma vista permanece abierta. Supabase desactivado en esta compilación; no se modificaron datos productivos.
- Limitaciones de QA: no se repitieron todos los temas y pantallas históricos. Expandir/Contraer todos tiene revisión de código/compilación; queda prueba interactiva de conservar selecciones en todas las vistas. Pendiente revisión de escritorio de los nuevos iconos y montos de varios meses en comparación de productos.
