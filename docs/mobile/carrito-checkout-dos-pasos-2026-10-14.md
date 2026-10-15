# Carrito y compra en dos pasos — 2026-10-14

## Recorrido implementado

1. Carrito: productos reales, quitar productos, ajustar cantidades y total de productos. El botón **Continuar** abre `/checkout`.
2. Finalizar compra: elegir envío o recojo, zona y dirección si corresponde, contacto, horario, medio de pago y resumen.

El carrito mantiene los cambios guardados por cuenta. La nueva pantalla conserva la modalidad al volver a editar productos. Cambiar de modalidad elimina el horario incompatible; pasar a envío elimina efectivo si estaba seleccionado. Los datos de dirección se conservan al alternar modalidades durante la sesión.

Se reutilizan catálogo, zonas, tarifas, configuración de pagos, horarios y envío transaccional existentes. El servidor sigue confirmando stock, precio, cupos y total. No se agregaron pasarelas, cupones ni datos simulados. Las rutas anteriores siguen disponibles.

## Verificación

- `npm run check`: TypeScript y ESLint.
- `node scripts/test-customer-cart.mjs`: cantidades, stock, presentaciones y granel.
- `node scripts/test-customer-checkout.mjs`: intención de compra, validación, reintentos, recuperación y rechazo atómico.
- `node scripts/test-customer-continuity.mjs`: persistencia, aislamiento de cuentas y autenticación sin enviar mensajes.
- `node scripts/test-checkout-flow.mjs`: transiciones reales del proveedor de checkout; conservar preferencias compatibles y eliminar horario/efectivo incompatibles; restablecimiento.
- Android `emulator-5554`, Expo Go: carrito → continuar → compra, edición y regreso, selección de zona, cambio a recojo y regreso a envío, medios de pago y horario.
- Carrito existente: 4 botellas a S/ 7.90 = S/ 31.60. Se incrementó y redujo una unidad, dejando las mismas 4. Zona 1: envío S/ 4.00, total S/ 35.60. Recojo: gratis, total S/ 31.60 y efectivo disponible. Al volver a envío se ocultó efectivo y quedaron Yape y Plin sin selección.
- No se ingresaron datos personales, no se envió OTP ni se creó pedido alguno. La tienda está cerrada para pedidos: la pantalla de horario muestra el cierre y no permite confirmar una franja.

## Evidencia local

- [Carrito final](../../tmp/mobile-qa/checkout-flow/cart-final.png)
- [Compra: envío](../../tmp/mobile-qa/checkout-flow/delivery-final.png)
- [Resumen con envío](../../tmp/mobile-qa/checkout-flow/delivery-total.png)
- [Compra: recojo](../../tmp/mobile-qa/checkout-flow/pickup.png)
- [Resumen con recojo y efectivo](../../tmp/mobile-qa/checkout-flow/pickup-total.png)
- [Horario cerrado](../../tmp/mobile-qa/checkout-flow/schedule.xml)

La compra real con usuario autenticado, horario disponible, pago y entrega continúa pendiente de validación operativa. Esta verificación cubre el recorrido de invitado y sus pantallas; no equivale a una compra real completada ni a una prueba nueva con fuente ampliada.
