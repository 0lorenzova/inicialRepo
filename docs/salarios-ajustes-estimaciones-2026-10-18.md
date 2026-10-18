# Salarios: fuentes, ajustes y estimaciones — 18 octubre 2026

## Implementado
- Una fuente compartida entre Configuración → Categorías de ingresos → Salario, Gestión salarial y recepción desde Inicio. Múltiples fuentes, edición con identidad conservada y duplicados normalizados.
- Condiciones por fecha de vigencia; versiones para semanas no persistidas y datos originales de períodos guardados. No extrapola tarifa actual a históricos sin evidencia.
- Tipo de remuneración, tarifas por hora/día y jornada habitual; otros importes son manuales por período de pago, sin fórmulas legales. CRC conservado.
- Catálogo por fuente: nombre, suma/resta, importe habitual opcional, clasificación salarial/beneficio/otro, activo/inactivo. Se reutilizan conceptos anteriores como catálogo sin duplicarlos.
- Ajustes por semana, independientes del catálogo, con nombre/importe/signo propios y estado estimado/confirmado. Guardar solo ajustes no crea períodos, ingresos ni deuda. Las semanas con ajustes se consultan también en las fichas.
- Esperado neto = base aplicable + ajustes − deducciones. Recibido conserva todas las aplicaciones reales aunque se edite o retire un ajuste posterior. Pendiente confirmado permanece separado. Confirmar un ajuste no reconoce la obligación completa.
- Límites de nuevos abonos usan el neto; correcciones de notas no reescriben ni invalidan cobros por cambios posteriores de expectativas. Expectativa menor que recibido no genera devoluciones ficticias.
- Histórico vacío: Sin registros, neutro, recibido y pendiente confirmado cero; Ver estimación plegado. Sin evidencia de tarifa vigente: información insuficiente, sin sugerencia de importe recibido ni suma inventada al resumen.
- Rojo únicamente obligación reconocida vencida; naranja parcial con días de atraso; verde completo. Pulso rojo/superficie original cada 2 s y movimiento reducido.
- Ver proyección reemplaza herramientas manuales de creación/proyección en el flujo habitual: semana, quincena calendario, mes, año, cantidad/unidad y fechas. Desglose por fuente/período, ingresos por recepción y estimación por vencimiento, sin sumar ambos ni generar datos.
- Volver a última semana en curso y controles ‹ Mes › / − Año / + Año. Calendario y flechas conservados.

## Reutilización y archivos
Motor/pagos/historial, salaryPeriodForDate, calendario, FinanceDialog, SettingsGroups, sincronización RPC y estilos existentes.
Modificados: app/page.tsx; lib/salary-tracking.ts; components/salary-tracking.tsx, salary-receive-dialog.tsx, salary-period-report.tsx, salary-period-calendar.tsx y estilos salariales; pruebas de estados, trabajo y motor.
Nuevos: lib/salary-projection.ts; components/salary-source-settings.tsx, salary-adjustments.tsx, salary-projection.tsx, salary-planning.module.css; scripts/verify-salary-adjustments.mjs. Documentación de conciliación y continuidad.

## Pruebas
- verify-salary-adjustments: catálogo, dos semanas independientes, deducciones, 125000+15000+10000−5000=145000, estimado/confirmado, pagos existentes, duplicados/reintentos, tarifas por vigencia, hora/día, fuentes múltiples, todos los rangos, cambio de año, consulta sin escrituras.
- verify-salary-tracking, verify-salary-states, verify-salary-work-timing, verify-salary-navigation y verify-salary-receipt: aprobados. Actualizadas expectativas sustituidas por el nuevo prompt y fixtures que ahora conservan versiones de configuración.
- TypeScript, ESLint de archivos afectados y compilación final: aprobados.
- Navegador local, Supabase desactivado: crear fuente/catálogo ficticios, seleccionar y guardar ajuste sin ingreso, navegar y recargar conservándolo, estado neutro/ceros/estimación insuficiente, consulta semanal y personalizada, mes/año/retorno actual. Anchos efectivos 320 y 1280 CSS, sin overflow de página/diálogo; consola sin errores. También se observó correcto a 267 CSS.
- Limitación de QA: fill automatizado de campos date no cambió su valor; se conservaron fechas iniciales y se probaron fechas/vigencias con tests del motor. No afirmar prueba manual de esos campos en dispositivo físico. No se realizaron cobros de prueba en producción.

## Persistencia y SQL
Campos adicionales dentro del documento salarial existente, conservados por la misma sincronización. Sin nuevas migraciones. Las dos migraciones autorizadas anteriormente ya están aplicadas; no repetir el bundle.

## Pendientes reales
- Definir cambio de tarifa a mitad de período: pregunta anterior sin respuesta. Por ahora solo se admiten cambios de condiciones al inicio del período; no se inventa prorrateo.
- Multimoneda/conversión: motor permanece en CRC; no se suman ni simulan otras monedas.
- Histórico sin condiciones suficientes admite consulta y ajustes, pero requiere datos fiables de configuración para estimar. Conservar esta distinción al ampliar el registro de cobros sin proyección.
- Confirmar sincronización real entre dispositivos con cuenta de prueba aislada y revisar campos de fecha en teléfono físico.
- La quincena del selector es un intervalo calendario (1–15 / 16–fin), mientras las fuentes quincenales conservan sus ciclos de 15 días. La proyección incluye pagos previstos dentro del intervalo mostrado.
- El desglose de consultas extremadamente extensas se limita a 50000 referencias por fuente para no bloquear la interfaz; fechas de navegación no limitadas a registros existentes.

## Publicación
Bloque preparado para commit/push a main después de las pruebas. Confirmar deployment Production exitoso por SHA y comunicar URL al propietario; un push por sí solo no confirma despliegue.

## Cierre confirmado
Commit 92cdd0f subido a main. Vercel Production confirmó success: https://inicial-repo-j8jhgh5m7-myself-e673.vercel.app. Nota de cierre añadida localmente después de la publicación; código y pruebas están publicados.
