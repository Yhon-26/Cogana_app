# Cogana · Reglas de consistencia de la página 65

Actualizadas el 24-09-2026 para las 35 pantallas visibles de `429:2` en el
archivo Figma `PMCmmZNLY9A8kqcG7IVsHA`. La especificación del flujo está en
`screens/customer-purchase-entry-flow.md`.

## Jerarquía

- Barra superior compacta de Inter Semi Bold 17 pt, con el nombre de la
  pantalla. Un solo titular de contenido de hasta 22 pt. Fraunces Bold queda
  para la marca y la bienvenida; no se repite en cada sección.
- El orden comercial es fotografía, nombre, presentación, precio y acción.
  El precio por presentación no se confunde con precio por kg, costo de
  entrega ni total.
- Texto de pantalla breve y útil. Los contratos, advertencias de datos y
  decisiones de producto viven en Markdown, no como rótulos de maqueta.

## Componentes y superficies

- Las fotos de producto tienen recorte consistente, bordes suaves y no
  comparten un cascarón de tarjeta con los formularios o con el resumen.
- Los listados de cuenta, privacidad y resumen usan filas y separadores;
  los medios de pago usan opciones seleccionables; los campos usan línea
  inferior; la acción principal usa un botón verde sólido. Sin sombras
  decorativas ni un radio, borde y sombra idénticos entre tipos distintos
  de elemento en una misma pantalla.
- Las opciones repetidas del mismo componente, como los seis dígitos OTP,
  sí comparten patrón. Los estados seleccionados se expresan con texto y
  contraste además del color.
- Ningún texto de botón o enlace termina en `→`. La importancia se expresa
  con peso, tamaño y color. Chevron de navegación y flecha de volver son
  iconos, no sufijos de copy.

## Medidas y navegación

- Fondo `#FCF9F1`, verde `#295D43`, margen lateral 20 pt, marco 393 × 852 pt.
- Objetivos enlazados mínimos de 44 × 44 pt. Píldoras de filtro: 44 pt de
  alto. Botones principales: 52 pt. Pestañas: 89 × 57 pt.
- La pestaña activa corresponde a la sección raíz. Desde descubrimiento,
  Carrito abre el estado vacío; tras agregar un producto, la ruta muestra
  el carrito con artículos. Ese cambio de estado todavía no persiste datos.
- El prototipo usa disolución de 180 ms. En código se debe respetar la
  preferencia de movimiento reducido y devolver foco al título al navegar.

## Contenido y privacidad

- Arroz, lenteja y frijol conservan los formatos y precios del catálogo
  inicial. Tarifas, horarios, direcciones, identidades, avisos y pedidos de
  estas pantallas son datos ficticios de diseño, documentados fuera del lienzo.
- Los teléfonos se enmascaran en confirmación y cuenta. No se exponen
  referencias de pago, códigos de recojo, hashes, evidencia ni datos de
  personal. Pedido, pago y entrega se presentan como estados separados.
- La fotografía actual es conceptual. Debe cambiarse por imágenes
  autorizadas antes del handoff final.

## Auditoría de la pasada

La capa visible de cada una de las 35 pantallas fue revisada a tamaño
393 × 852 pt. El recorrido desde 01 alcanza las 35. Se comprobaron 126
enlaces, ningún texto visible con `→`, ningún texto fuera del marco y ningún
objetivo enlazado menor de 44 pt. La única repetición de radio, borde y
sombra dentro de una pantalla corresponde a las seis casillas del mismo
campo OTP.
