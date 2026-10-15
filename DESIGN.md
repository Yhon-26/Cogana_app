# Cogana · implementación móvil

La autoridad visual es Figma `PMCmmZNLY9A8kqcG7IVsHA`: página 65 `429:2` (35 vistas)
y página 66 `539:6` (49 vistas). Véase `docs/mobile/figma.md` para el inventario verificado.
Se conserva la dirección de `design/system/ui-direction.md`; esta base no rediseña las pantallas.

## Tokens iniciales

Fondo #FCF9F1, verde #295D43, texto #1B241E, secundario #5F6B63 y borde #E4DED2.
Los valores expresos del usuario prevalecen sobre las variantes antiguas de variables de Figma.
Inter para interfaz (regular, medium, semibold); Fraunces semibold y bold para marca, bienvenida y titulares editoriales indicados en Figma.
`src/theme/tokens.ts` es la fuente de implementación; ampliar desde Figma al construir cada pantalla.

## Reglas de implementación

- Navegación cliente: Inicio, Categorías, Carrito, Cuenta. Etiquetas siempre visibles.
- Safe areas reales del dispositivo; no dibujar el reloj, la isla o la barra del sistema del mockup.
- Áreas táctiles de al menos 48 dp, texto escalable y contenido desplazable.
- Rutas delgadas; las vistas viven en features y las consultas en services.
- Modo claro definido; modo oscuro pendiente de un diseño aprobado.
- Las pantallas operativas siguen sin métricas ni pedidos ficticios. La tienda muestra precios de la semilla inicial solo en el adaptador visual provisional.
- El catálogo visual puede utilizar el adaptador `src/services/mock/catalog.ts` durante la construcción;
  sus precios y fotografías de concepto no representan disponibilidad real.
- El acceso con celular omite la fotografía decorativa de Figma `687:48` por indicación del usuario; mantener esta decisión al ajustar su composición.
- Impeccable se usa para accesibilidad, jerarquía y revisión; Figma y el alcance del usuario prevalecen.

## Superficie inicial

La bienvenida fue reemplazada por el rediseño del ZIP aportado por el usuario el 4 de octubre de 2026 (ver `docs/mobile/screens/01-welcome.md`); usa ilustraciones, Fraunces y DM Sans con paleta propia. Inicio/Tienda usa el rediseño del ZIP aportado el 4 de octubre de 2026, manteniendo el catálogo actual de la base (ver `docs/mobile/screens/02-store.md`). El acceso con celular `687:48` es la tercera pantalla implementada y espera revisión. El detalle de producto `/product/[id]` es la cuarta; usa la composición aportada por el usuario (foto a sangre y ficha blanca) en lugar del layout de Figma `459:199`, y espera revisión. La quinta, `/categories`, se rehízo como listado plano sin fotografías a petición del usuario y también espera revisión. La sexta, `/search`, dedicada a búsqueda, reemplaza el filtrado en línea de la tienda y espera revisión. El flujo de compra 12–15 y 18–19 está implementado con carrito de muestra y borrador local (ver `src/features/customer/checkout/README.md`); la pestaña Cuenta (21) y Mis pedidos (20, estado vacío) cierran las cuatro pestañas reales, ambos sin fotografía y esperando revisión. Direcciones (22, vacía) y Nueva dirección (23, formulario con guardado pendiente de cuenta) completan el tramo de cuenta, junto con el hub 24 y sus hijas 25–27 (preferencias por cargar, bandeja inexistente y eliminación con rojo de peligro), también sin fotografía y esperando revisión. La compra a granel (28) vive como variante por peso/monto del detalle de producto, y el horario (29) se abre desde Datos de entrega con valores de ejemplo marcados como tales. Los estados post-pago (30–33) encadenan mediante enlaces «· ejemplo»; el pago (18/19) habilita «Continuar» al elegir método y lleva a Pago pendiente (30). El recorrido cliente 01–33 está implementado. Operaciones: pasada 1 lista (Acceso de equipo con correo de trabajo, Elige tu tienda y Panel con barra de pestañas propia Inicio/Pedidos/Inventario/Gestión); los títulos del lado operación usan Inter según la página 66.
La pestaña Gestión contiene la Pasada 4 y sus rutas de Tu tienda, Pagos, Reparto y Actividad. El acceso owner/admin y las lecturas reales se documentan en `docs/mobile/screens/operations-pass-4.md`.
Los horarios habituales se pueden editar por día con la sesión owner/admin; los demás cambios de gestión siguen pendientes de sus contratos de escritura.

La vista `12 · Carrito` (`500:6`) utiliza la imagen aportada por el usuario para las tarjetas y el resumen fijo; conserva de Figma la sugerencia «También te puede gustar». Sus productos y precios son de muestra. El total mostrado corresponde solo a productos y el pago permanece pendiente.

La vista `13 · Entrega o recojo` (`500:7`) omite la fotografía decorativa por indicación del usuario. Mantiene la elección clara entre las dos modalidades y evita prometer horarios o ubicaciones sin datos reales.

La vista `14 · Datos de entrega` (`500:8`) conserva el formulario plano de Figma. Dirección, contacto y horario se muestran como entradas vacías o estados pendientes para no convertir los datos ficticios del diseño en información real. La disponibilidad de horario y la revisión se habilitarán al implementar sus contratos y rutas.

La vista `15 · Revisar pedido` (`500:9`) sigue la referencia visual aportada por el usuario: productos agrupados, resumen de entrega, totales y acción fija. Usa el catálogo de muestra y un borrador local de dirección; horario, tarifa y pago permanecen pendientes para no presentar datos sin confirmar.

Las vistas `18 · Pago para entrega` (`518:6`) y `19 · Pago para recojo` (`518:34`) comparten un selector mantenible. Entrega ofrece Yape y Plin; recojo añade efectivo. Los importes de productos proceden del carrito local, el costo de entrega queda por confirmar y ninguna selección representa un cobro o pago verificado.

Operaciones, Pasada 2: la pestaña Pedidos contiene cola y detalle con lecturas autorizadas por tienda. Resultado por artículo y sustitución siguen como subpasos del pedido; las escrituras permanecen inactivas hasta validar sus contratos transaccionales e idempotentes. No se muestran pedidos ficticios.

Operaciones, Pasada 3: Inventario y Catálogo y precios usan la pestaña Inventario con rutas anidadas y lecturas reales de productos, presentaciones, lotes e historial de precios. La disponibilidad vendible aún requiere el cálculo autorizado de reservas, paquetes y vencimientos; movimientos y cambios de catálogo/precios no se guardan desde estas pantallas hasta validar permisos y contratos de servidor.
