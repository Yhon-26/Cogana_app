# Checkout: revisión Android y servicio de envío — 30-09-2026

Estado histórico: los bloqueantes comerciales fueron respondidos. La continuación e implementación vigente están en [checkout y pago manual conectado](customer-checkout-live.md).

## Revisión realizada

Emulador `emulator-5554`, Expo Go y Metro en 8081. Metro estaba detenido; se inició y se usó `adb reverse tcp:8081 tcp:8081` con `exp://127.0.0.1:8081`. La automatización Windows no tenía conexión nativa; ADB sí respondió.

- Datos de entrega: ambas tarifas/mínimos legibles, sin imágenes decorativas, selección exclusiva confirmada por UIAutomator (`checked` cambia entre las dos zonas).
- Correcciones: texto inferior pide zona en lugar de distrito; opciones no seleccionadas blancas, opción seleccionada verde suave con radio y borde verde.
- Revisión y pago: abrir por enlace con carrito vacío ya no muestra el envío como total de una compra vacía. Muestra estado vacío y acción para volver a tienda.
- Capturas: `tmp/mobile-qa/zones-selected.png`, `zones-keyboard.png` (campo enfocado; no demuestra teclado abierto), `checkout-empty-payment.png`. `zones-order-review.png` registra el defecto previo del carrito vacío, no el resultado final.
- No se probó una compra real ni se creó stock/pedidos para simular producción. Quedan teclado abierto, texto ampliado, lector de pantalla y compra con existencias para la validación completa.

## Servicio preparado, todavía sin activar desde la UI

`services/customer/checkoutContract.ts` arma intención de compra con UUID de presentaciones, cantidades o monto, modalidad, contacto, dirección y horario. Reutiliza `cartLinePayload`; no envía precios. Valida entrada básica y respuesta.

`services/customer/checkout.ts` llama a la RPC existente bajo identidad autenticada no anónima, bloquea envíos concurrentes y mantiene UUID/hash/plazo de un intento en SecureStore (memoria en web). `expo-crypto` genera el UUID y SHA-256. No guarda dirección ni carrito en ese registro.

Si se pierde la respuesta, reintenta con la misma operación y primero consulta el pedido por usuario/tienda/operación. Si cambió el carrito y no se recuperó la respuesta, no genera otro pedido silenciosamente. Los errores de validación PostgreSQL revierten y liberan el intento; errores ambiguos lo conservan. El registro se elimina solo al reconocer el resultado confirmado. Este adaptador no llama a confirmación de pago: esa acción corresponde al personal autorizado.

`scripts/test-customer-checkout.mjs` prueba validaciones, ausencia de precios, reintentos, carrito cambiado, recuperación de pedido confirmado, reconocimiento y rechazo atómico con cliente simulado. Pasaron junto con carrito/granel y `npm run check`. No equivalen a prueba transaccional real de compra.

## Bloqueantes para conectar el botón final

Preguntas pendientes al usuario: plazo para Yape/Plin; acceso cliente por correo o exclusivamente SMS; número/titular de cada receptor de pagos. No inferir respuestas de silencios.

Después de definirlos:
1. Implementar identidad cliente y contacto, separados del acceso del equipo; no reutilizar automáticamente la sesión owner para comprar.
2. Guardar política de vencimiento y destinatarios, y derivar el vencimiento en servidor. El RPC heredado recibe fecha del llamador: el servicio preparado exige una fecha explícita y **no debe conectarse usando una fecha arbitraria calculada en el móvil**.
3. Conectar confirmación de compra con resultado persistente, recuperación tras reinicio y pantalla de pedido real. La captura del código de recojo requiere completar su contrato de recuperación.
4. Implementar comprobante/referencia del cliente con autorización de propietario y revisión por owner; el comprobante no confirma automáticamente dinero recibido. Definir conservación de reserva al enviar comprobante y al pasar a cola, incluida compra en efectivo, antes de activar ese recorrido.
5. Pruebas aisladas de servidor: stock, cupo, tarifa, mínimo, concurrencia, identidad, vencimientos y pago manual; después prueba completa en emulador.

La creación/pago completo no está terminado. El botón final mantiene su bloqueo y no se modificó la configuración de ventas reales en este bloque.
