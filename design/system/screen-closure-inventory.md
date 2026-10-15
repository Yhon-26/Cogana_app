# Cogana · Inventario de cierre de pantallas UI/UX

Estado: alcance **mínimo de diseño propuesto**, no aprobación de producto ni
confirmación de operaciones reales. Las páginas 65 y 66 ya sirven como
referencia visual para construir la interfaz. Fuente: recorridos de Figma `429:2` (cliente)
y `539:6` (Owner/Admin), `ui-ux-completion-plan.md`, sus especificaciones de
flujo y `docs/modelo-datos-v2.md`. Las plantillas antiguas de 360 × 844 pt
no se cuentan como pantallas finales.

## Cómo se cuenta

Una pantalla es un marco de alta fidelidad de 393 × 852 pt dentro del
recorrido vigente. Una variante de carga, vacío o error también cuenta como
marco, pero **no** como una función terminada. Un formulario o una decisión
que pueda resolverse claramente dentro de una pantalla actual se revisa allí
en vez de crear otra por cumplir una cuota.

| Grupo | Marcos actuales | Nuevas composiciones mínimas | Base de planificación |
| --- | ---: | ---: | ---: |
| Cliente | 35 | 0 | 35 |
| Owner/Admin | 49 | 0 | 49 |
| **Total** | **84** | **0** | **84** |

**Las 84 composiciones base ya están dibujadas.** Esta cifra es cobertura
visual de planificación, no aprobación ni el total final de variantes. Las
35 vistas de cliente y las 49 de Owner/Admin tienen nuevas pasadas de alta
fidelidad con datos ficticios de diseño; aún necesitan revisión funcional y
accesible. Podrán añadirse estados específicos una vez aprobado el contrato
de cada operación.

## Composiciones de cliente definidas para el cierre

C01–C06 tienen una nueva composición visual en el lienzo cliente. El acceso
incorpora dos marcos adicionales, verificación de código y nombre. Ningún
enlace del prototipo ejecuta operaciones ni valida estos contratos.

| ID | Pantalla / decisión principal | Relación con lo ya dibujado | Condición antes de habilitarla |
| --- | --- | --- | --- |
| C01 | Elegir compra a granel por peso o monto | Diseño `624:6` enlazado desde lenteja; 500 g y S/ 5.20 son datos de composición | Presentación publicada, unidad, redondeo, precio y stock verificables |
| C02 | Elegir fecha y franja disponible | Diseño `625:39` enlazado desde datos de entrega; franjas visibles en prototipo | Horarios, excepciones, cobertura, capacidad y zona horaria consultados |
| C03 | Pago pendiente o acción requerida | Diseño `632:34` con importe y acción de consulta ficticios | Método habilitado, intento de pago y estado devuelto por servidor |
| C04 | Pedido recibido / resultado de creación | Diseño `632:62` con pedido ficticio `CG-2846`; pago separado | Pedido, reserva y estado de pago persistidos; no equivale a pagado |
| C05 | Detalle y seguimiento de un pedido | Diseño `637:6` enlazado desde «Mis pedidos» | Lectura autorizada, estados de pedido/pago separados y datos privados mínimos |
| C06 | Responder sustitución o ajuste | Diseño `637:62` con alternativa y plazo ficticios | Propuesta, diferencia, vencimiento y respuesta transaccional definidos |
| C07 | Verificar código de acceso | Composición `719:148` | Proveedor OTP, caducidad, reenvío y protección contra abuso |
| C08 | Completar nombre tras verificación | Composición `702:23` | Identidad verificada y creación autorizada del cliente |

## Composiciones Owner/Admin definidas para el cierre

O01–O09 tienen una nueva composición de alta fidelidad. Las acciones de
guardar, publicar, proponer, ajustar y asignar siguen sin ejecutar
operaciones; los enlaces de Figma solo sirven para revisar la navegación.

