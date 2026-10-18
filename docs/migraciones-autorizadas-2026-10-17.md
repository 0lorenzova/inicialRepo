# Migraciones autorizadas — 17 octubre 2026

## Estado real
El propietario autorizó ambas migraciones al aclarar «Hazlas». Preparadas y probadas; NO ejecutadas en Supabase. Panel del proyecto iljzewjvutigusmjmwhz redirige a inicio de sesión. Solo hay clave pública configurada; no se encontró CLI/token administrativo. Se pidió iniciar sesión sin compartir contraseña.

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
- ESLint aprobado. Build y publicación: confirmar resultado en entrega.
- PGlite instalado SOLO en carpeta temporal C:/Users/0lore/AppData/Local/Temp/finanzas-sql-qa; no añade dependencias a la app.

## Retomar ejecución
1. Comprobar sesión administrativa y proyecto exacto. No solicitar otra autorización, ya concedida.
2. Inspeccionar esquema real, funciones/permisos y estado de migraciones; no asumir que Git refleja la base.
3. Obtener respaldo protegido de user_finance_data y guardar evidencia de recuperación. No exponer documentos financieros en logs.
4. Confirmar cliente compatible desplegado. Aplicar SQL revisado de concurrencia y guarda salarial en transacción controlada; si hay incompatibilidad, rollback y explicar sin alterar históricos automáticamente.
5. Verificar funciones, trigger, RLS y permisos. Pruebas financieras reales no autorizadas: usar cuenta/entorno ficticio aislado.
6. Dispositivos con una versión antigua deberán recargar tras revocar escrituras directas. Sus borradores locales se conservan; no limpiar cachés.
7. Registrar evidencia de aplicación y despliegue. No declarar migraciones ejecutadas hasta comprobarlo.

## Archivos
lib/supabase/finance-transport.ts; lib/salary-dates.ts; lib/salary-tracking.ts; components/salary-income-link.tsx; ambas migraciones; scripts/verify-finance-transport.mjs; scripts/verify-salary-work-timing.mjs; scripts/verify-sql-migrations.mjs; documentación.
