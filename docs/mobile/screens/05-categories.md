# 05 · Categorías

Referencia: composición aportada por el usuario (listado plano); las fotografías de la
propuesta anterior se retiraron porque en una pantalla de categorías son relleno.
Estado: implementada y verificada en el emulador; pendiente de su revisión visual.

## Implementación

- Ruta de pestaña `/categories`: `src/app/(customer)/categories.tsx` → `src/features/customer/categories/CategoriesScreen.tsx`.
- La versión anterior era una vista de preparación; se reemplazó por la pantalla real.
- Encabezado igual al de la tienda (marca Fraunces + localidad sin selector, según decisión previa).
- Sin fotografías: título, subtítulo y una tarjeta única con el listado de categorías.
- Filas: nombre, descripción y chevron dibujado (sin glifos). Solo «Arroces» y «Menestras y granos»
  navegan, porque son las categorías con productos en el catálogo de muestra; navegan a `/store`
  pre-filtrada con el parámetro `categoria`. «Aceites», «Pastas» y «Azúcar y endulzantes» se
  muestran sin chevron para no prometer una navegación vacía.
- `StoreScreen` aplica el pre-filtro ajustando su estado durante el render (patrón sin effects,
  exigido por `react-hooks/set-state-in-effect`).

## Revisión

Capturas locales: `tmp/mobile-qa/05-categories.png` (listado) y `05-store-filtered.png`
(tienda con el chip Arroces activo y solo los dos arroces). `npm.cmd run check` sin errores.
La captura `audit-categories-large.png` verifica la escala de texto 1.3 sin recortes. Pendiente:
lector de pantalla y aprobación del usuario.
