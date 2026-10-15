# 31 · Pedido recibido

Referencia: [Figma `632:62`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=632-62),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/order-received`: `src/app/order-received.tsx` → `src/features/customer/checkout/OrderReceivedScreen.tsx`.
- Tarjeta «Solicitud registrada» con chip «SOLO EJEMPLO» (no hay pedido real). CTA «Seguir
  explorando» abre `/store`. Enlace de ejemplo «Ver detalle y seguimiento · ejemplo» abre la 32.
- Llegada: enlace de ejemplo desde la 30 (el salto real llegará con la confirmación del proveedor).

## Revisión

Captura: `tmp/mobile-qa/31-received.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el servicio de pedidos.
