# 26 · Notificaciones

Referencia: [Figma `534:68`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=534-68),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/notifications`: `src/app/notifications.tsx` → `src/features/customer/account/NotificationsScreen.tsx`.
- Bandeja inexistente: tarjeta «Avisos en preparación» con chip «FUNCIÓN NO DISPONIBLE».
- «Ver mis pedidos» abre `/orders` como salida útil.
- Barra superior con regreso («Más»).

## Revisión

Captura: `tmp/mobile-qa/26-notifications.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el servicio de avisos.
