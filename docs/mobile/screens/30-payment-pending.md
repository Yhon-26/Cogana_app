# 30 · Pago pendiente

Referencia: [Figma `632:34`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=632-34),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/payment/pending`: `src/app/payment/pending.tsx` → `src/features/customer/checkout/PaymentPendingScreen.tsx`.
- Entrada real: el botón «Continuar» de las pantallas de pago (18/19) se habilita al elegir un
  método (Yape/Plin/efectivo) y abre esta pantalla; la nota bajo el botón cambia a «Tu pago queda
  pendiente: la confirmación llega del proveedor.» Seleccionar un método no es pagar.
- Tarjetas «Respuesta del pago» y «Acción necesaria», nota «Ningún cobro se inició en esta app.»
  y CTA «Continuar» deshabilitado («El estado real vendrá del proveedor.»).
- Enlace de ejemplo «Ver pedido recibido · ejemplo» abre la 31 (el lenguaje «· ejemplo» del sistema).

## Revisión

Captura: `tmp/mobile-qa/30-pending.png` (llegada real desde Yape). `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el contrato de cobros.
