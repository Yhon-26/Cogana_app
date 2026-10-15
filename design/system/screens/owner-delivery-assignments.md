# Cogana Owner/Admin Delivery Assignments — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `399:80`; screen `399:81`;
in-page documentation `399:109`.

The 360×844 overview separates ready-for-delivery orders, assignments,
tracking events and evidence. It contains no real orders, drivers, confirmation
codes or active assignment/completion controls.

`private.assign_delivery` requires active owner/admin authorization, a delivery
order in `ready_for_delivery`, an eligible active store member as driver, and
an idempotent operation. `delivery_assignments.status` and `orders.status` are
distinct; assignment or departure is not completed delivery. The generated
code and `confirmation_code_hash` are sensitive and must not appear in lists,
analytics or screenshots. Restrict recipient, address and driver details to
task-relevant authorized viewers. Participant RLS is not an Owner/Admin gate.

Selection, failure handling, evidence review and server-side completion remain
to be designed and connected. Loaded, empty-confirmed, no-eligible-driver,
partial, permission-denied and error states remain. Screen and 500×1260 docs
were visually reviewed: 20 and 9 Inter text nodes; five cards have 15 px
bottom text space, without clipping or fake assignments.

## Continuación de alta fidelidad en el recorrido Owner/Admin

La hoja `539:6` contiene Reparto de ejemplo `550:5`, Reparto cargando
`583:2` y Reparto sin conexión `583:32`, a 393 × 852 pt. Las dos variantes
nuevas conservan la fotografía editorial de menestras y la identidad
Fraunces/Inter; se revisaron visualmente sin recortes. Sustituyen el pedido
ficticio y el punto de progreso «Listo» por mensajes neutrales de consulta.
Ni carga ni error prueban que exista un pedido elegible, un conductor activo,
una asignación o una entrega finalizada. La foto no es prueba operativa.

«Reintentar» enlaza de sin conexión a cargando únicamente en Figma.
Asignación y finalización siguen deshabilitadas: necesitan autorización
owner/admin por tienda, pedido `ready_for_delivery`, conductor elegible,
operación idempotente, manejo de fallos y privacidad de códigos/evidencias.
