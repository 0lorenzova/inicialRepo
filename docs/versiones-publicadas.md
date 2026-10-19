# Historial y numeración de publicaciones

## Conciliación del 18 de octubre de 2026

- Fuente principal: API de despliegues de GitHub del repositorio `0lorenzova/inicialRepo`, creados por Vercel. La tabla conserva los registros con marca temporal; los commits `c785d32` (0.1.67) y `30f1c5e` (0.1.68) también tienen confirmación Vercel `success` / `Deployment has completed` por sus estados de commit.
- 63 despliegues Production con estado `success`, correspondientes a 63 commits distintos.
- 1 intento fallido: `0361b8c`, 28 de septiembre de 2026; excluido del recuento.
- Hasta la publicación `9a61644`, el número visible 0.1.1 no representaba este historial. El paquete había mantenido 0.1.0 desde el inicio.
- La corrección reservó **0.1.62** para la publicación exitosa número 62. La 0.1.66 es la publicación exitosa número 63, confirmada en Production.

## Regla para próximas publicaciones

Se conserva la serie 0.1 y se utiliza el tercer componente como número secuencial de publicación de código en Production. Es una convención de entregas del proyecto; no es una clasificación retrospectiva de compatibilidad de APIs.

1. Antes de publicar nuevos cambios, incrementar el tercer componente en `package.json` y en las dos versiones del paquete raíz de `package-lock.json`. El código previo a esta ronda era 0.1.77; la entrega siguiente es 0.1.78. La última entrega con éxito Production confirmada en este historial es 0.1.73 (`166549c`). Se enviaron 0.1.74 (`d3dd868`) y 0.1.75 (`bcef97a`), pero no se pudo consultar su estado de Production desde esta sesión. Cada versión se declara publicada solo después de confirmar Production `success`.
2. Un reintento fallido o una republicación del mismo código conserva su versión. Los commits locales y las vistas previas no cuentan como nuevas publicaciones.
3. `next.config.ts` toma la versión del paquete; Vercel añade el SHA corto para identificar exactamente el código publicado.
4. Confirmar Production success antes de declarar la versión publicada. No modificar manualmente la fecha de compilación.

## Publicaciones anteriores verificadas

El ordinal indica el orden de publicaciones exitosas; no afirma que estas versiones numéricas se mostraran históricamente en la aplicación. Fechas en UTC.

