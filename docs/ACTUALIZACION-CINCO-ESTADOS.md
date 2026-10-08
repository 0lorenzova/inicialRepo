ACTUALIZACIÓN INCREMENTAL — APP FINANZAS

Continúa desde el estado actual del proyecto.

Si ya terminaste una revisión o análisis previo del código, NO lo repitas.
Si todavía estabas realizando una revisión necesaria, termínala normalmente.

No reinicies el trabajo, no rehagas funciones que ya estén correctamente implementadas y reutiliza componentes, estados, funciones y lógica existentes siempre que sea posible.

Estas instrucciones corresponden a nuevas modificaciones y ampliaciones sobre el trabajo actual.

IMPORTANTE SOBRE PREGUNTAS Y DECISIONES PENDIENTES:

Si durante el trabajo encuentras algún punto que requiera una respuesta, decisión o confirmación mía:

- NO detengas todo el trabajo esperando mi respuesta.
- Registra claramente ese punto como PENDIENTE.
- No inventes mi decisión.
- No implementes una decisión irreversible basada en una suposición.
- Continúa trabajando normalmente en todos los demás puntos que sí puedan implementarse de forma segura.
- Al final presenta los pendientes que necesiten mi respuesta.

La ausencia de una respuesta mía sobre un punto específico NO debe detener el avance del resto de la tarea.

==================================================
1. SISTEMA DEFINITIVO DE PROXIMIDAD — 5 COLORES
==================================================

El sistema de proximidad debe utilizar únicamente estos CINCO estados:

⚪ Blanco
🟢 Verde
🟡 Amarillo
🔴 Rojo
🟣 Púrpura

NO existe estado naranja.

La progresión conceptual es:

⚪ → 🟢 → 🟡 → 🔴 → 🟣

Significado:

⚪ BLANCO
Existe una meta o pago programado, pero todavía está fuera de los períodos configurados de seguimiento/proximidad.

🟢 VERDE
El elemento ha entrado en el primer período de proximidad.

🟡 AMARILLO
El elemento ha entrado en el período intermedio de proximidad.

🔴 ROJO
El elemento se encuentra en el período crítico previo al vencimiento.

El ROJO también incluye el mismo día de la fecha límite:

día 0 = 🔴

🟣 PÚRPURA
La fecha límite ya pasó.

El elemento está vencido/atrasado.

Ejemplo:

faltan 20 días → puede estar ⚪ o 🟢 según configuración
faltan 7 días → puede estar 🟡
faltan 2 días → puede estar 🔴
vence hoy → 🔴
venció ayer → 🟣
venció hace 10 días → 🟣

Los valores concretos de inicio de verde, amarillo y rojo deben respetar la configuración existente de cada meta/pago.

No crear una segunda lógica de proximidad.

Debe existir UNA SOLA fuente de verdad para determinar el estado temporal.

==================================================
2. CONSISTENCIA DE LOS 5 ESTADOS
==================================================

Los mismos cinco estados y exactamente el mismo significado deben utilizarse en:

- tarjetas de sobres;
- indicadores de los sobres;
- diálogo de Metas e importes;
- Filtrar por proximidad;
- contadores globales;
- distribución de entradas;
- Agenda/Cronograma;
- avisos al abrir la aplicación;
- notificaciones cuando corresponda;
- cualquier otra vista que represente proximidad.

No implementar reglas diferentes según la pantalla.

==================================================
3. PUNTO BLANCO
==================================================

Recordar que ⚪ NO significa que el sobre esté vacío.

⚪ significa:

"Existe al menos una meta o pago programado, pero todavía no ha entrado en los períodos verde, amarillo o rojo."

Si realmente NO existe ninguna meta ni pago programado, no utilizar el blanco para aparentar que existe contenido.

Cuando existan elementos blancos deben poder consultarse igual que los demás estados.

El punto blanco también debe participar en los contadores globales.

==================================================
4. TIEMPO MOSTRADO JUNTO A LOS INDICADORES
==================================================

Mantener una representación temporal compacta.

Ejemplos:

🔴
2 días

🔴
0 días

🟣
1 día

🟣
8 días

