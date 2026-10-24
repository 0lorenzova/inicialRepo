# Correcciones realizadas

## AF-01 — Acciones deterministas al doble clic/tacto en un sobre

- `components/envelope-collection.tsx`: el doble clic de escritorio y el doble toque táctil abren explícitamente el modo de acciones rápidas. El botón ⋮ abre el modo completo.
- `app/page.tsx`: el estado del menú incluye su modo y usa una actualización funcional; el modo rápido siempre abre para el sobre pulsado. Sus dos acciones reutilizan las rutas actuales de asignación y gasto, sin implementar lógica financiera nueva. El modo completo mantiene las acciones anteriores.
- No se modificaron fórmulas, saldos, movimientos, preferencias ni datos persistidos.

## Trabajo visual solicitado anteriormente que estaba pendiente localmente

- `app/page.tsx`, `app/globals.css` y `lib/ui-copy.ts`: presentación de Resumen financiero con siluetas integradas de billetera, sobre y monedas; conserva los valores y controles existentes.
- Se incluye al publicar porque es trabajo solicitado previamente que seguía pendiente en el árbol local.

No se incluyeron los adjuntos locales, capturas ni archivos diagnósticos ajenos a estos cambios.