| N.º | Fecha de publicación (UTC) | Commit |
| --- | --- | --- |
| 1 | 2026-09-29T01:38:40Z | `2ffd57d` |
| 2 | 2026-09-29T02:19:54Z | `4cb548d` |
| 3 | 2026-09-29T02:50:48Z | `2fd9ad6` |
| 4 | 2026-09-30T02:08:53Z | `b3026b6` |
| 5 | 2026-09-30T12:00:53Z | `14e873e` |
| 6 | 2026-10-01T13:11:50Z | `3f83681` |
| 7 | 2026-10-01T21:06:39Z | `385d2da` |
| 8 | 2026-10-02T22:08:31Z | `0faad11` |
| 9 | 2026-10-03T16:39:29Z | `6495bf1` |
| 10 | 2026-10-03T18:33:42Z | `15cc8cb` |
| 11 | 2026-10-05T02:20:23Z | `0834a15` |
| 12 | 2026-10-05T11:08:49Z | `ca62a08` |
| 13 | 2026-10-05T11:40:33Z | `ea525c5` |
| 14 | 2026-10-05T16:17:56Z | `cd02e5e` |
| 15 | 2026-10-07T14:13:37Z | `f767169` |
| 16 | 2026-10-07T22:02:12Z | `4b169c2` |
| 17 | 2026-10-08T00:24:29Z | `f03c230` |
| 18 | 2026-10-08T01:32:54Z | `01787cc` |
| 19 | 2026-10-08T01:48:39Z | `c67acd2` |
| 20 | 2026-10-08T03:02:13Z | `79ae0bb` |
| 21 | 2026-10-08T11:34:51Z | `8f1dc1f` |
| 22 | 2026-10-08T15:55:49Z | `c760bfc` |
| 23 | 2026-10-08T16:42:55Z | `5ef6ce4` |
| 24 | 2026-10-09T01:18:59Z | `13e922c` |
| 25 | 2026-10-09T06:02:07Z | `a6c16ef` |
| 26 | 2026-10-11T03:29:48Z | `d3ca846` |
| 27 | 2026-10-11T04:02:00Z | `dbe582c` |
| 28 | 2026-10-11T04:51:58Z | `975c8e2` |
| 29 | 2026-10-11T11:29:19Z | `7a22e2f` |
| 30 | 2026-10-11T19:44:50Z | `08dfda1` |
| 31 | 2026-10-11T20:10:42Z | `cfde596` |
| 32 | 2026-10-11T20:58:34Z | `a0cecf6` |
| 33 | 2026-10-13T00:01:51Z | `bbec05f` |
| 34 | 2026-10-13T01:24:29Z | `1b6c08c` |
| 35 | 2026-10-13T02:34:20Z | `3320288` |
| 36 | 2026-10-13T06:33:33Z | `00fb730` |
| 37 | 2026-10-13T12:07:42Z | `bd26a7e` |
| 38 | 2026-10-13T17:27:29Z | `1fb6765` |
| 39 | 2026-10-14T02:01:15Z | `5cb3ba8` |
| 40 | 2026-10-14T11:56:37Z | `748390c` |
| 41 | 2026-10-14T13:42:12Z | `b5ea997` |
| 42 | 2026-10-14T18:57:08Z | `fd4e596` |
| 43 | 2026-10-14T21:33:13Z | `529e0fd` |
| 44 | 2026-10-14T23:38:04Z | `8b83745` |
| 45 | 2026-10-15T13:38:20Z | `9c4fa79` |
| 46 | 2026-10-15T19:03:55Z | `4752fb6` |
| 47 | 2026-10-16T00:12:07Z | `8a257b1` |
| 48 | 2026-10-16T04:16:51Z | `31aced6` |
| 49 | 2026-10-16T05:24:24Z | `a54da02` |
| 50 | 2026-10-16T13:03:50Z | `40e4656` |
| 51 | 2026-10-16T13:44:55Z | `d7224e2` |
| 52 | 2026-10-16T18:01:02Z | `27f188c` |
| 53 | 2026-10-17T02:03:22Z | `cce66d5` |
| 54 | 2026-10-17T02:44:07Z | `2e7ba5b` |
| 55 | 2026-10-17T04:23:05Z | `c7b9798` |
| 56 | 2026-10-17T04:33:50Z | `984ef23` |
| 57 | 2026-10-17T23:03:58Z | `a7c56ca` |
| 58 | 2026-10-18T03:44:34Z | `f27d67f` |
| 59 | 2026-10-18T04:07:13Z | `661d85a` |
| 60 | 2026-10-18T11:41:33Z | `92cdd0f` |
| 61 | 2026-10-18T16:17:17Z | `9a61644` |
| 62 | 2026-10-18T22:30:37Z | `f1e9618` |
| 63 | 2026-10-18T23:03:40Z | `c406fa9` |

## Entrega 0.1.63

Activación explícita de semanas históricas pendientes y mejoras compactas de interfaz. Publicación solicitada por el propietario el 18 de octubre. Build y TypeScript aprobados; confirmar estado Production del commit.

## Entrega 0.1.64

Configuración de día de pago por empleador, vigencias, catálogo compacto y referencias temporales. Alcance y pendientes en docs/fases-salarios-2026-10-18.md.

## Entrega 0.1.65

Cantidades por hora/día en conceptos y preparación del recibo estándar semanal. Publicada en Production el 18 de octubre de 2026 a las 22:30:37 UTC desde el commit `f1e961882ec8337ae2e856d0bc5df98068b292bd`; GitHub confirmó `success` (`Deployment has completed`). Despliegue: https://inicial-repo-mq6yw1l7a-myself-e673.vercel.app.

## Entrega 0.1.66

Catálogo recurrente por fuente con versiones efectivas futuras; las estimaciones históricas no se recalculan, los ajustes permanecen estimados hasta confirmación por período y beneficios como aguinaldo/vacaciones no se repiten automáticamente. Publicada en Production el 18 de octubre de 2026 a las 23:03:40 UTC desde el commit `c406fa9861b29fa4328facc4c3ecac40da13e66c`; GitHub confirmó `success`. Despliegue: https://inicial-repo-pa16xo9om-myself-e673.vercel.app.

## Entrega 0.1.67

