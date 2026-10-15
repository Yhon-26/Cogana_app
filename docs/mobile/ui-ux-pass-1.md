# UI/UX · primera pasada

Fecha: 2026-10-01. Alcance: navegación compartida, Inicio y tarjetas de productos.
Se aplicó Impeccable conservando la paleta, Inter/Fraunces, rutas y decisiones
visuales aprobadas. No se agregaron fotografías ni pantallas nuevas.

## Cambios

- `AppTabBar` concentra medidas y estados de las barras cliente/operación;
  cada una conserva sus destinos e iconos. Etiquetas de 12 dp en flujo normal,
  altura adaptable, respuesta al toque e insets laterales/inferiores.
- Inicio: búsqueda y categorías con objetivos de al menos 48 dp, encabezados
  sin enlaces superpuestos, espacios consistentes y contenido adaptable.
- Catálogo: carga anunciada, acción Reintentar ante error y salida del filtro
  cuando una categoría no contiene productos. Las consultas siguen en servicios.
- Productos: presentación más legible; nombres completos y una columna con
  texto ampliado. Las sugerencias horizontales aumentan su ancho con la escala.
  El botón de añadir solo aparece si existe una acción de añadir; no se ofrece
  un control deshabilitado que sugiera una función pendiente.
- Detalle sin fotografía: Volver conserva sus 48 dp completos y usa contraste
  verde sobre crema. La descripción se omite si está vacía; el incremento
  deshabilitado por falta de stock tiene un estado visual coherente.

## Verificación

`npm run check` pasó sin errores ni advertencias; los archivos modificados
pasaron Prettier. Revisión en Expo Go, emulador Android `emulator-5554`:
Inicio en escala normal y 1.3, navegación a detalle y regreso con Back,
detalle sin foto y carrito vacío. Escala restaurada a 1.0.

Evidencia local: `tmp/mobile-qa/ui-polish/store-normal.png`, `store-large.png`,
`cart-large.png`, `product-final.png` y XML de controles. Las capturas negras
iniciales eran un fallo de renderizado del emulador, también visible en Home;
un reinicio sin borrar datos lo resolvió. No cuentan como evidencia de diseño.

La barra operativa reutiliza el componente verificado, pero no se validó esta
pasada con sesión owner. No se probó el carrito lleno, una compra real ni
TalkBack. La recuperación del catálogo se verificó en código, sin interrumpir
la conexión real para simular un error. Son límites de esta revisión.

## Continuación

Revisar detalle y carrito con contenido largo, formularios y teclado del checkout,
estados de pago y después las vistas de operación. No duplicar las variantes
de entrega/recojo ni cambiar los contratos reales por datos decorativos.
Las fotos faltantes del catálogo requieren activos reales aprobados; esta pasada
no inventa stock, pagos, descuentos ni imágenes para rellenar espacio.

`DESIGN.md` y `PRODUCT.md` contienen límites históricos de autenticación/checkout
que ya fueron superados; para comportamiento actual consultar
`customer-checkout-live.md` y los servicios existentes.
