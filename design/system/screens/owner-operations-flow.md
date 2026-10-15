# Cogana · Recorrido Owner/Admin en revisión

Esta especificación conserva el alcance y los contratos de datos de la
composición anterior. La versión visual vigente de las 49 pantallas está en
[owner-operations-high-fidelity.md](owner-operations-high-fidelity.md). Los
rótulos de ejemplo y las decisiones de superficie descritas más abajo son
históricos y no están visibles en la nueva capa de Figma.

Figma: archivo `PMCmmZNLY9A8kqcG7IVsHA`, página nueva `539:6`,
«66 · Operación Cogana · Diseño de recorrido». Pantallas de 393 × 852 pt:
Acceso de equipo `540:2`, Elige tu tienda `540:15`, Panel de tienda
`540:35`, Cola de pedidos `540:68`, Detalle y preparación `545:2`, Inventario
`545:3`, Catálogo y precios `545:4`, Gestión `550:2`, Tu tienda `550:3`,
Pagos `550:4`, Reparto `550:5`, Actividad `550:6`, Sin tienda seleccionada
`555:2`, Acceso restringido `555:3`, Pedidos cargando `555:4`, Sin pedidos
activos `555:5`, Pedidos sin conexión `555:6`, Inventario parcial `562:2`,
Inventario vacío `562:3`, Catálogo parcial `562:4`, Catálogo sin conexión
`562:5`, Catálogo cargando `565:2`, Configuración cargando `573:2` y
Configuración sin conexión `573:29`, Pagos cargando `578:2` y Pagos sin
conexión `578:33`, Reparto cargando `583:2`, Reparto sin conexión `583:32`,
Actividad cargando `591:2`, Actividad sin conexión `591:32`, Preparación
cargando `594:2`, Preparación sin conexión `594:32`, Inventario cargando
`601:2`, Inventario sin conexión `601:22`, Panel cargando `604:2` y Panel
sin conexión `604:37`.
La séptima fila reúne Pedidos lectura parcial `610:2`, Pedidos error de
consulta `610:26`, Pedidos datos no vigentes `613:2` y Pedidos sin
coincidencias `613:26`.
La siguiente fila incorpora Resultado de preparación `641:2`, Proponer
sustitución `641:35`, Movimiento de inventario `641:63`, Editar producto
`642:2` y Precio e historial `642:35`. La última fila de cobertura base
incluye Horarios `645:2`, Zonas y tarifas `645:30`, Asignar repartidor
`645:58` y Revisar pago o ajuste `645:89`.
No hay paneles de documentación en el
lienzo. Las exploraciones Owner/Admin anteriores de `414:2` fueron rechazadas
como referencia de UI final; esta hoja parte de la dirección fotográfica y
tipográfica aprobada para el cliente, con mayor densidad operativa.

## Composición y navegación

