# Conciliación salarial — 17 octubre 2026

## Ampliación posterior: estimaciones históricas y semanas sin registros

El propietario añadió el prompt completo «Estimaciones históricas y estados de semanas sin registros». Es requisito vigente, no implementado en esta ronda. Uso al consultar: 98 % principal consumido; conservar la instrucción anterior de publicar en la próxima ronda, sin publicar un arreglo parcial.

Inspección focalizada confirmada:
- `salaryPeriodTotals` ya calcula pendiente confirmado solo cuando `earned` y la guarda temporal lo permiten.
- `salaryPeriodPresentation` calcula `overdue` usando `remaining` estimado y fecha, y puede dar rojo sin obligación reconocida. También colorea rojo un confirmado no vencido por el término `confirmed` en `tone`. Corregir ambos con una regla única; parcial conserva naranja y días de atraso cuando corresponda.
- `salary-receive-dialog` presenta `remaining` como pendiente previsto; las fichas de `salary-tracking` lo rotulan «Pendiente». No sustituir ciegamente el saldo usado para aplicar abonos: separar etiquetas y presentación de los límites del registro financiero.
- `salary-period-report` expone expectativa y conceptos de toda semana inmediatamente. Para pasado sin registros, mover estimación a sección optativa plegada y mostrar recibido/pendiente confirmado en cero.
- `salary-period-calendar` usa el cálculo compartido, pero su leyenda «Devengado pendiente / vencido» también debe actualizarse para no sugerir rojo antes del vencimiento; neutro debe incluir «Sin registros».
- `salary-status.module.css` pulsa una capa roja sobre fondo rojo: sustituir por alternancia de superficie original del tema y rojo cada dos segundos, manteniendo texto legible y movimiento reducido. El parcial actual es amarillo, debe ser naranja según el requisito vigente.

Reglas adicionales de entrega:
1. Semana pasada sin pagos válidos ni obligación confirmada: «Sin registros», neutro, recibido 0 y pendiente confirmado 0. Un ajuste estimado o confirmado por sí solo no reconoce toda la obligación. No usar la existencia de una proyección persistida como evidencia de deuda.
2. «Ver estimación» plegado por defecto, reiniciado al cambiar la semana consultada; visible en consulta histórica de Gestión y Registrar salario. Mostrar el aviso exacto «Esta cifra es una estimación; no representa un ingreso registrado ni una deuda confirmada».
3. Validez basada en condiciones con evidencia de vigencia para TODO el período. Si falta: «Sin información suficiente para estimar este período». No extrapolar la tarifa actual hacia atrás; una fecha inicial de calendario no prueba por sí sola que una tarifa editada rigiera desde entonces. Reutilizar instantáneas históricas fiables y versiones fechadas cuando estén implementadas; si la evidencia es ambigua, declarar insuficiencia.
4. Horarios habituales se identifican como estimación, nunca horas efectivamente trabajadas. Futuro continúa siendo proyección; pasado con movimientos conserva recibido y obligación reconocida separados.
5. Ver, desplegar o navegar no guarda períodos, ajustes, movimientos ni deudas. Registrar una recepción después no convierte automáticamente su estimación en obligación. Conservar motor, trazabilidad y saldos.
6. Verde completo; naranja parcial; rojo intermitente exclusivamente obligación reconocida, vencida y con pendiente. Pago parcial atrasado conserva condición parcial y días de atraso. No cambiar colores por una estimación impagada.

Pruebas añadidas: los 13 escenarios del nuevo prompt (histórico neutro/ceros, desplegar/contraer, evidencia válida/insuficiente y vigencias, completo/parcial/confirmado vencido, coherencia entre tres superficies, navegación sin escrituras y sin cambios financieros, móvil/PC). No ejecutadas aún; no presentar esta inspección como pruebas aprobadas. Esta ampliación modifica solo documentación local.

## Estado y autorización de esta ronda

El propietario pidió examinar y conciliar los últimos prompts, dejando la publicación para la siguiente ronda salvo que un bloque estuviera ya terminado. No había cambios funcionales preparados: esta entrega contiene únicamente análisis y continuidad local. No ejecutar un despliegue solo por esta documentación. Uso consultado: 89 % consumido de la ventana principal, 30 % de la semanal.

Base Git: 661d85a. Última publicación documentada: https://inicial-repo-qmv1mff5m-myself-e673.vercel.app. Esta ronda no volvió a comprobar su despliegue remoto ni ejecutó pruebas: no cambió código funcional.

Requisitos conciliados:
- Prompt del chat «Configuración salarial, proyecciones automáticas y navegación».
- Adjunto 0351ba50-1ded-436e-9fa1-1a992b20a4b9/Texto pegado.txt: «Conceptos salariales adicionales por período», leído completo.
- Instrucciones anteriores siguen vigentes salvo los comportamientos sustituidos explícitamente abajo.

