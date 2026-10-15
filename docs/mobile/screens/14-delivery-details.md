# 14 · Datos de entrega

Referencia: [Figma `500:8`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=500-8), página 65. Se conserva la jerarquía del formulario, pero la dirección, el celular y el horario ficticios del diseño se sustituyen por campos locales vacíos y mensajes honestos.

## Implementación

- Ruta `/delivery-details`: `src/app/delivery-details.tsx` → `src/features/customer/checkout/DeliveryDetailsScreen.tsx`.
- La opción Entrega de la pantalla 13 abre esta ruta. Volver regresa a Entrega o recojo con domicilio seleccionado.
- Distrito, dirección, referencia y celular se editan solo en estado local. Los textos se centralizan en `deliveryDetailsContent.ts` para facilitar cambios manuales.
- Referencia es opcional. Los demás campos quedan preparados para validarse cuando exista el contrato de checkout.
- «Revisar pedido» se habilita al completar distrito, dirección y celular y abre la pantalla 15. La tarjeta de horario abre la pantalla 29 para consultar las horas reales; elegir una franja continúa pendiente de disponibilidad y capacidad.
- El borrador se conserva solo en memoria mediante `CheckoutDraftContext.tsx`; no se coloca información personal en los parámetros de ruta.
- El formulario no escribe en Supabase. La pantalla de horario vinculada sí hace una lectura pública de horas y estado; el borrador permanece en memoria mientras vive el proveedor del checkout. `resetCheckoutDraft` ya existe, pero su invocación queda pendiente de las futuras rutas de finalización o abandono.

## Revisión

Verificada en el emulador Android con escala de texto 1.0 y 1.3, entrada y avance «Siguiente» entre campos mediante teclado, desplazamiento, navegación 13 → 14 y regreso. Capturas: `tmp/mobile-qa/14-delivery-details.png`, `14-delivery-details-large.png` y `14-delivery-details-keyboard.png`. La revisión final cerró los ajustes de contraste del aviso, separación de 20 dp entre campos, título de 22 sp y recorrido del teclado. Veredicto Impeccable: apta para entregar como pantalla 14 dentro del alcance local actual. Pendientes: lector de pantalla, validación real de campos y aceptación visual del usuario.