| Pantalla | Contenido visible | Prototipo |
| --- | --- | --- |
| Acceso de equipo | Marca de operación, fotografía de abarrotes, correo vacío y solicitud de enlace inactiva | No simula un inicio de sesión |
| Elige tu tienda | Santa Anita como tienda de ejemplo, no membresía confirmada | Volver → Acceso; Entrar al panel → Panel solo para revisar el diseño |
| Panel de tienda | Resumen de ejemplo: 12 pedidos por atender, 3 pagos por revisar, estado operativo y prioridad ficticia | Pedidos → Cola; Gestión → menú operativo |
| Cola de pedidos | Búsqueda, filtros visuales y dos pedidos EJ-1042/EJ-1043 de ejemplo, con estado de pedido separado del pago | Inicio → Panel; Gestión → menú operativo; EJ-1042 → Detalle; otros filtros/filas sin consultas ni mutaciones |
| Detalle y preparación | EJ-1042 ficticio, entrega, estado de pedido/pago y dos productos con presentación y precio de ejemplo | Volver → Cola; Ver stock → Inventario; Continuar preparación deshabilitado |
| Inventario | Imagen editorial, dos productos y aviso de cantidades no confirmadas | Volver → Panel; Ver catálogo y precios → Catálogo; sin ajustes de stock |
| Catálogo y precios | Tres productos y sus presentaciones/precios de ejemplo, sin promoción ni stock inferido | Volver → Inventario; edición deshabilitada |
| Gestión | Fotografía editorial y accesos visuales a las cuatro áreas administrativas | Inicio/ Pedidos → Panel/Cola; tarjetas → pantallas respectivas |
| Tu tienda | Estado operativo de ejemplo, horario semanal y zonas de entrega pendientes de consulta | Volver → Gestión; edición deshabilitada |
| Pagos | Tres casos ficticios por revisar, conciliación sin fuente y pedido/pago separados | Volver → Gestión; Actividad → pantalla de cobertura parcial; sin confirmar cobros |
| Reparto | Pedido EJ-1044 ficticio listo para reparto, sin conductor confirmado; progreso solo ilustrativo | Volver → Gestión; asignación deshabilitada |
| Actividad | Fuentes de eventos y aviso explícito de cobertura parcial, sin eventos inventados | Volver → Gestión; exportación deshabilitada |
| Sin tienda seleccionada | Estado previo a escoger contexto de tienda; no afirma que la persona carezca de membresías | Elegir tienda → Selección de tienda |
| Acceso restringido | Sin datos operativos visibles cuando falta rol owner/admin activo para la tienda | Elegir otra tienda → Selección de tienda |
| Pedidos cargando | Estructura neutra y estática mientras se espera la consulta autorizada; sin cifras ni registros simulados | Navegación local de revisión; búsqueda y filtros no actúan |
| Sin pedidos activos | Vacío solo tras lectura autorizada y completa para tienda/filtro | Inicio/Gestión → pantallas de revisión; no se confunde con error o lectura parcial |
| Pedidos sin conexión | Error explícito sin lista anterior presentada como actual | Reintentar → estado Cargando, solo como enlace de prototipo |
| Pedidos lectura parcial | Falta verificar parte de la cola; no muestra una lista incompleta como si fuese completa | Actualizar cola → Cargando, solo enlace visual; sin preparación ni asignación |
| Pedidos error de consulta | La consulta falló, sin afirmar cero pedidos ni reutilizar resultados caducos | Volver a intentar → Cargando, solo enlace visual; sin cambios de estado |
| Pedidos datos no vigentes | La lectura anterior queda oculta y no permite preparar ni asignar hasta actualizar | Actualizar pedidos → Cargando, solo enlace visual |
| Pedidos sin coincidencias | La búsqueda de ejemplo `EJ-0000` terminó sin resultados en Activos; no afirma que la cola de la tienda esté vacía | Inicio/Gestión → pantallas de revisión; búsqueda y filtros aún no operan |
| Resultado de preparación | Dos artículos de ejemplo y peso final por medir; sin resultado guardado | Volver → preparación; Ver stock → Inventario; Guardar inactivo |
| Proponer sustitución | Artículo original sin lectura, alternativa, diferencia y motivo pendientes | Volver → preparación; Enviar inactivo |
| Movimiento de inventario | Productos de la tienda como selección visual; lote, tipo, cantidad y motivo no validados | Volver → Inventario; Registrar inactivo |
| Editar producto | Nombre/SKU, presentación, imagen y publicación como campos de diseño | Volver → Catálogo; Guardar inactivo |
| Precio e historial | Valor de ejemplo separado de nuevo precio vacío e historial sin lectura | Volver → Catálogo; Guardar inactivo |
| Horarios | Zona horaria, semana regular y excepciones sin lectura real | Desde Tu tienda → Horarios; Guardar inactivo |
| Zonas y tarifas | Cobertura, distrito, vigencia, tarifa y mínimo pendientes | Desde Tu tienda → Zonas; Guardar inactivo |
| Asignar repartidor | Pedido y membresías por verificar, sin conductor elegido | Volver → Reparto; Confirmar inactivo |
| Revisar pago o ajuste | Tipo, importe y estado no consultados; sin referencia sensible | Volver → Pagos; Ajustar inactivo |
| Inventario parcial | Productos conceptuales visibles, sin cantidades ni disponibilidad inferidas | Volver → Inventario; ajuste deshabilitado |
| Inventario vacío | Ninguna existencia registrada solo después de consultar lotes y paquetes de la tienda | Volver → Inventario; Ver catálogo → Catálogo |
| Catálogo parcial | Un producto y precio de ejemplo visibles, historial/otras secciones sin confirmar | Volver → Catálogo; edición deshabilitada |
| Catálogo sin conexión | No presenta productos, precios ni disponibilidad anteriores como actuales | Volver → Catálogo; Reintentar → Catálogo cargando, solo prototipo |
| Catálogo cargando | Estructura neutra mientras se consulta, sin precios ni productos inventados | Volver → Catálogo; búsqueda sin acción |
| Configuración cargando | Fotografía editorial y operación, horario y cobertura en consulta; ningún valor operativo confirmado | Volver → Gestión; edición deshabilitada |
| Configuración sin conexión | Estado operativo, horarios, zonas y tarifas expresamente no disponibles | Volver → Gestión; Reintentar → Configuración cargando, solo prototipo |
| Pagos cargando | Seguimiento y movimientos en consulta, sin cifra cero ni estado de cobro inferido | Volver → Gestión; actividad deshabilitada |
| Pagos sin conexión | Sin cifras ni movimientos anteriores como vigentes; conciliación sigue sin fuente acordada | Volver → Gestión; Reintentar → Pagos cargando, solo prototipo |
| Reparto cargando | Pedidos y seguimiento en consulta, sin pedido listo ni progreso inferido | Volver → Gestión; asignación deshabilitada |
| Reparto sin conexión | Pedidos anteriores y seguimiento no disponibles; sin conductor ni entrega confirmados | Volver → Gestión; Reintentar → Reparto cargando, solo prototipo |
| Actividad cargando | Fuentes de actividad en consulta, sin eventos ni cobertura completa inferida | Volver → Gestión; exportación deshabilitada |
| Actividad sin conexión | Ninguna fuente presenta lectura actual; no se interpreta como ausencia de cambios | Volver → Gestión; Reintentar → Actividad cargando, solo prototipo |
| Preparación cargando | Pedido, artículos, cantidades, pago y existencias pendientes de lectura autorizada; no se muestra el ejemplo EJ-1042 | Volver → Cola; preparación deshabilitada |
| Preparación sin conexión | No presenta datos anteriores como actuales ni permite preparar; el pedido no se considera vacío | Volver → Cola; Reintentar → Preparación cargando, solo prototipo |
| Inventario cargando | Fotografía editorial y lectura de lotes, paquetes y reservas en curso; no indica stock ni disponibilidad | Volver → Inventario; controles de ajuste deshabilitados |
| Inventario sin conexión | Existencias sin lectura actual; ninguna cantidad anterior se presenta como vigente | Volver → Inventario; Reintentar → Inventario cargando, solo prototipo |
| Panel cargando | Resumen, pagos, estado y prioridad en consulta; guiones en vez de cifras | Pedidos/Gestión → pantallas del prototipo; sin acción prioritaria |
| Panel sin conexión | Ninguna métrica anterior se presenta como actual; la prioridad tampoco puede evaluarse | Reintentar → Panel cargando, solo prototipo; navegación inferior de revisión |

