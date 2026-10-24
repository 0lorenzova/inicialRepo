# Correcciones realizadas

## AF-02 — Controles móviles de préstamos
- Archivo: components/loans-screen.module.css
- Los filtros utilizan el ancho disponible y conservan sus etiquetas; el ordenamiento pasa a una fila legible en pantallas estrechas.

## AF-03 — Filtros de Reportes
- Archivo: components/finance-history.module.css
- En pantallas de hasta 430 px, los filtros pasan a una columna para evitar el recorte del período.

## AF-04 — Frecuencia de Recordatorios
- Archivos: lib/finance-reminders.ts y scripts/verify-reminders.mjs
- Se localizan las etiquetas visibles al español y se añade una comprobación. La frecuencia persistida no cambia.

## AF-05 — CSS de Gestión salarial
- Archivos: components/salary-tracking.module.css y app/globals.css
- La regla dirigida a una estructura global salió del CSS Module y se movió a la hoja global, manteniendo la condición visual existente.

## Ajuste móvil de Sobres
- Archivo: components/envelope-collection.module.css
- Ajuste leve de tipografía para nombres en cuadrícula de tres columnas en móviles.

## AF-06 — Filtros rápidos de Movimientos
- Archivo: components/movements-screen.module.css
- En anchos de hasta 480 px, los cuatro botones se distribuyen en dos columnas para que «Transferencias» no se parta dentro de la palabra.

## Alcance financiero
No se cambiaron cálculos, saldos, movimientos, registros, base de datos, autenticación ni preferencias financieras.
