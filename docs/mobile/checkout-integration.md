# Checkout · integración actual

Estado más reciente: [checkout y pago manual conectado](customer-checkout-live.md). El resto de este archivo conserva la evolución histórica. Zonas reales: [configuración](delivery-zones.md).

Actualizado el 29-09-2026. Proyecto: `mstcxtpjncozqztkawjg`.

## Completado

- La pantalla `/schedule` consulta horario semanal, excepciones próximas y estado operativo reales. La consulta pública está separada de la sesión owner y limitada a columnas públicas mediante permisos y RLS.
- La base valida `scheduled_for` no nulo al insertar o reprogramar un pedido: instante futuro, zona horaria de la tienda y horario semanal con prioridad de la excepción del día. El cierre exacto queda fuera del intervalo.
- Las validaciones toman un bloqueo compartido de tienda, compatible con el bloqueo exclusivo de `set_store_business_hours`.
- La selección de pago permanece como borrador. El botón final ya no navega a pago pendiente sin crear un pedido.

Migraciones aplicadas: `20260929004654_checkout_schedule_guard.sql` y `20260929004850_checkout_public_hours.sql`.

## Verificación

- `npm run check` y `npm run export:android` completados.
- Suite transaccional: 27 aserciones, 0 fallos, dentro de una transacción revertida. Se actualizó la expectativa histórica de 35 tablas a las 36 existentes, todas con RLS.
- Horario: apertura y último minuto antes del cierre aceptados; antes de abrir, cierre exacto y excepción cerrada rechazados. Se comprobó también el trigger de inserción.
- Expo Go mostró los siete días 07:00–20:00 y el estado cerrado. Capturas: `tmp/mobile-qa/cogana-checkout-schedule.png` y `tmp/mobile-qa/cogana-payment-guard.png`.
- Revisión posterior con `emulator-5554`: la pantalla de horario mostró la barra de estado oscura y los siete días correctos (`tmp/mobile-qa/cogana-schedule-final.png`). En pago se seleccionó Yape; UIAutomator confirmó que «Compra aún no disponible» mantiene `enabled=false` y pulsarlo no cambió de pantalla (`tmp/mobile-qa/cogana-payment-final.png`). Se abrió Expo Go mediante `exp://10.0.2.2:8081` tras recuperar la conexión con Metro.
- La lectura final conservó siete días correctos y cero pedidos. No hay zonas de reparto activas ni lotes disponibles en la tienda.

## Siguiente bloque

1. Disponibilidad y capacidad implementadas; completar la integración del envío final del pedido cuando estén listos los datos de compra siguientes.
2. Catálogo y carrito conectados, incluidos peso/monto cuando la presentación lo permite. Registrar existencias reales, confirmar precios y definir qué productos se venden a granel; persistencia del carrito pendiente si se necesita.
3. Configurar zonas, tarifas y cobertura reales para entrega, y la identidad/contacto del comprador.
4. Cerrar la política de vencimiento de reserva/pago, validar el estado operativo al crear el pedido y conectar la RPC de forma idempotente.
5. Probar compra, reintento, falta de stock y vencimiento con datos de prueba aislados antes de activar ventas.

El contrato actual exige `scheduled_for` para pedidos nuevos no cancelados. La selección es un borrador; el cupo se consume al crear el pedido. No se habilita automáticamente la tienda. El checkout completo continúa pendiente.

## Reglas confirmadas y guardadas

La migración `20260929171351_fulfillment_rules.sql` añade reglas por tienda y modalidad, con RLS owner/admin y guardado por RPC. Gestión → Tu tienda → Horarios permite editar cada modalidad; el servidor bloquea cambios si hay pedidos futuros activos de esa modalidad.

| Modalidad | Duración | Cupo                              | Anticipación |
| --------- | -------- | --------------------------------- | ------------ |
| Recojo    | 30 min   | 8 pedidos por franja              | 45 min       |
| Delivery  | 60 min   | 4 pedidos por franja y repartidor | 90 min       |

Con 07:00–20:00 hay 26 intervalos completos de recojo y 13 de delivery, antes de filtrar por anticipación, excepciones y capacidad. No se guarda un número fijo de franjas diarias: se deriva del horario del día. La API publica las franjas cuando la tienda acepta pedidos; el trigger protege el cupo de cada pedido nuevo.

