# Revisión integral de Finanzas — 2 de octubre de 2026

## Estado

Cambios implementados y comprobados localmente, conservando la aplicación existente. El commit `0faad11` se envió a `origin/main`; la confirmación final de Vercel quedó pendiente porque la revisión automática de permisos alcanzó su límite de uso. No se afirma que ese despliegue haya terminado. No se ejecutó SQL ni se escribieron datos ficticios en Supabase.

Las pruebas del navegador utilizaron `http://localhost:3101`, con la conexión a Supabase desactivada solamente para esa compilación local. No se cambiaron las credenciales ni las variables de Vercel. Por petición del propietario, se conservaron los resultados de pruebas anteriores y en la continuación se probaron los casos pendientes o afectados por cambios nuevos.

Capturas de la revisión: [móvil](C:/Users/0lore/.codex/visualizations/2026/09/28/01a0e624-24b8-7600-adde-b88eb9742056/finanzas-revision-movil.png) y [computadora](C:/Users/0lore/.codex/visualizations/2026/09/28/01a0e624-24b8-7600-adde-b88eb9742056/finanzas-revision-escritorio.png). Los importes son ficticios.

## 1. Archivos modificados

- Integración y estilos: `app/page.tsx`, `app/globals.css`, `.env.example`.
- Sobres: `components/envelope-collection.tsx`, `envelope-collection.module.css`, `envelope-action-dialog.tsx`, `envelope-editor.tsx`, `envelope-editor.module.css`, `envelope-goal-editor.tsx`, `envelope-goal-editor.module.css`, `envelope-view-preferences.tsx`, `postpone-editor.tsx`.
- Navegación y comunicación: `components/use-app-navigation.ts`, `finance-notifications.tsx`, `finance-notifications.module.css`, `feedback-dialog.tsx`.
- Reglas compartidas: `lib/app-navigation.ts`, `envelope-view.ts`, `envelope-icons.ts`, `envelope-goals.ts`, `envelope-operation.ts`, `envelope-settings.ts`, `finance-ledger.ts`, `finance-recurrence.ts`, `finance-notifications.ts`, `notification-audio.ts`.
- Pruebas añadidas o ampliadas en `scripts/`: `verify-app-navigation.mjs`, `verify-envelope-view.mjs`, `verify-envelope-icons.mjs`, `verify-envelope-goals.mjs`, `verify-goal-visibility.mjs`, `verify-envelope-operation.mjs`, `verify-envelope-settings.mjs`, `verify-finance-ledger.mjs`, `verify-finance-recurrence.mjs`, `verify-finance-notifications.mjs`, `verify-notification-audio.mjs`.
- Informe actual y actualización de estado en `docs/revision-pendientes-2026-10-01.md`.

`next.config.ts` ya aparecía modificado al retomar, sin diferencia de contenido; no se cambió su configuración para esta revisión.

## 2. Componentes

Inicio y Sobres comparten la misma colección, menús y preferencias. Se separaron el editor de nombre/icono, el editor de meta y el diálogo de operaciones. Se reutilizaron el diálogo accesible, el menú que ajusta su posición al viewport, el candado de sección, el proveedor de tema y el controlador de persistencia existentes.

## 3. Problemas corregidos

- Acciones conservan el sobre seleccionado; transferir/prestar/pedir solo solicitan la contraparte.
- Atrás/Adelante conserva sección, paso y filtros del sobre o movimiento seleccionado.
- Se quitaron repeticiones de descripción y nombres en movimientos.
- La privacidad global también oculta nombres automáticos y detalles que podrían contener montos.
- Corregidos conflictos de CSS que comprimían importes/iconos de tarjetas y reducían el contraste de controles del encabezado.
- La validación muestra errores en español, incluido el nombre obligatorio de una cuenta.

## 4. Funciones nuevas

