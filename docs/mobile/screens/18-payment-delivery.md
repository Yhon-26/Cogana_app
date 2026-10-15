# 18 · Pago para entrega

- Ruta: `/payment/delivery`
- Figma: `518:6`
- Implementación compartida: `src/features/customer/checkout/PaymentMethodScreen.tsx`

La pantalla mantiene la jerarquía del frame de Figma y ofrece únicamente Yape y Plin para entrega. El subtotal se calcula con el carrito y el catálogo de muestra; la tarifa y el total final no se inventan. Elegir una opción solo actualiza el borrador local del checkout.

La acción final permanece inactiva y dice «Compra aún no disponible». El carrito y sus precios son de ejemplo; la pantalla aclara que no creó un pedido ni inició un pago. Se eliminó el salto a `/payment/pending` que podía sugerir lo contrario. Faltan catálogo y stock vigentes, zona/tarifa, disponibilidad y creación idempotente antes de confirmar.

Validada en Android con zona segura y escala de texto 1.0. Captura local: `tmp/mobile-qa/18-payment-delivery.png`.
