# Operaciones · Pasada 4 y conexión de lecturas reales

Actualización 29-09-2026: Horarios incluye un editor compartido para reglas independientes de recojo y delivery. Valores autorizados, migración y pruebas en `docs/mobile/checkout-integration.md`.

## Alcance implementado

- Acceso de equipo: `src/services/operations/access.ts` envía y verifica OTP por correo con Supabase Auth (`shouldCreateUser: false`). La selección solo admite `store_memberships.is_active = true`, rol `owner` o `admin`, y una tienda activa. El layout de operaciones redirige a selección si no hay una tienda autorizada elegida.
- Panel, cola, detalle de pedido, inventario y catálogo leen Supabase por `store_id`; los adaptadores de muestra ya no se usan en operaciones. Las consultas viven en `src/services/operations/data.ts`, seleccionan solo campos visibles y vuelven a validar la membresía. La RLS sigue siendo la barrera del servidor.
- Gestión (`/gestion`, Figma `550:2`): menú de Tu tienda, Pagos, Reparto y Actividad, sin imagen decorativa.
- Tu tienda (`/gestion/tienda`, `550:3`), Horarios (`/gestion/horarios`, `645:2`) y Zonas (`/gestion/zonas`, `645:30`): configuración registrada, horarios/excepciones y cobertura. Los estados vacíos no copian los horarios ni tarifas ficticios de Figma.
- Pagos (`/gestion/pagos`, `550:4`) y revisión (`/gestion/pagos/revisar`, `645:89`): solo metadatos de transacciones, importe, método, estado y fecha. No se leen pruebas, referencias de proveedor ni eventos de pago.
- Reparto (`/gestion/reparto`, `550:5`) y asignación (`/gestion/reparto/asignar`, `645:58`): pedidos de entrega y asignaciones existentes, sin exponer código de confirmación, evidencia, dirección ni identidad del repartidor.
- Actividad (`/gestion/actividad`, `550:6`): pedidos, movimientos de inventario y cambios de precio recientes. **No** es un log exhaustivo de auditoría.

## Estado de datos verificado el 28-09-2026

En la primera verificación, el proyecto Supabase `Cogana` (`mstcxtpjncozqztkawjg`) contenía 1 tienda activa, 1 membresía owner activa, 25 productos, 30 presentaciones, 1 configuración de tienda y 30 registros de historial de precios. Una consulta de solo lectura ejecutada como rol `authenticated` con el usuario owner de esa membresía vio esos registros a través de RLS. No había pedidos, lotes, horarios, zonas, transacciones de pago ni asignaciones; las pantallas correspondientes mostraban estados vacíos. No se insertaron datos de prueba.

## Estado del acceso real en Expo Go

