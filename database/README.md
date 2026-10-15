# Base de datos de Cogana

## Proyecto Supabase objetivo

- Nombre: `Cogana`
- Referencia: `mstcxtpjncozqztkawjg`
- Región: São Paulo, Americas (`sa-east-1`)
- Estado verificado: `ACTIVE_HEALTHY`
- Estado al crearse: sin tablas públicas y sin migraciones

El proyecto anterior `Solaris` queda intacto como referencia y no es el destino del nuevo desarrollo.

## Estado de implementación

Aplicado y verificado en el proyecto `Cogana`:

- 35 tablas públicas, todas con RLS.
- 1 tabla privada de idempotencia, con RLS y política explícita de denegación.
- 54 políticas públicas y 4 políticas de Storage.
- 3 buckets: `product-images`, `payment-proofs` y `delivery-evidence`.
- Organización inicial `Cogana`.
- Tienda `Cogana Santa Anita` (`03c25d8b-847f-4021-86bb-22d1955bbe6e`).
- Estado operativo inicial: `closed`.
- Cero errores del asesor de seguridad. Al habilitar Auth anónimo, el asesor
  marca como advertencia toda política dirigida a `authenticated`; las rutas de
  personal fueron endurecidas y probadas para rechazar `is_anonymous = true`.
- 10 wrappers RPC `SECURITY INVOKER` en `public`; toda lógica privilegiada
  permanece en 20 funciones de `private` con `search_path` vacío.
- Liberación automática de reservas vencidas cada minuto mediante `pg_cron`.
- Auth anónimo habilitado y validado contra el endpoint real de Supabase.
- Cuenta propietaria real creada y vinculada como `owner` activo de
  `Cogana Santa Anita`; el correo ya está confirmado.
- Catálogo provisional cargado: 11 categorías, 24 productos y 30
  presentaciones, con 30 precios iniciales y sin inventario inventado.
- Historial automático para cada alta o cambio de precio de presentación.

Migraciones remotas registradas:

1. `cogana_v2_initial_schema`
2. `payment_events_service_policy`
3. `cogana_v2_storage`
4. `bootstrap_cogana_store`
5. `checkout_fefo`
6. `inventory_lifecycle`
7. `payments_preparation`
8. `substitutions_fulfillment`
9. `operation_log_rls_policy`
10. `reservation_expiry_cron`
11. `rpc_idempotency_hardening`
12. `anonymous_staff_hardening`
13. `catalog_price_history`

## Operaciones transaccionales implementadas

- Checkout idempotente con cálculo entero para cantidad, importe y presentación.
- Reserva FEFO atómica para granel y paquetes sellados.
- Apertura idempotente de paquetes sellados hacia stock fraccionable.
- Vencimiento automático y liberación de reservas con `SKIP LOCKED`.
- Máquina de estados de pedido con transiciones validadas.
- Confirmación manual de Yape/Plin y abstracción privada para eventos de proveedor.
- Preparación por peso, consumo de lote, total final y ajustes/devoluciones pendientes.
- Propuesta, aceptación/rechazo y reasignación de stock por sustitución.
- Recojo y delivery completados mediante código; delivery también admite evidencia.

La referencia de llamadas y las pruebas ejecutadas están en
[`OPERATIONS.md`](OPERATIONS.md).

La suite reproducible está en
[`../supabase/tests/database/transactional_operations_test.sql`](../supabase/tests/database/transactional_operations_test.sql).

Las reglas de la fotografía inicial del catálogo están en
[`CATALOG.md`](CATALOG.md).

## Pendiente externo

Antes de abrir el registro anónimo al público debe incorporarse CAPTCHA o
Turnstile y ajustarse el límite de abuso. La autorización administrativa no
depende solamente del rol técnico `authenticated`: exige una membresía activa
`owner` o `admin` en la tienda.

La cuenta propietaria ya abrió el enlace de acceso de Supabase y Auth muestra
el correo como confirmado.

La protección contra contraseñas filtradas aparece deshabilitada en el asesor.
La cuenta inicial usa enlace mágico y no tiene contraseña, pero la protección
debe habilitarse antes de ofrecer inicio de sesión mediante contraseña.

Las observaciones actuales de rendimiento siguen siendo informativas: claves foráneas
compuestas no reconocidas como cubiertas por índices simples y todos los índices
marcados como no usados porque la base todavía no tiene tráfico. No deben
crearse o eliminarse índices mecánicamente antes de medir consultas reales.

## Archivos

- `cogana_v2_target_schema.sql`: esquema objetivo completo del MVP para una base limpia.
- `OPERATIONS.md`: contrato de RPC, seguridad y evidencia de pruebas.
- `CATALOG.md`: criterios del catálogo provisional y actualización futura.
- `seeds/20260918_initial_catalog_snapshot.sql`: carga idempotente del catálogo recibido.
- `../supabase/tests/database/transactional_operations_test.sql`: 27 pruebas pgTAP aisladas por rollback.
- `../docs/modelo-datos-v2.md`: decisiones, diagramas, estados y reglas de negocio.
- `../docs/diagnostico-mvp-supabase.md`: diagnóstico de la base Solaris existente.

## Importante

El esquema objetivo **no debe ejecutarse directamente sobre Solaris**. Las tablas actuales comparten varios nombres y contienen datos de prueba. El archivo sirve como contrato final para generar migraciones de transformación no destructivas.

## Orden de implementación

1. Crear un respaldo recuperable de Solaris.
2. Crear una rama de desarrollo de Supabase o un entorno local equivalente.
3. Generar cada migración con la CLI de Supabase cuando esté disponible.
4. Añadir primero tablas/columnas nuevas; no eliminar módulos antiguos.
5. Migrar datos útiles y validar cantidades/precios.
6. Implementar operaciones transaccionales de inventario, pedido y pago.
7. Aplicar privilegios y RLS.
8. Ejecutar pruebas de seguridad, concurrencia y asesores.
9. Promover a Solaris únicamente después de revisión.
10. Retirar objetos antiguos en una migración posterior y separada.

La creación de una rama de Supabase puede tener costo y requiere autorización explícita antes de realizarse.