Paleta, fotografías, márgenes, zonas seguras y tipografía siguen
`design/system/screens/customer-purchase-entry-flow.md`: crema `#FCF9F1`,
verde `#295D43`, Fraunces Bold para titulares e Inter para operación. Las
imágenes son conceptos, no fotos aprobadas de inventario. El sello
«EJEMPLO VISUAL» distingue las vistas con datos simulados. No se usa el
antiguo encabezado verde ni los paneles extensos «por cargar» como plantilla
visual final.

## Contrato de acceso y datos

- El acceso operativo exige membresía **activa owner/admin en la tienda
  seleccionada**. Ser miembro de la tienda no basta: las políticas de lectura
  que admiten `driver` no constituyen una autorización de consola. La
  pantalla de selección no prueba membresía y el enlace hacia Panel solo
  recorre el prototipo.
- El método real de acceso, estado del enlace, identidad y selección de
  tienda autorizada deben verificarse antes de mostrar datos. No se inventa
  sesión ni se habilita «Solicitar enlace» con correo vacío.
- Las cifras 12 y 3, la tienda Santa Anita, los pedidos EJ-1042/EJ-1043 y
  «Aceptando pedidos» son **datos visuales simulados**. No son métricas,
  configuración ni registros de Supabase. Acordar periodo, zona horaria,
  estatus incluidos, frescura y lecturas parciales antes de conectar el
  panel. Un error de lectura no debe verse como cero.
- Cola: `orders.status` y `orders.payment_status` siguen separados. «Pago
  por revisar» no equivale a pedido listo para preparar. Activos/Historial
  son filtros solo visuales; la política de ordenación, paginación y
  actualización aún no está aprobada. No hay nombre, teléfono, dirección,
  código ni referencia de pago de cliente en las tarjetas.
- Los cambios de estado, preparación, pagos e inventario deberán pasar por
  operaciones autorizadas, transaccionales e idempotentes en servidor, no
  por escritura directa desde la pantalla.