## Lo existente que se reutilizará

- `salary.configs`: fuente compartida, identidad estable y rechazo de duplicados por empleador/nombre normalizados; edición con comparación del original.
- `salary.periods`: historial con conceptos, días laborales y frecuencia conservados; pagos vinculados por período/concepto.
- `salary.payments`: una recepción real vinculada a un movimiento, con abonos históricos diferenciados. Conservar todos sus identificadores y aplicaciones.
- `salaryPeriodForDate`, `adjacentSalaryPeriod`, calendario y reporte: consulta calculada sin escritura y reutilización de períodos históricos personalizados.
- `salaryPeriodPresentation`, `salaryPeriodTotals`: centralizar aquí la evolución de cálculos, evitando reglas distintas por pantalla.
- `SettingsGroups`: secciones de configuración plegadas e independientes.
- Editor actual de fuentes, motor de recepción/distribución, orden de historial y sincronización RPC.

## Hallazgos concretos y conciliación

1. **Catálogo no equivale a conceptos aplicados.** Hoy `projectedSalaryPeriod` copia todos los `extraConcepts` a cada proyección. El catálogo nuevo solo ofrece opciones e importes de referencia; vacaciones/aguinaldo no deben repetirse automáticamente. Conservar importes ya guardados y no reinterpretar silenciosamente conceptos históricos.
2. **Deducciones requieren cálculo neto.** `SalaryConcept` solo tiene id/nombre/importe y las validaciones exigen importes no negativos. Añadir signo/tipo explícito con importe positivo; no relajar sin más las validaciones del dinero real ni convertir deducciones en pagos negativos.
3. **Ajustes sin crear períodos.** Guardar ajustes independientes por fuente y referencia temporal estable; consultar una semana no guarda nada. Si no existe período, guardar únicamente sus ajustes, sin marcar `earned`, crear ingresos ni deuda. Al recibir dinero, reutilizar la materialización automática existente y esos mismos ajustes sin copiarlos dos veces.
4. **Estimado, confirmado y recibido son tres cosas diferentes.** Confirmar un ajuste solo valida ese componente. No confirma toda la obligación ni convierte una proyección en ingreso. Conservar por separado expectativa neta, obligación reconocida y abonos reales.
5. **Neutralidad sin deuda reconocida.** Hoy la presentación puede colorear rojo una proyección pasada sin `earned`, aunque `salaryPeriodTotals` mantenga deuda confirmada en cero. El prompt nuevo exige neutralidad para semanas sin pagos ni deuda confirmada; prevalece sobre la petición anterior de rojo automático por fecha. Distinguir fecha prevista transcurrida de deuda confirmada vencida, con una regla compartida en todas las pantallas.
6. **Pagos existentes no se reescriben por editar expectativas.** Actualmente `saveSalaryPeriod` protege conceptos con abonos. No eliminar ni reducir sus vínculos para permitir ajustes. Si el nuevo esperado queda por debajo de lo recibido, mostrar la diferencia sin restar dinero, inventar devoluciones ni perder recepción histórica. Revisar límite y reparto de abonos para usar esperado neto sin tratar deducciones como destinos de pago.
7. **Vigencia todavía falta.** La configuración actual preserva períodos guardados, pero las semanas no persistidas usan la tarifa actual. Introducir condiciones con fecha de vigencia; mantener intactas las instantáneas históricas. No inventar tarifas anteriores al historial conocido.
8. **Herramientas manuales sustituidas.** La restauración anterior de «Agregar período»/«Proyectar próximo período» no es el objetivo vigente. El nuevo flujo será consulta automática «Ver proyección» y edición de ajustes de la semana; preservar internamente períodos históricos y sus correcciones necesarias.
9. **Configuración y operación separadas.** Configuración → Categorías de ingresos → Salario administra fuentes y catálogos; Gestión salarial consulta/gestiona pagos y ajustes. Inicio registra una recepción. Compartir editor/datos, sin duplicar listas de fuentes.
10. **Moneda y remuneración requieren ampliación real.** Actualmente solo CRC entero y periodicidad de pago; no existen todos los campos de tarifa/hora, horas, tipo de remuneración ni cálculo multimoneda. No presentar un selector de moneda operativo sin soporte de cuentas y movimientos. Proyecciones multimoneda deben separar totales, nunca sumar monedas sin conversión definida. No inventar fórmulas legales.

## Diseño de datos propuesto (pendiente de implementación)

