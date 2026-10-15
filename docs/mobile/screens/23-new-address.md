# 23 · Nueva dirección

Referencia: [Figma `529:53`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=529-53),
página 65, sin fotografía decorativa. Estado: implementada y verificada en el emulador;
pendiente de su revisión visual.

## Implementación

- Ruta `/address/new`: `src/app/address/new.tsx` → `src/features/customer/addresses/NewAddressScreen.tsx`.
- Formulario plano con etiquetas mayúsculas (ETIQUETA, DIRECCIÓN, DISTRITO, REFERENCIA (OPCIONAL)),
  estándar de la regla 4 de consistencia. Campos en estado local de la pantalla.
- Casilla «Usar como principal» dibujada y funcional (estado local); sin glifos.
- «Guardar dirección» deshabilitado con nota honesta: las direcciones pertenecen a una cuenta
  de cliente; se activará con el contrato de identidad.
- El top bar usa el nombre del padre («Direcciones»), como en el prototipo y la regla de títulos
  para pantallas de formulario dentro de una pila.

## Revisión

Capturas: `tmp/mobile-qa/23-new-address.png` y `23-checkbox.png` (casilla marcada).
`npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla, aprobación del
usuario y el contrato real de guardado.