- Lista, cuadrícula de dos y de tres columnas; el botón alterna 2 → 3 → 2.
- Orden de sobres mediante pulsación sostenida y arrastre, además de alternativa de teclado.
- Privacidad independiente de los tres totales.
- Pedir prestado con el sobre receptor ya determinado.
- Metas con porcentaje real sin límite de 100 %, excedente y estado de plazo configurable.
- Interruptores independientes para ocultar progreso y estado temporal.
- Intervalo recurrente personalizado y posposición con fecha de vista previa.
- Campana, lectura/descarte y acceso al movimiento/recordatorio; preferencias de sonido y avisos del dispositivo.
- Sugerencias de iconos y formulario para comentarios al desarrollador.

## 5. UI

Se conservaron la paleta, los temas, las tarjetas y la estructura. El encabezado ofrece Inicio, tema, privacidad y campana. La navegación móvil tiene dos grupos de cuatro botones con ajuste al grupo completo. Los tres totales permanecen en una fila. Los controles principales tienen áreas táctiles de al menos 44 px.

La preferencia de tres columnas no se cambia silenciosamente si falta espacio: se conserva y se explica cómo volver a verla. Tanto el botón como Configuración impiden elegirla cuando no cabe. Se recalcula al cambiar el ancho.

## 6. Lógica

Las operaciones siguen utilizando el libro financiero central. Se validan fechas nuevas, asignaciones y total de productos; un error no aplica saldos parciales. Definir u ocultar una meta no mueve dinero. Quincena equivale a 15 días; confirmar un aporte avanza desde su fecha programada. Posponer cuenta desde hoy y no genera movimientos. Las notificaciones derivan del mismo historial y conservan su orden incluso cuando dos movimientos tienen la misma fecha/hora.

## 7–8. Hallazgos y correcciones adicionales

- Un fallo al guardar el orden podía anunciar éxito o quedar sin explicación: ahora conserva el orden anterior cuando la escritura es rechazada y muestra el error.
- El selector de Configuración no limitaba las tres columnas por espacio disponible: corregido.
- Faltaba ocultar la barra independientemente de la meta: incorporado sin cambiar saldos.
- Los productos podían sumar más que el gasto: restaurada validación central.
- Dos devoluciones del mismo minuto podían aparecer en distinto orden entre historial y campana: corregido el desempate por identificador.

## 9. Funciones existentes reutilizadas

No se recrearon el motor de saldos, asignaciones, desasignaciones, transferencias, préstamos/devoluciones, archivado, recordatorios recurrentes, autenticación, sincronización, respaldo ni política de conflictos. Se ampliaron donde lo requería esta revisión.

## 10. Límites y solicitudes no ampliadas

- Los avisos del dispositivo funcionan mientras la aplicación está abierta, sujetos a permisos y compatibilidad. No se implementó infraestructura de notificaciones con la aplicación cerrada. No se comprobó entrega en dispositivos físicos iOS/Android.
- «Enviar comentarios» prepara un correo; el usuario lo revisa y envía desde su aplicación de correo. No se envió ningún mensaje de prueba.
- El correo inicial es `0lorenzova@gmail.com`. El propietario puede cambiar `NEXT_PUBLIC_FEEDBACK_EMAIL` y recompilar; no se añadió un panel administrativo aparte.
- No se hizo una prueba integrada con Supabase real ni se ejecutó la migración pendiente. Esto no impide guardar estas preferencias como parte del documento JSON existente.

## 11. Datos y migraciones

No se realizó migración SQL. Los campos nuevos son opcionales y mantienen valores predeterminados compatibles: vista, privacidad, metas y notificaciones. Se conservan identificadores, movimientos, saldos y metadatos de sobres existentes. Los guardados de configuración siguen protegiendo los cambios concurrentes del saldo y de otros campos.

## 12–14. Móvil, orientación y vistas

Comprobaciones del navegador en 320 × 740, 360 × 800, 390 × 844, 844 × 390, 768 × 1024 y 1440 × 900. Se revisaron lista, dos columnas, tres columnas y el aviso cuando tres no caben, junto con las ocho secciones de navegación. No se observó desbordamiento horizontal en los estados revisados.

Menús comprobados en bordes y filas inferiores. En horizontal, su contenedor permanece dentro del viewport y permite desplazarse hasta la última opción. Probados navegación entre grupos, formularios, Atrás/Adelante, arrastre sostenido, teclado, recarga, fijación, privacidad y ambos temas. Estas son pruebas en navegador con viewport ajustado; no certificación de todos los dispositivos físicos.

