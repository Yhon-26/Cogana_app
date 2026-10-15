# Diagnóstico del MVP y de Supabase — Cogana

Fecha de revisión: 17 de septiembre de 2026  
Proyecto Supabase revisado: `Solaris` (`hcvrfmuheoaxaldmpzfr`)  
Alcance: lectura y diagnóstico. No se eliminaron tablas, datos, funciones, políticas ni archivos.

## 1. Conclusión ejecutiva

La base existente tiene fundamentos aprovechables, pero fue diseñada para una plataforma mucho más amplia que el primer lanzamiento de Cogana. Actualmente reúne comercio electrónico, punto de venta, caja, personal, sincronización fuera de línea, ventas empresariales, soporte, facturación, compras y múltiples tiendas.

Para el MVP no conviene continuar construyendo directamente sobre las 62 tablas y 95 funciones de aplicación existentes sin una reducción previa. La recomendación es conservar el núcleo de identidad, catálogo, inventario, pedidos y reparto; rediseñar las partes incompletas; y retirar del camino de ejecución los módulos que no se utilizarán todavía.

La estrategia recomendada es una **reestructuración controlada dentro de Solaris**, con respaldo previo, migraciones nuevas y una etapa de compatibilidad. No se recomienda borrar objetos inmediatamente ni intentar adaptar la aplicación a todo el modelo anterior.

## 2. Estado actual comprobado

### Proyecto local

La carpeta contiene material de definición y prototipos, pero todavía no existe una aplicación ejecutable:

- un documento PDF con la lógica anterior;
- seis prototipos HTML y sus imágenes;
- una hoja de estilos compartida;
- imágenes renderizadas para revisión del PDF.

No hay todavía proyecto Android, PWA, API, pruebas automatizadas ni configuración local versionada de Supabase. Esto es favorable para la reestructuración: todavía no existe código de producción que dependa del modelo sobredimensionado.

### Base de datos

- 62 tablas en `public`, todas con RLS activado.
- 29 migraciones aplicadas.
- 87 políticas RLS, todas destinadas a `authenticated`; ninguna política de tablas para `anon`.
- 46 funciones propias en `public`; las 46 usan `SECURITY DEFINER`.
- 49 funciones propias en `private`; 48 usan `SECURITY DEFINER`.
- 4 buckets de Storage: `avatars`, `product-images`, `delivery-evidence` y `support-evidence`.
- 1 Edge Function activa: `delete-account`, con verificación JWT.
- Datos actuales pequeños y propios de pruebas: 1 organización, 1 tienda, 8 productos, 10 pedidos, 21 ítems y 8 movimientos de inventario, entre otros.
- No existen lotes registrados, presentaciones de producto ni imágenes de productos.

## 3. Lo que sí está bien encaminado

- Separación por organización y tienda, útil para permitir marcas independientes en el futuro.
- Uso de enteros para dinero y cantidades, evitando errores de decimales.
- Soporte base para productos por gramos o unidades.
- Presentaciones previstas para paquetes, cajas y sacos.
- Historial de precios e inventario.
- Pedidos con recojo o delivery, dirección, zona y horario programado.
- Historial de estados, sustituciones y reservas de inventario.
- RLS activado en todas las tablas públicas.
- Imágenes de producto en un bucket público separado; evidencias de entrega en un bucket privado.
- Operaciones importantes con identificadores de idempotencia y control de versión.

Estas piezas deben aprovecharse conceptualmente, aunque varias necesitan simplificación o ajustes de seguridad.

## 4. Brechas que bloquean el MVP acordado

### 4.1 Compra sin cuenta

El catálogo y la creación de pedidos requieren actualmente una cuenta autenticada y un registro previo de cliente. La función `get_online_catalog` exige que el usuario ya sea cliente de la tienda y `create_online_order` devuelve el error “Cuenta de cliente requerida” si no existe sesión.

La solución recomendada es habilitar inicio de sesión anónimo de Supabase para la sesión de compra. Para el comprador sigue siendo una compra sin registro, mientras que internamente se obtiene un identificador seguro. Después de la compra se puede enlazar teléfono o correo y convertir esa identidad anónima en una cuenta permanente. Las políticas deberán distinguir el claim `is_anonymous`, porque estos usuarios emplean el rol `authenticated`.

### 4.2 Catálogo público

No existe acceso de lectura al catálogo para visitantes. Las políticas actuales de productos, categorías, presentaciones, promociones y zonas sólo permiten miembros o clientes autenticados.

Debe crearse una superficie pública mínima que entregue únicamente:

- productos activos y disponibles;
- precio de venta y presentaciones;
- imágenes;
- categorías;
- promociones publicadas;
- zonas, costos y tiempos de delivery;
- estado operativo visible de la tienda.

Nunca deben exponerse costo, stock exacto interno, proveedores, lotes ni datos administrativos.

### 4.3 Venta por monto libre

El modelo calcula correctamente un precio proporcional a gramos, pero el pedido sólo almacena `requested_quantity`. No distingue si el cliente pidió “S/ 3 de arroz” o “750 gramos”.

`order_items` debe guardar también el modo de solicitud y el valor ingresado, por ejemplo:

- `request_mode`: `quantity`, `money` o `presentation`;
- `requested_money_cents` cuando corresponda;
- `presentation_id` cuando se compre un saco o paquete;
- cantidad estimada y cantidad finalmente preparada.

Esto permitirá mostrar y auditar exactamente lo que pidió el cliente, incluso cuando el peso final varíe.

### 4.4 Sacos cerrados y producto a granel

Las presentaciones permiten definir un saco de 50 kg, pero no existe información que diferencie sacos todavía sellados de cantidad ya abierta para venta a granel. Descontar únicamente gramos del stock total puede ofrecer un saco cerrado que físicamente ya fue abierto.

El inventario debe registrar contenedores o disponibilidad sellada por lote. Abrir un saco será un movimiento explícito: reduce una unidad sellada y aumenta la cantidad disponible a granel dentro del mismo lote.

### 4.5 Lotes, vencimiento y FEFO

Existe `inventory_lots`, pero cada lote obliga actualmente a tener proveedor y orden de compra. Para el MVP debe ser posible registrar una entrada rápida aunque aún no se use el módulo completo de compras.

Además, las reservas de pedidos se relacionan sólo con el producto, no con el lote. Por ello no se puede asegurar FEFO ni saber de qué lote salió cada venta.

Se necesita:

- permitir recepción rápida con proveedor y orden opcionales;
- asignar reserva y consumo a uno o varios lotes;
- elegir primero el lote que vence antes;
- bloquear lotes vencidos;
- alertar próximos vencimientos;
- registrar merma y ajuste por lote.

### 4.6 Pagos

Actualmente el pedido sólo tiene método, referencia y estado de pago. `order_payment_history` es un historial de estados, no un registro completo de transacciones. No existen intentos de pago, proveedor, identificador externo, conciliación, webhook, devolución parcial ni protección específica contra eventos duplicados.

También se permite efectivo tanto para delivery como para recojo, contrario a la decisión del producto.

Debe incorporarse un registro transaccional de pagos y aplicar estas reglas:

- efectivo únicamente para recojo;
- Yape/Plin con verificación manual inicialmente o integración formal posterior;
- tarjeta mediante proveedor certificado; Cogana nunca almacena datos de tarjeta;
- pedido confirmado sólo después del pago, salvo recojo en efectivo aprobado;
- webhooks idempotentes;
- devoluciones y diferencias por peso trazables;
- vencimiento y liberación automática de reservas de pedidos impagos.

### 4.7 Horarios y operación diaria

El horario se guarda en un único campo de texto. No puede representar reglas semanales, cierres excepcionales, apertura tardía, pausa temporal ni el momento en que el dueño inicia la atención.

Se requiere modelar:

- horario semanal;
- excepciones por fecha;
- estado operativo: cerrado, recibiendo pedidos, atendiendo o pausado;
- hora estimada de reapertura;
- preparación iniciada manualmente;
- cálculo de tiempos que empiece cuando la tienda esté atendiendo.

### 4.8 Promociones

La tabla actual sólo guarda título, descripción, cupón y vigencia. No define qué productos participan ni cómo calcular el beneficio.

Para una primera versión debe soportar, como mínimo:

- descuento fijo o porcentual por producto;
- precio por cantidad;
- monto mínimo;
- delivery gratis;
- límites de uso y vigencia.

Los combos y reglas complejas pueden quedar para una versión posterior.

### 4.9 Sustituciones

La base ya guarda política y propuestas de sustitución, pero falta completar:

- límite de aumento autorizado por el cliente;
- precio y cantidad de la propuesta;
- vencimiento de la propuesta;
- diferencia a cobrar o devolver;
- decisión automática cuando el cliente autorizó una alternativa compatible.

### 4.10 Reservas abandonadas

Los pedidos reservan inventario, pero el esquema no tiene una expiración visible para reservas pendientes. Un pedido sin pago podría inmovilizar stock indefinidamente.

Cada reserva debe tener `expires_at` y una liberación segura, automática e idempotente.

