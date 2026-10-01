# Propuesta de sincronización con revisión

**Estado: preparada para revisión. No aplicada a Supabase.** Requiere autorización explícita del propietario antes de ejecutar SQL. Este documento tampoco confirma que el cliente compatible esté integrado o desplegado.

## Riesgo detectado

La implementación revisada guardaba el documento financiero completo con `upsert`. Dos dispositivos podían partir de la misma versión y el último guardado reemplazaba al primero. RLS impide el acceso a otros usuarios, pero no detecta conflictos entre dispositivos del mismo usuario.

También hay que corregir el cliente: una lectura fallida no debe habilitar guardados; el caché debe separarse por usuario; los cambios de sesión no deben recargar sobre cambios pendientes; y «Reiniciar datos locales» no debe guardar un documento vacío en Supabase.

## Alternativa provisional sin SQL

Mientras se revisa esta migración, el cliente puede usar la columna existente `updated_at` para una actualización condicional: filtrar por `user_id` y por la fecha exacta leída, enviar un `updated_at` estrictamente posterior y comprobar que la consulta devuelve una fila. Cero filas significa conflicto. La creación inicial debe usar `insert`; una violación de clave única (`23505`) significa que otra sesión ya creó la fila.

Se debe conservar la cadena de fecha recibida de PostgreSQL para el filtro; convertirla a `Date` y de vuelta a texto puede perder microsegundos. Para la nueva fecha puede usarse `max(Date.now(), Date.parse(base) + 1)` tras validar la fecha base. Guardados serializados, respaldos, separación por usuario y tratamiento de conflictos siguen siendo necesarios. Si hay varias pestañas, los borradores pendientes necesitan identidades separadas para que no reemplacen el respaldo de otra pestaña.

Esto protege frente a otros clientes que respetan el mismo protocolo. **Un cliente antiguo que siga haciendo `upsert` puede eludirlo**; por eso no equivale a la protección completa de revisión/RPC y revocación de escritura directa. La migración descrita abajo sigue pendiente de autorización y aplicación aunque se publique esa mejora provisional.

## SQL propuesto y alcance

Archivo: `supabase/migrations/202610010001_finance_revision.sql`.

- Conserva la tabla `user_finance_data`, sus filas, sus documentos JSON y las políticas RLS existentes. No recalcula saldos ni migra movimientos.
- Añade `revision bigint NOT NULL DEFAULT 0`. Los documentos existentes comienzan en revisión `0`.
- Crea `public.save_finance_data(p_data jsonb, p_expected_revision bigint)`, que devuelve **una fila con `revision bigint` y `data jsonb`**.
- Una revisión esperada `NULL` significa «crear únicamente si todavía no existe». La primera fila se crea con revisión `1`. Un intento concurrente no reemplaza el documento.
- Una revisión numérica significa «guardar únicamente si la revisión sigue siendo ésta». Comparación, documento, fecha y revisión se actualizan juntos en la misma operación SQL.
- Un conflicto produce `code = '40001'` y `message = 'FINANCE_REVISION_CONFLICT'`. No se debe reintentar a ciegas usando la nueva revisión.
- `42501 / FINANCE_AUTH_REQUIRED` indica sesión ausente; `22023 / FINANCE_INVALID_DATA` o `FINANCE_INVALID_REVISION` indica parámetros inválidos.
- `SECURITY DEFINER` usa `search_path = ''`, referencias de esquema explícitas y `auth.uid()`. No acepta un identificador de usuario del navegador. Debe crearse desde SQL Editor con el rol administrador del proyecto.
- Solo `authenticated` puede ejecutar la función. Las lecturas siguen pasando por RLS. Se revocan escrituras directas a `PUBLIC`, `anon` y `authenticated`: las pestañas antiguas que hagan `upsert` recibirán un error, en vez de omitir el control de revisión. Los permisos administrativos existentes no se modifican.

El RPC protege la concurrencia del documento completo; **no valida por sí solo todas las reglas del motor financiero**. El cliente debe conservar las validaciones actuales. No añade un motor de conciliación automática ni mueve dinero por su cuenta.

## Integración requerida en el cliente

1. Cargar `data, revision` para el usuario autenticado. Mantener una referencia de la última versión confirmada y una instantánea local pendiente. Una lectura fallida debe dejar las escrituras pausadas.
2. Separar el caché por `user.id` y conservar la revisión base con los cambios pendientes. Nunca importar silenciosamente un caché heredado sin dueño a una cuenta nueva.
3. Sustituir **todos** los `upsert` por `supabase.rpc('save_finance_data', { p_data: snapshot, p_expected_revision: revision })`. Para una fila inexistente usar `null`. La respuesta es una matriz de una fila; guardar su revisión.
4. Serializar guardados: solo uno en curso por cliente. Si cambia el estado durante una petición, guardar después la instantánea más reciente usando la revisión recibida. No anunciar «Sincronizado» mientras queden cambios pendientes.
5. Ignorar respuestas de sesiones anteriores y cancelar temporizadores al salir/cambiar de usuario. Los eventos de renovación de token no deben recargar datos sobre cambios locales pendientes.
6. Al recibir conflicto: conservar la instantánea local y la versión remota por separado, pausar guardados y mostrar una explicación. Ofrecer descargar el respaldo local y cargar la versión de Supabase mediante confirmación. No mezclar automáticamente movimientos, balances o préstamos, ni ofrecer sobrescribir la nube sin revisión.
7. Si se pierde la respuesta de un guardado, volver a consultar. Si el documento remoto coincide con la instantánea enviada, puede reconocerse como guardado; si difiere, tratarlo como conflicto. No repetir la operación financiera para «reparar» el transporte.
8. Recuperar cambios pendientes después de reabrir el navegador. Si la revisión remota aún coincide con la base local, se puede continuar el guardado; si cambió, conservar ambas versiones y pedir revisión.
9. «Limpiar copia local» no debe llamar `setData(initial)` en modo nube. Deshabilitar la limpieza si hay guardados pendientes, error o conflicto. Tras guardar, puede eliminarse la copia y recargarse desde Supabase sin enviar cambios. En modo exclusivamente local, cualquier reinicio debe seguir requiriendo confirmación explícita y respaldo si corresponde.
10. Refrescar al recuperar conexión/enfoque solo cuando no haya cambios pendientes; si los hay, resolver mediante la revisión. Realtime es opcional y no sustituye el control SQL.

