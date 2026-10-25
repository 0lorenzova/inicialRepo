# Gestión salarial: registro directo de pagos

## Entrega 0.1.86

Estado: implementación y pruebas terminadas. La confirmación de producción por SHA se registra en `despliegue.json` después de publicar.

## Cambios

- Semanas abre el período ISO que contiene la fecha local del usuario. Flechas, calendario y enlaces de semanas conservan el período elegido al abrir el registro, incluso si todavía no está guardado.
- Acción principal «Registrar pago» visible. Las funciones administrativas siguen disponibles en «Más detalles y ajustes»; el registro detallado anterior se conserva.
- Formulario directo: salario efectivamente recibido, varios conceptos, cuenta, medio, fecha, notas, referencia y total neto. El importe salarial comienza vacío.
- Cada concepto nuevo requiere nombre, importe y naturaleza: ingreso adicional o deducción. Se puede pagar un adicional existente sin volver a crear su obligación.
- Un solo guardado compone las operaciones existentes de período, ajustes y pago. El desglose queda en el pago y se reutiliza en historial y reporte; no se creó otra colección financiera ni se modificó el esquema de Supabase.
- La elección de distribución aparece después del guardado. Usa el ingreso recién creado. Continuar sin asignar conserva sus fondos.
- Protección ante doble pulsación, importes inválidos, conceptos repetidos y cambios concurrentes. La segunda pulsación no descarta accidentalmente el diálogo posterior.
- Cancelar un borrador permite seguir editando o descartarlo, mediante un diálogo de la aplicación.
- Correcciones visuales verificadas: botón contenido en la tarjeta, una sola flecha semanal, contraste del total en oscuro y encabezado del formulario sin superposición al desplazarse.

## Archivos y reutilización

| Archivos | Responsabilidad |
| --- | --- |
| `components/salary-tracking.tsx`, `.module.css` | Navegación semanal, acceso directo y agrupación administrativa |
| `components/salary-payment-entry.tsx`, `.module.css` | Formulario compacto, validación y protección del borrador |
| `components/salary-receive-dialog.tsx` | Selección entre formulario directo y registro detallado existente |
| `components/salary-payment-breakdown.tsx` | Desglose reutilizado del pago |
| `components/salary-receipt-dialog.tsx` | Elección posterior de distribución existente |
| `components/salary-period-report.tsx` | Desglose en consulta y reporte |
| `lib/salary-receipt-entry.ts` | Composición atómica de operaciones existentes |
| `lib/salary-tracking.ts` | Metadatos opcionales del desglose y validación de concordancia |
| `app/page.tsx` | Contexto de apertura del registro detallado |
| `scripts/verify-salary-entry.mjs` | 20 escenarios financieros aislados |
| `scripts/verify-salary-quick-registration.mjs` | Expectativa de texto actualizada |

Reutilizados: `FinanceDialog`, `AccountSelector`, `SalaryPeriodCalendar`, `SalaryAdjustments`, `SalaryReceiptDialog`, `IncomeDistribution`, guardado del libro, funciones ISO, estados semanales, auditoría y correcciones históricas.

También se preservaron para esta publicación los cambios anteriores solicitados de Resumen financiero y el botón «Ver todos»: `app/globals.css`, `components/home-dashboard.module.css`, `components/proximity-filter.tsx` y su CSS, más el ornamento de las figuras en `app/page.tsx`. Se revisó su diff y se ejecutó la regresión técnica; las capturas de esta ronda corresponden al flujo salarial.

## Criterios financieros

- Se respetan los estados semanales existentes, incluyendo pendientes adicionales confirmados. Un abono de una proyección no confirma automáticamente el resto del salario como deuda.
- En una semana histórica sin referencia guardada, se solicita expresamente el salario esperado acordado. Una referencia histórica ya guardada conserva sus conceptos originales.
- Ingresos adicionales suman; deducciones restan del depósito neto conforme a los ajustes existentes. Los conceptos no generan movimientos separados.
- Una corrección posterior que cambia importe o aplicaciones deja de mostrar el desglose anterior como vigente; el original permanece en la auditoría.
- Se preservaron saldos, pagos y configuración existentes. Todas las operaciones de prueba fueron sobre libros aislados en memoria.

## Pruebas ejecutadas

### Automatizadas

- Los 61 scripts `verify-*.mjs` aprobaron. Los dos SQL fallaron inicialmente por omitir su argumento de PGlite; al pasar la instalación local existente, ambos aprobaron. No se ejecutaron contra Supabase.
- La nueva suite contiene 20 escenarios: salario completo/parcial, pagos múltiples, Moto, varios adicionales, deducciones, solo adicional, proyecciones, históricos con y sin referencia, feriado pendiente, pago de ajuste existente, duplicados, datos obsoletos, entradas inválidas, distribución, persistencia JSON, correcciones e invariantes de fondos.
- TypeScript y ESLint completo aprobados. Compilación de producción aprobada. `git diff --check` sin errores.
- Salida reproducible de las suites en `pruebas-automatizadas.txt`.

### Navegador real, datos aislados

Se montaron los componentes reales en una ruta local temporal, sin cliente Supabase ni persistencia financiera. La ruta se retiró antes de compilar: no forma parte de la publicación.

- Anchos de 320, 390 y 1280 px; temas claro y oscuro.
- Semana actual, siguiente, anterior y selección desde el calendario.
- Salario 125.000 + Moto 13.500 = ingreso único 138.500; el historial conserva ambas partes.
- Distribución posterior de 50.000: un ingreso, un pago y 88.500 disponibles.
- Abono de 50.000 con deducción de 10.000: depósito 40.000 y opción de continuar sin asignar; semana futura sin pendiente confirmado.
- Doble pulsación: un ingreso y un pago; elección posterior permanece abierta.
- Cancelar y seguir editando conserva 50.000; descartar deja cero movimientos.
- Importe salarial excesivo rechazado sin registrar. Lectura de importe de nueve cifras en oscuro.
- Formulario a 320 px: ancho interno y de desplazamiento iguales (281 px); sin desbordamiento horizontal.
- Sin errores en la consola de la pestaña final.

Capturas: `semanas-movil.jpg`, `registro-movil.jpg`, `registro-oscuro.jpg`. Contienen exclusivamente datos de prueba.

## Limitaciones

- No se hicieron escrituras financieras en producción ni una prueba remota de sincronización con Supabase. La persistencia y los conflictos se probaron con las suites existentes y JSON.
- La vista probada fue un montaje aislado de los componentes reales, sin autenticación ni navegación global. No equivale a probar todos los recorridos de la aplicación autenticada.
- No se probaron gestos físicos de Android ni lector de pantalla físico.
- El modelo financiero actual trabaja con importes enteros en CRC. No se añadió soporte monetario ni una categoría informativa inexistente.
- Los textos nuevos siguen la arquitectura actual en español; no se añadieron idiomas ni una migración de traducciones.
- La confirmación nativa del borrador bloqueó inicialmente la herramienta de navegador. Se sustituyó en el nuevo formulario por confirmación accesible dentro de la aplicación y se volvió a probar con éxito.
