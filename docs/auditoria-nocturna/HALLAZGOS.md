# Hallazgos de auditoría

## AF-01 — Acciones rápidas inconsistentes al doble clic del icono de sobre
- Severidad: media.
- Estado: corregido, verificado y publicado previamente en f83f03a.
- Resultado: doble clic/doble toque abre las acciones rápidas de cargar sobre y registrar gasto para el sobre pulsado; el menú de opciones conserva las acciones completas.
- No se realizaron operaciones financieras durante la verificación.

## AF-02 — Filtros de Préstamos entre sobres comprimidos en móvil
- Severidad: media.
- Estado: corregido y verificado visualmente en viewport estrecho.
- Causa: la fila de controles forzaba etiquetas a ocupar anchos demasiado pequeños.

## AF-03 — Selector de período de Reportes recortado en móvil
- Severidad: baja.
- Estado: corregido y verificado visualmente; los controles se apilan en pantallas estrechas.

## AF-04 — Frecuencia interna en inglés en Recordatorios
- Severidad: baja.
- Estado: corregido y cubierto con verificador; etiquetas visibles traducen daily/weekly/monthly/yearly a español sin cambiar el valor persistido.

## AF-05 — Selector global dentro de CSS Module salarial
- Severidad: media para compilación.
- Estado: corregido; regla trasladada al CSS global y verificación de tipos/lint correcta.

## AF-06 — Nombre de filtro rápido dividido en Movimientos
- Severidad: baja.
- Estado: corregido y verificado visualmente en dos anchos móviles.
- Causa: cuatro columnas forzaban la palabra «Transferencias» a partirse en pantallas estrechas.
- Resultado: los cuatro filtros pasan a dos columnas cuando el ancho no alcanza; conservan sus contadores y acciones.

## Límites de cobertura

No se atribuyen hallazgos a flujos no ejecutados sobre datos de prueba aislados. Consultas remotas, modo sin conexión real, accesibilidad con lector de pantalla y gestos con hardware Android no se verificaron.
