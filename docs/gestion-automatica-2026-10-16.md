# Simplificación salarial — 16 octubre 2026

- Retirados Agregar período, Proyectar próximo período y Confirmar devengo del flujo habitual. Correcciones de datos históricos quedan plegadas y solo habilitadas para registros existentes.
- Referencia actual calculada sin guardarla. Registrar salario ya conserva automáticamente un período solo cuando necesita asociar un cobro; se reutiliza ese flujo.
- Estados de presentación automáticos sin mensajes que exijan confirmar trabajo. No se inventan días trabajados ni se cambia el atributo histórico de devengo.
- Historial, fichas y abonos ordenables en ambos sentidos; desempate por identificador, fechas originales intactas. Preferencia guardada en el JSON del usuario. Último cobro permanece independiente del orden elegido.
- Resumen del período de solo lectura: consulta por fecha, flechas y almanaque, conceptos, proyección, recibido real, restante, vencimiento, atraso, abonos y enlaces a movimientos. No requiere crear semanas.
- Archivos: lib/salary-history.ts, lib/salary-tracking.ts, components/salary-tracking.tsx, components/salary-period-report.tsx, scripts/verify-salary-history.mjs, expectativas de pruebas salariales y continuidad.
- Pruebas: registro sin período previo, parcial/completo, duplicados, consulta 1920/2400 sin escrituras, orden reversible y estable, persistencia JSON, invariantes financieros; suite de estados; TypeScript y compilación. La revisión interactiva móvil/PC de este nuevo reporte queda pendiente por margen de uso. No se declara verificada visualmente.
- No hay SQL nuevo. La migración previa sigue pendiente; no ejecutarla sin autorización. Las estructuras históricas y el guard de devengo conservan compatibilidad, aunque ya no se exige ese paso al usuario.
- Publicar el bloque compilado y confirmar Vercel. Retomar revisión visual del reporte, orden en ambas vistas y preferencia tras recarga. No repetir las pruebas lógicas ya aprobadas salvo cambios relacionados.

## Cierre posterior de verificación
- El bloque anterior se publicó en Production con el commit d7224e2.
- Revisión interactiva pendiente completada en la siguiente entrega: reporte a 320/1280 px, lista/cuadrícula en ambos órdenes y preferencia tras recarga. Evidencia y límites en `navegacion-salarial-2026-10-16.md`; sus notas sustituyen el pendiente visual anterior.