## 5. Clasificación de las 62 tablas

La clasificación expresa el destino funcional recomendado. “Retirar del MVP” no significa borrar ahora.

### A. Conservar y adaptar para el MVP — 28

| Área | Tablas | Decisión principal |
|---|---|---|
| Marca y acceso | `organizations`, `stores`, `profiles`, `store_memberships` | Mantener la separación por tienda; simplificar roles iniciales a propietario y repartidor. |
| Catálogo | `categories`, `products`, `product_presentations`, `product_images`, `price_history` | Añadir modos de venta, disponibilidad visible y reglas para saco/granel. |
| Inventario | `suppliers`, `inventory_lots`, `inventory_movements` | Hacer proveedor opcional en recepción rápida y volver los movimientos conscientes del lote. |
| Clientes | `customers`, `customer_addresses`, `customer_preferences` | Admitir identidad anónima y posterior conversión a cuenta. |
| Pedidos | `orders`, `order_items`, `order_status_history`, `order_substitutions`, `order_inventory_reservations`, `order_payment_history`, `order_incidents` | Simplificar estados y rediseñar pago, reservas por lote y sustituciones. |
| Entrega | `delivery_zones`, `delivery_assignments`, `delivery_events` | Mantener reparto propio y preparar extensión futura. |
| Configuración y marketing | `store_settings`, `promotions` | Reemplazar horario en texto y completar reglas de promoción. |
| Privacidad | `account_deletion_requests` | Mantener junto con la Edge Function existente. |

### B. Posponer para fases posteriores — 20

| Área futura | Tablas |
|---|---|
| Favoritos | `customer_favorites` |
| Operadores logísticos externos | `delivery_operators` |
| Facturación electrónica | `fiscal_integrations`, `fiscal_documents` |
| Compras y conteos avanzados | `purchase_orders`, `purchase_order_items`, `physical_counts`, `physical_count_items` |
| Comercio empresarial | `business_accounts`, `business_members`, `business_prices`, `business_quotes`, `business_quote_items`, `business_documents`, `recurring_orders` |
| Mesa de ayuda interna | `support_tickets`, `support_messages` |
| Permisos configurables | `role_permissions` |
| Personal | `work_shifts`, `attendance_entries` |

Los datos y funciones de estos módulos deben quedar inactivos y fuera de la aplicación, no mezclados con el flujo inicial.

### C. Retirar del modelo objetivo del MVP — 14

| Motivo | Tablas |
|---|---|
| Caja no requerida | `cash_sessions`, `cash_movements`, `cash_difference_reviews` |
| POS y venta presencial duplican el dominio de pedidos | `sales`, `sale_items`, `sale_payments`, `sale_status_history`, `sale_returns`, `sale_return_items` |
| Sincronización fuera de línea prematura | `devices`, `device_sync_state`, `sync_outbox`, `sync_operations`, `change_log` |

La app inicial será online-first. Las notificaciones push no necesitan conservar este sistema de dispositivos y sincronización; se pueden modelar después con una tabla mucho más pequeña de tokens de notificación.

## 6. Diagnóstico de seguridad

Los asesores de Supabase reportan 51 observaciones agrupadas en cuatro tipos:

- 3 funciones `SECURITY DEFINER` ejecutables por `anon`: `adjust_inventory`, `change_product_price` y `handle_new_user`;
- 45 funciones `SECURITY DEFINER` ejecutables por usuarios autenticados;
- `pgtap` y `pgcrypto` instaladas en `public`;
- protección contra contraseñas filtradas desactivada.

Las dos primeras funciones administrativas comprueban sesión y permisos internamente, pero no deben seguir expuestas al rol anónimo. La corrección prioritaria será revocar permisos innecesarios y reducir el número de endpoints privilegiados.

También existen 35 funciones en `private` ejecutables por `anon` y `authenticated`. Aunque ese esquema no está expuesto normalmente por la API, deben revocarse esos permisos como defensa adicional y dejar ejecutables únicamente las funciones que realmente lo necesiten.

Recomendaciones obligatorias antes de conectar la nueva aplicación:

1. Revocar `EXECUTE` general y concederlo por función y rol.
2. Mantener `SECURITY DEFINER` sólo cuando sea imprescindible, con verificación interna de usuario/tienda y `search_path` seguro.
3. Separar funciones públicas de funciones internas y triggers.
4. Revisar RLS considerando que los usuarios anónimos de Supabase usan el rol `authenticated`.
5. Activar protección contra contraseñas filtradas.
6. Mover extensiones fuera de `public` cuando sea compatible y esté probado.
7. Revisar el bucket `avatars`: hoy es público, aunque sus políticas se comportan como si fuera privado.