- El detalle EJ-1042, sus dos artículos, cantidades y precios son una
  **composición ficticia**. No representan un pedido real ni se suman como
  total cobrado. Antes de preparar hay que leer `order_items`, reservas,
  sustituciones y pago por tienda; `payment_status` no se deriva de
  `orders.status`. La acción permanece deshabilitada.
- Inventario distingue productos de cantidades disponibles. La foto no
  confirma existencia: lotes, paquetes cerrados, reservas y vencimientos
  necesitan lecturas y reglas distintas. «Por verificar» no significa cero.
- Los precios de Catálogo son ejemplos de presentación, no valores actuales
  del servidor. Un precio real procede de `product_presentations.price_cents`
  con unidad y modo; una edición posterior no cambia el precio capturado
  en un pedido existente. Las imágenes conceptuales no pertenecen al
  catálogo aprobado.
- Configuración combina `stores`, `store_settings`, estado operativo, horarios,
  excepciones y zonas. El estado «Aceptando pedidos» es ficticio; no demuestra
  disponibilidad pública. Horarios y cobertura no equivalen a un vacío
  confirmado. Editar exige membresía owner/admin activa, validación en zona
  horaria de tienda y revisión de pedidos programados.
- Pagos: el «3» es una cifra de muestra, no deuda ni conciliación real.
  `payment_transactions` distingue cargos, devoluciones y ajustes; pendiente
  no equivale a exitoso. No existe aún una fuente/contrato de conciliación
  bancaria. `payment_events` y referencias de proveedor permanecen del lado
  del servidor y fuera de la UI.
- Reparto: EJ-1044 y su progreso son solo visuales. Asignar exige pedido de
  delivery en `ready_for_delivery`, conductor elegible activo y operación
  autorizada e idempotente. Asignado no significa entregado. No se muestran
  nombres, ubicaciones precisas, códigos de confirmación ni evidencias.
- Actividad es una vista de cobertura, no un historial completo. No hay bitácora
  unificada de todos los cambios; no se atribuye un actor ni se infiere un
  evento desde `updated_at`. El acceso y una eventual exportación requieren
  alcance, retención y minimización de datos definidos.
- «Sin tienda» precede a la selección; no equivale a «sin membresías». «Sin
  permiso» requiere una respuesta de autorización que descarte owner/admin
  activo en esa tienda; no debe aparecer por un fallo de red ni revelar
  pedidos, clientes o configuración. Ambos estados deben tener rutas de
  recuperación accesibles.
- La cola solo puede mostrar «vacío confirmado» después de una lectura
  autorizada, completa y vigente para la tienda y filtro escogidos. Cargando
  usa bloques estáticos, sin imitar pedidos reales ni comunicar cero.
  Lecturas parciales, errores y datos caducos necesitan estados distintos.
  Sin conexión no ofrece preparación ni confirma que no haya pedidos; el
  enlace «Reintentar» solo ilustra el regreso a carga, no hace una petición.
- Lectura parcial y error de consulta separan la incertidumbre de «sin
  conexión». La primera no expone una lista incompleta como si cubriera todos
  los pedidos; el segundo no presume una causa de red ni afirma cero pedidos.
  Ambos mantienen preparación, asignación y cambios de estado bloqueados.
  «Actualizar cola» y «Volver a intentar» regresan visualmente a Cargando;
  no ejecutan consultas reales. Para implementar una lista parcial útil harán
  falta contratos de cobertura, frescura, paginación y conciliación por tienda.
- Datos no vigentes es diferente de error y sin conexión: puede existir una
  respuesta anterior, pero no se muestra como actual ni autoriza operaciones.
  «Actualizar pedidos» solo vuelve visualmente a Cargando. Sin coincidencias
  es un resultado acotado a una referencia y al filtro Activos después de una
  búsqueda completa y autorizada; el código `EJ-0000` es ilustrativo, no un
  pedido. La fotografía es editorial. No se deduce que la tienda no tenga
  pedidos, ni que Historial esté vacío. La búsqueda y los filtros requieren
  contratos reales antes de habilitarse.
- Inventario parcial muestra la identidad de productos solo como composición
  visual: si faltan lotes, paquetes o reservas no se calcula stock vendible
  ni se habilitan ajustes. El vacío de inventario exige consultas completas
  de lotes **y** paquetes; no demuestra que el catálogo esté vacío ni que un
  producto esté despublicado. La fotografía es editorial, no evidencia de
  existencias físicas.