- Mantener identidad de cada fuente en `configs`; añadir historial de condiciones por vigencia y metadatos de remuneración/horario. Separar frecuencia de pago de tipo de remuneración.
- Catálogo por fuente: id estable, nombre, suma/resta, importe habitual opcional, activo y clasificación salarial/beneficio/otro. Desactivar conserva referencias históricas.
- Ajustes por fuente y período: identidad estable de la referencia y fechas, id del ajuste, id opcional del catálogo, nombre/importe/signo conservados, estimado/confirmado. Edición o eliminación afecta solo esa semana. No depender del nombre editable para vincular datos.
- Compatibilidad: conceptos antiguos permanecen como componentes positivos históricos. No generar catálogos duplicados por recarga; adaptación determinista con ids conservados y guardado explícito cuando corresponda.
- Proyección: base vigente + ajustes positivos − deducciones. Reutilizar ajustes guardados; importe habitual es referencia, no confirmación ni repetición automática de conceptos extraordinarios.
- Pago real: conserva movimiento y aplicaciones existentes. Cálculo de recibido debe seguir contando recepciones aun si después se modifica o retira un ajuste; no derivarlo únicamente de conceptos visibles nuevos.

## Orden de implementación para la siguiente ronda

1. Modelo compatible: vigencias, catálogo y ajustes por semana; cálculo compartido neto/estimado/confirmado/recibido, sin tocar saldos por planificación.
2. Reutilizar editor de fuentes en Configuración → Categorías de ingresos → Salario. Nombre, empleador, moneda soportada, tipo/tarifa/base, días/horas, frecuencia/pago, vigencia y conceptos manuales; múltiples fuentes sin duplicación.
3. «Conceptos adicionales ▾» plegado en semana consultada: selección del catálogo, personalizados, importe/signo/estado, editar/quitar, total. Conservación independiente incluso sin pagos/período guardado.
4. «Ver proyección»: próxima semana, quincena, mes, año y cantidad entera positiva/unidad días-semanas-meses-años. Intervalo, fuentes, total por moneda, desglose por fuente/período, estimaciones y pagos reales separados. Aplicar vigencias y ajustes sin escrituras ni doble conteo. Mantener selector compacto y editable en pantalla.
5. Sustituir retorno pendiente por «Volver a última semana en curso», calculado con fecha local y sin depender de registros. Toolbar del almanaque: ‹ Mes › y − Año/+ Año separados; conservar selección y cuadrícula.
6. Regresión focalizada y QA móvil/PC; publicar bloque coherente con margen, verificar Production y registrar lo que falte. No repetir pruebas no afectadas.

## Decisiones abiertas

- Ya se preguntó cómo tratar una tarifa que entra en vigor a mitad del período: prorratear por días laborales, aplicar desde próximo período o importe manual. No hay respuesta registrada al cerrar este análisis. No asumirla; avanzar mientras tanto con tareas independientes.
- Si se necesita conversión entre monedas para recepción real, definir la política antes de implementarla. No bloquear catálogo/calendario por esta dependencia.
- Antes de ampliar validaciones SQL, revisar compatibilidad del nuevo JSON y consultar al propietario cualquier migración nueva. Aún no se determinó necesaria una nueva migración.

## Pruebas requeridas para el bloque futuro

- Varias fuentes, edición sin duplicar, catálogo sincronizado Configuración/Gestión/Inicio; normalización y doble pulsación.
- Vigencia y conservación histórica; misma fuente en dos semanas con importes distintos; referencias antiguas sin tarifa conocida claramente identificadas.
- Ajustes positivos/deducciones, ejemplo 125000+15000+10000−5000=145000; estimado versus confirmado; editar/quitar sin afectar otra semana/catálogo.
- Guardar solo ajustes sin ingresos/períodos/deuda; consultar sin ninguna escritura; desactivar catálogo conserva historia.
- Cambiar ajustes después de abonos conserva movimientos, recibido, cuentas y sobres; recibido superior al nuevo esperado no inventa reintegros.
- Proyección semanal/quincenal/mensual/anual y personalizada; meses/años cruzados, vigencia, importes por moneda y separación estimado/real, sin duplicación.
- Neutralidad sin pagos ni obligación, pagos parciales/completos y deuda reconocida vencida coherentes entre ficha/registro/reporte.
- Retorno actual, flechas mensuales/anuales y selección de semana; móvil y PC, controles sin overflow.

## SQL y publicación

Las migraciones `202610010001_finance_revision.sql` y `202610150001_salary_earned_guard.sql` YA fueron aplicadas. No repetir el bundle ni presentarlas como pendientes. Ver `migraciones-autorizadas-2026-10-17.md`. Sigue pendiente QA de sincronización entre dispositivos con entorno/cuenta de prueba aislada.

Este análisis no modifica aplicación, datos, SQL ni despliegues. Archivos nuevos/cambiados únicamente: este informe y `docs/CONTINUIDAD.md`. Permanecen locales para evitar un despliegue de documentación durante la pausa solicitada.
