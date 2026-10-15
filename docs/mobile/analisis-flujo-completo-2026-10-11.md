# Análisis del flujo comercial completo de Cogana

Fecha: 11-10-2026, America/Lima. Aplicación móvil: `C:\Cogana_app`. Backend verificado: `mstcxtpjncozqztkawjg`.

## Diagnóstico

Cogana tiene catálogo real, selección de productos, carrito local, acceso OTP, creación transaccional de pedidos y pago manual implementados. Todavía no tiene un recorrido móvil completo y validado desde agregar productos hasta entregar o recoger y cerrar el pedido. Hay bloqueos de datos operativos, una función de inventario sin desplegar, un error de navegación en la cola de pagos y funciones posteriores al pago que no están conectadas a las pantallas.

Esta revisión contrastó código, migraciones locales, funciones y datos agregados desplegados, API públicas con la clave del cliente y comprobaciones locales. No creó usuarios, no envió OTP, no creó pedidos, no registró pagos ni cambió configuración de negocio. No auditó el código del proyecto desktop. La exportación Android regeneró `dist`; no se cambió el código de la app.

## Estado actual comprobado en Supabase

| Elemento | Estado observado | Consecuencia |
| --- | --- | --- |
| Proyecto | `ACTIVE_HEALTHY`; API públicas responden HTTP 200 | La conexión existe y funciona para las lecturas examinadas. |
| Catálogo público | 24 productos, 30 presentaciones | Los productos y precios vienen del backend. |
| Stock público | 0 presentaciones con `available_quantity > 0` | Actualmente no se puede agregar un producto vendible. |
| Lotes | 1 lote, 100 unidades sueltas de SKU `QA-REV-001`, sin paquetes sellados ni presentación activa no sellada | Tener este lote no abastece las presentaciones publicadas del catálogo. |
| Tienda | Activa, estado operativo `closed` | Los pedidos nuevos no están habilitados. |
| Horario habitual | Los 7 días, 07:00–20:00 | El horario configurado no implica apertura operativa. |
| Franjas | 0 para delivery y 0 para recojo en los próximos 7 días | No hay franja seleccionable para completar checkout. |
| Zonas | 2 activas: Los Ficus/Universal, S/4 y mínimo S/30; resto de Santa Anita, S/6 y mínimo S/40 | No falta crear las zonas iniciales. Su selección no acredita verificación geográfica de una calle. |
| Reglas | Recojo: 30 min, 8 pedidos, 45 min de anticipación. Delivery: 60 min, 4 por repartidor, 90 min, 2 repartidores configurados | Ya existe un contrato de capacidad y anticipación. |
| Personal | 1 membresía activa owner; 0 driver | La cifra de repartidores configurada no demuestra que existan usuarios autorizados para repartir. |
| Pagos | Yape/Plin y efectivo para recojo habilitados; plazo digital de 15 min | Es pago manual con verificación de la tienda. |
| Auth público | `email:true`, `phone:true`, registro habilitado | No demuestra entrega real ni recepción del OTP. |
| Pedidos | 0 | No hay evidencia de una compra completa persistida en este proyecto. |
| Granel público | 0 presentaciones no selladas o con entrada por peso/monto | La lógica cliente existe, pero esa modalidad no está publicada actualmente. |
| Imágenes/descripciones | 2 de 30 presentaciones tienen ruta de imagen remota; 0 tienen descripción | Completar contenido comercial; las imágenes locales de referencia no son fotos finales verificadas. |
| Vencimiento de reservas | Cron cada minuto activo; 3 ejecuciones recientes `succeeded` | El worker existe; no sustituye una prueba real de vencimiento de un pedido. |

Las cifras son una fotografía de esta revisión, no una garantía de estado futuro.

## Recorrido por función

