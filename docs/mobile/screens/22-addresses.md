# 22 · Mis direcciones

Referencia: [Figma `529:35`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=529-35),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/addresses`: `src/app/addresses.tsx` → `src/features/customer/addresses/AddressesScreen.tsx`.
- Estado vacío real: sin cuenta de cliente no hay direcciones; la tarjeta usa el chip
  «ACCESO PENDIENTE» (`surfaceSuccess`). «Nueva dirección» abre `/address/new`.
- Acceso: fila «Mis direcciones» de la pestaña Cuenta (21), que ahora sí tiene chevron.

## Revisión

Captura: `tmp/mobile-qa/22-addresses.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el servicio real.
