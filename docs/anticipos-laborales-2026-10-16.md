# Anticipos laborales y estados — 16 octubre 2026

## Implementado
- Cierre laboral previsto calculado desde los días guardados en el propio período. Si un histórico no tiene esa instantánea, conserva su fecha final; no adopta la configuración actual.
- «Adelanto laboral» identifica pagos recibidos hasta el último día laboral incluido, sin asumir una hora de cierre. Se distingue de pagar antes de la fecha prevista. Cada recepción conserva su clasificación individual.
- Fichas, formulario y calendario comparten estado laboral. Un salario cubierto por adelantado sigue mostrando En curso cuando corresponda; recibir dinero no confirma devengo.
- Acceso rápido pendiente considera el último día laboral previsto.
- Paleta de la auditoría más reciente: pago parcial amarillo, proyección/en curso neutro gris, completo verde y pendiente devengado/vencido rojo. Los períodos futuros no reciben rojo por una fecha de pago temprana. Se mantienen textos, avisos de atraso y movimiento reducido.
- Corregido cálculo de fechas de cobros históricos sin hora: se interpretan como fecha civil, sin construir un datetime inválido ni inventar una hora.

## Pruebas
- verify-salary-work-timing: viernes/sábado, calendario personalizado, histórico sin instantánea, adelanto laboral versus fecha prevista, pago total anticipado sin devengo, ausencia de escrituras y correspondencia de paleta entre fichas y almanaque.
- Regresiones salary-states, salary-navigation, salary-closing y salary-import aprobadas. Lint dirigido aprobado. Compilación de producción y TypeScript antes de publicar.
- No se repitió QA visual del navegador bloqueado. Verificación visual de la nueva paleta y diálogo posterior al salario sigue pendiente en móvil/PC y dispositivos reales.

## Archivos
- lib/salary-dates.ts, lib/salary-tracking.ts.
- components/salary-tracking.tsx, components/salary-receive-dialog.tsx, components/salary-period-calendar.tsx.
- components/salary-status.module.css, components/salary-receive-dialog.module.css.
- scripts/verify-salary-work-timing.mjs, scripts/verify-salary-closing.mjs y continuidad.

## Pendiente para retomar
- La confirmación explícita del devengo todavía valida la fecha final completa del período. Alinear esa guarda con el último día laboral y revisar la migración SQL pendiente de forma conjunta; NO ejecutar el SQL antiguo como si ya incluyera esta regla. Consultar al propietario antes de aplicarlo.
- No se cambian earned, movimientos, cantidades, fechas originales, ni configuraciones históricas por presentar estos estados.
- Sigue pendiente la vigencia temporal de configuraciones, herramientas manuales opcionales, QA visual e importador/Supabase real. Ver auditoría de los 19 puntos; estas notas actualizan únicamente anticipos y paleta.
