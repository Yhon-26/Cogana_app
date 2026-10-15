# Zonas de entrega — 30 septiembre 2026

Configuración autorizada y aplicada a `cogana-santa-anita` mediante `20260930090509_delivery_zone_pricing.sql`:

| Zona | Envío | Mínimo de productos |
| --- | --- | --- |
| Los Ficus y Universal | S/ 4.00 | S/ 30.00 |
| Resto de Santa Anita | S/ 6.00 | S/ 40.00 |

La zona 2 excluye Los Ficus y Universal. La selección es manual: no hay polígonos ni verificación geográfica automática. Los ETA quedan nulos (ambos o ninguno); una franja de entrega no representa tiempo de traslado.

`get_customer_delivery_zones` expone exclusivamente zonas activas de tiendas activas. `services/customer/deliveryZones.ts` valida la respuesta; `useDeliveryZones` recarga al enfocar la pantalla y descarta tarifas anteriores cuando falla la consulta. El borrador guarda el UUID de zona, sin persistir precios.

Datos de entrega exige seleccionar zona; revisión muestra envío, total y cuánto falta para el mínimo. No permite avanzar con zona ausente/inactiva o subtotal insuficiente. Pago comparte la tarifa actual; recojo conserva envío gratuito. El mínimo excluye envío. El servidor ya reconsulta tarifa y mínimo en `private.create_checkout_order`; al conectar el envío definitivo deberá incluirse `delivery_zone_id` desde el borrador, sin confiar en precios del cliente.

Verificado: lectura como anon con tarifas 400/600 y mínimos 3000/4000 céntimos; tienda desconocida sin resultados; zonas inactivas ocultas; sin USAGE de anon al esquema privado. Regresión reproducible: `database/tests/customer_delivery_zones.sql` (rollback). Revisión visual en emulador pendiente. No se activó el cobro ni se crearon pedidos.

El asesor de seguridad continúa mostrando avisos de [políticas para authenticated](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins), [RLS sin políticas en una tabla privada](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) y [protección de contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No se declara auditoría global limpia.

Pendiente de checkout completo: plazo de reserva/pago, creación autenticada e idempotente del pedido, existencias reales y validación del flujo completo. No duplicar pantallas para cada zona.
