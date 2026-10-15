# 13 · Entrega o recojo

Referencia: [Figma `500:7`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=500-7), página 65. Se conserva la elección entre entrega y recojo; la fotografía decorativa se omite por petición del usuario.

## Implementación

- Ruta `/fulfillment`: `src/app/fulfillment.tsx` → `src/features/customer/checkout/FulfillmentScreen.tsx`.
- El carrito abre esta pantalla con su preferencia Entrega/Recojo seleccionada. Ambas opciones se pueden cambiar aquí; la selección permanece local.
- Se reutilizan el icono de regreso y los tokens de la app. Los textos viven en `fulfillmentContent.ts` para facilitar cambios manuales.
- No se muestran horarios, tienda ni zona ficticios. «Continuar con entrega» abre la pantalla 14; la ruta de recojo permanece inactiva hasta implementar su pantalla específica.
- La pantalla no consulta ni escribe en Supabase.

## Revisión

Verificada en el emulador Android en escalas de texto 1.0 y 1.3, incluida la selección Recojo recibida desde el carrito, el regreso al carrito y el contraste de la barra de estado. Capturas: `tmp/mobile-qa/13-fulfillment-final.png` y `13-from-cart-pickup.png`. Pendientes: prueba con lector de pantalla y aceptación visual del usuario.
