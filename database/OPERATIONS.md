# Operaciones transaccionales de Cogana

Fecha de verificación: 18 de septiembre de 2026  
Proyecto aplicado: `mstcxtpjncozqztkawjg`

## Diseño de seguridad

- Los wrappers en `public` son `SECURITY INVOKER` y sólo se conceden a
  `authenticated`; `anon` no puede ejecutarlos.
- La lógica con bypass de RLS está en `private`, usa `SECURITY DEFINER`,
  `search_path = ''`, nombres calificados y validación explícita de identidad,
  tienda y rol.
- No existe ninguna función `SECURITY DEFINER` en `public`.
- `service_role` sólo recibe las funciones servidoras para eventos de pago y
  vencimiento. No debe llegar a web ni Android.
- Las llamadas externas a proveedores deben ocurrir fuera de las transacciones
  SQL. Luego se registra el resultado idempotente.

## RPC autenticados

| RPC                        | Actor                             | Propósito                                                                  |
| -------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| `create_checkout_order`    | invitado anónimo o cliente        | Cotiza, crea el pedido y reserva FEFO.                                     |
| `receive_inventory_lot`    | owner/admin                       | Registra la entrada de un lote nuevo (granel y/o paquetes sellados).       |
| `open_inventory_package`   | owner/admin                       | Convierte unidades selladas en granel, con neto físico cero.               |
| `transition_order`         | owner/admin                       | Aplica sólo transiciones permitidas.                                       |
| `confirm_manual_payment`   | owner/admin                       | Confirma Yape/Plin manual y pone el pedido en cola.                        |
| `finalize_weighted_order`  | owner/admin                       | Consume asignaciones, fija pesos y crea ajuste/devolución pendiente.       |
| `propose_substitution`     | owner/admin                       | Propone reemplazo y autoacepta sólo dentro de la autorización.             |
| `decide_substitution`      | comprador o owner/admin           | Acepta o rechaza y reasigna reserva atómicamente.                          |
| `assign_delivery`          | owner/admin                       | Asigna reparto y devuelve el código una sola vez.                          |
| `complete_pickup`          | owner/admin                       | Verifica código, cobra efectivo si corresponde y completa.                 |
| `complete_delivery`        | repartidor asignado u owner/admin | Verifica código o evidencia y completa.                                    |
| `set_store_business_hours` | owner/admin                       | Guarda un día habitual y bloquea cambios ante pedidos futuros programados. |

Las operaciones de pedidos, inventario, pagos y reparto reciben un
`operation_id` UUID o una clave de idempotencia equivalente. Repetir la misma
operación devuelve el resultado previo o no duplica el efecto. El horario
habitual usa la clave natural `(store_id, weekday)`.

El horario habitual usa una clave natural `(store_id, weekday)` y solo actualiza
la fila cuando cambian sus valores. La migración
`database/migrations/20260929002711_store_business_hours_transaction.sql`
revoca la escritura directa de `store_business_hours` para `authenticated`.
La RPC comprueba owner/admin y toma un bloqueo exclusivo de la tienda antes de
consultar pedidos futuros y guardar. `create_checkout_order` comparte esa fila
con un bloqueo de lectura durante checkout, de modo que ambas operaciones se
serializan. Esta protección no sustituye la validación de disponibilidad de
franjas ni habilita por sí sola el checkout en la app.

La migración `20260929223042_checkout_slot_capacity.sql` amplía el guard anterior:
todo pedido nuevo no cancelado requiere `scheduled_for` en el inicio exacto de
una franja completa y futura, dentro de los próximos 14 días, con anticipación,
capacidad y tienda aceptando pedidos. Las excepciones prevalecen sobre la semana.
El trigger toma bloqueos compartidos de tienda/configuración/estado y un bloqueo
transaccional por tienda y modalidad antes de contar pedidos. En el aislamiento
READ COMMITTED de la API, la consulta posterior al bloqueo ve la compra anterior.
El cupo se consume en la misma transacción que el pedido y la reserva FEFO:
si falta stock, todo se revierte. No existe una reserva independiente al elegir.
Pedidos cancelados liberan cupo; completados siguen contándolo. Reprogramar o
reactivar valida capacidad; avanzar un pedido existente no vuelve a exigir
anticipación ni tienda abierta. Las escrituras directas de excepciones siguen
revocadas hasta contar con una RPC transaccional.

`get_checkout_slots(p_store_slug,p_mode,p_days)` es una lectura pública (1–14 días,
7 por defecto) que devuelve inicio, fin y disponibilidad; no publica pedidos,
identidades ni cantidad de personal. El wrapper SQL preanalizado conserva
SECURITY INVOKER y no concede USAGE de `private` a `anon`.

