# Historial y numeración de publicaciones

## Conciliación del 18 de octubre de 2026

- Fuente: API de despliegues de GitHub del repositorio `0lorenzova/inicialRepo`, creados por Vercel; se consultaron los estados de los 62 registros disponibles (una página completa de resultados inferior al límite de 100).
- 61 despliegues Production con estado `success`, correspondientes a 61 commits distintos.
- 1 intento fallido: `0361b8c`, 28 de septiembre de 2026; excluido del recuento.
- Hasta la publicación `9a61644`, el número visible 0.1.1 no representaba este historial. El paquete había mantenido 0.1.0 desde el inicio.
- Esta corrección reserva **0.1.62** para la publicación exitosa número 62. La entrega al usuario debe confirmar el estado success de su commit en Production.

## Regla para próximas publicaciones

Se conserva la serie 0.1 y se utiliza el tercer componente como número secuencial de publicación de código en Production. Es una convención de entregas del proyecto; no es una clasificación retrospectiva de compatibilidad de APIs.

1. Antes de publicar nuevos cambios, incrementar el tercer componente en `package.json` y en las dos versiones del paquete raíz de `package-lock.json`. La siguiente versión será 0.1.63.
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
