# 25 · Tus preferencias

Referencia: [Figma `534:35`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=534-35),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/preferences`: `src/app/preferences.tsx` → `src/features/customer/account/PreferencesScreen.tsx`.
- Los cuatro ajustes (Avisos de pedido, Ofertas, Permiso comercial, Sustituciones) muestran el
  chip «POR CARGAR»: sin cuenta no hay valores que mostrar, y dibujar interruptores activos
  sería inventar estado.
- «Guardar cambios» deshabilitado con nota honesta; se activará con el contrato de identidad.
- Barra superior con regreso («Más»), igual que sus hermanas.

## Revisión

Captura: `tmp/mobile-qa/25-preferences.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla y aprobación del usuario.
