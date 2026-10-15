# 27 · Privacidad y cuenta

Referencia: [Figma `534:86`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=534-86),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/privacy`: `src/app/privacy.tsx` → `src/features/customer/account/PrivacyScreen.tsx`.
- «Eliminar mi cuenta» usa el rojo de peligro `#A63D2F` (nuevo token `danger`), según la regla
  de acciones destructivas; chip «NO DISPONIBLE» y botón «Solicitar eliminación» deshabilitado
  hasta el contrato de identidad.
- Barra superior con regreso («Más»).

## Revisión

Captura: `tmp/mobile-qa/27-privacy.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el contrato de identidad.