## Orden de publicación

1. Preparar y revisar el cliente compatible y la migración. Probar ambos en un proyecto de prueba; no utilizar datos financieros reales para escenarios ficticios.
2. Obtener autorización del propietario para este SQL y acordar la breve ventana de publicación. Guardar una copia de respaldo de la tabla y anotar el despliegue vigente.
3. Aplicar **primero** esta migración en el SQL Editor de Supabase. Desde ese momento el cliente antiguo puede leer, pero sus guardados fallarán y deberán conservarse localmente. Pedir que no se introduzcan nuevas operaciones durante esta ventana.
4. Desplegar inmediatamente el cliente compatible en Vercel y pedir recargar pestañas antiguas. **No desplegar un cliente que requiera el RPC antes de crear el RPC.** Si aún no se autoriza el SQL, mantener desactivada su integración y publicar solo correcciones independientes.
5. Comprobar lectura, guardado, indicadores y conflictos con cuentas de prueba. Confirmar que las filas y los saldos previos continúan intactos.

## Pruebas de aceptación

Usar dos sesiones de la misma cuenta de prueba y una tercera de otra cuenta. Estas pruebas pendientes describen el procedimiento; no se han ejecutado contra Supabase por redactar este documento.

- **Fila inicial:** crear con revisión `NULL`; repetir desde otra sesión. Solo la primera llamada guarda; la segunda recibe `40001`.
- **Escritura normal:** leer revisión `r`, guardar y comprobar revisión `r + 1`, documento completo y fecha del servidor.
- **Dos dispositivos:** ambos leen `r`; A guarda, luego B intenta guardar con `r`. B recibe conflicto; lo guardado por A sigue intacto y el caché pendiente de B se conserva.
- **Peticiones simultáneas:** dos guardados con la misma revisión; exactamente uno debe confirmar. Verificar también operaciones consecutivas en un mismo cliente.
- **Sesión/permisos:** usuario B no lee la fila de A; `anon` no puede leer ni ejecutar el RPC; `authenticated` no puede hacer `insert`, `update` o `upsert` directos. Un RPC de B solo puede escribir en su propia fila.
- **Error de carga:** simular fallo de lectura y comprobar que no se ejecuta un guardado de la copia local encima de Supabase.
- **Red:** cortar conexión antes/después de enviar una petición. Reabrir y verificar recuperación de pendientes, detección de respuesta perdida y ausencia de duplicación de movimientos.
- **Cambio de cuenta:** salir de A e iniciar B; no copiar datos de A a B ni aplicar respuestas retrasadas de A.
- **Limpieza local:** con documento sincronizado, limpiar la copia y recargar. La fila en Supabase y su revisión deben permanecer sin modificaciones financieras; bloquear limpieza con pendientes.
- **Conflicto visible:** conservar/exportar la copia local antes de aceptar la remota; una recarga no debe borrar silenciosamente la copia en conflicto.
- **Regresión financiera:** ingreso, gasto, asignación, desasignación, transferencia y préstamo/devolución conservan la identidad `en cuentas = asignado + sin asignar`.

## Reversión segura

Si el SQL falla antes del `COMMIT`, la transacción revierte sus cambios. No volver a ejecutar parcialmente instrucciones sueltas sin revisar el error.

Si el SQL ya se aplicó y el cliente falla, la opción segura es conservar la columna y el RPC, detener escrituras en la interfaz y publicar una versión compatible corregida. Las filas siguen legibles y los documentos no necesitan restaurarse para resolver un fallo de interfaz.

**No restaurar automáticamente el cliente antiguo con permisos de `upsert`.** Volver a conceder escritura directa eliminaría la protección y permitiría a una pestaña antigua sobrescribir datos. Esa reversión requiere autorización nueva, respaldos, cerrar sesiones antiguas y reconciliar primero los cambios pendientes. No se proporciona una reversión destructiva ni se elimina `revision`, el RPC o ningún documento financiero.

## Referencias

- [Supabase: funciones SQL, seguridad y permisos de ejecución](https://supabase.com/docs/guides/database/functions).
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [PostgreSQL: comparación de condiciones tras actualizaciones concurrentes](https://www.postgresql.org/docs/current/transaction-iso.html).