| ID | Pantalla / decisión principal | Relación con lo ya dibujado | Condición antes de habilitarla |
| --- | --- | --- | --- |
| O01 | Resultado de preparación por artículo y peso final | Concepto `641:2`, continuación del detalle de preparación | Pedido, pago, reservas y cantidades revalidados en servidor |
| O02 | Proponer sustitución o ajuste al cliente | Concepto `641:35`, vuelve a preparación; no cambia directamente un precio | Política del artículo, diferencia y operación autorizada |
| O03 | Registrar entrada o ajuste de inventario | Concepto `641:63`, vuelve a Inventario | Lote, paquete, vencimiento, motivo y concurrencia validados |
| O04 | Crear o editar producto y presentación | Concepto `642:2`, vuelve a Catálogo y precios | SKU, unidad, imagen, publicación y permisos por tienda |
| O05 | Editar precio y consultar historial | Concepto `642:35`, separa valor vigente e historial | Base de precio, motivo, efecto sobre pedidos y operación autorizada |
| O06 | Editar horario semanal y excepciones | Concepto `645:2`, enlazado desde Tu tienda | Zona horaria, solapamientos y pedidos programados revisados |
| O07 | Editar zona de reparto y tarifa | Concepto `645:30`, enlazado desde Tu tienda | Cobertura, mínimo, tarifa y vigencia verificados |
| O08 | Seleccionar y asignar repartidor | Concepto `645:58`, vuelve a Reparto; no confunde asignación con entrega | Pedido elegible, conductor activo y asignación idempotente |
| O09 | Revisar una transacción o ajuste de pago | Concepto `645:89`, vuelve a Pagos; no afirma conciliación bancaria | Movimientos, estado real y permiso Owner/Admin; sin referencias sensibles |

## Trabajo que no suma automáticamente una pantalla nueva

- Convertir las vistas existentes de carrito, checkout, pedidos, cuenta,
  panel, cola, inventario, catálogo, pagos y tienda desde ejemplos o bloqueos
  en diseños con datos/acciones contratados y estados veraces.
- Completar los estados aplicables de carga, lectura completa, vacío
  confirmado, lectura parcial, error, sin conexión, permiso denegado,
  operación en curso, éxito y fallo. Se diseñarán por **flujo**, no copiando
  todos los estados a todas las páginas. Su número de marcos se fija después
  de aprobar el contrato de cada operación.
- Conectar navegación realista, formularios, validación, foco, lector de
  pantalla, texto ampliado, objetivos táctiles y movimiento reducido.
- Sustituir la fotografía conceptual por imágenes autorizadas del catálogo
  y obtener aprobación visual del recorrido completo.

## Decisiones de alcance que pueden aumentar el total

Estas variantes **no** están incluidas en la base de 84 ni deben dibujarse como
funciones activas sin una decisión de producto:

| Decisión pendiente | Consecuencia para el inventario |
| --- | --- |
| Recuperación y errores de acceso por OTP / vinculación de invitado | Los marcos 34–35 muestran la ruta feliz; errores, recuperación, canal y proveedor siguen sin contrato aprobado |
| Recorrido móvil del repartidor | Asignaciones, detalle, recojo, entrega y fallos; el modelo admite el rol, pero el alcance de esta app no está cerrado |
| Cupón manual y promociones editables | Validación y resultados de cupón, más editor operativo; el checkout actual no aplica códigos |
| Notificaciones activas | Bandeja y preferencias verificadas; hoy solo hay una propuesta no disponible |
| Eliminación de cuenta desde la app | Verificación, confirmación y estado de solicitud; la pantalla actual permanece bloqueada |

No sumar estas decisiones al total sin aprobar primero su contrato y si
pertenecen a la primera versión. Tampoco incluir en la primera versión POS,
facturación electrónica automática, B2B ni logística externa, que el modelo
de datos deja fuera.

## Criterio de cierre antes del handoff

El inventario se considerará listo para exportación **solo** cuando las
composiciones necesarias y sus estados aplicables estén revisados en el
lienzo, con rutas enlazadas, datos y privacidad comprobados, fotografía real
autorizada y aprobación visual explícita. El número 84 por sí solo no cumple
ese criterio; no conectar acciones críticas de React Native a operaciones
reales mientras sigan sin contrato.
