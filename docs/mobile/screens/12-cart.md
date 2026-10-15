# 12 · Carrito

Referencia: [Figma `500:6`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=500-6), página 65. La composición principal sigue la imagen proporcionada por el usuario: tarjetas de productos y panel inferior con Entrega/Recojo y resumen. De Figma se conserva «También te puede gustar» con Frijol canario.

## Implementación

- Ruta de pestaña `/cart`: `src/app/(customer)/cart.tsx` → `src/features/customer/cart/CartScreen.tsx`.
- Los tres artículos iniciales provienen de `src/services/mock/cart.ts`; sus fichas, imágenes y precios de muestra se resuelven mediante `src/services/mock/catalog.ts`. Cambiar productos de la demostración en esos adaptadores, sin editar los componentes de la vista.
- Los controles de cantidad y eliminación actualizan el estado local, el contador y el subtotal. Al eliminar el último artículo reaparece el estado vacío existente.
- La sugerencia de Frijol canario se obtiene del catálogo de muestra y abre su detalle. Nunca se recomienda un producto ya incluido en las líneas iniciales.
- Entrega/Recojo es una preferencia visual local. No existe tarifa confirmada: el importe mostrado como «Total de productos» excluye el servicio. «Elegir entrega o recojo» abre la pantalla 13 con la opción elegida; el avance posterior sigue pendiente de validación de precio, disponibilidad, entrega y pago.
- `src/assets/cart/trash.svg` es un icono local; imágenes y textos quedan fuera del JSX de navegación. No se crean pedidos ni se escribe en Supabase.

## Revisión

Capturas del emulador en `tmp/mobile-qa/12-cart-first.png`, `12-cart-large.png`, `12-cart-suggestion.png` y `12-cart-pickup.png`. Se verificaron escala 1.0 y 1.3, cantidades y subtotal recalculados, desplazamiento hasta la sugerencia y cambio a Recojo. Pendientes: prueba manual con lector de pantalla y aprobación visual del usuario.
