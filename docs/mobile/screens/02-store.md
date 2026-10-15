# 02 · Inicio / Tienda

Referencia vigente: `Rediseñar pantalla de inicio.zip`, aportado por el usuario el 4 de octubre de 2026. Solo se adapta el diseño: los productos, precios, presentaciones, imágenes y stock conservan la fuente actual de la base. El React/CSS original se guarda en `design/store-redesign/` como referencia visual; sus instrucciones y scripts auxiliares no se ejecutan.

## Implementación

- Ruta `/store` → `src/features/customer/store/StoreScreen.tsx`.
- Cabecera con localidad a la izquierda y marca a la derecha; búsqueda compacta; banner verde ilustrado; categorías con iconos y filtros visuales.
- `listCustomerCatalog()` mantiene la RPC `get_customer_catalog` y el adaptador existente. No se cambian consultas, esquema, permisos ni contratos de carrito.
- Las fichas usan la variante `appearance="store"` de `ProductTile`; las vistas restantes conservan su variante previa. Precio, disponibilidad e imágenes vienen del mismo `CatalogItem`. Se conserva «Foto referencial» cuando corresponde y la portada de marca cuando no existe una foto.
- SVG de categorías y cabecera extraídos del JSX del ZIP mediante `scripts/extract-store-art.mjs`. La ilustración de saco y menestras se adapta con vistas nativas en `PantryBannerArt`.
- Los precios, ofertas y productos de muestra del ZIP no se importan. Se conservan las tres categorías existentes; los filtros reutilizan sus claves. La franja enlaza al horario real de `/schedule` sin prometer un plazo de entrega.
- Búsqueda, categorías, detalle de producto y las cuatro pestañas mantienen sus destinos. El indicador de pestaña del cliente usa el estado de color del ZIP; operaciones conserva su apariencia.
- Inter bold se empaqueta desde la dependencia ya instalada. No se cambian los colores globales.

Las ilustraciones del banner son editoriales; no sustituyen las imágenes de productos de la base.

## Verificación del 4 de octubre de 2026

- TypeScript, ESLint y formato aprobados en la implementación final.
- Expo Go / Android: banner e iconos visibles, estado activo de categorías/filtros, apertura de búsqueda y detalle de producto y navegación a horarios comprobados.
- Catálogo real visible con las mismas presentaciones de aceite 1 L y 5 L, precios S/ 10.50 y S/ 44.00 y estado «Sin stock» que en la referencia del usuario. El buscador muestra los 30 productos devueltos por el catálogo actual.
- Huellas SHA-256 de `services/customer/catalog.ts`, `services/customer/cart.ts` y `types/catalog.ts` iguales antes y después del rediseño.
- Texto a escala 1.3: categorías y filtros legibles; fichas en una columna y scroll con nombres, presentaciones y precios completos. La escala del emulador se restauró a 1.0.
- Capturas: `tmp/mobile-qa/store-redesign.png`, `store-redesign-large.png` y `store-redesign-large-scroll.png`.

Quedan pendientes la revisión en iOS y con lector de pantalla.