### Personal disponible para reparto

El dueño confirmó 2 personas disponibles (él y un trabajador) durante todo el horario de la tienda, lunes a domingo de 07:00 a 20:00. La migración `20260929172715_delivery_staff_capacity.sql` añade `delivery_staff_count` a la regla de delivery y amplía el mismo RPC, conservando llamadas anteriores. Se guardó 2 mediante el RPC con autorización de owner; la capacidad configurada es 2 × 4 = 8 pedidos por franja de 60 minutos.

Gestión → Tu tienda → Horarios → Editar entrega permite actualizar la cantidad al incorporar personal o ante ausencias: 3 personas producen 12 cupos; 0 indica capacidad nula. Es una disponibilidad planificada para todo el horario, no un conteo de cuentas con rol driver. El dueño conserva su rol; no se crean identidades ficticias para el trabajador. Delivery hereda los horarios y excepciones de la tienda, sin mantener un segundo calendario.

Los cambios se guardan junto con las reglas en una sola operación y se bloquean si hay pedidos futuros activos de esa modalidad. Verificado en transacción con rollback: capacidad de 3 personas, conservación del número con llamadas antiguas, valor 0, rechazo de negativos, rechazo de personal en recojo y rechazo sin autorización. Pendientes: asignaciones individuales y disponibilidad parcial por turno si se necesita más adelante.

## Disponibilidad y capacidad atómica · 29-09-2026

Migración `20260929223042_checkout_slot_capacity.sql`: genera franjas completas desde la apertura local, usa excepciones, anticipación y personal disponible. La consulta pública solo expone inicio, fin y disponibilidad. La pantalla muestra siete días y vuelve a consultar al confirmar la elección; guarda el resultado como preferencia local, nunca como reserva confirmada.

El trigger de pedidos valida horario exacto, tienda abierta y cupo, con serialización por tienda/modalidad. Insertar el pedido consume capacidad en la misma transacción del checkout; errores posteriores de inventario revierten también ese consumo. Cancelar libera; completar no libera capacidad adicional para esa franja. El worker de vencimientos existente libera el cupo cuando cancela el pedido; hasta esa cancelación el cupo permanece ocupado. No se cambió la política comercial de vencimiento de pago.

Verificación: `database/tests/checkout_slot_capacity.sql` pasó en una tienda aislada y rollback; cubre duraciones, independencia de modalidades, cupo lleno, cancelación, completados, alineación, nulidad, anticipación, personal, excepciones y cierre. La suite transaccional conservó 27 aserciones y 0 fallos; su apertura de tienda es solo dentro del rollback. Dos transacciones concurrentes contra un cupo único: A confirmó, B recibió «La franja se llenó», conteo final 1. La tienda y pedidos usados para esa prueba fueron eliminados y el conteo de fixtures quedó en 0.

TypeScript/ESLint y exportación Android pasaron. Expo Go mostró el estado real cerrado (`tmp/mobile-qa/cogana-slot-screen.png`), sin permitir elegir. La lectura `anon` funciona sin acceso al esquema privado. No se validó visualmente el flujo abierto ni se habilitaron ventas.

## Catálogo y carrito por presentación · 30-09-2026

La migración `20260929224504_public_customer_catalog.sql` publica `get_customer_catalog` con UUID de presentación, precio configurado, categoría, imagen y disponibilidad agregada. Descuenta reservas vigentes y excluye lotes bloqueados/vencidos y productos, categorías o presentaciones inactivos, siguiendo el criterio de FEFO. No expone lotes, proveedores, costos ni identidades de reservas. `anon` no recibe USAGE del esquema privado.

Tienda, búsqueda, detalle, categorías, carrito y resúmenes leen `src/services/customer/catalog.ts`; se recargan al volver a la pantalla. Los adaptadores de muestra se conservan como referencia, sin importaciones desde las pantallas. El catálogo remoto contiene 25 productos y 30 presentaciones activas, con 0 lotes: todos figuran sin stock. Los precios son los configurados en base y aún deben ser revisados por el dueño antes de vender; esta integración no los ha cambiado.

