# Cogana Owner/Admin Payments & Reconciliation — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `399:41`; screen `399:42`;
in-page documentation `399:70`.

The 360×844 overview separates order/payment states, transactions,
adjustments, and reconciliation. “Por cargar” is not zero due or paid. No
payment amount or financial action is fabricated.

`orders.status` and `orders.payment_status` are independent;
`payment_transactions` contains charge, refund and adjustment records with
their own status. Pending/processing transactions are not succeeded, and a
pending refund is not completed. `payment_events` is service/server-only and
must never be read directly in the client or exposed as raw payload. The
schema has no bank-settlement reconciliation source or completed reconciliation
contract: define matching, periods, reversals and discrepancies before labeling
anything “conciliado”. Owner/admin gating is required even though order-based
RLS can permit the requester or other store members to read transactions.

Do not expose provider references, idempotency keys, proof paths or raw IDs.
Loaded/partial/error states and authorized, idempotent actions remain. The
screen and 500×1260 documentation were visually reviewed: 20 and 9 Inter text
nodes; five cards have 15 px bottom text space and no clipping or fake totals.

## Continuación de alta fidelidad en el recorrido Owner/Admin

La hoja `539:6` contiene Pagos de ejemplo `550:4`, Pagos cargando `578:2`
y Pagos sin conexión `578:33`, a 393 × 852 pt. Las dos variantes nuevas
mantienen Fraunces/Inter y la paleta Cogana; se revisaron visualmente sin
recortes. Sustituyen la cifra y el pedido ficticios por guiones y mensajes
de consulta: un guion nunca es cero, pago exitoso ni conciliación. El
estado de pedido y el de pago siguen separados. No se exponen referencias,
eventos privados, identificadores ni importes sin lectura autorizada.

«Reintentar» enlaza de sin conexión a cargando únicamente en Figma. No hay
consulta, cobro, devolución, conciliación ni exportación conectados. La
fuente bancaria y el contrato de conciliación siguen pendientes, igual que
la autorización owner/admin por tienda y estados parciales/cargados reales.
