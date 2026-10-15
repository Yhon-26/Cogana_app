# Detalle: compra flotante y fotografía · 14/10/2026

Referencia: imágenes aportadas por el usuario en este chat. Se adaptaron la posición de la foto y la barra inferior; se conservaron producto, precio, stock, descripción y servicios reales.

- Selector de cantidad y acción Agregar al carrito fuera del contenido desplazable, en una tarjeta inferior flotante con sombra y esquinas redondeadas.
- Separación de la barra de gestos mediante insets reales. El contenido reserva la altura medida de la barra para que pueda leerse completo al desplazarse.
- Controles táctiles de 48 dp; mínimo/máximo de cantidad y bloqueo durante incorporación conservados.
- Con texto ampliado o ancho reducido, el selector y la acción se colocan en dos filas sin truncar sus etiquetas.
- La foto usa ajuste contain, altura proporcional limitada a 270 dp y espacio por debajo del área de estado/cámara. Las tarjetas del catálogo mantienen su ajuste anterior.
- El modo de compra por peso/monto conserva el formulario y utiliza la misma barra para guardar la cantidad; el aviso de resultado se muestra en texto pequeño dentro de la barra.

Validación: TypeScript y ESLint pasaron. Expo Go en emulator-5554, 1080 × 2424, densidad 420. Se inspeccionaron escala 1.0, escala 1.3 y desplazamiento. En 1.3 la barra sigue completa y fija; la descripción puede desplazarse por encima. Se agregó una selección de dos botellas y se verificaron dos unidades por S/ 15.80 en el carrito. Se retiraron las dos unidades de prueba; el carrito quedó vacío. No se creó un pedido ni se registró un pago. Se restauró font_scale=1.0.

Evidencia: tmp/mobile-qa/product-dock/normal.png, large.png, large-scrolled.png, added.png, cart-verified.xml y cart-clean.xml. Los primeros intentos de cambio de escala capturaron la bienvenida al recrearse Expo Go; no cuentan como verificación del detalle. Las capturas finales large/large-scrolled sí corresponden a la pantalla objetivo.

Límites: no hay un producto activo a granel ni uno sin stock para una revisión nativa de esas variantes; no se modificó inventario para simularlos. iOS, tablet, teclado para granel y TalkBack no se probaron.
