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
