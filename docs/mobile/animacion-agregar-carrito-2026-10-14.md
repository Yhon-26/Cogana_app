# Animación de agregar al carrito · 14/10/2026

Se adaptó únicamente la interacción del carrito del ZIP «Mejorar animación de agregar al carrito.zip» (`src/App.tsx` y sus estilos). No se ejecutaron sus scripts ni se incorporaron su catálogo de muestra, botella ilustrada, horarios o cambios generales de diseño.

## Comportamiento en Inicio

- La consulta y modificación reales del carrito terminan antes de confirmar éxito.
- La foto del producto hace un leve movimiento y una miniatura viaja al icono del carrito durante 760 ms. La miniatura espera a que la imagen esté lista para evitar una tarjeta vacía.
- El botón muestra una marca de confirmación temporal y el carrito responde con rebote/anillo de 600 ms.
- El indicador numérico procede del carrito real: cuenta unidades de presentaciones y una línea por solicitud a granel. Se muestra 99+ para cantidades mayores.
- La confirmación se superpone encima de la navegación inferior, sin ocupar espacio ni desplazar los productos. Usa «Producto agregado», precio por unidad, «Ver carrito», cierre y una duración de 3.6 s con salida breve.
- Los toques repetidos durante la incorporación/confirmación no agregan más unidades ni abren el detalle de producto accidentalmente.
- Con movimiento reducido se omiten el vuelo, la elevación del producto y el rebote; se conserva una confirmación breve y el anuncio de accesibilidad.
- Los fallos conservan su mensaje real; no se muestra confirmación de éxito si el carrito no aceptó la incorporación.

Se conservaron las fotos, precios, stock, fichas, navegación y servicios actuales. Operaciones mantiene su barra anterior; AppTabBar solo ofrece una extensión opcional para dibujar el icono del cliente.

## Verificación

TypeScript y ESLint pasaron sin errores ni advertencias. Prueba en Expo Go, emulator-5554, 1080 × 2424, escala de texto 1.0:

- Vuelo con foto real, marca de confirmación, rebote y aviso inferior observados en video.
- Tres toques rápidos: contador 6 → 7, permaneciendo en Inicio.
- Cierre automático del aviso comprobado.
- «Ver carrito» abre el carrito con las cantidades e importes reales.
- Movimiento reducido comprobado con `transition_animation_scale=0`, que es el ajuste observado por AccessibilityInfo en esta versión. El aviso se conserva sin vuelo. Se restauró el valor original 1.0. El ajuste animator_duration_scale conserva su estado original sin valor explícito.
- Se retiraron las unidades incorporadas exclusivamente por estas pruebas: carrito final 4 botellas, S/ 31.60, igual a la cantidad observada al iniciar este trabajo. No se creó un pedido ni se registró un pago.

Evidencia local: `tmp/mobile-qa/cart-animation/cart-animation-final.mp4`, `sequence-final.png`, `toast-final.png`, `reduced-motion-verified.mp4`, `reduced-motion-verified.png` y `cart-restored.xml`.

Alcance visual: Inicio y navegación al carrito. No equivale a validar TalkBack, texto ampliado, tablet o iOS. La animación de las pantallas de detalle/checkout no se modificó.
