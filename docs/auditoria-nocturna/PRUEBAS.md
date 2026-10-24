# Pruebas y resultados

Fecha: 24 oct 2026

| Prueba | Resultado | Evidencia / límite |
|---|---|---|
| `git diff --check` | Correcto | Sin errores de whitespace. |
| `npm run lint` | Correcto | ESLint finalizó con código 0. |
| `npm run build` | Correcto al repetir | El primer intento encontró `EPERM` al coincidir con la escritura del servidor local en `.next`; el segundo intento secuencial terminó correctamente, incluido el prerender. |
| `npm run verify:salary-quick` | Correcto | Verificó escenarios de registro salarial, conciliación, duplicados, conceptos confirmados y hooks de disposición móvil/escritorio. |
| Doble clic en icono de un sobre | Correcto | Menú rápido: “Cargar sobre” y “Registrar gasto del sobre”. |
| Doble clic en un segundo sobre | Correcto | Mismas dos opciones, asociadas al sobre seleccionado. |
| Doble clic con viewport móvil de 390 × 844 | Correcto para la interacción de ratón | El menú rápido abrió y mostró ambas opciones dentro del viewport móvil. No equivale a una prueba táctil física. |
| Geometría del menú móvil | Correcto | A 390 px: el menú midió 238 px, quedó entre los bordes del viewport y el documento mantuvo `scrollWidth` de 390 px. |
| Viewport de 320 px | Parcial | La preferencia local vigente de cuadrícula de tres columnas muestra el aviso existente de ancho insuficiente; no se modificó esa preferencia ni se usó una acción para forzar otro diseño. |
| Botón ⋮ de opciones | Correcto | Conserva el menú avanzado y las acciones previas. |
| Acciones financieras desde el menú | No ejecutadas | La prueba se detuvo en la presentación del menú para no cambiar datos reales/locales. |
| Doble toque físico / gestos táctiles | No probado en dispositivo físico | El doble toque conserva el detector táctil existente y llama al nuevo modo rápido; no hay dispositivo táctil conectado. |
| Temas y operaciones financieras completas | No probados en esta corrección | No son necesarios para abrir el menú; requieren una pasada de auditoría y datos de prueba aislados. |

La app local sí cargó y permitió verificar la interfaz. Los datos del usuario no se modificaron durante las pruebas.
