# Salario: elección de distribución después de guardar

## Implementado
- Registrar salario ya no ofrece distribución antes de confirmar. Valida y registra un único ingreso con sus aplicaciones salariales.
- Tras el registro, espera confirmación de persistencia: localStorage en modo local; acuse de Supabase cuando está conectado. Mientras espera no muestra éxito.
- Diálogo compacto «Salario registrado correctamente»: distribuir ahora o continuar sin asignar. Cerrar conserva el ingreso. No se vuelve a mostrar por renderizar la pantalla.
- Distribución reutiliza IncomeDistribution (sobres, obligaciones, cronograma y calendario). Acepta reparto parcial, deja remanente sin asignar y nunca crea otro ingreso.
- Operación atómica sobre el estado más reciente: valida saldo del ingreso y fondo disponible; cada asignación conserva incomeSources y las obligaciones seleccionadas. Guarda un identificador estable para impedir doble asignación por pulsación repetida.
- Si falla sincronización, permite reintentar únicamente la confirmación sin volver a registrar ingreso ni distribución. Los conflictos remotos siguen usando el mecanismo existente de recuperación.
- Al vincular un ingreso ya existente, únicamente ofrece distribuir su remanente actual; conserva lo previamente asignado.

## Archivos
- app/page.tsx, components/salary-receive-dialog.tsx, components/use-finance-store.ts.
- Nuevos components/salary-receipt-dialog.tsx, lib/distribute-saved-income.ts, scripts/verify-salary-receipt.mjs.

## Pruebas y límites
- verify-salary-receipt aprobado: ingreso único y vinculación salarial, distribución parcial y completa, remanente, relación ingreso/asignaciones, rechazo de repetición y exceso, error de cuenta, fallo atómico y conservación de saldos al no distribuir.
- verify-finance-sync aprobado: 19 escenarios, incluidos conflicto entre dispositivos simulados, fallo de escritura, respuesta perdida y cambio de sesión.
- ESLint dirigido y compilación de producción Next (incluye TypeScript) aprobados.
- PENDIENTE: interacción visual del diálogo en móvil/PC, cierre/continuar/cancelación mediante clic, doble clic físico, y flujo contra Supabase real. La prueba local de navegador falló por timeout; al acceder a su página de error, la política de URL del navegador bloqueó esa página. No se usó otro mecanismo para eludirlo. No afirmar que las pruebas del motor sustituyen esas comprobaciones visuales.
- No se modificaron datos reales ni se ejecutó SQL. Este bloque no necesita migración; migraciones anteriores siguen pospuestas por el usuario.
- Publicar el bloque compilado antes de agotar créditos; confirmar el resultado real de Vercel por separado.
