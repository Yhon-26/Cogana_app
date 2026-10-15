# Checkout y pago manual conectado — 30-09-2026

Este documento sustituye el estado pendiente de `checkout-visual-and-submission.md`. Proyecto Supabase `mstcxtpjncozqztkawjg`; app `C:\Cogana_app`. No afecta al repositorio desktop.

## Configuración confirmada por el dueño

- Acceso cliente mediante correo y celular.
- Yape y Plin: COMERCIAL GAEL Y NATALY S.A.C, 969789624.
- Plazo: 15 minutos desde crear el pedido para transferir e informar la referencia.
- Zonas: Los Ficus/Universal S/4, mínimo S/30; resto de Santa Anita S/6, mínimo S/40.

Los destinatarios y el plazo se guardan en `store_settings`, no en constantes de pantalla. `get_customer_payment_settings` expone la proyección pública necesaria. Cada pedido conserva una copia del destinatario para que un cambio posterior no altere sus instrucciones.

Yape indica que los pagos llegan de inmediato, pero [recomienda verificar el movimiento recibido](https://www.yape.com.pe/preguntas-frecuentes/enviar-y-recibir-yapeos/como-identifico-un-yapeo-falso). Cogana usa confirmación manual autorizada; no es una integración bancaria automática.

## Flujo implementado

1. Acceso OTP en la pantalla existente, selector Correo/Celular, código, reenvío con espera y errores. Sesión customer con clave de almacenamiento independiente de owner; refresh al volver al primer plano. No se vinculan cuentas de correo y celular automáticamente: usa el mismo acceso para conservar el historial, hasta implementar vinculación con verificación de ambos canales.
2. Pago pide nombre/contacto y sesión, respeta zona, mínimo, stock, medio habilitado y horario. `submit_customer_order` calcula vencimiento y total en servidor. El wrapper anterior conserva su firma, pero ya no permite al cliente elegir la fecha de vencimiento.
3. Idempotencia local y del servidor: UUID estable, recuperación del pedido si se pierde la respuesta, puntero persistente al último pedido y listado real en Mis pedidos. El cliente no envía precios. Un pedido recuperado de otro carrito no borra el carrito actual.
4. `/payment/pending?orderId=…` presenta número, total, instrucciones, vencimiento y estado reales bajo RLS. Permite informar la referencia del movimiento. No se pide clave ni código de acceso y no se suben capturas de comprobantes en este bloque.
5. Informar dentro del plazo deja el pago `processing`, nunca `paid`, y conserva la reserva hasta que la tienda revise o cancele. El dueño debe atender esta cola; el aviso no se cancela automáticamente por superar los 15 minutos.
6. Gestión → Pagos → Revisar pago muestra la referencia informada y permite confirmar una referencia comprobada en la cuenta receptora. `confirm_manual_payment` exige owner/admin; al confirmar, el pedido pasa a cola y la reserva se conserva para preparación. El cliente solo puede consultar y avisar.
7. Sin aviso ni confirmación al vencimiento, el worker existente libera la reserva y cancela el pedido. No se admiten avisos tardíos ni confirmaciones sobre reservas vencidas. Si ya se transfirió tarde, la interfaz indica contactar a la tienda.
8. Efectivo se limita a recojo; no tiene vencimiento de pago digital. Su reserva se mantiene hasta preparación/consumo o cancelación explícita.

## Archivos y límites

- Migraciones aplicadas: `20260930190302_customer_checkout_payments.sql`, `20260930190700_customer_order_submission.sql`.
- Servicios: `services/customer/auth.ts`, `checkout.ts`, `checkoutContract.ts`, `payments.ts`; `services/operations/payments.ts`.
- Vistas existentes reutilizadas: SignInScreen, PaymentMethodScreen, PaymentPendingScreen, OrdersScreen, AccountScreen, ManagementScreen. Confirmación owner encapsulada en PaymentReviewAction.
- Tipos regenerados desde Supabase. Se conserva corrección explícita de nulabilidad de horas cerradas en `set_store_business_hours` porque el generador no representa ese contrato.
- El código de retiro/seguimiento posterior a preparación y vincular correo+celular a una misma cuenta siguen fuera de este bloque. No se confirma entrega desde la pantalla de pago.

## Verificación y pendientes externos

`npm run check`, pruebas de carrito/granel y `scripts/test-customer-checkout.mjs` pasaron. Las pruebas de OTP son simuladas: no se enviaron correos ni SMS de prueba. Suite transaccional: 33 aserciones, 0 fallos. `database/tests/customer_order_submission.sql` verifica tarifa, mínimo, 15 minutos calculados en servidor, reintento, bloqueo de otra identidad, reserva durante revisión, confirmación owner y vencimiento. Usa identidad/rol autenticado en las llamadas cliente; los fixtures se revierten completos.

La exportación Android (`npm run export:android`) también finalizó correctamente.

Lectura final de negocio: tienda cerrada, 0 pedidos, 1 lote. El lote no fue creado por estas pruebas. No se abrió la tienda ni se realizaron cobros.

Android: acceso Correo/Celular revisado en Expo Go; selección de canal verificada por UIAutomator. Capturas finales `tmp/mobile-qa/customer-sign-in-final.png`, `customer-phone-final.png`. La primera captura `customer-sign-in.png` era una versión en caché sin conexión a Metro y no sirve como evidencia del cambio. No se afirma compra completa en emulador con sesión real, ni verificación de entrega real de OTP.

**Prueba SMS pendiente al final, por decisión del dueño:** la consulta posterior de `/auth/v1/settings` confirmó `email:true`, `phone:true`. Twilio Verify está configurado con un número y OTP de prueba; esto no acredita entrega real de SMS. Quedan pendientes probar acceso en el móvil, entrega real con un destinatario permitido por Twilio Trial y retirar el OTP fijo antes de ventas reales. Las claves permanecen en Supabase, nunca en Expo ni en el chat. También falta verificar recepción y confirmación por correo para una cuenta nueva.

El asesor conserva avisos generales de [políticas authenticated](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins), [RLS sin políticas en tabla privada](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) y [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se declara auditoría global limpia.
