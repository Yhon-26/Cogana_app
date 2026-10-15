# Cogana · Cierre de UI/UX antes del handoff

Actualizado el 24-09-2026. Archivo Figma `PMCmmZNLY9A8kqcG7IVsHA`.
Inventario: `screen-closure-inventory.md`.

## Estado de los recorridos

| Recorrido | Página | Marcos 393 × 852 pt | Estado |
| --- | --- | ---: | --- |
| Cliente | `429:2`, «65 · Compra Cogana · Diseño de recorrido» | 35 | Nueva pasada de alta fidelidad y prototipo visual completo, en revisión |
| Owner/Admin | `539:6`, «66 · Operación Cogana · Diseño de recorrido» | 49 | Nueva pasada de alta fidelidad y navegación visual, en revisión |
| Total | | 84 | Cobertura visual base, no aprobación de producto |

La página 65 conserva los 35 IDs de marco y muestra una nueva capa visible
`Cogana · Alta fidelidad v2` en cada uno. La bienvenida, descubrimiento,
producto, carrito, entrega/recojo, pago, pedidos, cuenta y acceso quedaron
conectados. Se revisaron 35 capturas y 126 enlaces; desde la bienvenida se
alcanza cada pantalla. Detalle y decisiones del cliente:
`screens/customer-purchase-entry-flow.md`. Reglas visuales:
`consistency-rules.md`. La página 66 conserva los 49 IDs de marco y muestra
una nueva capa `Cogana · Operación alta fidelidad` en cada uno. Su referencia
visual está en `screens/owner-operations-high-fidelity.md`; los contratos de
datos siguen en `screens/owner-operations-flow.md`.

## Próximo trabajo de producto y aplicación

1. Revisar visualmente las 84 pantallas con el usuario y ajustar lo que
   indique. El diseño actual no se declara aprobado por su sola existencia.
2. Sustituir fotografías conceptuales por fotos autorizadas de los productos
   y presentaciones reales; comprobar recortes y consistencia de la grilla.
3. Cerrar los contratos de identidad por celular/OTP, catálogo publicado,
   inventario, granel, cobertura, tarifa, horarios, carrito, checkout,
   proveedores de pago, pedidos, sustituciones, direcciones, preferencias,
   notificaciones y eliminación de cuenta.
4. Diseñar y verificar variantes de carga, vacío confirmado, lectura parcial,
   error, sin conexión, permiso denegado, operación en curso, éxito y fallo
   según cada flujo. No se añaden todas a todas las pantallas por cuota.
5. Probar en la app foco, lector de pantalla, texto ampliado, contraste,
   objetivos táctiles, teclado, formularios y movimiento reducido. El
   prototipo de Figma no reemplaza esas pruebas.
6. Después de la aprobación visual y los contratos, preparar el handoff:
   exportación de tokens, especificaciones de componentes/estados, redlines,
   imágenes aprobadas y mapeo a React Native.

## Reglas de contenido y seguridad

La interfaz de cliente muestra datos ficticios de diseño como si fueran
contenido normal de una app, sin rótulos de maqueta. El archivo Markdown
identifica qué valores son ficticios. No deben copiarse a producción como
stock, pedidos, pagos, direcciones, disponibilidad, promociones ni horarios
reales. Las acciones de compra, pago, inventario y sustitución requieren
operaciones autorizadas, transaccionales e idempotentes en servidor.

Pedido, pago y entrega tienen estados separados. No mostrar en el prototipo
códigos de confirmación, hashes, referencias de pago, evidencia privada ni
datos de personal. La consola Owner/Admin exige membresía activa owner/admin
por tienda; ser miembro de tienda no basta. La exploración Owner/Admin
rechazada `414:2` permanece fuera de la referencia final.

## Límite del estado actual

Las páginas 65 y 66 son referencias visuales concretas para empezar a construir
la UI. Sus formularios y enlaces son visuales; ningún cobro, pedido, reserva,
lectura de cuenta o cambio de inventario ocurrió en Figma. El cierre final
para React Native depende de revisión visual, datos y fotos autorizados,
contratos de servidor, variantes aplicables y accesibilidad comprobada.