- Catálogo parcial puede mostrar una presentación cuyo precio sí se leyó,
  pero no debe extender esa certeza a otras categorías, al historial o a la
  disponibilidad de compra. El S/ 19.50 está rotulado como **ejemplo**.
  Error/sin conexión no muestra precios cacheados como vigentes ni permite
  publicar; «Reintentar» solo enlaza al estado de carga en el prototipo.
- Configuración cargando y sin conexión conserva la fotografía solo como
  concepto editorial y el nombre de tienda como contexto de ejemplo.
  Ninguna pantalla demuestra que acepte pedidos, tenga horarios o zonas
  vigentes. Sin conexión no equivale a tienda cerrada. «Reintentar» enlaza a
  cargando en Figma; en la app requerirá una lectura autorizada por tienda.
- Pagos cargando y sin conexión sustituyen la cifra y el pedido ficticios de
  la vista de ejemplo por guiones y una lectura no disponible. El guion no
  equivale a cero, a pagado ni a saldo conciliado. El estado de pedido no se
  deduce del estado del pago; no se muestran transacciones, referencias de
  proveedor ni eventos privados. «Reintentar» solo enlaza a cargando en el
  prototipo, sin iniciar un cobro o una consulta real.
- Reparto cargando y sin conexión retira el pedido EJ-1044 y el indicador
  de progreso «Listo» de la vista de ejemplo. La foto de menestras es
  editorial, no evidencia de pedido ni stock. No se infiere que un pedido
  sea elegible, que haya conductor activo, una asignación o una entrega.
  «Reintentar» solo enlaza a carga; asignar sigue deshabilitado y requiere
  lectura autorizada y operación idempotente del servidor.
- Actividad cargando y sin conexión mantienen la advertencia de cobertura
  parcial. Las tres tarjetas nombran fuentes posibles, no eventos reales ni
  un historial consolidado. Sin conexión no implica cero cambios; no se
  exportan datos. «Reintentar» solo enlaza a carga en el prototipo. Una
  implementación deberá definir permiso, alcance por tienda y tiempo,
  paginación, fuentes, retención y minimización antes de leer o exportar.
- Preparación cargando y sin conexión omiten la referencia EJ-1042, los
  productos, las cantidades, los precios y los estados ficticios de la vista
  de ejemplo. Sin conexión no confirma que el pedido esté vacío. «Reintentar»
  solo enlaza a carga en el prototipo; ningún estado permite preparar,
  reservar inventario ni cambiar el estado del pedido. La implementación
  requerirá autorización owner/admin de tienda y revalidación de pedido,
  pago, existencias y ajustes en servidor antes de una acción idempotente.
- Inventario cargando y sin conexión no presentan cantidades, alertas de
  vencimiento ni disponibilidad vendible. La fotografía de granos es editorial;
  no prueba existencias. «Reintentar» solo enlaza a carga en el prototipo.
  Ningún ajuste se habilita sin permiso owner/admin y lectura de lotes,
  paquetes, reservas y estado de la tienda.
- Panel cargando y sin conexión sustituye 12 pedidos, 3 pagos, el estado
  «Aceptando pedidos» y la prioridad EJ-1042 de la vista de ejemplo por
  guiones y lecturas pendientes/no disponibles. Un guion no es cero. La foto
  es editorial y el nombre de tienda sigue siendo contexto de ejemplo.
  «Reintentar» solo enlaza a carga; antes de mostrar cifras reales se deben
  acordar estados incluidos, periodo, zona horaria, frescura y respuesta
  parcial, además de verificar rol owner/admin activo para esa tienda.

## Profundización operativa (pantallas 41–49)

Estas nueve composiciones completan la **cobertura visual base**, no los
formularios funcionales ni su autorización. En todas se mantiene la puerta
de entrada owner/admin activo por tienda. La foto de abarrotes es editorial,
no evidencia de inventario o pedido. «EJEMPLO VISUAL», «por consultar» y
acciones deshabilitadas evitan presentar datos o mutaciones ficticias.

- **Preparación `641:2`:** pedido, pago, reservas, peso pedido y peso final
  deben leerse y revalidarse por artículo. El peso final no se infiere del
  pedido. Guardar resultado exige diferencias, faltantes y transición de
  estado autorizada e idempotente; un pago por revisar bloquea el avance.
- **Sustitución `641:35`:** la alternativa no existe hasta elegir producto,
  presentación y peso; calcular diferencia, motivo y vencimiento antes de
  enviarla al cliente. El envío no modifica por sí mismo el pedido ni el
  precio capturado. Evitar nombres o contactos del cliente en la pantalla.
