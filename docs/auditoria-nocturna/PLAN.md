# Auditoría nocturna — plan y estado

Fecha de inicio: 24 oct 2026
Proyecto: App Finanzas (`main`)

## Alcance y protección

- [x] Revisar la rama, el commit base y los cambios locales antes de editar.
- [x] Mantener intactos los archivos locales no relacionados y los adjuntos de referencia.
- [x] Consultar la guía local de Next.js para componentes interactivos.
- [x] Inspeccionar navegación, componentes de sobres, menús y flujo de acciones asociado.
- [x] Corregir el menú inconsistente activado con doble clic/doble toque en el icono del sobre.
- [x] Probar la apertura del menú en dos sobres distintos sin ejecutar operaciones financieras.
- [x] Comprobar el menú en un viewport móvil de 390 × 844 y restaurar el tamaño del navegador.
- [x] Comprobar que el botón de opciones avanzadas conserva todas sus acciones.
- [x] Ejecutar ESLint.
- [x] Repetir la compilación de producción sin conflicto con el servidor de desarrollo.

## Auditoría funcional más amplia

- [x] Identificar las pantallas principales y los grupos de navegación existentes.
- [x] Revisar estáticamente las rutas de acciones de sobres, movimientos y resumen financiero.
- [ ] Probar todas las operaciones financieras en un entorno aislado con datos descartables.
- [ ] Probar sincronización, modo sin conexión y recuperación de sesión con un entorno no productivo.
- [ ] Completar recorridos visuales de todos los módulos en móvil y escritorio.
- [ ] Validar accesibilidad con lector de pantalla y dispositivo táctil real.

Las tareas sin marcar no se consideran verificadas. No se ejecutaron operaciones financieras con los datos presentes en el navegador.
