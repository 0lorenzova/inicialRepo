# Auditoría incremental del prompt 248d8439 — 16 octubre 2026

Revisión acotada sobre la implementación vigente. Las instrucciones nuevas sustituyen únicamente los puntos que cambian. No se declara completado el prompt integral.

| Punto | Estado comprobado y acción pendiente |
|---|---|
| 1. Gestión salarial | Sección independiente, seguimiento, registro salarial, configuraciones e importación en herramientas. Agregar período y Proyectar próximo período se retiraron por la instrucción anterior de simplificación. PENDIENTE reintroducirlos como herramientas opcionales según el nuevo texto, sin convertirlos en pasos obligatorios. |
| 2. Registrar salario | Nombre, acceso de Inicio, período actual, configuración recordada y vista previa pura existentes. Añadido acceso explícito al último período anterior pendiente, incluido un intervalo sin registro; respeta inicio de seguimiento y no cambia selección silenciosamente. |
| 3. Formulario compacto | Medio de recepción y cuenta visibles; referencias, fecha, observaciones y aplicaciones múltiples en Más opciones. La distribución entre sobres pasó a un diálogo posterior al guardado confirmado. Conceptos configurados reutilizados; edición de conceptos permanece en configuración/correcciones. |
| 4. Navegación y etiquetas | Flechas bidireccionales, abreviaturas, referencias relativas y límites técnicos de fechas implementados y probados; consulta sin escrituras. PENDIENTE revisar etiquetas cuando cambia la periodicidad histórica, pues la distancia usa la configuración vigente. |
| 5. Almanaque | Mes/año, flechas, semana ISO, selección persistente en pantalla y resaltado implementados. PENDIENTE comprobación manual del campo nativo mes/año y nueva QA móvil/PC; limitaciones del navegador documentadas. |
| 6. Estados | Motor compartido y etiquetas accesibles existentes. CAMBIO PENDIENTE: el nuevo prompt pide amarillo parcial y neutro proyectado; hoy se conserva naranja parcial/amarillo sin vencer de la instrucción anterior. Definir rojo según devengo y diferenciar vencimiento sin perder los días de atraso; no se cambió parcialmente la paleta. |
| 7. Devengo | Guardas existentes impiden confirmar antes del día siguiente al final del período; pagos no devengan. PENDIENTE usar último día laboral real cuando el intervalo es ISO y registrar días trabajados desde la UI habitual si corresponde. Protección SQL directa sigue pospuesta por el propietario. |
| 8. Anticipos y atrasos | Fecha prevista frente a recepción calculada por pago; históricos preservados. PENDIENTE separar adelanto laboral por último día laboral de anticipación al vencimiento. Eliminado aviso hipotético «Si registras este pago» cuando el importe es cero. |
| 9. Abonos | Parciales, varios pagos, varias semanas y conceptos con un único ingreso disponibles. Pago completo de una sola recepción ahora también se denomina «Pago completo» en Registrar salario, en lugar de contarlo como abono. Cero cobros conserva Abonos: 0. |
| 10. Fichas | Consultables, correcciones, casilla calculada, acceso a registrar pendiente, lista/cuadrícula persistentes existentes. PENDIENTE aplicar la nueva paleta coherentemente con el punto 6. |
| 11. Configuración | Empleador, salario, frecuencia, días, desfase de pago, inicio y conceptos existentes. Instantáneas conservan períodos guardados. PENDIENTE versiones de configuración con fecha efectiva para proyecciones no guardadas. CRC entero; multimoneda requiere modelo. Conceptos genéricos pueden representar extras; no hay cálculo legal automático ni calendario específico de feriados/vacaciones. |
| 12. Duplicados | Normalización, IDs, aplicaciones, fechas y vínculo financiero existentes. Nuevo reparto de salario usa asignaciones con IDs estables; no genera otro ingreso. Control de revisión remota conserva conflictos; SQL semántico directo pendiente. |
| 13. Correcciones | Motor atómico y auditoría existentes; ingresos usados/asignados bloquean cambios incompatibles. No se implementó una reversión general de operaciones posteriores. |
| 14. Excel | Importador y vista previa existentes, selección explícita, pagos históricos sin sumar cuentas o enlace a ingresos existentes. No se reimportó ni modificó el archivo real. PENDIENTE QA visual integral del importador. |
| 15. Importes | Recibido azul y Sin asignar con acento distinto; estilos específicos existentes. PENDIENTE nueva comprobación visual integral por tema, sin cambiar colores de proximidad. |
| 16. Más opciones | Mover a otro sobre ya está plegado; no se rehízo. |
| 17. Verificación | Se reutilizó evidencia previa. Nuevas pruebas: navegación con acceso a período no guardado y sin escrituras; reparto completo/parcial, duplicados y fallos atómicos; 19 escenarios de sincronización. QA visual del nuevo diálogo bloqueada por conexión/política del navegador; Supabase real entre dispositivos pendiente. |
| 18. Temas | White Snow, Ice y Fire ya implementados en selector y persistencia; no duplicar ni recrear. |
| 19. Entrega | Primer bloque posterior al salario publicado y confirmado en Production: cce66d5. Publicar después este acceso rápido y ajuste de avisos, comprobando el SHA nuevo. |

## Archivos del segundo bloque
- lib/salary-tracking.ts: consulta pura del último período pendiente.
- components/salary-receive-dialog.tsx: acceso contextual, aviso condicionado al importe y denominación de pago completo.
- scripts/verify-salary-navigation.mjs: regresión del acceso a intervalos no guardados y respeto al inicio configurado.
- Esta auditoría y docs/CONTINUIDAD.md.

## Orden para retomar
1. QA del diálogo posterior al salario (móvil/PC, continuar, cerrar, cancelar, errores), sin rehacer el motor.
2. Unificar último día laboral, adelanto laboral, devengo y estados según esta versión del prompt. Consultar cualquier cambio SQL antes de ejecutarlo.
3. Configuración con vigencia temporal y distancia entre períodos de distintas periodicidades.
4. Herramientas manuales opcionales pedidas nuevamente, manteniendo registro cotidiano automático.
5. QA del importador y Supabase real entre dispositivos; revisión visual de importes/temas.