El 28-09-2026 se verificó en el panel de Cogana que [SMTP personalizado](https://supabase.com/dashboard/project/mstcxtpjncozqztkawjg/auth/smtp) está activo y que la [plantilla Magic link or OTP](https://supabase.com/dashboard/project/mstcxtpjncozqztkawjg/auth/templates/magic-link-or-otp) contiene `{{ .Token }}`. Se estableció `EXPO_PUBLIC_OPERATIONS_EMAIL_OTP_READY=true` en `.env.local`, de modo que la app habilita el envío para un correo válido. El correo debe existir en Auth y su `user_id` debe tener membresía owner/admin activa. Tras corregir la autenticación SMTP y la autorización de IP en Brevo, el usuario recibió el código y entró con la cuenta owner. La selección de Cogana Santa Anita y la navegación autenticada se comprobaron en Expo Go.

Referencia: [Passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless).

## Operaciones de escritura pendientes

Las pantallas de preparación, movimientos, edición de catálogo/precios, excepciones de horario, zonas, confirmación de pagos y asignación están en lectura o estado explicativo. No se habilitan botones que podrían escribir sin completar antes validación de rol/tienda, contratos transaccionales e idempotencia cuando corresponda, autorización de cada caso y pruebas con una sesión owner real. `database/OPERATIONS.md` enumera las RPC existentes para pedidos, inventario, pagos y reparto. Los horarios habituales sí permiten guardar un día a la vez; antes de activar cambios de excepciones, zonas o estado operativo, revisar sus políticas, validaciones y efecto sobre pedidos futuros.

El asesor de seguridad de Supabase devuelve avisos existentes sobre políticas para usuarios anónimos y protección de contraseñas filtradas; requieren revisión antes de producción. No se modificaron políticas ni datos de producción en esta pasada.

## Verificación

En la pasada original, `npm run check`, `npm run check:connection` y `npm run export:android` pasaron. En el emulador `Solas_Cogana` se abrió el acceso de equipo y se confirmó que abrir `/gestion` sin sesión redirige a selección sin permitir entrar al panel. Capturas originales: `tmp/mobile-qa/operations-pass4-login-final.png` y `operations-pass4-guard-final.png`.

Tras activar el acceso por correo, `npm run check`, `npm run check:connection` y `npm run export:android` volvieron a pasar. Expo Go cargó `/operations` en `emulator-5554`; con un correo de prueba sintácticamente válido, “Enviar código” se habilitó sin pulsarlo ni enviar un correo. Captura: `tmp/mobile-qa/cogana-otp-valid-email.png`.

### Incidencia de envío del 28-09-2026

La primera solicitud real desde la app falló. `auth_logs` de Supabase registró `POST /otp` con HTTP 500 y `535 5.7.8 Authentication failed` del servidor SMTP. Se verificó por consulta de solo lectura que el correo utilizado existe en Auth y tiene una membresía owner/admin activa; tampoco es un error de conectividad del emulador. El problema está en la autenticación de Supabase ante Brevo. No se repitió el envío durante el diagnóstico.

Para corregirlo, comparar en Brevo **Settings → SMTP & API** el valor exacto de **SMTP login** y una **SMTP key** vigente con los campos **Username** y **Password** de [Supabase SMTP Settings](https://supabase.com/dashboard/project/mstcxtpjncozqztkawjg/auth/smtp). El servidor es `smtp-relay.brevo.com` y el puerto configurado es `587`. La clave SMTP no es la API key ni la contraseña de acceso a Brevo. Actualizarla directamente en el panel, sin incorporarla al repositorio ni compartirla en el chat. Tras guardar, solicitar un solo código nuevo y comprobar los logs de Auth si falla. El mensaje de la app ahora distingue un fallo 5xx del servicio de correo de un problema de conexión.

**Actualización 28-09-2026, 15:20 UTC:** los nuevos intentos cambiaron a `525 5.7.1 Unauthorized IP address` en `auth_logs`. La captura de Brevo muestra el bloqueo activado para claves SMTP, cero IP autorizadas y una IP no autorizada. Esto indica que las credenciales ya superaron el fallo 535 anterior, pero Brevo bloquea la IP de salida usada por Supabase. La corrección de menor alcance es revisar la entrada de **Direcciones IP no autorizadas** en Brevo y autorizar la IP correspondiente al intento de las 15:20 UTC para la clave SMTP, sin desactivar el bloqueo general. Hay que comprobar el resultado con un solo OTP nuevo; no se ha verificado aún la entrega. La IP saliente podría variar en un servicio alojado, por lo que una autorización puntual puede requerir revisión posterior.

### Revisión autenticada posterior

El usuario confirmó que recibió el código y pudo entrar. En `Solas_Cogana`, la sesión owner seleccionó Cogana Santa Anita y abrió Panel, Pedidos, Inventario, Gestión, Tu tienda, Horarios, Zonas, Pagos, Reparto y Actividad. El panel mostró 0 pedidos y 0 pagos pendientes desde los datos de la tienda; las secciones sin registros mostraron estados vacíos. La sesión persistió al reiniciar Expo Go y permitió volver a seleccionar la tienda sin pedir otro código.

Se corrigió la etiqueta cruda `closed` a `Cerrada` en Panel y Tu tienda (`src/features/operations/storeStatus.ts`), se eliminó `panelContent.ts` porque contenía métricas ficticias sin uso, y Actividad ahora une los cambios de precio con el nombre real de producto y presentación. Capturas: `tmp/mobile-qa/cogana-auth-panel-fixed.png`, `cogana-auth-store-fixed.png`, `cogana-auth-orders.png`, `cogana-auth-inventory.png`, `cogana-auth-hours.png`, `cogana-auth-zones.png`, `cogana-auth-payments.png`, `cogana-auth-delivery.png` y `cogana-activity-final.png`. `npm run check`, la comprobación de formato de los archivos tocados y `npm run export:android` pasaron tras el ajuste.

La prueba cubre lecturas y navegación con la cuenta owner; no verifica escrituras, pedidos reales ni entrega futura de OTP desde otras redes/IP.

### Horario habitual editable

`/gestion/horarios` conserva la pantalla existente y añade edición por día sin valores precargados. Muestra la zona horaria registrada de la tienda para interpretar las horas locales. `BusinessHoursEditor.tsx` controla el formulario y `src/services/operations/hours.ts` valida el día, formato `HH:MM` y cierre posterior a la apertura, vuelve a comprobar la membresía owner/admin y llama a `set_store_business_hours`. La RPC vuelve a validar el rol, bloquea la tienda frente a checkout, consulta pedidos futuros programados y guarda por `(store_id, weekday)` en una transacción. Se revocó la escritura directa de la tabla para la app. Un día marcado cerrado guarda ambas horas como `null`; los días ausentes siguen diciendo “Sin configurar”. Las excepciones permanecen en lectura.

Se verificaron las columnas y políticas vigentes de `store_business_hours` en el proyecto. Una escritura autenticada como owner con `09:00–17:00` funcionó dentro de una transacción revertida; la consulta posterior confirmó **0 filas**, por lo que no se cambió el horario real. La pantalla y el formulario abierto se revisaron en `Solas_Cogana` (`tmp/mobile-qa/cogana-hours-fixed.png` y `cogana-hours-edit-open.png`). TypeScript, ESLint y Prettier pasaron después de integrar el editor. Desde el 29-09-2026, el bloqueo de pedidos programados se ejecuta en la RPC transaccional del servidor.

### Horario real confirmado por el dueño

El dueño confirmó atención **lunes a domingo, 07:00–20:00** para Cogana Santa Anita. Antes de guardar se verificaron cero horarios existentes y cero pedidos futuros programados. Los siete días se insertaron en una transacción bajo la identidad owner con RLS; una lectura independiente confirmó `weekday` 1–7, `opens_at=07:00`, `closes_at=20:00` e `is_closed=false` en todos. Expo Go mostró “7 días configurados” en Tu tienda y `07:00–20:00` en Horarios (`tmp/mobile-qa/cogana-store-live.png` y `cogana-hours-live.png`). La zona horaria registrada es `America/Lima`.

El estado operativo de la tienda continúa `closed`/“Cerrada”: el horario guardado no cambia por sí solo la apertura en línea.

### Protección transaccional del horario · 29-09-2026

La migración `database/migrations/20260929002711_store_business_hours_transaction.sql` se aplicó al proyecto `mstcxtpjncozqztkawjg`. La función pública solo admite `authenticated`; su implementación privada comprueba owner/admin activo, toma el bloqueo exclusivo de la tienda, rechaza cambios ante pedidos futuros programados activos y guarda el día. Checkout ya toma `FOR SHARE` sobre esa misma tienda al crear el pedido. Los permisos directos `INSERT`, `UPDATE` y `DELETE` sobre `store_business_hours` se revocaron a `authenticated` para evitar omitir la regla mediante la API de tablas.

En transacciones revertidas se comprobó la respuesta de la RPC con la identidad owner, el rechazo de un pedido futuro temporal y el rechazo de una identidad sin membresía. Tras aplicar la migración, la tabla conservó siete días con 07:00–20:00 y no quedó ningún pedido de prueba. Sigue pendiente validar la disponibilidad de la franja elegida durante checkout y conectar la compra del cliente a datos reales; esta migración no habilita esas funciones.

En Expo Go se abrió el editor de lunes y se guardó el mismo horario, 07:00–20:00, mediante la nueva RPC. La pantalla confirmó «Lunes guardado» (`tmp/mobile-qa/cogana-hours-rpc-saved.png`). La lectura posterior del proyecto confirmó los siete días correctos y cero pedidos.
