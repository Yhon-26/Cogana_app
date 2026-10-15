# Verificación Android e inventario · 14 de octubre de 2026

## Resultado

El aceite Beltrán de 1 litro ya figura disponible y se agrega al carrito. La causa era una configuración de inventario incompatible con su venta por botella; no era un fallo de conexión ni un lote vencido.

| Dato | Antes | Después |
| --- | --- | --- |
| Unidad base del producto | unidad | unidad |
| Equivalencia de una presentación | 500 unidades | 1 unidad (una botella de 1 L) |
| Existencias sueltas del lote | 500 | 0 |
| Botellas selladas de la presentación | 0 | 500 |
| Disponibilidad devuelta al cliente | 0 | 500 |
| Precio por botella | S/ 7.90 | S/ 7.90 |

El titular confirmó expresamente 500 botellas cerradas de 1 litro a S/ 7.90. Se conservó el lote QA-LOTE-001 y su vencimiento 28/02/2027. Se registró una reclasificación con delta físico neto cero, sin crear otra recepción. La operación se ensayó con rollback, se aplicó en una transacción y se repitió para comprobar que no duplica stock ni movimientos. Resultado: 500 botellas, un ajuste, cero pedidos y cero reservas.

Script de mantenimiento: `database/maintenance/2026-10-14-beltran-stock-reclassification.sql`. Incluye bloqueos y rechaza un estado inicial distinto del inspeccionado. No es una migración de esquema ni se debe generalizar a otros productos.

## Cambios de código relacionados

- Se extrajo `operationInputStyle.ts` para eliminar el ciclo OrderActions → SubstitutionProposal → OrderActions. El aviso se veía sobre los controles inferiores; no volvió a aparecer tras reiniciar Expo Go.
- La lista de inventario operativo ahora cuenta y muestra los envases sellados además de las existencias sueltas. Antes podía mostrar sin stock aunque hubiera paquetes. Esta vista requiere owner/admin y su revisión visual con esa sesión sigue pendiente; el cambio pasó TypeScript y ESLint.
- No se cambió el cálculo público para sumar stock suelto a las presentaciones selladas: las reservas y la preparación necesitan respetar esa separación.

## Recorrido comprobado en el emulador

Entorno: Expo Go, emulator-5554, 1080 × 2424, densidad 420, escala de texto 1.0. Computer Use no tuvo conexión nativa; la revisión se realizó mediante ADB, capturas y UIAutomator. No se alteraron los ajustes de escala ni los permisos del dispositivo.

| Vista o acción | Evidencia observada |
| --- | --- |
| Bienvenida tras arranque en frío | Ilustración, texto y acción Explorar la tienda visibles. |
| Inicio | Cambio de Sin stock a Disponible; botón + activo y confirmación al agregar. |
| Detalle antes de la corrección | Foto, nombre, descripción y precio reales; estado sin stock coherente con la respuesta anterior del servidor. |
| Carrito | Una botella S/ 7.90; incremento a dos botellas S/ 15.80. |
| Reinicio completo de Expo Go | Se recuperaron las dos botellas y el total S/ 15.80 desde almacenamiento nativo. |
| Entrega o recojo | Ambas opciones seleccionables; el texto de Continuar cambia con la modalidad. |
| Entrega | Dos zonas reales con tarifas/mínimos; campos vacíos, desplazamiento y acción de revisión protegida. |
| Entrada de dirección | Foco visible y teclado flotante del emulador; no se introdujo información personal. No equivale a validar un teclado completo en otros dispositivos. |
| Recojo | Yape, Plin y efectivo; contacto, horario y solicitud de ingreso antes de comprar. |
| Horarios | Tienda cerrada, ninguna franja elegible y semana habitual 07:00–20:00. No se abrió la tienda para forzar la prueba. |

Capturas y XML: `tmp/mobile-qa/2026-10-14/`. Las capturas principales son `stock-before.png`, `product-before.png`, `stock-after.png`, `cart.png`, `cart-restored.png`, `delivery.png`, `delivery-keyboard.png`, `pickup.png` y `schedule.png`.

## Hallazgos visuales y límites

- Resuelto: el estado agotado impedía agregar el producto por la clasificación del inventario.
- Resuelto: aviso de dependencia circular sobre la zona inferior.
- Pendiente menor: las acciones +/− del carrito tienen ancho 32 dp, aunque altura 48 dp. Conviene ampliar el área táctil a 48 × 48 dp en una pasada del carrito; su funcionamiento sí se comprobó.
- El nombre de la presentación repite el nombre comercial completo y se abrevia en las tarjetas. Puede simplificarse en el catálogo administrativo a Botella de 1 L, conservando el nombre del producto, cuando se revise su contenido.
- No se validaron TalkBack, texto ampliado, iOS, tablet, sesión operativa, pantallas de un pedido existente ni una compra completa. No se atribuye una puntuación global de accesibilidad o rendimiento a partir de este recorrido parcial.
- El inventario disponible no abre automáticamente la atención: la tienda continúa cerrada y esta sesión es invitada. Faltan apertura operativa, ingreso privado del cliente y prueba real de pedido, pago, preparación y entrega.

TypeScript y ESLint pasaron sin errores ni advertencias después de los cambios. La prueba visual no creó pedidos, cobros ni reservas; las dos botellas del carrito son intención local de compra y no descuentan las 500 físicas.
