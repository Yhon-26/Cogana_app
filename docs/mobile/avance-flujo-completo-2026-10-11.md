# Avance de los puntos 1 a 5 · Cogana

Estado: implementación móvil y backend conectados; puesta en operación y comprobación física pendientes. No se ha confirmado una compra real ni publicado un instalador.

| Punto | Implementado | Pendiente para cerrar |
| --- | --- | --- |
| 1. Inventario y pagos | `receive_inventory_lot` desplegado; cantidades selladas/sueltas, vencimiento, reintentos y cálculo de unidades base validados. Cola de pagos incluye `requires_action` y `processing`, abre cada movimiento, confirma ingresos, rechaza referencias no recibidas y registra diferencias. | Lista de existencias físicas. El cobro sigue siendo manual: el dueño/admin debe verificar su cuenta. |
| 2. Compra real | Agregar desde la tienda, continuación de recojo, entrega existente y acceso/checkout conservan los contratos. Cancelación propia de pedidos digitales sin pago libera stock. | Stock real, apertura de tienda, personal/capacidad confirmados y acceso con OTP privado. No se enviaron códigos reales. |
| 3. Preparación y entrega | Aceptar pedido, preparar cantidades físicas, descontar stock, finalizar total, marcar listo, asignar, iniciar reparto y completar con código. Seguimiento del cliente muestra artículos, historial y código recuperable solo durante la entrega/recojo. | Recorrido visual y físico en Android. Cierre disponible para dueño/admin; una experiencia propia de repartidor dependerá del personal y alcance que confirme el usuario. |
| 4. Incidencias | Proponer y responder sustituciones, reservar el reemplazo, rechazar propuestas vencidas al finalizar, confirmar diferencias de dinero, cancelar pedidos y registrar devoluciones por realizar. El cliente puede reportar el cobro adicional; informarlo no lo convierte en pagado. | Transferencias y devoluciones reales verificadas por el dueño/admin. |
| 5. Continuidad y cuenta | Carrito por tienda/cuenta en almacenamiento seguro nativo, escritura por partes, recuperación ante interrupción, adopción del carrito invitado conservando otros artículos, limpieza al salir y protección del intento de compra hasta persistir el carrito vacío. Datos de contacto, preferencias, direcciones y avisos de pedidos conectados a Supabase. Firma release separada de debug. | Eliminación definitiva de cuentas, QA de dispositivo, contenido/fotos finales, reparación compatible de avisos de dependencias y firma/artefacto de producción. La solicitud de eliminación se registra pero aún no elimina la cuenta. |

## Verificación

- 126 comprobaciones SQL pasaron en `database/tests/customer_commerce_completion.sql`, incluyendo las 33 anteriores. Cubren acceso, inventario, idempotencia, recojo en efectivo, pago digital, sustitución, refund parcial, ajuste positivo, cancelación pagada, asignación, entrega y ocultamiento de códigos al finalizar. Las transacciones se revirtieron.
- TypeScript y ESLint pasaron. Pruebas de carrito, checkout, continuidad y enlaces pasaron.
- Expo Doctor: 21/21. Export Android: generado correctamente, 1829 módulos, 64 assets.
- La comprobación Gradle `:app:assembleRelease --dry-run --offline` rechaza la tarea con el mensaje de falta de firma privada. No se generó un AAB/APK release.
- Auditoría `--omit=dev`: 0 críticas, 18 altas, 3 moderadas. Persisten `braces`, `node-forge` y `decode-uri-component` y sus dependencias. La reparación automática compatible ya se aplicó; no se utilizó `--force`, cuyo plan proponía cambios de SDK incompatibles.
- El emulador `Solas_Cogana` inició, pero ADB lo mostró como `unauthorized` después de reconectar con el SDK. No se obtuvieron capturas ni evidencia de navegación para estos cambios. El emulador y Metro iniciados para esta prueba se cerraron.
- Comprobación posterior: 0 pedidos, 1 lote previo, 0 paquetes, 0 códigos, 0 productos/cuentas de prueba; tienda cerrada. No quedó inventario ficticio ni se alteró la apertura operativa.

## Migraciones y compatibilidad

Las cinco migraciones están en `database/migrations/`, con versiones y nombres de su registro remoto: `20261012015854`, `20261012021118`, `20261012022148`, `20261012022921` y `20261012023248`. Se crearon con el CLI y se aplicaron mediante el conector. El directorio `database/migrations/` conserva la ubicación histórica del repositorio.

Las firmas de las RPC existentes se conservan. `transition_order` endurece el comportamiento: ya no permite marcar listo sin cantidades finalizadas, avanzar sin verificar el pago digital ni completar sin código. **El desktop todavía usa el cierre genérico y necesita adaptar ese recorrido a `complete_pickup`/`complete_delivery` y a la finalización de preparación.** No se modificó el proyecto desktop en este trabajo.

El registro desktop `register_inventory_lot` conserva su contrato. Los precios y existencias se siguen calculando en el servidor; los datos personales no se colocan en parámetros de ruta. La nueva tabla privada de códigos tiene RLS y no concede lectura directa a clientes. El aviso informativo de ausencia de políticas es intencional para mantener el acceso cerrado.

## Eliminación de cuentas

La revisión automática rechazó agregar un servicio que anonimice datos y elimine usuarios porque se trata de una operación irreversible sin autorización explícita. La propuesta concreta está en `docs/mobile/eliminacion-cuenta-propuesta.md`; se solicitó autorización y no se implementó el borrado mientras esa respuesta permanece pendiente.

## Siguiente prueba de operación

Recibir la lista física, cargar cada lote/presentación, confirmar si repartirá el dueño o un integrante, ajustar la capacidad real y abrir la tienda cuando corresponda. El usuario debe introducir su OTP privadamente en la app. Después ejecutar entrega digital, recojo en efectivo, sustitución, diferencia de peso y cancelación/devolución, verificando dinero y cantidades físicas antes de declarar el flujo listo para producción.