El color comunica la condición, por lo que no es necesario repetir constantemente debajo del punto:

"faltan"
"atrasado"
"vencido"

En mensajes explicativos más amplios sí puede indicarse claramente la situación cuando sea necesario.

Respetar singular/plural:

1 día
2 días

==================================================
5. CONTADORES EN "FILTRAR POR PROXIMIDAD"
==================================================

En el encabezado:

Mis sobres
→ Filtrar por proximidad

deben aparecer los cinco indicadores:

⚪ 🟢 🟡 🔴 🟣

Cada indicador debe mostrar justo debajo un número.

Ese número representa cuántos pagos/metas de TODOS LOS SOBRES se encuentran actualmente en ese estado.

Ejemplo conceptual:

⚪    🟢    🟡    🔴    🟣
12     4     3     2     1

El punto blanco TAMBIÉN tiene contador.

Ejemplo:

⚪
12

significa que existen 12 elementos programados que todavía están fuera del período de seguimiento.

Los indicadores funcionan simultáneamente como:

- resumen visual;
- contador;
- filtro.

Al tocar un color, mostrar los elementos correspondientes a ese estado.

Mantener disponible una opción clara:

"Ver todos"

para consultar todos los elementos independientemente de su proximidad.

==================================================
6. VISIBILIDAD DE PROXIMIDAD
==================================================

Respetar la opción existente:

☑ Mostrar proximidad

Cuando está ACTIVADA:

- mostrar los indicadores en los sobres;
- mostrar "Filtrar por proximidad";
- mostrar sus puntos y contadores.

Cuando está DESACTIVADA:

- ocultar los indicadores visuales de las tarjetas;
- ocultar los controles visuales de Filtrar por proximidad.

IMPORTANTE:

Esto afecta únicamente la VISIBILIDAD.

NO debe detener:

- cálculos;
- fechas;
- estados;
- metas;
- pagos;
- alertas;
- notificaciones;
- información almacenada.

Al volver a activarla, todo debe reaparecer mostrando el estado actual correctamente calculado.

==================================================
7. AVISO AL ABRIR LA APLICACIÓN
==================================================

Agregar un aviso/resumen previo a la pantalla principal cuando existan obligaciones que requieran atención inmediata.

Priorizar especialmente:

🟣 elementos vencidos;
🔴 elementos que vencen hoy o están en condición crítica.

Ejemplo conceptual:

ATENCIÓN

🟣 Vencido hace 3 días
Internet

🔴 Vence hoy
AyA Agua

El objetivo es que el usuario conozca inmediatamente aquello que requiere atención al abrir la aplicación.

No convertirlo en una pantalla molesta cuando no exista nada importante.

Si no existen elementos que justifiquen el aviso, permitir entrar normalmente a Inicio.

La experiencia debe ser breve, clara y accionable.

==================================================
8. NOTIFICACIONES: SOLO INFORMACIÓN RELEVANTE
==================================================

Ajustar la lógica de notificaciones.

NO generar notificaciones simplemente porque ocurrió un movimiento financiero ordinario como:

- entrada;
- salida;
- asignación;
- desasignación;
- transferencia;
- préstamo ordinario;
- otros movimientos que pueden consultarse en Movimientos.

Las notificaciones deben concentrarse en situaciones que requieren atención.

Especialmente:

- proximidad crítica;
- vencimientos;
- elementos vencidos;
- límites de tiempo relacionados con deudas.

Movimientos continúa siendo el lugar para consultar la actividad financiera normal.

Evitar saturar la campana de notificaciones con información que no requiere acción.

==================================================
9. "SALDO ACTUAL" EN LOS SOBRES
==================================================

En cada tarjeta de sobre, identificar claramente el monto disponible mediante el texto:

Saldo actual

Ejemplo:

Alimentación
Saldo actual
₡45 000

Mantenerlo compacto.

No aumentar innecesariamente la altura de las tarjetas.

==================================================
10. CAMBIO DE TEXTO: "ASIGNAR PAGO A ESTE SOBRE"
==================================================

Cambiar el texto:

"Programar importe a este sobre"

por:

"Asignar pago a este sobre"

