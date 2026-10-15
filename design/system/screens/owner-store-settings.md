# Cogana Owner/Admin Store Settings — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `399:2`; screen `399:3`;
in-page documentation `399:31`.

The 360×844 store settings overview separates identity/contact, operational
state and services, weekly hours, local-date exceptions, and delivery zones.
All sections say “por cargar”; this is not a closed store or empty schedule.
No setting is editable in the current design.

Data sources are `stores`, `store_settings`, `store_operational_state`,
`store_business_hours`, `store_schedule_exceptions`, and `delivery_zones`,
scoped to `store_id`. Hours and exceptions use the store timezone, and a local
exception can replace the regular day. Slot availability needs the combined
schedule, operating state, fulfillment flags and zone rules, not one field.
Changes require active owner/admin membership, validation of hours and fees,
and review of existing scheduled orders before enabling save.

Legal identity, tax ID and contact data need role-appropriate exposure. Loaded,
empty-confirmed, partial, permission-denied and error/offline states remain.
The screen and 500×1260 documentation were visually reviewed: 20 and 9 Inter
text nodes, respectively; five cards have 15 px bottom text space, with no
clipping or active mutation. The owner header remains a proposal.

## Continuación de alta fidelidad en el recorrido Owner/Admin

La página de recorrido `539:6` contiene «Tu tienda» `550:3`, «Cargando»
`573:2` y «Sin conexión» `573:29`, todas a 393 × 852 pt y con la dirección
fotográfica, crema/verde, Fraunces/Inter del flujo en revisión. Las dos
variantes se revisaron visualmente sin recortes a tamaño iPhone 16. En carga
no se afirma estado operativo, horario ni cobertura; sin conexión tampoco
se presentan valores anteriores como actuales. La fotografía es editorial y
«Santa Anita» es contexto de tienda de ejemplo, no identidad validada.
«Reintentar» solo conduce visualmente de sin conexión a cargando; no ejecuta
una consulta. Guardado y edición siguen deshabilitados. Faltan respuesta
autorizada owner/admin, lectura completa o parcial por sección, reglas de
horario y excepciones, validación de zonas y efecto sobre pedidos futuros.