`20260929004850_checkout_public_hours.sql` permite a `anon` leer solo las
columnas públicas de tienda, horario, excepciones y estado operativo de tiendas
activas. La app cliente usa un cliente sin sesión separado para estas lecturas;
las políticas de personal continúan separadas.

## Payload de checkout

### Catálogo público

`get_customer_catalog(p_store_slug)` devuelve una proyección pública de presentaciones activas con precios configurados y stock elegible neto de reservas, separado de los datos operativos. Ver `20260929224504_public_customer_catalog.sql`. No requiere sesión y no concede acceso a inventario, costos o reservas. La disponibilidad es informativa hasta la reserva FEFO transaccional; los precios del cliente nunca sustituyen la cotización del servidor. Suite actual: 32 aserciones.

`create_checkout_order(payload, operation_id, reservation_expires_at)` recibe:

```json
{
  "store_id": "uuid",
  "source": "web",
  "fulfillment_type": "pickup",
  "payment_method": "yape",
  "customer": {
    "name": "Nombre",
    "phone": "teléfono",
    "email": "opcional"
  },
  "delivery_zone_id": "sólo delivery",
  "delivery_address": { "address_line": "sólo delivery" },
  "scheduled_for": "obligatorio: starts_at de una franja publicada, ISO-8601",
  "preparation_not_before": "opcional ISO-8601",
  "items": [
    {
      "presentation_id": "uuid",
      "request_mode": "quantity | money | presentation",
      "requested_quantity": 500,
      "requested_money_cents": null,
      "substitution_policy": "allow_similar | contact | remove",
      "max_substitution_extra_cents": 0
    }
  ]
}
```

El servidor que llama checkout decide `reservation_expires_at`; la base no
inventa una duración comercial. `pg_cron` libera cada minuto sólo las reservas
que ya superaron ese instante.

## Pruebas ejecutadas contra el proyecto

- Suite reproducible: `supabase/tests/database/transactional_operations_test.sql`.
- 27 aserciones pgTAP aprobadas contra el proyecto remoto, dentro de
  `BEGIN ... ROLLBACK`.
- Migraciones completas validadas primero dentro de `BEGIN ... ROLLBACK`.
- Cálculo por importe: S/ 3 a S/ 4/kg produjo 750 g enteros.
- FEFO eligió el lote con vencimiento más cercano.
- Dos checkouts simultáneos por 750 g contra 1,000 g: uno confirmó y el otro
  falló con stock insuficiente; no hubo sobreventa.
- Apertura repetida con el mismo `operation_id`: un solo movimiento y un solo
  saco convertido.
- Pago manual pasó de `requires_action` a `paid` y encoló el pedido.
- Preparación consumió exactamente el lote y fijó el total final.
- Sustitución aceptada cambió producto, lote y reserva en una sola transacción.
- Reserva vencida dejó pedido `cancelled`, pago `expired` y reserva `expired`.
- Recojo con código confirmó efectivo y completó el pedido.
- Delivery con código dejó pedido y asignación completados y registró eventos.
- `anon` no tiene ejecución; `authenticated` sí; `anon` tampoco tiene `USAGE`
  del esquema `private`.
- `signInAnonymously()` fue validado contra Auth remoto después de habilitar el
  proveedor. El usuario temporal de la prueba fue eliminado.
- La cuenta propietaria real quedó con perfil activo y membresía `owner` en
  `Cogana Santa Anita`. Bajo su identidad ve exactamente una tienda y
  `private.has_store_role(..., array['owner'])` devuelve `true`.
- Una identidad anónima sin membresía no ve la tienda ni obtiene el rol
  `owner`, aunque técnicamente use el rol Postgres `authenticated`. Los helpers
  de personal también rechazan explícitamente JWT con `is_anonymous = true`.
- Todos los usuarios, pedidos, productos, lotes y zonas `TEST` fueron eliminados
  al finalizar. El proyecto conserva la cuenta propietaria y el catálogo real
  provisional; sigue en cero pedidos, lotes y eventos de pago.

## Trabajo servidor pendiente

- Habilitar protección contra contraseñas filtradas antes de admitir acceso con
  contraseña; la cuenta inicial usa enlace mágico.
- Elegir proveedor de tarjeta antes de desplegar la Edge Function de webhook.
  `private.record_payment_event` ya ofrece el punto idempotente de persistencia.
- Incorporar CAPTCHA/Turnstile y límites de abuso antes de abrir el registro
  anónimo al público.