El carrito inicia vacío y vive en memoria compartida. `addToCart` vuelve a consultar disponibilidad y admite cantidades enteras por presentación, fusiona repetidos y limita al stock disponible (máximo de UI 99). Carrito/revisión usan precios actuales y bloquean continuar si falta stock o se retiró una presentación. Los productos retirados pueden eliminarse explícitamente. No se reserva inventario al agregar. Las fotos locales vinculadas a SKU se identifican como referenciales; los demás productos esperan su propia imagen, sin reemplazarla por una foto ajena.

Validación: 32 aserciones transaccionales, 0 fallos y rollback, incluidas disponibilidad neta tras reservar 750 g, independencia de sellados, exclusión de lotes bloqueados/vencidos y publicaciones inactivas. `node --experimental-strip-types scripts/test-customer-cart.mjs` comprueba agregación, inmutabilidad y límites de cantidad/stock. Lectura `anon`: 30 presentaciones y disponibilidad total 0. Asesor de seguridad consultado, sin hallazgos específicos de la nueva RPC.

`npm run check` terminó sin errores ni advertencias y la exportación Android terminó correctamente. La revisión visual de este bloque queda pendiente: ADB dejó de responder a navegación/captura; tras reiniciar su servidor el emulador volvió a figurar conectado, pero la navegación aún no respondió. No hay captura nueva válida de catálogo/cart y no se afirma validación visual. Las capturas de franjas corresponden al bloque anterior.

Pendiente: ingresar stock, validar precios/fotos definitivos, configurar las presentaciones a granel, zonas y tarifas, identidad/contacto del comprador, vencimiento comercial y llamada final idempotente al checkout. El carrito no persiste al cerrar la app. El botón final de compra permanece deshabilitado.

## Carrito por peso y monto · 30-09-2026

`services/customer/cart.ts` centraliza `parseBulkRequest`, `quoteBulk`, `setBulkLine`, `resolveCartLine` y `cartLinePayload`. El valor por monto se guarda en céntimos enteros, el peso en gramos enteros. Se respetan permisos de la presentación, mínimo e incremento; los cálculos con BigInt siguen el redondeo de `private.create_checkout_order`. Por monto, el peso baja al incremento permitido y el importe estimado nunca supera el presupuesto. Los importes siguen siendo estimados, no un cobro ni una cotización definitiva.

El detalle permite elegir solo modos autorizados, muestra estimación y errores de entrada/stock y vuelve a consultar el catálogo al guardar. Una selección a granel reemplaza la línea de la misma presentación; editar desde carrito recupera la selección anterior. Carrito, revisión y pago comparten el cálculo, evitando sumar gramos como si fueran unidades. El payload preparado contiene UUID, modo y solicitud, sin precios confiados al cliente. No se llama todavía a la creación de pedido.

Pruebas locales ampliadas: coma decimal, entradas inválidas, mínimo, incremento, redondeo, stock insuficiente, permisos, presentación sellada, reemplazo sin duplicados, recalcular tras cambios y payload; comprobación de múltiples presupuestos sin excederlos. No hubo cambios de esquema ni de datos de negocio en este bloque. La lectura de Supabase encontró 0 presentaciones habilitadas para cantidad en gramos; no se activó ninguna automáticamente. Para usar el flujo real se requiere definir qué productos admiten peso/monto y cargar sus existencias.

El dueño confirmó dos zonas; configuración e integración registradas en el bloque siguiente.

Verificación final de este bloque: pruebas del carrito/granel, `npm run check` y `npm run export:android` completados. Sin cambios de datos reales. El intento de navegación ADB se interrumpió tras 10 segundos sin respuesta; la validación visual sigue pendiente y no se presenta la exportación como prueba de interacción.

Verificación de reglas: guardado con identidad owner, rechazo de una identidad sin membresía, lectura remota de ambas configuraciones y guardado sin cambiar valores desde Expo Go. Capturas: `tmp/mobile-qa/cogana-rules.png` y `cogana-rules-saved.png`. TypeScript/ESLint y las 27 aserciones de la suite transaccional pasaron; la expectativa de esquema ahora incluye 37 tablas. El asesor marca [políticas para el rol authenticated](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins); el acceso de esta tabla requiere además `has_store_role(owner/admin)`, que rechaza sesiones anónimas y usuarios sin membresía.
