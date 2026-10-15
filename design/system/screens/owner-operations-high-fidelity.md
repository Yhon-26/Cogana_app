# Cogana · Operación Owner/Admin · página 66

Revisión visual del 24-09-2026. Archivo Figma `PMCmmZNLY9A8kqcG7IVsHA`,
página `539:6`, «66 · Operación Cogana · Diseño de recorrido». Los 49 marcos
originales de 393 × 852 pt conservan sus IDs. Cada uno muestra una capa nueva
`Cogana · Operación alta fidelidad`; la composición anterior permanece oculta.
El archivo [page66-ui-redesign.js](../page66-ui-redesign.js) reproduce el
contenido, las rutas y los tokens de esta pasada. La [hoja de contacto](../../reviews/page66-ui-v2/overview.png)
permite revisar los 49 marcos juntos.

## Dirección de interfaz

- La operación usa el mismo fondo crema `#FCF9F1`, verde `#295D43`, margen
  lateral de 20 pt, estado de iPhone y ritmo tipográfico que el cliente en la
  página 65. Inter domina los controles y datos; Fraunces aparece solo en la
  marca. Los títulos de contenido no superan 22 pt.
- El panel condensa pedidos, preparación, pagos y la próxima acción. La cola,
  inventario, catálogo, pagos y ajustes usan filas y separadores para leer
  rápido. Fotos de producto identifican artículos concretos; no se repite una
  tarjeta con el mismo radio, borde y sombra en tipos de elemento distintos.
- Las 45 vistas dentro del contexto de tienda muestran la barra inferior de
  cuatro destinos: Inicio, Pedidos, Inventario y Gestión. Acceso, selección de
  tienda, falta de selección y acceso restringido no la muestran porque aún no
  existe un contexto operativo autorizado.
- Ningún texto visible usa `→` ni rótulos de maqueta. Los controles de lectura
  del prototipo usan disolución de 180 ms. Las acciones de guardar, ajustar,
  publicar, proponer y asignar son diseño visual: Figma no ejecuta cambios.

## Cobertura de pantallas

| Marcos | Alcance |
| --- | --- |
| 01–02 | Acceso de equipo y selección de la tienda |
| 03–12 | Panel, cola, preparación, inventario, catálogo, gestión, tienda, pagos, reparto y actividad |
| 13–17 | Contexto y permisos; carga, vacío y sin conexión de pedidos |
| 18–22 | Inventario parcial/vacío y catálogo parcial/sin conexión/carga |
| 23–36 | Carga y sin conexión de tienda, pagos, reparto, actividad, preparación, inventario y panel |
| 37–40 | Lectura parcial, error, datos no vigentes y búsqueda sin coincidencias en pedidos |
| 41–49 | Resultado de preparación, sustitución, movimiento, producto, precio, horarios, zonas, repartidor y revisión de pago |

Los enlaces de navegación conservan los destinos dentro de los mismos 49
marcos. Los estados de carga, desconexión y permisos son variantes de diseño:
su aparición real dependerá de respuestas autorizadas de la aplicación.

## Coherencia de datos entre las páginas 65 y 66

Los valores visibles son **datos ficticios de composición**, no registros
consultados a Supabase. `CG-2846` conserva S/ 24.70 en productos, S/ 5.00 de
entrega y S/ 29.70 total; aparece como pago Yape pendiente tanto para cliente
como para operación. El mínimo de entrega diseñado para Santa Anita es S/ 20,
por lo que ese pedido puede seguir el recorrido. La tarifa es S/ 5.00.

`CG-2847` representa un recojo de dos productos con pago confirmado y
preparación a las 16:00. `CG-2848` representa un pedido listo para asignación
de reparto. Los precios de arroz superior 5 kg (S/ 19.50), lenteja 500 g
(S/ 5.20) y frijol canario 500 g (S/ 6.50) coinciden con la semilla inicial
del catálogo. Personal, lotes, movimientos, horarios y zonas son ejemplos
coherentes para definir la interfaz; no se copian como datos de producción.

Pedido, pago y reparto mantienen estados separados. Las vistas de lectura
parcial, error y datos caducos no presentan cero ni habilitan mutaciones como
resultado de una consulta fallida. La implementación exige verificación de
membresía owner/admin activa en la tienda y operaciones transaccionales para
preparación, inventario, precio, asignación y pagos. El contrato de datos
detallado sigue en [owner-operations-flow.md](owner-operations-flow.md).

## Comprobación de esta pasada

Se comprobaron las 49 composiciones en una hoja de contacto y varias pantallas
clave a tamaño de móvil. La inspección estructural halló 49 capas nuevas, una
sola capa visible por marco, 180 pestañas de navegación, 279 enlaces,
ningún destino de enlace fuera de la página, ningún objetivo enlazado menor
de 44 pt, ningún texto fuera del marco y ningún texto con `→` ni rótulos de
maqueta. La tipografía visible usa Inter y Fraunces según el sistema.

Antes del handoff de aplicación quedan la aprobación visual, fotografías
autorizadas, contratos del servidor, estados de guardado/error de operaciones
y pruebas reales de foco, lector de pantalla, texto ampliado y movimiento
reducido. La barra y los enlaces de Figma permiten revisar rutas; no hacen
funcionales los formularios ni las mutaciones.
