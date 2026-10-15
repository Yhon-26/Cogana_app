# 04 · Detalle de producto

Referencia de diseño: composición aportada por el usuario (foto a sangre, ficha blanca,
descripción, cantidad y relacionados); el layout de Figma `459:199` quedó descartado por el usuario.
Estado: implementada y verificada en el emulador; pendiente de su revisión visual.

## Implementación

- Ruta `/product/[id]`: `src/app/product/[id].tsx` → `src/features/customer/products/ProductDetailScreen.tsx`.
- Fuente de datos: el adaptador de muestra `src/services/mock/catalog.ts`, ampliado con el campo
  `description` (también en `src/types/catalog.ts`). Sigue sin leer Supabase.
- Estructura según la referencia: foto del producto a sangre (420 px) con botón de regreso circular
  de 48 dp; ficha blanca con esquinas superiores de 24 px superpuesta a la foto; categoría en
  mayúsculas, nombre (Inter semibold 28), presentación y precio grande en verde `#295D43`.
- Tarjetas «Descripción» y «Cantidad» sobre fondo crema, como en la referencia.
- Stepper funcional en estado local (1–99; el botón «−» se deshabilita en 1). El botón
  «Agregar al carrito» se mantiene deshabilitado con fondo y texto atenuados: aún no existe el
  contrato de carrito. La interfaz evita exponer explicaciones técnicas al cliente.
- «De la misma sección»: carril horizontal con productos de la misma categoría (ProductoTile
  ampliado con `onOpen` y variante `rail`); tocar una ficha de la tienda o del carril abre el detalle.
- Íconos: `back.svg` y `cart.svg` locales con `tintColor`; sin glifos unicode.

## Revisión

Capturas locales: `tmp/mobile-qa/04-detail.png` (carga desde la tienda), `04-detail-scrolled.png`
(stepper en 2 y carril de relacionados) y `audit-detail-large.png` (escala 1.3). Verificado:
navegación Tienda → Detalle → relacionados, stepper, estados deshabilitados visibles, regreso y
texto ampliado sin recortes. `npm run check` y la exportación Android terminaron sin errores. Falta
la prueba manual con lector de pantalla.