Preferencias de cuenta y medio recordadas por fuente salarial después de guardar un pago. Vercel confirmó `success` / `Deployment has completed` para `c785d32` (https://vercel.com/myself-e673/inicial-repo/3jPwCE4LUfq3TptcwgQJsKcuTz1G).

## Entrega 0.1.68

Selector por rango de períodos confirmados para preparar depósitos agrupados. Vercel confirmó `success` / `Deployment has completed` para `30f1c5e` (https://vercel.com/myself-e673/inicial-repo/5BxSr9j4RMsAnJeZrDtFgLk1P1R6).

## Entrega 0.1.69

Un abono parcial solo queda vencido si el período fue confirmado como devengado. Vercel confirmó `success` / `Deployment has completed` para `7b41d74` (https://vercel.com/myself-e673/inicial-repo/EzKwVfnJ8BRaLaF1bXZozrPKn1Wu).

## Entrega 0.1.74
- Fecha límite opcional al registrar préstamos entre sobres, visible en su listado como próxima, de hoy o vencida. Se conserva tras devoluciones parciales; sin devoluciones automáticas ni cambios a notificaciones globales.
- `verify-envelope-operation.mjs`, `verify-finance-ledger.mjs`, `verify-finance-history.mjs`, TypeScript, ESLint afectado y build de producción pasan; QA visual pendiente.

## Entrega 0.1.75
- Avisos globales de devolución de préstamo para fecha límite de hoy o vencida y saldo abierto, incluidos en campana y atención inicial; privacidad global conservada y apertura directa de Gestión de préstamos.
- Los avisos son derivados: no registran devoluciones, movimientos ni cambios de saldo. El estado de Production se confirmará después de que Vercel procese el commit.

## Entrega 0.1.76
- Campo para limitar la última fecha de una recurrencia, usando el dato `endDate` que ya respetaban el calendario y la lógica de aportes. Production pendiente de confirmar.

## Entrega 0.1.78
- Gestión salarial reparte períodos confirmados entre varios depósitos. Fechas exactas crean un movimiento por depósito; fechas aproximadas o desconocidas se guardan como histórico sin movimiento ni cambios de saldo, y se muestran con esa precisión.
- Aguinaldo y vacaciones presentan estimaciones del régimen general del sector privado de Costa Rica basadas en períodos salariales confirmados. Se informan cruces, vacíos y ajustes sin confirmar; se puede registrar lo reconocido, recibido y disfrutado sin crear movimientos.
- Falta el QA de sincronización real en dos dispositivos con una cuenta de prueba aislada. Las migraciones SQL ya aplicadas no deben repetirse.
- TypeScript y ESLint dirigido pasaron; el build de producción y `git diff --check` también pasaron. No se ejecutaron pruebas automatizadas. Vercel confirmó Production `success` para `848916e` el 19 de octubre de 2026 a las 03:06:52 UTC: https://inicial-repo-lt2ziv5rk-myself-e673.vercel.app.

## Entrega 0.1.73 · 19 octubre 2026 — publicada
- Gestión salarial indica el flujo para separar depósitos con fechas reales distintas: seleccionar únicamente los períodos de cada depósito, registrarlo con su fecha y repetir para el siguiente.
- Reutiliza el flujo y la confirmación actuales; no crea ingresos, montos o fechas automáticamente. `verify-salary-receipt.mjs`, TypeScript, lint completo, `git diff --check` y build de producción pasan. QA visual pendiente.
- Vercel confirmó Production `success` para `166549c`: https://vercel.com/myself-e673/inicial-repo/13avtepP9AwvgYUKvy8Eb18ibbt6.

## Entrega 0.1.72 · 19 octubre 2026 — publicada
- Resumen de salarios confirmados por ciclo 1 de diciembre–30 de noviembre o rango personalizado. Agrupa devengado, abonos aplicados a esos períodos y saldo confirmado pendiente.
- Excluye los períodos que cruzan los límites y los períodos no confirmados; los informa sin prorratear. No calcula aguinaldo ni vacaciones y no crea movimientos ni cambia el libro.
- `verify-salary-cycle.mjs` y las 14 suites salariales existentes pasan; también TypeScript, lint completo y `git diff --check`. El primer build tuvo `EPERM` al generar `/_not-found`; el reintento de producción pasó. QA visual pendiente.
- Vercel confirmó Production `success` para `c89b58d`: https://vercel.com/myself-e673/inicial-repo/EoVQhmf4Hs23HDiV9c7TrsmyzCKx.

## Entrega 0.1.71 · 18 octubre 2026 — publicada
- La selección agrupada 3/20/todos usa un resolvedor puro probado con 25 períodos: conserva orden de más reciente a más antiguo y limita 3/20 correctamente.
- Sin cambios en movimientos o importación; el diálogo y la confirmación existentes conservan el registro del ingreso único. `verify-salary-receipt.mjs`, TypeScript, ESLint afectado, `git diff --check` y build de producción pasaron. QA visual no realizado.
- Vercel confirmó Production `success` para `d78e3fd`: https://inicial-repo-l8kgyredm-myself-e673.vercel.app.

## Entrega 0.1.70

Avisos para valores de fechas y conceptos calculados en el importador salarial, más auditoría de solo lectura del libro de prueba. Vercel confirmó `success` / `Deployment has completed` para `6c0b4fa` (https://vercel.com/myself-e673/inicial-repo/2cc83WeEeEEQWVSZpydMi2NsxLkw).
