# Hallazgos

## AF-01 — El doble clic del icono abría un menú ambiguo/inconsistente

- **Severidad:** media (inconsistencia de interacción; sin evidencia de alteración de saldos).
- **Estado:** corregido y comprobado en la aplicación local con clic de escritorio.
- **Componente:** `components/envelope-collection.tsx` y el manejador de menú en `app/page.tsx`.
- **Causa:** el icono de sobre y el botón ⋮ compartían el mismo menú general; además, el cambio de menú dependía de un estado capturado que podía quedar obsoleto al cambiar rápidamente de sobre. El gesto no separaba explícitamente acciones rápidas del menú completo.
- **Comportamiento esperado:** el doble clic/doble toque del icono abre de manera determinista las acciones “Cargar sobre” y “Registrar gasto del sobre” para ese sobre; el botón ⋮ mantiene el menú avanzado.
- **Resultado:** dos sobres distintos mostraron las mismas dos acciones rápidas y el menú identificó el sobre seleccionado. El botón ⋮ siguió mostrando las opciones avanzadas. No se seleccionaron acciones financieras.

## Estado del resto de la auditoría

No se encontraron ni se declararon hallazgos en áreas que todavía no se probaron. Las funciones de salario, préstamos, pagos, sincronización remota, reportes y accesibilidad completa quedan pendientes de un entorno de pruebas aislado.
