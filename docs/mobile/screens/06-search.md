# 06 · Buscar productos

Referencia: Figma `486:7` (página 65), integrada al flujo real: los resultados abren el
detalle de producto en lugar del enlace muerto del prototipo. Estado: implementada y
verificada en el emulador; pendiente de su revisión visual.

## Implementación

- Ruta `/search` (fuera del grupo de pestañas): `src/app/search.tsx` →
  `src/features/customer/search/SearchScreen.tsx`; textos en `searchContent.ts`.
- El campo de la Tienda ya no filtra en línea: al tocarlo abre esta pantalla (misma
  apariencia, ahora `Pressable`). Los chips de categoría siguen filtrando en la tienda.
- Búsqueda en vivo sobre el catálogo de muestra por nombre y presentación (es-PE);
  sin consulta vacía muestra todo el catálogo con su contador.
- Filas con foto, nombre, presentación y precio en verde; chevron dibujado; cada fila
  abre `/product/[id]`. Los nombres admiten dos líneas para respetar el escalado del sistema.
  Botón de borrado dibujado (dos barras), sin glifos.
- Estado vacío honesto: «No encontramos "…". Prueba con arroz, lenteja o frijol.»

## Revisión

Capturas locales: `06-search.png` (catálogo completo con teclado), `06-search-results.png`
(filtro en vivo «lenteja» → 1 producto), `06-search-to-detail.png` (resultado abre Lenteja)
y `06-search-empty.png` (sin resultados). Verificados también el borrado y el regreso.
`audit-search-large.png` verifica la escala 1.3; los resultados conservan nombre, presentación,
precio y objetivo táctil. `npm.cmd run check` sin errores. Pendiente: lector de pantalla y
aprobación del usuario. La nota de disponibilidad del prototipo se omitió a propósito:
el estado real ya se comunica con el «+» deshabilitado de las fichas.
