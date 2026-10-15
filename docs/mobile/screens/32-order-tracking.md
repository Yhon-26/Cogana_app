# 32 · Detalle y seguimiento

Referencia: [Figma `637:6`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=637-6),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/order-tracking`: `src/app/order-tracking.tsx` → `src/features/customer/checkout/OrderTrackingScreen.tsx`.
- Sección «Artículos · ejemplo» con dos filas (Arroz superior y Lenteja, «1 unid.» en verde);
  tarjetas de entrega («Zona por confirmar»), estado del pago y resumen (Pedido «Por confirmar»,
  Pago «Por consultar», Entrega «Sin asignar» en verde).
- Nota «Sin pedido consultado en esta vista.» y CTA «Detalle no disponible» deshabilitado.
- Enlace de ejemplo «Ver cambio propuesto · ejemplo» abre la 33.

## Revisión

Capturas: `tmp/mobile-qa/32-tracking.png` y `32b.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el servicio de pedidos.
