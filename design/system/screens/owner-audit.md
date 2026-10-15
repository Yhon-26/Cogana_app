# Cogana Owner/Admin Operational Audit — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `399:119`; screen `399:120`;
in-page documentation `399:148`.

The 360×844 overview groups inventory, catalog/store, order/delivery and
payment traces. It explicitly calls audit coverage partial: the schema has no
unified audit log, and several `store_*` tables do not record a historical row
for every change. “Por cargar” is not an empty or complete history.

Potential sources include `inventory_movements`, `product_price_history`,
`order_status_history`, `delivery_events`, `payment_transactions` and selected
current store fields. `payment_events` payload is server-only and cannot be
queried by the client. Never infer an unrecorded action or actor from an
`updated_at` timestamp. A future viewer needs owner/admin gate, store/time
scoping, pagination, source and coverage labels, controlled access to actor
identity, and retention/export rules. Minimize contacts, addresses, precise
locations, codes, hashes, provider references and proofs.

Queries, filters, export, partial-source and error states remain unimplemented.
The screen and 500×1260 documentation were visually reviewed: 20 and 9 Inter
text nodes; five cards have 15 px bottom text space, no clipping, active
controls or invented events.

## Recorrido Owner/Admin de alta fidelidad (fase 7.5)

En la página compartida `539:6`, la vista de Actividad `550:6` tiene ahora dos
variantes de 393×852 pt: Cargando `591:2` y Sin conexión `591:32`. Conservan
la identidad crema/verde y Fraunces/Inter del recorrido, sin documentación
adyacente en el lienzo. Las tarjetas de pedidos/reparto, catálogo/precios e
inventario identifican posibles fuentes, no filas de una bitácora completa.

- Cargando anuncia consulta en curso; no muestra eventos, actores, totales ni
  un vacío confirmado. Exportar permanece inactivo.
- Sin conexión deja explícito que no hay lectura actual, lo cual **no** prueba
  ausencia de cambios. «Reintentar» enlaza únicamente a Cargando dentro del
  prototipo; no ejecuta consulta ni exportación.
- El acceso de producción exige rol owner/admin activo en la tienda; además
  faltan contrato de cobertura por fuente, periodo, paginación, errores
  parciales, retención y reglas de privacidad. No inferir un evento ni un
  actor desde `updated_at`, ni exponer payloads privados o identificadores.

Las dos variantes se revisaron a tamaño iPhone 16, sin texto recortado. Sus
tres enlaces (dos «Volver» y un «Reintentar») apuntan a pantallas existentes y
tienen objetivos de al menos 44 pt. Son diseño visual, no auditoría funcional.
