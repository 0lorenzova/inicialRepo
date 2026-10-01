# Revisión de pendientes — 1 de octubre de 2026

## Completado en esta revisión

- Vercel confirmó `Deployment has completed` para el despliegue anterior, commit `3f83681`.
- El historial ahora relaciona movimientos con el ID del sobre, conservando el nombre histórico. La carga de datos recupera referencias antiguas solo cuando hay evidencia inequívoca. Renombrar ya no separa los movimientos del sobre.
- El motor rechaza una distribución que repita el mismo sobre. Archivar sobres y desactivar cuentas valida el saldo vigente, incluyendo préstamos pendientes.
- Los aportes recurrentes usan la operación central de asignación. Movimiento, saldo y próxima fecha cambian juntos. Se bloquean confirmaciones repetidas, aportes futuros y fondos insuficientes. El cálculo mensual respeta el último día del mes y posponer un vencimiento pasado lo lleva al día siguiente de hoy.
- Editar nombre/meta/configuración no restaura el saldo que tenía un formulario antiguo. Se preservan cambios de otros dispositivos en campos no editados y se detecta conflicto si cambió el mismo campo.
- La interfaz descarta formularios abiertos al cambiar de cuenta autenticada.
- La persistencia se concentra en un controlador con guardados serializados, comparación de `updated_at` y creación inicial mediante `insert`. Una lectura inicial fallida no habilita escrituras.
- La caché está separada por usuario; cada instancia conserva un borrador independiente. No se importa automáticamente la caché antigua sin propietario a otra cuenta. La caché heredada permanece conservada.
- Los errores/conflictos muestran un aviso y permiten descargar el respaldo. Cargar la versión remota respalda primero los pendientes. Las recuperaciones sucesivas conservan también los respaldos anteriores.
- «Limpiar copia local» en modo Supabase no modifica el documento financiero ni escribe datos vacíos en la base. Solo se permite tras sincronizar. En modo local, reiniciar conserva un respaldo.
- La app comprueba cambios remotos al recuperar foco/conexión y periódicamente. Los paneles no se cierran al confirmar un guardado o refrescar la misma versión.

## Archivos modificados o añadidos

- `app/page.tsx`: integración del historial por ID, recurrencia central, persistencia, recuperación, configuración y separación de formularios por usuario.
- `app/globals.css`: aviso de sincronización y estados de limpieza.
- `components/use-finance-store.ts`: integración React, autenticación, persistencia local y exportación de respaldos.
- `lib/finance-ledger.ts`: referencias estables, migración conservadora y validaciones centrales.
- `lib/finance-recurrence.ts`: reglas de recurrencia y calendario.
- `lib/envelope-settings.ts`: edición segura de campos del sobre.
- `lib/finance-sync.ts`: cola, versiones, cachés, conflictos y recuperación.
- `lib/supabase/finance-transport.ts`: consultas de lectura y escritura condicional con el esquema actual.
- `scripts/verify-finance-ledger.mjs`, `verify-finance-recurrence.mjs`, `verify-finance-sync.mjs`, `verify-envelope-settings.mjs`, `verify-finance-transport.mjs`: escenarios en memoria y transporte simulado.
- `supabase/migrations/202610010001_finance_revision.sql` y `docs/sync-migration.md`: propuesta SQL y plan de aplicación; **no ejecutados**.

## Verificación

- Escenarios del motor financiero, historial, archivado y estado de cuentas: aprobados.
- Recurrencia: confirmación, repetición, posposición, insuficiencia de fondos, reapertura y fin de mes: aprobados en memoria.
- 19 escenarios de sincronización: aprobados con servidor/almacenamiento simulados.
- Transporte Supabase: comprobados filtros exactos, microsegundos de `updated_at`, creación única, conflictos y errores mediante simulación; sin operaciones sobre datos reales.
- Edición de sobres mientras cambian saldo/configuración: aprobada.
- TypeScript, lint y compilación de producción comprobados.
- Navegación por las ocho secciones a 320, 390, 768 y 1280 px: sin desbordamiento horizontal.
- Menús en lista y cuadrícula a 320 px: seis ubicaciones comprobadas dentro del viewport. Asignación conserva el contexto del sobre.
- Prueba visual local: renombrar Ahorro conservó sus seis movimientos históricos y el saldo. El resumen mantiene las tres tarjetas en una fila.
- Las pruebas visuales usan `localhost:3100` con Supabase desactivado solo en el proceso de compilación de prueba. No se modificaron variables de Vercel ni archivos de credenciales.

## Pendientes y límites

1. **SQL:** falta autorización explícita, ejecución y pruebas contra una base de prueba. La migración incorpora revisión del servidor/RPC y bloquea escrituras de clientes antiguos. No se debe ejecutar hasta coordinar el cliente compatible; el adaptador publicado por ahora usa el esquema existente.
2. **Versiones antiguas:** la comparación por fecha protege a los clientes que respetan ese protocolo. Una versión antigua que aún use `upsert` puede eludirlo. La protección completa requiere el punto anterior.
3. **Confirmación visual de recurrencia:** el clic final del aporte ficticio local sigue pendiente del usuario. La revisión automática rechazó esa acción incluso tras la autorización de pruebas locales. No se reintentó por otra vía; el motor se verificó mediante escenarios en memoria.
4. **Historial antiguo ambiguo:** cuando no puede identificarse un sobre con certeza, el registro permanece en el historial general. No se reasigna por suposición ni se elimina.
5. **Validación con Supabase real:** no se hicieron transacciones ficticias sobre cuentas reales. Falta la prueba integrada con una cuenta de prueba para la futura migración SQL.

## Referencias técnicas de la solución provisional

- [Actualizaciones filtradas en Supabase](https://supabase.com/docs/reference/javascript/update).
- [PostgreSQL: comprobación de condiciones en actualizaciones concurrentes](https://www.postgresql.org/docs/current/transaction-iso.html).
