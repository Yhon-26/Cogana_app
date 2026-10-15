# Cogana · Recorrido de compra del cliente · página 65

Archivo Figma `PMCmmZNLY9A8kqcG7IVsHA`, página `429:2`. Revisión de alta
fidelidad del 24-09-2026. Las 35 pantallas miden 393 × 852 pt y conservan sus
IDs de marco para el prototipo. El diseño anterior permanece como contenido
oculto dentro de cada marco; la capa visible se llama `Cogana · Alta fidelidad
v2`. El archivo [page65-ui-redesign.js](../page65-ui-redesign.js) documenta la
composición reproducible, las rutas y el contenido de referencia.

## Alcance y lectura correcta

Esta pasada fija la composición visual y la secuencia de decisiones para
iniciar la implementación de interfaces. Precios y formatos de arroz, lenteja
y frijol proceden de la semilla inicial del catálogo. Ana Torres, las
direcciones, `CG-2846`, los avisos, el horario, la tarifa de S/ 5.00, la
alternativa a granel y los estados de pago/pedido son datos **ficticios de
diseño**. En las pantallas se muestran como contenido natural de una app; no
son registros leídos ni acciones ejecutadas. Las fotografías son conceptos
visuales, no imágenes autorizadas de los productos publicados.

Los enlaces de Figma navegan entre marcos. Los campos, interruptores,
cantidades, compra, pago y eliminación no escriben datos ni ejecutan
operaciones. El código debe recibir valores y permisos del servidor; no debe
copiar los datos ficticios como constantes de producción.

## Sistema visual de esta pasada

- Fondo `#FCF9F1`, verde `#295D43`, texto principal `#1B241E`, texto
  secundario `#5F6B63`, bordes `#E4DED2`. Inter para operación; Fraunces Bold
  solo en marca y bienvenida. Los títulos de flujo se redujeron a 22 pt o
  menos y las barras superiores a 17 pt.
- La fotografía identifica el producto. La ficha muestra nombre,
  presentación y precio sin una tarjeta envolvente. En checkout predominan
  líneas y filas planas; opciones seleccionadas usan verde pálido. La acción
  principal usa bloque verde de 52 pt. No hay sombras decorativas.
- Ninguna pantalla combina el mismo radio, borde y sombra en tipos de
  elemento distintos. Seis casillas de un mismo campo OTP comparten estilo
  intencionalmente. Los botones y enlaces no usan el carácter `→`.
- Márgenes laterales de 20 pt, encabezado compacto y zonas seguras de iPhone
  16. Objetivos enlazados de al menos 44 pt; la navegación inferior tiene
  objetivos de 89 × 57 pt. Mantener foco visible, orden de lectura, texto
  ampliado y alternativa de movimiento reducido al implementar.

## Mapa de las 35 pantallas

