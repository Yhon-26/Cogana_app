# 19 · Pago para recojo

- Ruta: `/payment/pickup`
- Figma: `518:34`
- Implementación compartida: `src/features/customer/checkout/PaymentMethodScreen.tsx`

La variante de recojo ofrece Yape, Plin y efectivo. La opción de efectivo aclara que se paga al recoger; no aparece en entrega. El recojo se muestra gratis y el total visible corresponde a los productos de muestra del carrito.

La selección es local y no confirma el pedido ni marca el pago como realizado. La acción final permanece inactiva y aclara que el carrito contiene productos de ejemplo; no abre `/payment/pending` sin un pedido creado.

Validada en Android con escala de texto 1.0 y 1.3; las tres opciones, el resumen y el pie permanecen visibles. Capturas locales: `tmp/mobile-qa/19-payment-pickup.png` y `tmp/mobile-qa/19-payment-pickup-large.png`.
