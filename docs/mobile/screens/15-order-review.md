# 15 · Revisar pedido

Referencia secundaria: [Figma `500:9`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=500-9), página 65. La composición principal sigue la imagen aportada por el usuario: bloques compactos para productos, entrega y total, más una acción fija inferior; se adapta a los tokens y estados reales de la base Cogana.

## Implementación

- Ruta `/order-review`: `src/app/order-review.tsx` → `src/features/customer/checkout/OrderReviewScreen.tsx`.
- Los productos e importes provienen de `src/services/mock/cart.ts` y `catalog.ts`. La pantalla muestra las tres líneas actuales y calcula el subtotal en céntimos.
- `CheckoutDraftContext.tsx` conserva el carrito, distrito, dirección, referencia y celular solo en memoria durante el recorrido. Evita colocar información personal en parámetros de navegación y no escribe en Supabase.
- La pantalla 14 habilita «Revisar pedido» al completar distrito, dirección y celular. La pantalla 15 muestra la dirección completa del borrador, compuesta por dirección y distrito; el horario y el costo de envío siguen pendientes.
- El proveedor compartido en la raíz mantiene sincronizadas las cantidades del carrito entre las pantallas 12 y 15, evitando que la revisión reconstruya un carrito desactualizado. `resetCheckoutDraft` está disponible, pero se invocará desde las futuras rutas de finalización o abandono.
- «Elegir método de pago» abre la vista previa de métodos; allí la confirmación de compra permanece deshabilitada. El total visible corresponde únicamente a productos y la tarifa de entrega sigue por calcular.
- `src/assets/checkout/delivery.svg` reemplaza el emoji de la referencia por un icono vectorial consistente con Cogana.
- La carga anuncia un indicador etiquetado como barra de progreso. El error se anuncia mediante una región activa y ofrece «Reintentar» para volver a cargar catálogo y carrito.

## Revisión

Verificada en el emulador Android con escalas de texto 1.0 y 1.3, productos locales, dirección completa compartida, navegación de regreso y acción de pago inactiva. Al incrementar Lenteja en la pantalla 12, la revisión mostró `x2` y recalculó el subtotal a S/ 34.10, confirmando que no usa un carrito obsoleto. La captura ampliada conserva visible la flecha de regreso; el CTA deshabilitado alcanza una relación de contraste de 6.04:1. Capturas: `tmp/mobile-qa/15-order-review.png` y `15-order-review-large.png`. Veredicto Impeccable: apta para entregar como pantalla 15 dentro del alcance local actual. Pendientes: prueba con lector de pantalla, horario y tarifa reales y aceptación visual del usuario.