| Nº | Marco | Contenido principal | Continuación |
| ---: | --- | --- | --- |
| 01 | `459:196` | Bienvenida editorial | Tienda o acceso |
| 02 | `459:197` | Tienda, búsqueda, categorías, dos productos | Descubrimiento, carrito vacío, cuenta |
| 03 | `687:48` | Celular para entrar | Código o invitado |
| 04 | `459:199` | Arroz superior, dos presentaciones | Carrito con productos |
| 05 | `486:6` | Categorías y familias | Búsqueda o menestras |
| 06 | `486:7` | Dos resultados de arroz | Fichas de arroz |
| 07 | `488:57` | Lenteja en bolsa y acceso a granel | Granel o carrito |
| 08 | `486:9` | Carrito vacío | Tienda o categorías |
| 09 | `491:40` | Arroz extra 1 kg | Carrito |
| 10 | `492:6` | Lenteja y frijol canario | Fichas |
| 11 | `492:2036` | Frijol canario 500 g | Carrito |
| 12 | `500:6` | Dos artículos, cantidad, subtotal y sugerencia | Entrega o recojo |
| 13 | `500:7` | Elección de domicilio o recojo | Ruta elegida |
| 14 | `500:8` | Dirección, referencia, horario, contacto | Horario o revisión |
| 15 | `500:9` | Revisión de entrega y total S/ 29.70 | Medio de pago |
| 16 | `505:6` | Punto y horario de recojo | Revisión |
| 17 | `505:38` | Revisión de recojo y total S/ 24.70 | Medio de pago |
| 18 | `518:6` | Yape y Plin para entrega | Estado de pago |
| 19 | `518:34` | Yape, Plin y efectivo para recojo | Estado de pago |
| 20 | `520:8` | Pedido actual e historial | Seguimiento |
| 21 | `529:6` | Cuenta de Ana, accesos frecuentes | Pedidos, direcciones, ajustes |
| 22 | `529:35` | Casa y trabajo | Nueva dirección |
| 23 | `529:53` | Formulario de dirección | Direcciones |
| 24 | `534:6` | Ajustes de cuenta | Preferencias, avisos, privacidad |
| 25 | `534:35` | Preferencias con estados visibles | Cuenta |
| 26 | `534:68` | Tres avisos de compra | Pedidos |
| 27 | `534:86` | Datos, direcciones y eliminación | Cuenta |
| 28 | `624:6` | Lenteja por peso o monto | Carrito |
| 29 | `625:39` | Fecha y franjas de entrega | Datos de entrega |
| 30 | `632:34` | Pago que requiere consulta | Consultar o cambiar método |
| 31 | `632:62` | Pedido recibido, pago separado | Seguimiento |
| 32 | `637:6` | Línea de estado y resumen | Sustitución |
| 33 | `637:62` | Comparación y respuesta a cambio | Seguimiento |
| 34 | `719:148` | Código de seis dígitos | Nombre |
| 35 | `702:23` | Nombre, apellido y celular verificado | Cuenta |

Desde 01 se llega a los 35 marcos. La pestaña Carrito de las pantallas de
descubrimiento lleva a 08; agregar un producto abre 12. Este salto demuestra
dos estados del carrito y no persiste un artículo. Hay 126 enlaces en la nueva
capa visible; la transición propuesta es disolución de 180 ms y debe omitirse
cuando el sistema pide reducir movimiento.

## Datos y contratos para implementación

La semilla `database/seeds/20260918_initial_catalog_snapshot.sql` respalda
arroz superior 5 kg S/ 19.50 y 50 kg S/ 185.00, arroz extra 1 kg S/ 4.20,
lenteja 500 g S/ 5.20 y 5 kg S/ 48.00, y frijol canario 500 g S/ 6.50. Los
totales del prototipo son aritméticos: S/ 24.70 en productos, S/ 29.70 con
una tarifa ficticia de S/ 5.00 para domicilio y S/ 24.70 para recojo.

La app debe consultar publicación, precio vigente, existencias, cobertura,
tarifa y capacidad antes de habilitar compra. Para granel faltan contrato de
unidad, precisión, redondeo, mínimo, máximo y peso final. Para horarios
faltan excepciones, zona horaria y reserva de capacidad. El checkout requiere
creación transaccional e idempotente, y estado de pedido separado del pago.
Yape/Plin requieren intento y resultado verificables; efectivo solo se ofrece
en recojo. Una respuesta pendiente nunca se presenta como pago confirmado.

Celular y OTP son el recorrido visual elegido; proveedor, protección contra
abuso, reenvío, caducidad y recuperación deben cerrarse antes de activarlo.
Direcciones, pedidos, preferencias, notificaciones y privacidad necesitan
lecturas y escrituras autorizadas del propio cliente. Eliminar cuenta exige
verificación y manejo de pedidos en curso. No mostrar códigos de confirmación,
hashes, referencias de pago, datos de personal ni evidencias privadas.

## Validación de diseño

Se revisaron las 35 capturas a 393 × 852 pt y el recorrido completo en una
hoja de contacto. La lectura estructural encontró 35 capas visibles, 126
enlaces, 35 pantallas alcanzables desde 01, cero etiquetas con `→`, cero
textos fuera del marco y cero destinos táctiles menores de 44 pt. Se corrigió
el titular de bienvenida y se retiraron las etiquetas de estado de maqueta.

Quedan antes de declarar handoff final: aprobación visual del usuario,
fotografía autorizada del catálogo, definición de los contratos anteriores,
variantes de carga/error y prueba de foco, lector de pantalla y texto
ampliado. El diseño ya da una referencia concreta para construir la UI;
los registros y operaciones mostrados no están implementados.
