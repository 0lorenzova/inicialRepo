# Actualización complementaria — 11 octubre 2026

## Implementado
- Inicio: «Filtrar por proximidad» con casilla a su derecha y «Ver todos» al extremo. Sin «Activar filtro». Preferencia `homeShowProximity` persistida en el documento existente; oculta filtro y tarjetas exclusivamente en Inicio, sin detener cálculos ni avisos. La visibilidad global conserva su prioridad.
- Púrpura: animación condicionada a elementos vencidos reales. Contador cero y leyendas de referencia estáticos; cinco estados conservados.
- Icono del sobre: doble clic / doble toque abre el mismo menú personal. Se conservan tres puntos, pulsación larga y ordenación por teclado. Sustituye el antiguo acceso Entrada/Salida.
- Menú: Nuevo gasto primero, con icono propio `ShoppingCartCheckoutOutlined`; resto de opciones solicitadas ordenadas, adicionales conservadas antes de Archivar.
- Gasto contextual: formulario existente con sobre preseleccionado; permite cambiarlo y añadir otros. Selección de sobres antes de categorías, sin selector global redundante.
- Categorías por sobre: asociar existentes, crear dentro del gasto, editar o archivar desde el menú. Categorías compartidas mantienen ID; nombres históricos permanecen en cada movimiento. No hay borrado destructivo.
- Reparto: importes explícitos por sobre y, si se selecciona más de una, por categoría. Una categoría usa el importe de su sobre. Sin categorías se guarda «Sin categoría». Los importes deben cuadrar exactamente; alternativa existente para gastar directamente dinero sin asignar.
- Motor: un único `postMovement` y actualización atómica. `categoryAllocations` es clasificación, nunca una segunda deducción. Cuenta, sobres, préstamos y límites conservan el mismo motor. Reportes agrupan los importes reales de cada categoría; movimientos antiguos siguen funcionando.
- Ruta del ingreso: icono/nombre/importe y despliegue de metas y pagos actuales, incluidos estados pagados. «Ver movimientos de este sobre» debajo. Historial de navegación preserva regreso y sobres desplegados.
- Sin asignar: Ver distribución a la izquierda y Cargar dinero a la derecha solo en escritorio.
- Selector único de vista anterior conservado: lista → cuadrícula cómoda → compacta → lista, según espacio disponible.

## Pruebas realizadas
- `verify-contextual-expenses`: asociaciones, duplicados, importes inválidos, reparto exacto, categorías ajenas/archivadas, un único gasto, atomicidad, conservación del historial tras renombrar, persistencia JSON, reportes y navegación.
- `verify-expense-categories`, lint dirigido, TypeScript y compilación de producción local con Supabase desactivado.
- Navegador local: Inicio oculto/persistido frente a Sobres visible; contador púrpura 2 animado y cero estático; doble clic en icono y menú tradicional; icono propio de Nuevo gasto; preselección Hogar y gasto ficticio300 repartido Hogar200/Ahorro100, categorías150/50/100. Un movimiento, saldos coherentes y detalle en historial.
- Categorías creadas/asociadas desde el registro, edición desde el menú. Ruta del ingreso → Hogar desplegado → movimientos → regreso al mismo despliegue → pantalla anterior.
- Móvil360/390 y escritorio1280. Sin overflow horizontal en componentes revisados; menú de lista dentro del viewport, cuadrículas2/3 y regreso a lista. Orden de botones de escritorio confirmado.
- Captura: `C:/Users/0lore/.codex/visualizations/2026/09/28/01a0e624-24b8-7600-adde-b88eb9742056/proximidad-categorias.png`.

## Pendientes / límites
- Verificar doble toque y arrastre en un teléfono físico: el navegador de pruebas disponible solo proporciona entrada de ratón. Implementación táctil conservada, pero no declarar verificación física.
- No hay decisiones financieras ni cambios SQL nuevos para esta entrega. Campos opcionales en JSON de `user_finance_data`; no se modificaron datos de producción ni `.env.local`.
- Migración RPC antigua sigue pendiente de cliente compatible, respaldo, entorno de prueba y autorización; no ejecutarla aisladamente.
- Backlog anterior independiente: déficit separado, fotos/almacenamiento; definiciones de multimoneda, notificaciones con app cerrada, vencimientos propios de préstamos y prioridad en empates. QA histórica de productos con varios meses y colores futuros coincidentes sigue pendiente.