## 7. Diagnóstico de rendimiento

Los asesores reportan:

- 140 claves foráneas sin índice;
- 21 políticas con evaluación no optimizada de funciones de autenticación;
- 37 índices sin uso;
- 1 caso de múltiples políticas permisivas.

No conviene crear 140 índices automáticamente. Gran parte del ruido desaparecerá al retirar módulos ajenos al MVP. Después de consolidar el esquema se indexarán únicamente relaciones y consultas reales: catálogo, pedidos por estado/fecha, lotes por vencimiento, reservas activas y entregas pendientes.

Los índices marcados como no usados tampoco deben borrarse por esa señal solamente, porque la base tiene muy pocos datos y aún no recibe tráfico real.

## 8. Modelo objetivo recomendado

El modelo final del MVP debe organizarse en estos bloques:

1. **Tienda e identidad**: organización, tienda, perfiles y membresías.
2. **Catálogo**: categorías, productos, presentaciones, imágenes y precios.
3. **Inventario trazable**: lotes, contenedores sellados/granel, movimientos y asignaciones FEFO.
4. **Cliente invitado o registrado**: cliente, direcciones y preferencias.
5. **Pedido**: pedido, ítems, estados, sustituciones y reservas con expiración.
6. **Pago**: transacciones, eventos del proveedor, conciliación y devoluciones.
7. **Operación**: horario semanal, excepciones y estado diario de atención.
8. **Entrega**: zonas, asignaciones, eventos y comprobación de entrega.
9. **Marketing básico**: promociones y productos/reglas participantes.

Nuevas estructuras necesarias:

- horarios semanales y excepciones;
- estado operativo de la tienda;
- asignación de inventario por lote;
- distinción entre saco sellado y producto abierto;
- transacciones y eventos de pago;
- reglas/objetivos de promociones;
- expiración de reservas;
- campos de solicitud por dinero, cantidad o presentación.

## 9. Estrategia de reestructuración

### Etapa 1 — Congelar y respaldar

- Exportar esquema y datos actuales.
- Generar tipos actuales como referencia.
- Identificar los cuatro perfiles y diez pedidos de prueba.
- No usar todavía datos reales de clientes.

### Etapa 2 — Diseñar la versión 2

- Definir el diagrama entidad-relación del MVP.
- Definir estados de pedido y pago por separado.
- Definir unidades, redondeos y reglas de precio.
- Definir acceso de invitado, cliente, propietario y repartidor.

### Etapa 3 — Migración no destructiva

- Añadir las estructuras nuevas.
- Adaptar las 28 tablas conservadas.
- Deshabilitar el acceso a módulos pospuestos.
- migrar únicamente los datos de prueba útiles;
- mantener temporalmente tablas antiguas con nombres o esquemas claramente archivados si una migración depende de ellas.

### Etapa 4 — Seguridad y pruebas

- Probar RLS por cada rol, incluida una identidad anónima.
- Probar que una tienda nunca pueda leer datos de otra.
- Probar pago duplicado, pedido duplicado y webhook duplicado.
- Probar dos clientes intentando comprar el último stock.
- Probar vencimiento, FEFO, apertura de saco, merma y cancelación.
- Ejecutar nuevamente los asesores de seguridad y rendimiento.

### Etapa 5 — Limpieza final

Sólo después de validar la aplicación se crearán migraciones para retirar tablas y funciones antiguas. Cada eliminación deberá estar precedida por una comprobación de dependencias y un respaldo recuperable.

## 10. Decisión final de esta etapa

La base actual **no debe desecharse por completo**, pero tampoco debe tomarse como arquitectura definitiva. Aproximadamente 28 tablas representan conceptos útiles, 20 pertenecen a etapas futuras y 14 responden a caja/POS/sincronización que no forman parte del producto actual.

La siguiente etapa debe comenzar con el **diagrama de datos v2 del MVP**, seguido por una especificación de estados y reglas de negocio. Después de aprobar ambos se podrá escribir la primera migración de reestructuración sin poner en riesgo la base existente.

## Referencias técnicas verificadas

- Inicio de sesión anónimo y conversión posterior de identidad: https://supabase.com/docs/guides/auth/auth-anonymous
- Funciones `SECURITY DEFINER` accesibles por anónimos: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- Funciones `SECURITY DEFINER` accesibles por autenticados: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Extensiones instaladas en `public`: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- Protección de contraseñas: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Claves foráneas sin índice: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
- Optimización de RLS: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