Este es principalmente un cambio terminológico.

Debe utilizar la funcionalidad existente correspondiente.

NO crear una segunda función.

==================================================
11. TEXTO "ASIGNAR DINERO A ESTE SOBRE" — PENDIENTE
==================================================

Existe intención de sustituir:

"Asignar dinero a este sobre"

por una expresión más clara, posiblemente:

"Agregar dinero al sobre"

Todavía no considerar definitivo ese cambio.

Si necesitas resolverlo para avanzar, conserva temporalmente la terminología actual y registra:

PENDIENTE:
Definir texto definitivo para la acción actualmente denominada "Asignar dinero a este sobre".

No detener ningún otro trabajo por esto.

==================================================
12. SEMANA DEL AÑO — ISO 8601
==================================================

La configuración de nombre automático del ingreso debe utilizar:

"Semana del año"

y especificar:

"Semana del año (ISO 8601)"

Utilizar correctamente el estándar ISO 8601 para determinar el número de semana.

Ejemplo:

7/10/2026 - ₡140 000 - Semana 41

Respetar correctamente los casos de cambio de año.

==================================================
13. MOSTRAR EL RANGO DE LA SEMANA
==================================================

Además del número de semana, mostrar el rango real de fechas correspondiente.

Como se utilizará ISO 8601, la semana va de:

lunes → domingo

Ejemplo:

Semana 41

Del lunes 5 de octubre al domingo 11 de octubre

Utilizar nombres de mes textuales y una presentación fácil de leer.

==================================================
14. TOCAR EL RANGO DE SEMANA → CALENDARIO
==================================================

El rango de fechas de la semana debe poder tocarse.

Al tocarlo:

abrir una vista de calendario correspondiente.

POR AHORA el calendario será únicamente de visualización.

No agregar funciones complejas de edición o planificación que no hayan sido solicitadas.

Su objetivo inicial es permitir visualizar esa semana dentro del calendario.

==================================================
15. DISTRIBUIR UNA ENTRADA — DESPLEGAR CADA SOBRE
==================================================

En el flujo existente:

Nueva entrada
→ Paso 2 de 2
→ Distribuir ahora

actualmente aparecen los sobres.

Conservar este comportamiento y ampliarlo.

Al tocar el icono o descripción/nombre de un sobre, desplegar debajo las obligaciones/pagos programados correspondientes a ese sobre.

Ejemplo conceptual:

Servicios
▼

☐ AyA
₡18 500
🔴
0 días

☐ Electricidad
₡27 000
🔴
2 días

☐ Internet
₡24 000
🟡
6 días

☐ Marchamo
₡75 000
⚪
fuera de seguimiento

Cada elemento debe mostrar de manera compacta:

- nombre;
- monto;
- checkbox;
- indicador temporal correspondiente;
- información temporal necesaria.

Utilizar exclusivamente los cinco estados:

⚪ 🟢 🟡 🔴 🟣

No crear una lógica de proximidad exclusiva para esta pantalla.

==================================================
16. ORDEN DE LAS OBLIGACIONES
==================================================

Al desplegar las obligaciones de un sobre, ordenarlas por prioridad temporal.

Los elementos vencidos 🟣 deben aparecer primero porque ya requieren atención.

Después mostrar los demás desde los más próximos a su fecha límite hasta los más lejanos.

Conceptualmente:

VENCIDOS
↓
VENCE HOY / CRÍTICOS
↓
PRÓXIMOS
↓
MÁS LEJANOS
↓
FUERA DE SEGUIMIENTO

La ordenación debe basarse en la fecha límite y estado temporal, NO en la fecha de creación del registro.

==================================================
17. CHECKBOXES PARA GESTIONAR UNA ENTRADA
==================================================

Cada pago/obligación desplegado durante "Distribuir ahora" debe tener una casilla de selección.

El usuario puede:

- marcar;
- desmarcar;
- cambiar de opinión;
- probar diferentes combinaciones.

Mientras realiza la selección, mostrar claramente cuánto dinero de la entrada permanece disponible.

Ejemplo:

Entrada:
₡140 000

Seleccionado:
₡45 500

