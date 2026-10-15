# Operaciones · Pasada 2: pedidos (04–05)

- **04 · Cola de pedidos**: pestaña `/pedidos`, referencia Figma `540:68`. Sustituye la vista de preparación anterior. Búsqueda local por número, filas con estado de pedido y pago separados, y aviso visible de que los pedidos son de ejemplo. La barra inferior existente se reutiliza.
- **05 · Detalle y preparación**: `/pedidos/[id]`, referencia Figma `545:2`. Detalle para pedidos de muestra dentro de la misma pestaña. Los artículos usan fotos locales del catálogo porque ayudan a identificarlos; se omiten fotografías decorativas. La preparación queda deshabilitada hasta que existan lectura autorizada, pago, reservas y transición segura.
- **Resultado por artículo**: `/pedidos/resultado?id=…`, referencia `641:2`. Presenta los artículos solicitados y deja el peso final y ajuste por registrar. Guardar está inactivo.
- **Proponer sustitución**: `/pedidos/sustitucion?id=…`, referencia `641:35`. Conserva el producto solicitado y deja la alternativa, diferencia, motivo y plazo pendientes. Enviar está inactivo.

El adaptador `src/services/mock/operationsOrders.ts` contiene dos pedidos visuales aislados de Supabase. Las rutas no conceden acceso; falta implementar el control de rol owner/admin activo por tienda y los estados de lectura real. No se escriben pedidos ni pagos.

Validación en `emulator-5554`: cola, búsqueda `2846`, apertura/regreso del detalle, barra inferior, resultado y sustitución. El detalle se revisó con escala de texto 1.3 sin recortes y la escala se restauró a 1.0. Capturas locales: `tmp/mobile-qa/op4-queue-final.png`, `op5-detail-fixed.png`, `op5-detail-large-final.png`, `op-result-final.png` y `op-substitution-final.png`. `npm run check` aprobado. Pendientes: aprobación visual del usuario, lector de pantalla y backend autorizado.
