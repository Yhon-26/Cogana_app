# 24 · Más de tu cuenta

Referencia: [Figma `534:6`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=534-6),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/account/more`: `src/app/account/more.tsx` → `src/features/customer/account/AccountMoreScreen.tsx`.
- Hub con las tres opciones reales: Preferencias (`/preferences`), Notificaciones
  (`/notifications`) y Privacidad y cuenta (`/privacy`); todas con chevron porque existen.
- Nota honesta en verde claro: «Algunos ajustes aún no están habilitados.»
- Se accede desde la pestaña Cuenta con el botón «Más de tu cuenta» (agregado en la 21).

## Revisión

Captura: `tmp/mobile-qa/24-more.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla y aprobación del usuario.
