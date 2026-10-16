# Estados, calendario y días laborales — 16 octubre 2026

## Implementado
- Una fuente de estado para fichas, Registrar salario y almanaque: verde con importe cubierto, amarillo sin vencer, naranja con abono parcial, rojo vencido sin abonos. Vencimiento calculado exclusivamente contra `payDate`.
- Días de atraso visibles, incluso en pagos parciales. Historial de fechas reales y atraso/anticipación por recepción conservado. Las proyecciones siguen sin crear dinero ni deuda devengada.
- Encabezado completo y casilla Pagado con el mismo fondo. La casilla abre el registro/conciliación y solo se marca por pagos válidos; no modifica importes por sí sola.
- Barrido naranja cada 3 segundos y pulso rojo cada 2 segundos, mediante una capa sin eventos ni movimiento del contenido. `prefers-reduced-motion` los desactiva y el texto permanece.
- Nuevas configuraciones: lunes–viernes, semana ISO lunes–domingo, pago al día siguiente del último día laboral (sábado). Días y plazo editables.
- Las configuraciones existentes conservan su calendario. Para adoptar el nuevo esquema: Gestión salarial → Herramientas salariales → Editar configuración → Regla de calendario ISO y plazo 1. No se cambian automáticamente registros históricos ni períodos ya guardados.
- Cada proyección nueva conserva una copia de los días laborales configurados. Al editar configuración se congela también la referencia de los períodos existentes que no la tenían. No se prorratean salarios ni se confirman días trabajados automáticamente.
- Almanaque con superficie delimitada, celdas separadas, día actual subrayado, selección de período, leyenda de estados y encabezado compacto con flechas y acceso textual.
- Filtro Con saldo pendiente usa el importe restante del período, incluyendo anticipos parciales, sin alterar los totales financieros.

## Archivos modificados
- `lib/salary-tracking.ts`.
- `components/salary-tracking.tsx` y `.module.css`.
- `components/salary-receive-dialog.tsx` y `.module.css`.
- `components/salary-period-calendar.tsx`.
- Nuevo `components/salary-status.module.css` compartido.
- Nuevo `scripts/verify-salary-states.mjs`; expectativas actualizadas en `verify-salary-calendar.mjs` y `verify-salary-closing.mjs`.
- Este informe y `docs/CONTINUIDAD.md`.

## Pruebas
- Cuatro estados; no rojo antes de vencer; domingo 18/10 = 1 día después del sábado 17/10; parcial vencido conserva naranja y saldo.
- Pago parcial → corrección a completo → anulación: cambio de estados, un solo movimiento por cobro, saldos conservados.
- Año ISO: 01/01/2027 pertenece a semana 53 de 2026; 04/01/2027 a semana 1 de 2027.
- Días personalizados, plazo de cobro, generación sin movimientos, configuración futura y conservación histórica; serialización JSON de los nuevos campos.
- Suites de estados, calendario, cierre salarial y etiquetas temporales aprobadas; TypeScript, ESLint y compilación Next aprobados.
- UI local con Supabase desactivado: casilla abre el período correcto, misma tonalidad naranja en ficha/formulario, verde marcado, proyección amarilla con pago sábado 24, alerta roja con ciclo calculado de 2 segundos, persistencia tras recarga.
- Revisión en PC 1280 px y teléfono 360/320 px. Modal dentro del viewport y sin desbordamiento horizontal. Movimiento reducido verificado en la regla CSS y prueba estática; no se cambió la preferencia del sistema operativo.

## Persistencia y pendientes
- Se utiliza el JSON existente de `user_finance_data`, sin cambios de tablas ni nueva migración SQL. No se ejecutó SQL.
- El trigger de devengo `202610150001_salary_earned_guard.sql` continúa pendiente por decisión del propietario. Se conserva la validación actual de devengo; este bloque no la reemplaza.
- No se realizó una nueva prueba de sincronización real entre dos dispositivos ni se resolvió el incidente anterior de acceso Failed to fetch.
- Publicación en main autorizada; confirmar el despliegue Vercel en el mensaje final.
