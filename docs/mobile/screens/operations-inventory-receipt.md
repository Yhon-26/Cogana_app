# Operaciones · Carga de inventario real y apertura de tienda

Fecha: 3 de octubre de 2026

## Registrar entrada (`/inventario/movimiento`)

Reemplaza el borrador deshabilitado de Figma `641:63`. La ruta abre
`OperationsReceiptScreen` con el producto elegido desde Inventario.

- Formulario real: código de lote (sugerido `L-AAAAMMDD`, editable),
  vencimiento opcional `AAAA-MM-DD`, cantidad suelta en unidades base del
  producto (gramos/mililitros/unidades según `base_unit`), paquetes sellados
  por cada presentación `is_sealed` activa, y notas opcionales.
- Escribe vía RPC `receive_inventory_lot` (owner/admin, idempotente por
  `operation_id`): crea el lote `available`, inserta las filas de
  `inventory_lot_packages` y registra el movimiento `receipt` en una sola
  transacción. El `operation_id` se conserva entre reintentos y se renueva
  tras un registro exitoso.
- El código de lote debe ser nuevo por producto; repetir uno existente
  devuelve error claro (reabastecer = lote nuevo).
- Tras registrar: panel de confirmación con el resumen y enlace al
  inventario. El listado de inventario ahora se recarga al recuperar el
  foco, así que el nuevo stock aparece al volver.
- Nota visible en pantalla: el lote entra disponible al catálogo público de
  inmediato; los paquetes sellados se venden completos y pueden abrirse a
  granel después (esa conversión todavía no tiene pantalla).

## Estado operativo (`/gestion/tienda`)

Nueva sección «Estado operativo» (`StoreStateControl`) al pie de Tu tienda:

- Muestra el estado persistido (`store_operational_state.status`) con las
  etiquetas de `storeStatus.ts`.
- Acciones: **Abrir tienda** (`accepting_orders`), **Pausar pedidos**
  (`paused`) y **Cerrar tienda** (`closed`, con confirmación). La acción del
  estado actual queda marcada «· actual» y deshabilitada.
- Escritura directa con upsert sobre `store_operational_state` registrando
  `changed_by`; la RLS solo permite insert/update a owner/admin. No hay RPC:
  el guard de checkout en la base sigue exigiendo franja futura publicada,
  cupo y tienda aceptando pedidos por cada pedido nuevo.

## Corrección incluida

- El listado de inventario filtraba lotes por `status = 'active'`, un valor
  que no existe (los válidos son `available/blocked/expired/depleted`): con
  stock real seguiría mostrando «Sin stock». Corregido a `available`.
- Si una recarga al foco falla con datos previos, la lista se conserva y
  muestra el aviso «esta información puede estar desactualizada».

## Pendiente para probar en vivo

La RPC `receive_inventory_lot` aún no existe en el proyecto remoto
(`mstcxtpjncozqztkawjg`): hay que ejecutar
`database/migrations/20261003120000_inventory_receipt.sql` en el SQL editor y
regenerar `src/types/database.generated.ts`
(`npx supabase gen types typescript --project-id mstcxtpjncozqztkawjg ...`).
Mientras tanto la app compila (`npm run check` limpio) pero el registro de
entrada fallará con «Could not find the function receive_inventory_lot».

Ojo: los tipos generados del 30-09 revelan funciones remotas no documentadas
en este repositorio (`register_inventory_lot`, `adjust_inventory_lot`,
`save_store_configuration`, `save_promotion_admin`, `get_admin_report`,
`set_fulfillment_rules`, `report_customer_payment`). Se crearon directamente
en el proyecto remoto en sesiones anteriores. Si al aplicar la migración se
encuentra que `register_inventory_lot` ya cubre la entrada de lotes, se puede
evaluar retirar la RPC nueva; la del repositorio es un superconjunto (agrupa
paquetes sellados y vencimiento/proveedor opcionales) y sigue el patrón de
seguridad documentado.

Validación estática: `npm run check` sin errores ni avisos. Falta la prueba
en AVD con sesión owner después de aplicar la migración.