Disponible restante:
₡94 500

Cada cambio de selección debe recalcular inmediatamente estos valores.

==================================================
18. SELECCIÓN PROVISIONAL HASTA CONFIRMAR
==================================================

IMPORTANTE:

Marcar o desmarcar un checkbox NO debe generar inmediatamente movimientos financieros definitivos.

Los checks representan una selección PROVISIONAL.

El usuario debe poder probar diferentes distribuciones sin crear y posteriormente tener que revertir movimientos.

Solamente cuando confirme la distribución final deben ejecutarse las operaciones financieras correspondientes.

Utilizar un botón final claro equivalente a:

Confirmar distribución

Antes de confirmar, mostrar de forma comprensible:

- monto total de la entrada;
- monto seleccionado;
- monto restante sin asignar.

NO crear movimientos definitivos antes de esa confirmación.

==================================================
19. QUÉ DEBE OCURRIR AL CONFIRMAR
==================================================

Al confirmar la distribución:

- utilizar la lógica financiera existente;
- evitar movimientos duplicados;
- mantener trazabilidad;
- actualizar sobres;
- actualizar pagos;
- actualizar saldos;
- actualizar movimientos;
- actualizar proximidad;
- actualizar contadores;
- actualizar saldo sin asignar.

Esta pantalla debe ser una forma más eficiente de utilizar el sistema financiero existente.

NO crear un segundo sistema financiero paralelo.

==================================================
20. AGENDA / CRONOGRAMA DE PAGOS DURANTE LA DISTRIBUCIÓN
==================================================

En la misma pantalla de distribución de una entrada agregar acceso a una vista:

"Agenda de pagos"

o, si la terminología existente ya utiliza Cronograma:

"Cronograma de pagos"

Esta vista permite consultar las obligaciones desde una perspectiva temporal en lugar de agruparlas únicamente por sobre.

Debe utilizar exactamente los mismos datos existentes.

NO duplicar pagos ni obligaciones.

==================================================
21. CHECKBOXES EN AGENDA / CRONOGRAMA
==================================================

Dentro de Agenda/Cronograma de pagos, los elementos también deben poder seleccionarse mediante checkbox.

La selección debe ser EXACTAMENTE LA MISMA que en la vista por sobres.

Ejemplo:

Si el usuario marca:

☑ AyA

desde la vista por sobres y después cambia a Agenda de pagos:

AyA debe continuar seleccionado.

☑ AyA

Y viceversa.

NO mantener dos listas independientes de selección.

Ambas vistas representan exactamente el mismo estado provisional de distribución.

==================================================
22. SALDO RESTANTE COMPARTIDO ENTRE TODAS LAS VISTAS
==================================================

El cálculo del saldo restante debe ser único.

Ejemplo de interacción:

- usuario selecciona un pago desde un sobre;
- cambia a Agenda;
- selecciona otro;
- vuelve a sobres;
- desmarca uno.

El saldo restante debe actualizarse correctamente durante todo el proceso.

Mantener UNA SOLA fuente de verdad para:

- monto de entrada;
- elementos seleccionados;
- total seleccionado;
- saldo restante.

==================================================
23. RELACIÓN CON EL SISTEMA DE PROXIMIDAD
==================================================

Los pagos mostrados durante la distribución deben utilizar el estado temporal REAL que ya tienen en el sistema.

No recalcularlos mediante reglas diferentes.

Por ejemplo:

Un pago que aparece 🟣 en su sobre también debe aparecer 🟣 durante la distribución.

Uno que aparece ⚪ en el sobre debe aparecer ⚪ durante la distribución.

La vista por sobres, Agenda/Cronograma y filtros deben coincidir.

==================================================
24. OBJETIVO UX PRINCIPAL DE ESTA ACTUALIZACIÓN
==================================================

El objetivo principal es reducir drásticamente el tiempo necesario para gestionar una entrada, especialmente un salario periódico.

El flujo deseado es:

RECIBIR DINERO
→ VER SOBRES Y OBLIGACIONES
→ IDENTIFICAR PRIORIDADES VISUALMENTE
→ SELECCIONAR QUÉ CUBRIR
→ VER CUÁNTO DINERO QUEDA
→ AJUSTAR LA SELECCIÓN
→ CONFIRMAR