| Etapa | Implementación actual | Falta para cerrar el flujo |
| --- | --- | --- |
| Bienvenida, tienda, categorías y búsqueda | Navegación y lectura del catálogo real | Contenido final, inventario y comunicación clara de apertura/modalidades. |
| Selección de presentación | Detalle conectado a `addToCart`; cantidad y límites de stock | Abastecer presentaciones publicadas. Inicio no entrega `onAdd` a `ProductTile`: se agrega desde el detalle. |
| Peso/monto | Parseo entero, mínimos, incrementos, redondeo y payload de intención | Publicar presentación compatible y stock suelto; conectar preparación con peso real y diferencias de pago. |
| Carrito | Agregar, cambiar cantidad, retirar; recalcula contra catálogo | Persistencia tras reinicio y recuperación coherente por cuenta/tienda. Agregar no reserva stock. |
| Acceso | Correo/celular OTP, reenvío, validación; cliente separado de sesión de equipo | Prueba privada con destinatarios reales, plantilla de correo con código y proveedor SMS de producción. |
| Sesión | SecureStore nativo, refresco en primer plano, cierre de sesión | Verificar expiración, segundo arranque y cambio de identidad; el borrador no debe pasar a otra cuenta. |
| Delivery | Dirección manual, zona, mínimos, tarifa y selección de franja | Datos operativos; validar cobertura declarada y recorrido con cuenta real. |
| Recojo | Selector y pantalla de pago compartida existen | Continuación deshabilitada; completar contacto, franja, revisión, pago, código y entrega. |
| Crear pedido | `submit_customer_order`, intención sin precios, UUID estable y recuperación de respuesta perdida | Prueba móvil completa con stock/franja/sesión; comprobar carreras y reintentos contra servidor. |
| Pagar | Instrucciones reales, plazo, referencia, consulta cada 15 s | Corregir acceso a revisión del pago en móvil; cerrar rechazo, pagos tardíos y reservas retenidas. |
| Mis pedidos | Lista real por identidad bajo RLS | Detalle comercial y seguimiento reales; actualmente abre la pantalla de pago. |
| Preparación | Cola y artículos se leen por tienda | Acciones de confirmar, preparar, registrar resultados, finalizar cantidades y dejar listo. |
| Sustituciones | RPC desplegadas; pantalla cliente de ejemplo | Propuesta real, aceptación/rechazo, vencimiento y efectos en reserva/importe. |
| Reparto | Consulta de pedidos y asignaciones | Usuario driver, asignación efectiva, salida, incidencias y comprobación de entrega. |
| Completar recojo/entrega | RPC específicas desplegadas | Servicios y UI móviles, código/evidencia y cierre consistente de stock/pago/historial. |
| Direcciones, preferencias, privacidad | Vistas de preparación | Direcciones CRUD, preferencias persistentes y solicitud/procesamiento de eliminación. |
| Notificaciones | Pantalla informativa sin bandeja ni envío push | Avisos de pago, preparación, sustitución y entrega. El polling de pago no cubre todo el pedido. |

## Bloqueos y defectos concretos

### 1. Entrada de inventario móvil sin función remota

`src/services/operations/inventory.ts:47` llama a `receive_inventory_lot`. Existe la migración local `database/migrations/20261003120000_inventory_receipt.sql`, pero no aparece en las migraciones desplegadas y no existe esa función en `public` ni en `private`. El backend dispone de `register_inventory_lot`, con otro contrato. No basta que los tipos locales declaren la función.

Trabajo requerido: revisar el contrato de entrada, resolver su despliegue o adaptar de forma explícita el cliente al contrato existente; verificar owner/admin, cantidades, lotes, paquetes, vencimientos e idempotencia. Luego registrar existencias físicas correctas por presentación. No inventar stock para activar un botón.

### 2. Los pagos digitales no aparecen en la cola revisable

El checkout crea la transacción Yape/Plin en `requires_action`. `report_customer_payment`, confirmado también en su definición desplegada, la cambia a `processing`. Sin embargo, `src/features/operations/management/ManagementScreen.tsx:185` filtra «Por revisar» únicamente por `pending`. «Movimientos recientes» muestra las otras filas sin enlace.

