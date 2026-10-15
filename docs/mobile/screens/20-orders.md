# 20 · Mis pedidos

Referencia: [Figma `520:8`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=520-8),
página 65, sin la fotografía decorativa (criterio del usuario para esta base).
Estado: implementada y verificada en el emulador; pendiente de su revisión visual.

## Implementación

- Ruta `/orders` (fuera de pestañas): `src/app/orders.tsx` → `src/features/customer/orders/OrdersScreen.tsx`.
- Estado vacío real: no hay pedidos ni simulados; mostrar uno inventado contradiría el contrato.
  La tarjeta usa el chip «SIN COMPRAS» con el tono `surfaceSuccess` (#EFF5EE), agregado a tokens.
- «Explorar la tienda» abre `/store`. Título según la regla de top bar (nombre de la propia pantalla).
- Se accede desde la pestaña Cuenta (21 · Tu espacio).

## Revisión

Captura: `tmp/mobile-qa/20-orders.png`. `npm.cmd run check` sin errores; tipos de ruta regenerados.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el servicio de pedidos real.
