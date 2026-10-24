# Pruebas y resultados

Fecha: 24 oct 2026

## Correctas
- ESLint: npm run lint.
- TypeScript: npx tsc --noEmit.
- Revisión de diff: git diff --check.
- Build de producción: npm run build (Next.js 16.3.6, rutas estáticas generadas). Un primer intento falló por EPERM al crear un directorio temporal de .next; después de crearlo, el build completo pasó.
- Verificador de recordatorios, libro financiero (18 escenarios), sincronización simulada (19 escenarios), transporte simulado, operación de sobres, navegación, detalles de reportes, estados salariales y registro salarial rápido.
- Suite local: 58 de 60 verificadores pasaron.
- Navegación visual móvil: nueve destinos principales mostraron su encabezado esperado.
- Se revisaron temas claro y oscuro y se restauró Oscuro.
- Formularios de movimiento se abrieron y cancelaron antes de guardar; no hubo escritura financiera.
- Se verificaron visualmente filtros móviles de Préstamos, período de Reportes, etiquetas de Recordatorios y cuadrícula de Sobres.
- En el repaso posterior se comprobó en navegador móvil que el doble clic en dos iconos de sobre abre las mismas acciones rápidas y que el botón de opciones conserva el menú completo.
- Filtros rápidos de Movimientos: verificados visualmente en ancho estrecho y junto al punto de cambio de columnas, sin cortar la palabra «Transferencias».
- Vista de tres columnas de Sobres y tamaño original del navegador restaurados después de las pruebas.

## Limitaciones verificadas
- Dos verificadores SQL no pudieron ejecutarse por dependencia PGlite ausente del entorno; no se instaló.
- Webpack compiló CSS en copia temporal, pero la fase de tipos de esa copia no resolvió módulos por restricción de enlace. La comprobación TypeScript directa y el build de producción en el proyecto sí pasaron.
- No se probaron operaciones financieras de extremo a extremo, Supabase con escritura, modo sin conexión real, dispositivo Android físico, lector de pantalla ni todos los modales.
- No se midieron métricas de rendimiento.

Las pruebas automatizadas que usan memoria, fixtures o transporte simulado no demuestran comportamiento del servicio remoto de producción.
