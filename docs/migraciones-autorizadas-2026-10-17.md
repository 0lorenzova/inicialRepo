# Migraciones autorizadas — 17 octubre 2026

## Estado real — cierre confirmado
Ambas migraciones APLICADAS el 17 octubre 2026 en Supabase iljzewjvutigusmjmwhz, por autorización del propietario. Se confirmó primero el cliente f27d67f en Vercel Production: https://inicial-repo-25buvovr6-myself-e673.vercel.app.

- Compilación/TypeScript aprobados tras corregir el tipo de respuesta RPC.
- Preflight remoto: esquema original, RLS activa, un documento, sin función RPC ni trigger salarial previos.
- Bundle supabase/apply_pending_20261017.sql ejecutado una sola vez en SQL Editor, transacción coordinada con lock y respaldo privado. Resultado: «Migraciones aplicadas; respaldo privado verificado».
- Comparación exacta de user_id, data y updated_at contra respaldo dentro de la transacción: aprobada. Ningún documento financiero modificado.
- Verificación remota posterior: rpc=true, salary_guard=true, rls=true, rpc_execute=true; direct_insert=false, direct_update=false; backup_private=true; live_rows=1 y backup_rows=1.
- Respaldo: finanzas_migration_backup.user_finance_data_20261017. Esquema privado sin acceso de anon/authenticated/service_role; RLS sin políticas en copia. Recuperación solo administrativa y revisada; no sobrescribir movimientos posteriores automáticamente.
- No se registraron pagos de prueba en producción. Sigue pendiente la comprobación funcional entre dispositivos con cuenta ficticia aislada.
- Las pestañas de versiones anteriores deben recargar para usar RPC. No limpiar cachés ni borradores.
- SQL aplicado manualmente en Editor; no se insertaron registros inventados en el historial interno de migraciones de Supabase. No confundir la lista de migraciones del dashboard con ausencia de estas funciones.

## Preparación completada
- Cliente intenta RPC save_finance_data(p_data,p_expected_updated_at); solo usa transporte anterior si falta la función (PGRST202). Permisos, validaciones, fallos de red y conflictos NO provocan fallback.
- Migración 202610010001 conserva timestamps exactos como token para mantener compatibilidad con cachés pendientes; incrementa revision en servidor, bloquea escrituras directas y mantiene lecturas RLS. Sustituye la propuesta antigua basada en p_expected_revision que nunca se aplicó según continuidad.
- Devengo local y SQL usan el último día laboral conservado en el período; sin horario, usan fin histórico. No utiliza configuración actual para reescribir historia.
- Migración 202610150001 comprueba documentos existentes bajo bloqueo y aborta si son incompatibles. No corrige ni borra históricos. Rechaza días futuros, duplicados y horarios inválidos.

## Pruebas
- verify-finance-transport: CAS exacto, fallback solo RPC ausente, errores sin bypass.
- verify-finance-sync: 19 escenarios aprobados.
- verify-salary-work-timing: días laborales, anticipos, guardas y legado aprobados.
- verify-sql-migrations: ambas migraciones completas en PostgreSQL embebido PGlite, permisos, aislamiento entre usuarios, conflictos, creación única, guardas salariales, rechazos atómicos, repetición de migraciones y rollback ante históricos inválidos. No prueba simultaneidad real entre conexiones; sí revisión obsoleta y creación repetida.
- ESLint, build y publicación del cliente aprobados.
- PGlite instalado SOLO en carpeta temporal C:/Users/0lore/AppData/Local/Temp/finanzas-sql-qa; no añade dependencias a la app.

## Continuidad
No repetir las migraciones ni volver a pedir autorización. El bundle se niega a sobrescribir el respaldo existente. Retomar QA de sincronización real solo con entorno/cuenta de prueba aislada. El resto de pendientes funcionales está en CONTINUIDAD.md.

## Archivos
lib/supabase/finance-transport.ts; lib/salary-dates.ts; lib/salary-tracking.ts; components/salary-income-link.tsx; ambas migraciones; scripts/verify-finance-transport.mjs; scripts/verify-salary-work-timing.mjs; scripts/verify-sql-migrations.mjs; documentación.
