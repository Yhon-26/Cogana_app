# 21 · Tu espacio (pestaña Cuenta)

Referencia: [Figma `529:6`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=529-6),
página 65, sin la fotografía decorativa y con ajustes de honestidad.
Estado: implementada y verificada en el emulador; pendiente de su revisión visual.

## Implementación

- Ruta de pestaña `/account`: `src/app/(customer)/account.tsx` → `src/features/customer/account/AccountScreen.tsx`
  (reemplaza la vista de preparación; conserva el mismo nombre de componente).
- Sin fotografía. Título Fraunces «Tu espacio», tarjeta de invitado y sección «Tu actividad».
- «Mis pedidos» navega a `/orders`; «Mis direcciones» se muestra **sin chevron** porque su
  pantalla (23/22) aún no existe. El botón verde «Más de tu cuenta» de Figma se omite hasta
  construir su destino (24); el «Acceso de equipo» del prototipo anterior se conserva como
  enlace discreto al pie (es la entrada validada del owner a `/operations`).

## Revisión

Captura: `tmp/mobile-qa/21-account.png`. `npm.cmd run check` sin errores.
Pendiente: escala 1.3, lector de pantalla y aprobación del usuario.
