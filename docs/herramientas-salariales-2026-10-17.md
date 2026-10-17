# Herramientas salariales opcionales — 17 octubre 2026

## Completado
- Punto 1 pendiente de la auditoría 248d8439: Agregar período y Proyectar próximo período dentro de Herramientas salariales, plegadas inicialmente.
- Agregar propone el período actual; Proyectar propone el inmediatamente siguiente al actual. Ambos permiten navegar mediante el calendario existente o flechas.
- Vista previa sin escrituras. Solo Guardar proyección persiste la referencia; no crea ingresos, pagos, asignaciones ni devengo.
- Referencias existentes se reutilizan; no aparece Guardar si ya existen. Guardas centrales evitan IDs repetidos y solapamientos, con protección adicional contra doble pulsación.
- Ajustar fechas y conceptos reutiliza el editor, preservando el contexto y las validaciones de pagos existentes.
- Registrar salario sigue siendo automático y no exige preparar períodos.

## Archivos
- components/salary-tracking.tsx
- components/salary-period-report.tsx
- scripts/verify-salary-planning.mjs
- docs/CONTINUIDAD.md y este informe.

## Verificación nueva
- verify-salary-planning: consulta/cancelación sin mutaciones; fechas/días/conceptos; guardado sin dinero; duplicados/solapamientos; cobro posterior reutiliza referencia; correcciones; semanal/quincenal/mensual/personalizada.
- ESLint de componentes y prueba: aprobado.
- next build con Supabase desactivado: compilación y TypeScript aprobados.
- Navegador local localhost:3113, Solo navegador, configuración ficticia: cancelación, reapertura sin registro, flechas con almanaque abierto, guardado explícito, reutilización sin segundo guardado, acceso a editor y cancelación, persistencia tras recarga. Recibido y pagos permanecen en cero.
- Viewports solicitados 320 y 1280: el zoom del navegador dejó anchos CSS efectivos 267 y 1067. Diálogo sin overflow (scrollWidth = clientWidth: 230 y 607). Navegación y controles accesibles con scroll vertical. Restablecido viewport.
- Captura inspeccionada en pantalla; exportación del archivo bloqueada por permisos. No se probaron dispositivos físicos ni Supabase real.

## Pendientes que permanecen
- Vigencia temporal de configuración y etiquetas al cambiar periodicidad histórica.
- Alinear guarda explícita de devengo con último día laboral y revisar SQL conjuntamente. Usuario pospuso las migraciones: no se ejecutaron ni modificaron.
- QA integral del diálogo posterior al ingreso, importación Excel y sincronización real entre dispositivos.
- Observación adicional de QA: el almanaque puede mostrar proyecciones vencidas antes del inicio de seguimiento configurado. Revisar la semántica de esos intervalos sin bloquear consulta histórica ni crear obligaciones por defecto.
- Resto de la auditoría integral permanece registrado; este bloque no declara completado todo el prompt.

## Publicación
- Preparado para commit y push a main; confirmar SHA y estado Production en la entrega antes de declarar publicado.
