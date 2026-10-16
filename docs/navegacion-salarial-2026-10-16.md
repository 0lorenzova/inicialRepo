# Navegación y referencias salariales — 16 octubre 2026

## Correcciones
- La flecha izquierda podía volver al mismo período histórico personalizado; además, una semana calculada que cruzaba ese histórico se rechazaba. La consulta reutiliza la referencia histórica y la navegación sale de sus límites en ambas direcciones. No cambia fechas ni crea obligaciones superpuestas.
- Fechas compartidas con Ln, Mt, Mc, Jv, Vi, Sb y Dm en Registrar salario, fichas, historial y reporte. Se calculan desde fechas civiles reales, incluidos cambios de mes/año.
- El intervalo ISO se distingue de «Trabajo previsto» y «Pago previsto». Los días laborales usan la instantánea del período; no se inventa una para históricos que no la tengan.
- El almanaque sincroniza el mes con la referencia seleccionada. Las semanas sin cobros muestran Recibido cero y Abonos cero; salario y pendiente previstos se calculan desde la configuración.
- Consultar continúa siendo una operación pura. No se modificaron las funciones de registro de ingresos ni los saldos.

## Archivos
- lib/salary-dates.ts, lib/salary-tracking.ts.
- components/salary-receive-dialog.tsx, components/salary-period-report.tsx, components/salary-tracking.tsx.
- scripts/verify-salary-navigation.mjs y documentación de continuidad.

## Verificación
- Nueva regresión: 110 semanas hacia atrás y regreso, referencias idénticas entre calendario/flechas, cero cobros, JSON intacto al consultar, numeración ISO diciembre/enero, siete abreviaturas, días laborales discontinuos y salida de históricos personalizados.
- verify-salary-history y verify-salary-calendar aprobados; TypeScript, ESLint dirigido y compilación Next de producción aprobados.
- UI local con Supabase desactivado, datos ficticios: orden antiguo/reciente en lista y cuadrícula, persistencia tras recarga; reporte con pago existente y sin registros; flechas, selección desde almanaque, navegación a 2025 y regreso a la siguiente semana. Dos abonos y total recibido ₡175.000 conservados tras las consultas.
- Reporte y registro salarial revisados a 320 px y 1280 px; página y diálogo sin desbordamiento horizontal. No equivale a prueba en teléfono físico.
- La automatización de escritura directa del campo nativo Mes y año no confirmó actualización de la cuadrícula; la navegación anual/mensual mediante botones y selección de días sí funcionó. No se cambió ese control existente por esta limitación de la comprobación.

## Pendientes y publicación
- Este bloque no necesita SQL. La migración anterior 202610150001_salary_earned_guard.sql permanece pendiente por decisión del propietario; no se ejecutó.
- Quedan las pruebas remotas entre dispositivos reales y los pendientes generales anteriores ajenos a esta corrección. No declarar terminado todo el historial de peticiones.
- Publicar este bloque y confirmar por separado el estado de Vercel Production. Los resultados de esta nota corresponden a pruebas locales.