## 15. Sobres nuevos y predeterminados

Se creó «Viaje familiar de vacaciones y ahorro futuro» y se utilizó junto a Hogar y Ahorro. Se comprobaron sugerencias de iconos, nombre largo, asignación, retiro, préstamo recibido, transferencia, devolución parcial/final, recurrencia, posposición y gasto con comercio/referencia. Las acciones conservaron el contexto y el sobre nuevo participó en los mismos cálculos y listados.

Resultado final del escenario ficticio: **₡249.000 en cuentas = ₡168.500 asignados + ₡80.500 sin asignar**. El préstamo de ₡5.000 quedó cerrado mediante devoluciones de ₡2.000 y ₡3.000. El aporte de ₡500 se ejecutó solo al confirmarlo. Crear una cuenta vacía y posponer el recordatorio no alteró el total.

## 16. Metas y pruebas técnicas

- En UI: progreso 25 %, 100 % y superior a 100 %; estados verde, amarillo, rojo y vencido; validación de umbrales; ocultación independiente del progreso.
- Pruebas puras: 25/100/110/200/700 %, excedentes, fechas y umbrales; recurrencia, fin de mes, duplicados y fondos; operaciones y conservación del dinero; lectura/descarte de notificaciones; audio compatible/no disponible.
- El libro financiero pasó 18 escenarios, además de archivado y estado de cuentas. Los resultados de las pruebas anteriores se conservaron sin volver a ejecutar toda la batería en la última continuación.
- Casos nuevos ejecutados aisladamente: filtros de navegación, visibilidad de meta y orden de notificaciones con fechas iguales.
- Compilación de producción/TypeScript y lint de archivos afectados: correctos.

## 17. Conservación de información y pendientes

No se borraron movimientos, no se resetearon saldos y no se limpió almacenamiento. Las pruebas verificaron compatibilidad y persistencia mediante recarga y documentos JSON. Las únicas operaciones financieras de esta revisión fueron sobre datos ficticios aislados del proyecto Supabase.

**Pendientes que requieren decisión del propietario:**

1. Confirmar el resultado de Vercel para `0faad11`. Los ajustes posteriores del 3 de octubre permanecen locales y requieren una nueva indicación de despliegue.
2. Autorizar y coordinar la migración anterior de revisión/RPC, su cliente compatible y pruebas en una base de prueba. Véase `docs/sync-migration.md`; no ejecutar el SQL aislado del cambio de cliente.
3. Decidir en una etapa posterior si se necesitan notificaciones con la aplicación cerrada; requieren infraestructura adicional.

La prueba visual de confirmación recurrente que figuraba pendiente en el informe del 1 de octubre quedó completada en esta revisión.

## Ampliación solicitada: cuadrícula de computadora

La cuadrícula ahora deriva sus columnas del ancho disponible, con densidades cómoda y compacta. Conserva las preferencias móviles de dos/tres columnas y las utiliza como densidad en áreas amplias. Inicio y Sobres admiten un contenido de hasta 1440 px con márgenes limitados. Las tarjetas compactas mantienen al menos 156 px; no se impone un máximo artificial de seis. El contador, las indicaciones y el desplazamiento por teclado utilizan las columnas efectivamente mostradas.

Comprobación puntual: seis columnas a 1440 px, ocho a 1920 px y tres al volver a 390 px, sin desbordamiento horizontal. Probada alternancia cómoda/compacta; script nuevo `scripts/verify-envelope-desktop.mjs`, compilación/TypeScript y lint de archivos afectados correctos. No se repitieron las pruebas financieras. No requiere SQL ni modifica saldos. Incluida en el commit `0faad11` enviado a Git; resultado final de Vercel sin confirmar.

## Continuación del 3 de octubre

Los requisitos posteriores amplían metas/importes, contadores filtrables, pagos, privacidad por sobre, temas y trazabilidad. Véase `docs/metas-importes-2026-10-03.md`. La presentación con contadores sustituye el punto único para los importes programados.
