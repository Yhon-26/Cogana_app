# Catálogo inicial de Cogana

Fecha de la fotografía: 18 de septiembre de 2026  
Tienda: `Cogana Santa Anita`  
Archivo de carga: `seeds/20260918_initial_catalog_snapshot.sql`

## Estado cargado

- 11 categorías.
- 24 productos.
- 30 presentaciones.
- 30 precios iniciales expresados en céntimos de sol.
- 0 lotes y 0 existencias: la lista recibida no incluía cantidades, fechas de
  vencimiento ni códigos de lote.
- 0 imágenes: se incorporarán cuando exista material aprobado por producto.

## Criterios provisionales

- Los textos con varias marcas separadas por `/` se guardaron como marca
  referencial del producto genérico. Si cada marca llega a tener precio, stock o
  presentación propios, se separará en productos distintos.
- Todas las presentaciones recibidas son cerradas y de precio fijo.
- Los pesos se guardan en gramos, los aceites en mililitros y el consomé por
  número de cubos.
- Los SKU con prefijo `COG-` son identificadores internos estables para que una
  nueva carga actualice los registros existentes sin duplicarlos.

## Cambios futuros

Actualizar una presentación modifica su precio actual y crea automáticamente
una fila en `product_price_history` con precio anterior, precio nuevo, fecha y
usuario responsable. Repetir la carga sin cambios no duplica productos,
presentaciones ni historial.

Eliminar un producto de una fotografía futura no lo borra automáticamente. Se
debe desactivar de forma explícita para no perder referencias históricas de
pedidos o movimientos.
