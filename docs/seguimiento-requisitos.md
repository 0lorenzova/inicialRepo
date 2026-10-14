# Seguimiento de requisitos — 14 octubre 2026

Auditoría limitada a los pedidos disponibles en este chat, los tres documentos recientes, código consultado y evidencias registradas en CONTINUIDAD. No certifica instrucciones no disponibles ni vuelve a ejecutar pruebas anteriores. «Verificado» indica evidencia concreta, con su alcance. Salarios aún no implementado.

| ID | Requisito | Estado | Evidencia | Corrección pendiente | Prioridad |
|---|---|---|---|---|---|
| C01 | Avisos con cantidad exacta de días de atraso, sin texto permanente en tarjetas | IMPLEMENTADO Y VERIFICADO | Helper compartido, prueba verify-theme-palettes y regresión planned-payment | QA física de accesibilidad | Alta |
| C02 | Iconos Entrada/Salida en el menú real Nuevo movimiento | IMPLEMENTADO Y VERIFICADO | PaymentsOutlined/ShoppingCartCheckoutOutlined; menú abierto en revisión local | Ninguna identificada | Alta |
| C03 | Giro de filtros globales si alguno de sus elementos tiene pago previsto tardío | IMPLEMENTADO Y VERIFICADO | Local360: verde, atraso3días, giro2s; al corregir fecha animación none, contador1; pruebas de agrupación | Combinaciones de varios colores: pruebas de cálculo, no QA visual exhaustiva | Alta |
| C04 | Giro 3D 2 s, púrpura secuencial y movimiento reducido | IMPLEMENTADO Y VERIFICADO | 5cb3ba8; verify-calendar-futures; CSS fases sin cambios | Comprobación física de preferencia del sistema | Alta |
| U01 | Resumen, sobres y actividad plegables; candados independientes; privacidad | IMPLEMENTADO Y VERIFICADO | Evidencias anteriores en CONTINUIDAD; Inicio móvil revisado en esta entrega | No repetir implementación | Media |
| U02 | Lista/cuadrículas adaptables y selector único | IMPLEMENTADO Y VERIFICADO | CONTINUIDAD 11oct; cuadriculado móvil/PC revisado | Arrastre táctil físico | Media |
| U03 | Encabezado fijo configurable y alcance a todas las pantallas | IMPLEMENTADO Y VERIFICADO | 5cb3ba8, pruebas locales y persistencia documentadas | Ninguna identificada | Media |
| U04 | Configuración inicialmente contraída y secciones independientes | IMPLEMENTADO Y VERIFICADO | 1fb6765, SettingsGroups; acceso Apariencia revisado | Ninguna identificada | Media |
| U05 | Cuatro temas nuevos preservando temas anteriores | IMPLEMENTADO Y VERIFICADO | theme-palettes, contraste AA; cuatro paletas visualizadas en360/1280, pantallas representativas/formulario/menús | Publicación al cierre; no se revisó cada combinación de pantalla/tema | Alta |
| U06 | Preferencia de tema por usuario | IMPLEMENTADO PARCIALMENTE | Clave local separada por ID autenticado; fallback conserva preferencia anterior | Dos usuarios reales y sincronización entre dispositivos no verificados; tema no viaja en JSON Supabase | Media |
| F01 | Ingreso con distribución explícita/sin asignar y contexto de sobre | IMPLEMENTADO Y VERIFICADO | 3320288 y pruebas de income-distribution/corrección documentadas | Ninguna identificada en esta entrega | Alta |
| F02 | Motor único, asignación, gasto, transferencias, préstamos y devoluciones | IMPLEMENTADO Y VERIFICADO | finance-ledger y pruebas financieras históricas documentadas | No es auditoría bancaria independiente | Alta |
| F03 | Déficit separado del dinero real | PENDIENTE | CONTINUIDAD, prompt70919143 §9 | Diseño de operación y confirmación, sin crear dinero | Alta |
| P01 | Proximidad, cobertura y visibilidad independientes | IMPLEMENTADO Y VERIFICADO | envelope-planning; indicadores conservan cinco colores funcionales | QA de combinación de cuatro colores en un día sigue pendiente | Alta |
| P02 | Fecha prevista independiente y persistente por ocurrencia | IMPLEMENTADO Y VERIFICADO | 1fb6765, planned-payment, calendar-futures | Ninguna identificada en cálculo | Alta |
| P03 | Calendario semana inicial, navegación plegada y accesos rápidos | IMPLEMENTADO Y VERIFICADO | 1fb6765; revisión local del calendario móvil | Ninguna identificada | Media |
| P04 | Recurrencias futuras virtuales, excepciones y finalización | IMPLEMENTADO PARCIALMENTE | 5cb3ba8; verify-calendar-futures | Editor de fecha final no existe; dato endDate sí se respeta | Media |
| P05 | Tooltip estable mientras permanece el cursor | IMPLEMENTADO PARCIALMENTE | Ancla estable y Tooltip interactivo | Prueba física de hover sostenido | Media |
| P06 | Menú contextual mantiene sobre; iconos y acciones financieras | IMPLEMENTADO Y VERIFICADO | Informe complementario11oct; menú Hogar local | Gestos físicos y revisión exhaustiva de todos los contextos | Media |
| H01 | Historial separado/cronológico y detalle textual reutilizado | IMPLEMENTADO Y VERIFICADO | 7a22e2f/bd26a7e; CONTINUIDAD13oct | Ninguna identificada | Media |
| H02 | Reportes enlazan ingresos/gastos del período y conservan regreso | IMPLEMENTADO Y VERIFICADO | bd26a7e, verify-report-details; Reportes móvil revisado | Ninguna identificada | Media |
| T01 | Productos seleccionables, seguimiento y conservación de importes | IMPLEMENTADO Y VERIFICADO | 1fb6765 y verify-finance-products; pruebas de selección documentadas | Compras de varios meses requieren QA histórica | Media |
| N01 | Notificaciones, pago desde aviso e importes opcionales con privacidad | IMPLEMENTADO Y VERIFICADO | CONTINUIDAD y verify-finance-notifications | Notificaciones con aplicación cerrada necesitan definición | Media |
| N02 | WhatsApp/correo para recordatorios | PENDIENTE | Pospuesto expresamente por propietario | Mantener pospuesto | Baja |
| S01 | Motor salarial, empleadores/períodos/conceptos/abonos/aplicaciones | PENDIENTE | Plan salarial y Excel analizados | Implementar modelo e integración atómica | Alta |
| S02 | UI salarial y consulta de deudas antiguas | PENDIENTE | Documento ddaa7693 y plan salarial | Configuración, resumen, períodos, filtros, abonos e historial | Alta |
| S03 | Importación salarial con vista previa y confirmación | PENDIENTE | Mapeo de Hoja1 documentado | Fechas faltantes, precisión y conciliación histórica sin duplicar ingresos | Alta |
| X01 | Fotos/recibos, multimoneda, plazos propios de préstamos y desempate configurable | PENDIENTE | Backlog previo de CONTINUIDAD | Definición e implementación separadas | Media |
| X02 | Sincronización real entre dos dispositivos, gestos y movimiento reducido físico | NO VERIFICABLE | No se ha realizado esa prueba física | Sesión de QA con dispositivos | Media |
| SQL01 | Migración RPC antigua202610010001 | PENDIENTE | docs/sync-migration.md y CONTINUIDAD | Cliente compatible, base de prueba, respaldo y autorización. No ejecutar aislada | Alta |

SQL nuevo para temas/avisos: ninguno. No se alteran funciones financieras en esta entrega. Otros hallazgos de la auditoría se documentan antes de implementar cambios de lógica.