`PaymentReviewAction` y `confirm_manual_payment` sí existen y admiten la revisión de esos estados, pero la navegación normal no lleva a ella desde esa lista. Esto impide completar el recorrido manual desde la cola móvil. Corregir la clasificación y los enlaces, y verificar estados sin mezclar cobros, ajustes y devoluciones.

Al informar una referencia, las reservas pasan a vencimiento infinito mientras la tienda revisa. La ausencia de una acción operativa de rechazo/cancelación deja un riesgo concreto de stock retenido. No se debe considerar una referencia como dinero recibido.

### 3. Recojo incompleto y código sin tratamiento cliente

`src/features/customer/checkout/FulfillmentScreen.tsx:113` deshabilita la continuación de recojo. Aunque hay `/payment/pickup`, no hay recorrido normal completo hacia esa compra.

El checkout de backend genera `pickup_code` y conserva su hash. `parseCheckoutResult` no conserva el código, y la consulta de pedido no lo recupera. Antes de habilitar recojo se necesita un mecanismo privado de entrega/visualización y recuperación o regeneración del código. No exponer el hash ni confiar en que se pueda reconstruir el código original.

### 4. Preparación y cumplimiento aún no están conectados

`OrderPreparationScreen` solo consulta pedido/artículos y muestra avisos; no ejecuta preparación ni registra resultados. La asignación en `ManagementScreen` es un estado pendiente. No hay llamadas móviles a `transition_order`, `finalize_weighted_order`, `propose_substitution`, `decide_substitution`, `assign_delivery`, `complete_pickup` o `complete_delivery` fuera de las declaraciones de tipos.

Las RPC existen en el backend. Hay que construir servicios y acciones con sus contratos reales y verificar pago, reservas, cantidades, permisos y repetición segura. La operación desktop podría cubrir parte de esto, pero no se auditó ese proyecto y no se presume que lo complete.

### 5. Transiciones genéricas pueden eludir controles de cierre

La definición desplegada de `private.transition_order` verifica rol owner/admin, pedido, transición e idempotencia. Permite `pending_payment -> queued`, `ready_for_pickup -> completed` y `out_for_delivery -> completed`, sin verificar dentro de esa función el pago o el código/evidencia exigidos por las operaciones específicas. Los triggers observados en `orders` protegen horario y reservas al confirmar pago; no añaden esa verificación de cumplimiento.

Es un hallazgo de revisión estática de la función real, no una prueba de explotación con una cuenta. Antes de conectar botones, restringir los cambios críticos o hacer que invoquen los controles específicos. Marcar `completed` no debe sustituir el consumo de inventario ni la comprobación de entrega/recojo.

### 6. Seguimiento cliente y diferencias de dinero incompletos

`OrderReceivedScreen`, `OrderTrackingScreen` y `SubstitutionScreen` usan contenido de ejemplo; aceptar/responder está inactivo. «Mis pedidos» lleva al estado de pago, no a detalle real con artículos e historial. La consulta actual usa `estimated_total_cents`, aunque el backend también maneja `final_total_cents`.

`finalize_weighted_order` puede crear ajustes o devoluciones pendientes por diferencia de peso. Esa capacidad de base de datos no transfiere dinero ni presenta por sí sola un flujo al cliente. Se necesitan total final, diferencia, cobro/devolución comprobados y estados coherentes antes de entregar. También resolver cancelación tras pago, transferencia tardía, referencia inválida y cliente ausente al recojo.

### 7. Persistencia y cuenta

`CheckoutDraftContext` guarda carrito, dirección, método y franja solo en memoria. Las sesiones y el puntero al último pedido sí se persisten; eso no recupera un carrito no comprado. Persistir solo lo necesario, separar por usuario/tienda, revalidar precios/stock/franja y limpiar al salir o cambiar cuenta.