El usuario debe poder organizar una entrada en pocos minutos o incluso segundos.

Priorizar:

- pocos toques;
- información relevante visible;
- reconocimiento visual;
- mínima navegación;
- evitar registros duplicados;
- evitar pasos innecesarios;
- evitar tener que entrar individualmente a cada sobre para tomar decisiones que pueden resolverse durante la distribución.

==================================================
25. NO CONFUNDIR SELECCIÓN CON PAGO AUTOMÁTICO
==================================================

La selección mediante checkbox durante la distribución representa la intención del usuario de utilizar parte de esa entrada para cubrir/asignar esos elementos.

No asumir comportamientos financieros adicionales que todavía no estén definidos.

Si para completar el flujo es necesario decidir exactamente si la confirmación:

- asigna dinero al sobre;
- marca inmediatamente el pago como pagado;
- realiza ambas operaciones;
- o requiere otra distinción;

y esa decisión no puede deducirse de la implementación existente, NO inventarla.

Registra ese punto como PENDIENTE y continúa con las demás funciones.

==================================================
26. RENDIMIENTO Y EXPERIENCIA
==================================================

El despliegue de obligaciones dentro de los sobres debe sentirse rápido.

No cargar innecesariamente toda la aplicación de nuevo cada vez que se expanda un sobre.

Evitar:

- saltos bruscos de layout;
- scroll innecesario;
- pérdida de selección al abrir/cerrar sobres;
- pérdida de selección al cambiar entre vista por sobres y Agenda;
- recargas completas;
- duplicación visual innecesaria.

En móvil, priorizar interacción táctil clara.

En escritorio, aprovechar el espacio adicional sin volver la interfaz excesivamente extensa o cargada.

==================================================
27. NO IMPLEMENTAR NARANJA
==================================================

Para evitar cualquier ambigüedad:

NO crear:

🟠 naranja

NO crear:

- estado naranja;
- configuración naranja;
- contador naranja;
- filtro naranja;
- días de naranja;
- notificaciones naranja;
- estilos naranja;
- lógica temporal naranja.

El sistema solicitado en esta actualización tiene exactamente CINCO estados:

⚪ 🟢 🟡 🔴 🟣

==================================================
28. REPORTE FINAL
==================================================

Al terminar, reporta de forma clara:

- archivos modificados;
- funciones nuevas;
- componentes existentes reutilizados;
- cómo implementaste los cinco estados;
- cómo implementaste el púrpura para vencidos;
- cómo implementaste los contadores globales;
- cómo funciona el punto blanco;
- cómo funciona el aviso inicial;
- cómo ajustaste las notificaciones;
- cómo calculas Semana del año mediante ISO 8601;
- cómo calculas y muestras el rango lunes-domingo;
- cómo implementaste el calendario de visualización;
- cómo implementaste el despliegue de obligaciones durante una entrada;
- cómo mantienes la selección provisional;
- cómo sincronizas vista por sobres y Agenda/Cronograma;
- cómo mantienes un único saldo restante;
- cómo garantizas que no se creen movimientos definitivos antes de confirmar;
- pruebas realizadas.

Al final agrega una sección:

PENDIENTES DE CONFIRMACIÓN DEL USUARIO

Incluye únicamente las decisiones que realmente necesiten mi respuesta.

Si siguen sin estar resueltas, incluir:

1. Texto definitivo que sustituirá "Asignar dinero a este sobre".

2. Comportamiento financiero exacto al confirmar un checkbox durante la distribución, únicamente si la implementación actual no permite determinarlo con seguridad.

IMPORTANTE FINAL:

No detengas el resto del trabajo esperando estas respuestas.

Continúa con todo lo que pueda implementarse correctamente sin mi intervención.

No rehagas innecesariamente partes del proyecto que ya funcionan.

No dupliques lógica existente.

No introduzcas complejidad que no aporte utilidad directa.

El objetivo general continúa siendo una aplicación financiera simple, rápida, compacta, intuitiva y eficiente.