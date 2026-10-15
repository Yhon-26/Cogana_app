# 33 · Responder sustitución

Referencia: [Figma `637:62`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=637-62),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/substitution`: `src/app/substitution.tsx` → `src/features/customer/checkout/SubstitutionScreen.tsx`.
- Eyebrow en línea «EJEMPLO VISUAL · CAMBIO», tarjetas «Tu producto · Original» y
  «Alternativa · Pendiente» (sin producto propuesto), campo «PLAZO DE RESPUESTA · Por confirmar».
- Nota «Sin propuesta real para responder» y CTA «Responder no disponible» deshabilitado.
- Llegada: enlace de ejemplo desde la 32 (la real llegará con el flujo de sustituciones del
  servidor, ya probado en base con `order_substitutions`).

## Revisión

Captura: `tmp/mobile-qa/33-substitution.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el contrato de sustituciones.