- **Inventario `641:63`:** producto seleccionado, tipo de movimiento, unidad,
  lote/paquete, vencimiento, cantidad, motivo y existencia previa son datos
  distintos. Registrar requiere permiso, concurrencia y operación de servidor;
  «Por cargar» no significa cantidad cero.
- **Producto `642:2`:** SKU único por tienda, nombre, unidad, modalidad,
  presentación, precio, fotografía real y estado de publicación requieren
  validación. Guardar un borrador y publicar son decisiones separadas;
  ninguna está conectada aquí.
- **Precio `642:35`:** S/ 19.50 es el valor de **ejemplo** de la semilla para
  arroz superior de 5 kg, no una lectura vigente. El nuevo importe está
  vacío y el historial sin consultar. Motivo, concurrencia, vigencia y efecto
  en pedidos previos se revisan antes de guardar; un precio nuevo no altera
  snapshots de pedidos ya creados.
- **Horarios `645:2`:** obtener la zona horaria de la tienda, intervalos por
  día y excepciones locales. Validar cierres, solapamientos y pedidos ya
  programados; no interpretar «por consultar» como horario cerrado.
- **Zonas `645:30`:** distrito/cobertura, mínimo, tarifa, restricciones y
  vigencia deben verificarse juntos. Una zona editada no debe cambiar en
  silencio la promesa de pedidos ya programados.
- **Repartidor `645:58`:** el pedido debe ser de delivery, elegible y estar
  `ready_for_delivery`; el conductor debe ser miembro activo autorizado.
  Asignación idempotente con errores/concurrencia; asignado no es entregado.
  Sin nombre, ubicación precisa, código ni evidencia en el concepto.
- **Pago o ajuste `645:89`:** el importe, tipo, movimientos, estado y relación
  con el pedido dependen de lectura autorizada. No se muestran referencias
  de proveedor ni eventos privados; «conciliación no verificada» no es
  conciliación completada. Ajustar requiere operación del servidor.

Los 9 botones de guardar/proponer/registrar/confirmar/ajustar están inactivos.
Los enlaces existentes de Horario semanal y Zonas de entrega en Tu tienda
abren sus conceptos; todos los «volver» regresan al contexto de origen.
Se verificaron las 9 capturas de 393 × 852 pt, fuentes Inter/Fraunces, límites
de texto y objetivos enlazados ≥44 pt. Siguen pendientes foco, lector de
pantalla, texto ampliado, estados de validación, error y éxito, así como
movimiento reducido en la app.

## Interacción y movimiento del prototipo

- Los 78 enlaces usan una disolución breve de 180 ms con salida
  suave. Es una transición de revisión entre pantallas, no una animación de
  cargas, pagos, stock ni confirmaciones operativas.
- Los estados anteriores reunían 66 enlaces; los nueve conceptos operativos
  y los accesos desde Tu tienda elevan el total a 78. Sus destinos y
  objetivos de 44 pt o más fueron comprobados.
- Los 12 controles «volver» que medían 36 × 40 pt ahora tienen un objetivo
  táctil de 44 × 44 pt. La auditoría de los 78 controles enlazados no encontró
  objetivos menores de 44 pt en ningún eje. Se revisó una captura de la
  pantalla de carga de catálogo (393 × 852) después del ajuste.
- En React Native, la preferencia del sistema de movimiento reducido deberá
  eliminar la disolución y navegar sin animación. El prototipo de Figma no
  detecta esa preferencia automáticamente. Mantener los esqueletos estáticos;
  no añadir shimmer ni movimiento que haga parecer confirmados los datos.
- Falta comprobar foco, orden de lectura, nombres accesibles y ampliación de
  texto con una implementación real. El tamaño del área táctil por sí solo no
  resuelve esas pruebas.

## Pendientes antes del handoff

Profundizar configuración, pagos, reparto, actividad, preparación, inventario
y edición de catálogo solo con contratos aprobados. Añadir estados de datos
completos, lectura parcial, errores específicos y cambios de estado para las
demás rutas; las variantes de esta hoja cubren acceso, cola, inventario y
catálogo de forma selectiva. Verificar los objetivos táctiles no enlazados,
textos ampliados, foco, lector de pantalla, estados en texto y
fotografía real aprobada. Las cuarenta y nueve pantallas fueron revisadas sin
recortes visibles y con Inter/Fraunces; hay 78 enlaces de lectura y 43 imágenes
conceptuales. Esto **no** equivale a aprobación visual ni a
una implementación funcional en React Native.
