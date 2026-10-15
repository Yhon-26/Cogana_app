# Figma conectado

Verificado por el conector Figma el 24/09/2026 y consultado de nuevo durante la implementaciÃ³n hasta las pantallas 18 y 19, el 26/09/2026, sin modificar el archivo.

- Archivo: https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana
- PÃ¡gina 65, clientes: https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=429-2
- PÃ¡gina 66, operaciones: https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=539-6

Inventario completo en `figma-inventory.json`: 35 vistas cliente y 49 de operaciones.
La vista 03 de cliente es un COMPONENT (`687:48`), por eso contar solo FRAME devuelve 34.
No debe cambiarse el ledger previo de diseÃ±o para marcar estas vistas como implementadas.

## RelaciÃ³n inicial

| Ruta base | Feature | Referencia para la implementaciÃ³n futura |
| --- | --- | --- |
| `/` | customer/welcome | Bienvenida `459:196` Â· implementada y aceptada por el usuario |
| `/store` | customer/store | Tienda `459:197` Â· implementada y aceptada por el usuario |
| `/categories` | customer/products | CategorÃ­as `486:6` |
| `/cart` | customer/cart | Carrito vacÃ­o `486:9`, carrito `500:6` Â· vista con productos de muestra implementada |
| `/fulfillment` | customer/checkout | Entrega o recojo `500:7` Â· implementada sin fotografÃ­a decorativa |
| `/delivery-details` | customer/checkout | Datos de entrega `500:8` Â· formulario local implementado |
| `/order-review` | customer/checkout | Revisar pedido `500:9` Â· adaptada a la referencia aportada por el usuario |
| `/account` | customer/account | Cuenta invitada `529:6`, acceso `687:48` |
| `/sign-in` | customer/account | Acceso `687:48` Â· interfaz implementada, OTP pendiente |
| `/operations` | operations/dashboard | Acceso de equipo `540:2`, panel `540:35` |
| `/pedidos` | operations/orders | Cola `540:68`, detalle `545:2`, resultado `641:2` y sustitución `641:35` · Pasada 2 |
| `/inventario` | operations/inventory | Inventario `545:3`, catálogo `545:4`, movimiento `641:63`, producto `642:2` y precio `642:35` · Pasada 3 |

Se consultaron el contexto de diseÃ±o y las capturas de `459:196`, `459:197` y `687:48` para construir las tres pantallas.
Los activos utilizados se guardaron en `src/assets/`; no hay URLs temporales de Figma en runtime. En la pantalla 03 se omitiÃ³ la fotografÃ­a decorativa por indicaciÃ³n del usuario; el resto del catÃ¡logo sigue usÃ¡ndola.
Las rutas sin una ficha de pantalla en `docs/mobile/screens/` solo prueban la estructura y todavÃ­a no reproducen los contenidos/activos de sus referencias.
La navegaciÃ³n inferior cliente ya usa los iconos vectoriales del nodo 02 con etiquetas visibles.

Avance documentado por pantalla: [01 Â· Bienvenida](screens/01-welcome.md), [02 Â· Tienda](screens/02-store.md), [03 Â· Acceso](screens/03-sign-in.md), [04 Â· Detalle](screens/04-product-detail.md), [05 Â· CategorÃ­as](screens/05-categories.md), [06 Â· BÃºsqueda](screens/06-search.md), [12 Â· Carrito](screens/12-cart.md), [13 Â· Entrega o recojo](screens/13-fulfillment.md), [14 Â· Datos de entrega](screens/14-delivery-details.md) y [15 Â· Revisar pedido](screens/15-order-review.md).
Code Connect no estÃ¡ disponible con el asiento actual de Figma; el contexto de diseÃ±o, la captura y los activos del nodo sÃ­ se consultaron.

## Flujo de trabajo

1. Elegir un nodo del inventario y leer su especificaciÃ³n en design/system.
2. Usar figma-design-to-code y get_design_context con captura. Conservar los IDs en la documentaciÃ³n.
3. Descargar activos definitivos a src/assets; nunca dejar URLs temporales de Figma en runtime.
4. Traducir a React Native, tokens centrales y componentes compartidos; respetar safe areas del SO.
5. Verificar pantalla Android con estados y accesibilidad usando Impeccable.

Figma es una fuente de diseÃ±o durante desarrollo, no una dependencia de red de la app.
El conector y las skills Figma/Supabase/Impeccable estÃ¡n disponibles en esta sesiÃ³n; no requieren claves Figma en el cliente.

