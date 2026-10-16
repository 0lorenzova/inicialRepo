# Etiquetas temporales y nuevos temas — 15 octubre 2026

## Implementado
- Registrar salario muestra Hoy, La semana pasada, Hace X semanas, La próxima semana y Dentro de X semanas según el período seleccionado.
- Orientación con fecha civil local del dispositivo, actualización cada minuto y al recuperar foco. Las fechas contables mantienen su zona y sus reglas existentes.
- Se reutilizan los anclajes del calendario salarial para semanas, quincenas, meses e intervalos personalizados; navegar no guarda registros.
- White Snow, Ice y Fire integrados en el selector y ciclo existentes. Preferencia por usuario conservada mediante el mecanismo actual del navegador.
- Tokens compartidos para superficies, controles nativos y portales MUI; textos positivos/negativos y fichas salariales adaptados al contraste claro/oscuro. Colores de proximidad intactos.
- Corrección del fondo del nombre Finanzas en los tres temas nuevos y texto contrastante sobre el día seleccionado en Fire.

## Archivos
- `lib/salary-dates.ts`, `lib/salary-tracking.ts`: fecha local y etiqueta calculada.
- `components/salary-receive-dialog.tsx`, `components/salary-receive-dialog.module.css`: encabezado y contraste del calendario.
- `lib/theme-palettes.ts`, `components/theme-provider.tsx`, `app/globals.css`, `components/salary-tracking.module.css`: temas y colores funcionales.
- `scripts/verify-salary-temporal-labels.mjs`, `scripts/verify-theme-palettes.mjs`: comprobaciones automatizadas.

## Pruebas realizadas
- Etiquetas actuales, pasadas y futuras hasta ±1000 semanas, diciembre/enero, zonas Costa Rica/Madrid, quincenas, meses anclados al día 31 e intervalos personalizados; sin mutar el ledger.
- Contraste de texto principal/secundario/acentos ≥4,5:1 sobre superficies; acciones y botones MUI ≥4,5:1; contorno de campos ≥3:1. Siete paletas adicionales diferenciadas y esquema claro/oscuro correcto.
- TypeScript, ESLint de los archivos afectados, compilación Next de producción y diff sin errores.
- Navegador local sin Supabase: Hoy → La semana pasada → Hace 2 semanas → La próxima semana; selección de semana desde almanaque actualiza la etiqueta.
- White Snow en Inicio/Movimientos PC y persistencia después de recargar; Ice en Sobres a 360 px; Fire en Gestión salarial PC y Registrar salario/almanaque a 320 px. Dialog dentro del viewport, sin overflow horizontal.
- No se registraron nuevas operaciones financieras durante esta revisión. Datos ficticios previos: dos entradas, total ₡175.000.

## Límites y continuidad
- Esta actualización no requiere SQL. El trigger `202610150001_salary_earned_guard.sql` sigue pendiente por decisión del propietario.
- No se probó sincronización de apariencia entre dispositivos: se conserva la persistencia por usuario ya existente, local al navegador.
- Pendientes anteriores ajenos a este bloque: diagnóstico del acceso “Failed to fetch”, verificación de sincronización real entre dos dispositivos y revisión de importación real de Excel. No se declaran resueltos.
- Publicación autorizada: commit/push a main y confirmación del estado Vercel durante el cierre del bloque; el mensaje final indica resultado y URL.