Guardar dirección, guardar preferencias y solicitar eliminación están deshabilitados. Las cuentas de correo y celular no se vinculan automáticamente. Mantener una sola identidad o implementar vinculación verificada para evitar historiales separados. Las preferencias de sustitución deben tener un valor explícito y coherente entre checkout y servidor.

## Distribución y seguridad

- `android/app/build.gradle:115` firma `release` con `signingConfigs.debug`. Se requiere firma de distribución y verificación del artefacto definitivo. Una exportación de JavaScript no genera un APK/AAB de producción.
- `expo-doctor`: 20/21 comprobaciones; falla compatibilidad de parches. Instalado/esperado: Expo 57.0.25/~57.0.27, constants 57.0.19/~57.0.21, linking 57.0.11/~57.0.12, router 57.0.23/~57.0.25.
- `npm audit --omit=dev` actual: 24 entradas afectadas, 3 moderadas, 20 altas, 1 crítica. Son entradas de paquetes y cadenas transitivas, no 24 fallos independientes de la app. `shell-quote` 1.10.0 tiene el aviso crítico [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv); analizar alcance de toolchain/runtime y actualizar con compatibilidad. No aplicar degradaciones o `audit fix --force` sin revisión.
- Todas las tablas públicas examinadas tienen RLS habilitada. Los helpers desplegados de membresía/roles rechazan identidades anónimas y comprueban tienda, membresía activa y rol.
- El asesor Supabase conserva 39 avisos de políticas para `authenticated`, 1 aviso de protección de contraseñas filtradas desactivada y 1 informativo de tabla privada con RLS sin políticas. Los avisos genéricos no demuestran por sí solos acceso indebido; faltan pruebas de aislamiento entre dos clientes y entre tiendas. Referencia: [asesores de Supabase](https://supabase.com/docs/guides/database/database-advisors).
- La documentación previa registra SMS de prueba/OTP fijo pendiente de retirada. La API pública solo confirmó el canal habilitado; no expone ni acredita que esa configuración interna haya sido retirada. Revisar proveedor y plantilla y probar recepción privada. [Configuración oficial de acceso por teléfono](https://supabase.com/docs/guides/auth/phone-login).
- Definir observabilidad de errores y operaciones sin tokens/OTP/datos privados en logs; alertas de pagos sin revisar, reservas retenidas y cron fallido; recuperación y copias verificadas. No se acredita configuración de recuperación/backups con esta revisión.
- Falta validar build nativo definitivo en Android físico, segundo arranque, pérdida de red, sesión renovada, teclado, accesibilidad y enlaces. No se volvió a hacer QA visual ni se probó iOS en este análisis.
- Las listas actuales limitan pedidos cliente a 50, pedidos de operación a 100 y pagos a 50. Antes de volumen, incorporar paginación y colas filtradas en servidor para que una revisión pendiente no desaparezca por antigüedad.
- Actualizar `README.md`, `architecture.md` y READMEs de features: varias afirmaciones sobre mocks, OTP y pagos ya no representan el código actual.

## Orden de cierre recomendado

1. **Inventario y coherencia del backend.** Resolver la RPC de entrada; proteger transiciones críticas; verificar compatibilidad con desktop. Criterio: entrada repetida no duplica stock, presentación correcta aparece vendible y no puede completarse un pedido eludiendo sus controles.
2. **Primer recorrido de delivery con pago manual.** Corregir cola de pagos; abastecer productos; habilitar operación cuando corresponda; confirmar franjas y cuenta/OTP real. Criterio: un único pedido se crea, reserva stock/cupo, informa pago y el owner lo revisa desde la UI.
3. **Preparación, detalle cliente y entrega.** Conectar cantidades, total final, estados, usuario driver, asignación y confirmación. Criterio: pedido pagado termina en `completed`, inventario se consume una sola vez y el cliente ve historial/importe verdaderos.
4. **Recojo y excepciones.** Completar horario/contacto/código, efectivo y verificación; cancelación, sustituciones, peso, diferencias, rechazo y devolución. Criterio: las variantes cierran sin saldo ni reserva indeterminados.
5. **Cuenta y continuidad.** Carrito persistente, direcciones, preferencias, identidad y avisos. Criterio: reinicio y cambio de cuenta conservan o limpian exactamente el estado que corresponde.
6. **Distribución.** Dependencias revisadas, firma, artefacto nativo, contenido final, observabilidad y validación física. Criterio: instalación limpia y recorrido completo demostrado sobre el build que se entregará.

Un primer alcance real puede ser Android, una tienda, productos sellados con precio fijo, delivery y pago manual. Integración bancaria automática, tarjetas, GPS en vivo y otras plataformas no son requisitos para demostrar ese alcance. Recojo y granel deben habilitarse solo cuando sus recorridos estén cerrados.

## Matriz mínima para demostrar compra completa

| Escenario | Resultado exigido |
| --- | --- |
| Compra delivery Yape/Plin | Cliente accede, agrega, elige zona/franja, crea una vez, paga, informa, owner verifica, prepara, entrega y cierra; total y stock correctos. |
| Dos compradores por el último stock/cupo | Solo la cantidad/capacidad permitida se vende; el otro recibe error recuperable. |
| Doble toque o respuesta perdida | Una operación/pedido; recuperación al reintentar y después de reiniciar. |
| Precio, publicación, stock o franja cambiados | Servidor revalida; cliente muestra el motivo y vuelve a corregir sin cobro duplicado. |
| Plazo digital vencido sin reporte | Pedido cancelado y reserva liberada por cron; no se admite confirmación tardía como si estuviera vigente. |
| Referencia informada sin dinero | Sigue en revisión; owner puede resolver/rechazar/cancelar; no queda stock retenido indefinidamente. |
| Peso real distinto o sustitución | Consentimiento, total final, ajuste/devolución y reserva quedan coherentes. |
| Recojo efectivo o digital | Código privado disponible y validado; efectivo registrado una vez; cierre correcto. |
| Entrega fallida o cancelación tras pago | Incidencia, dinero y stock tienen resolución auditada. |
| Cuenta distinta/tienda distinta | No lee ni modifica pedido, dirección, pago o inventario ajenos. |
| Sin red, app reiniciada, sesión vencida | Recuperación clara, sin duplicar compra ni mezclar identidades. |

## Comprobaciones ejecutadas en esta revisión

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| `npm run check` | Correcto | TypeScript y ESLint. |
| `node scripts/test-customer-cart.mjs` | Correcto | Presentaciones, cantidades, stock, granel, redondeo y payload. |
| `node scripts/test-customer-checkout.mjs` | Correcto | Contrato, reintentos y recuperación simulados; Auth/OTP simulados. No envía mensajes. |
| `npm run security:links` | Correcto | Regresión de enlaces nativos. |
| `npm run export:android` | Correcto | Bundle Android y assets; no APK/AAB ni compra real. |
| `npm run doctor` | 20/21 | Cuatro parches Expo no alineados. |
| `npm audit --omit=dev` | Avisos pendientes | 3 moderados, 20 altos, 1 crítico; ninguna dependencia modificada. |
| REST público/Auth y consultas SQL de lectura | Correcto | Catálogo, zonas, franjas, pagos, inventario agregado, funciones, roles, cron y RLS. |
| Compra móvil con OTP/pago/entrega reales | No ejecutada | No hay evidencia para declararla completa. |
| Suites SQL con fixtures y rollback | No ejecutadas en esta revisión | La documentación registra ejecuciones anteriores; no se presentan como nuevas. |

No se asigna un porcentaje global de terminación: las pantallas implementadas no equivalen a operaciones comerciales completas.
