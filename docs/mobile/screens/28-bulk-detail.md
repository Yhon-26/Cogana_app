# 28 · Lenteja a granel (compra por peso o monto)

Referencia: [Figma `624:6`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=624-6),
página 65. Es una **variante del detalle de producto** (misma ruta y composición de la 04,
con foto a sangre según la referencia del usuario). Estado: implementada y verificada en el
emulador; pendiente de su revisión visual.

## Implementación

- El catálogo de muestra incluye `preview-lentils-bulk` con `soldByWeight: true` y
  `pricePerKgCents: 1040` (S/ 10.40 por kilo, coherente con la bolsa de 500 g a S/ 5.20).
- `ProductDetailScreen` renderiza la variante cuando el producto se vende por peso:
  subtítulo «Elige peso o monto», precio con sufijo «por kilo», tarjetas selector
  «Por peso» / «Por monto» con ejemplos, campo numérico cuyo label cambia con el modo
  y estimado en vivo («≈ S/ 5.20» para 500 g; «≈ 481 g» para S/ 5). Cambiar de modo
  limpia el valor (unidades distintas).
- Nota «Granel y stock por confirmar» y CTA deshabilitado con la misma nota honesta del carrito.
- Acceso: búsqueda «lenteja» (2 resultados) y categoría Menestras y granos.

## Revisión

Capturas: `tmp/mobile-qa/28-search.png`, `28-bulk.png`, `28-bulk-estimate.png` y
`28-bulk-amount.png`. Verificados ambos modos con cálculo correcto. `npm.cmd run check`
sin errores. Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y el
contrato de carrito para granel.
