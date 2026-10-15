# Validación de la base · actualizada 26/09/2026

## Comprobado

- Proyecto previo inspeccionado antes de crear archivos: no había package.json ni app móvil en la raíz. El package.json de tools pertenece a una herramienta Figma independiente.
- Material previo de design, database, docs, supabase y tools conservado.
- Expo SDK 57.0.25, React 19.2.3, React Native 0.86.3 y Router 57.0.23 instalados con package-lock.json.
- `npm.cmd run doctor`: **21/21** comprobaciones aprobadas.
- `npm.cmd run check`: TypeScript estricto y ESLint sin errores.
- `npm.cmd run format:check`: aprobado.
- `npm.cmd run export:android`: aprobado; bundle Hermes generado en dist (no es un APK).
- Solo se incluyen los cinco pesos de Inter/Fraunces utilizados. Expo Router incluye además sus propios recursos.
- Metro arrancó en localhost:8081 y `/status` respondió `packager-status:running`.
- `npm.cmd run check:connection`: Supabase Cogana respondió HTTP 200 con la clave publishable. Sin escrituras ni consultas de datos de negocio.
- Figma MCP: inventario vivo de 35 vistas cliente y 49 de operaciones guardado, con referencias estables a nodos.
- Impeccable: contexto PRODUCT.md/DESIGN.md preparado, guía Android aplicada y detector mecánico ejecutado sin hallazgos. No equivale a revisión visual nativa.
- `npm.cmd run android`: diagnóstico correcto de SDK instalado y ausencia de AVD/dispositivo.

## Prueba visual Android · 25/09/2026

- AVD `Solas_Cogana` conectado como `emulator-5554` (Android 17, 1080 × 2424). Expo Go y Metro activos.
- La app abrió en Expo Go. Capturas del dispositivo revisadas para Inicio, Categorías, Cuenta y Acceso de equipo; Carrito comprobado por su texto en la jerarquía de Android.
- La navegación Inicio → Categorías → Carrito → Cuenta y Cuenta → Acceso de equipo respondió. Atrás regresó a Inicio según el historial de pestañas.
- La base muestra fondo, marca, Inter/Fraunces y barra inferior sin recortes evidentes. El botón de herramientas gris de Expo Go es una superposición de desarrollo.
- Las capturas de inspección están en `tmp/mobile-qa/` (ignorado por Git); son evidencia local, no diseños aprobados ni pruebas de las 84 pantallas.

### Pantalla 01 · Bienvenida (`459:196`)

- Fotografía e icono del nodo Figma exportados a `src/assets/welcome/`; composición comparada visualmente en el AVD con la captura del nodo.
- `Explorar la tienda` abrió `/store`; `Ya tengo cuenta` abrió `/sign-in` y su botón de vuelta regresó a `/`.
- `npm.cmd run export:android` incluyó los activos de la bienvenida y generó el bundle sin errores.
- Capturas locales: `tmp/mobile-qa/welcome-screen.png` y `tmp/mobile-qa/account-destination.png`.
- No se detectó recorte en la vista estándar. La superposición gris sobre la ubicación pertenece al menú de desarrollo de Expo Go.
- Texto ampliado: se recargó Expo Go con escala 1.3 y se comprobó que título, descripción y ambas acciones permanecen visibles sin recorte. Después se restauró la escala 1.0. Captura: `tmp/mobile-qa/welcome-large-final.png`.

### Pantalla 02 · Tienda (`459:197`)

- Contexto de diseño y captura del nodo Figma consultados; imagen de temporada, arroz superior y lenteja comparadas por hash con los archivos ya locales y reutilizadas sin duplicación. Los cuatro SVG de la barra inferior se guardaron en `src/assets/navigation/`.
- Composición contrastada visualmente con Figma en el AVD. Captura estándar: `tmp/mobile-qa/store-final.png`. El botón flotante sobre «Santa Anita» pertenece a Expo Go.
- El filtro «Arroces» mostró las dos fichas de arroz; el campo de búsqueda abrió `/search`. La pestaña Categorías navegó y marcó su icono activo en verde.
- Se recargó a escala de texto 1.3: los títulos y enlaces de sección se separan, las categorías pasan a dos filas y las fichas quedan disponibles al desplazarse. Se amplió el panel del banner para evitar recortar «Descubrir». Captura final: `tmp/mobile-qa/store-large-final.png`. La escala del emulador se restauró a 1.0.
- Los enlaces de sección y categorías tienen objetivos de al menos 48 dp. «+» está atenuado y deshabilitado mientras no exista catálogo publicado y contrato de carrito; la localidad no sugiere un selector aún inexistente. No se generaron pedidos ni lecturas/escrituras de negocio en Supabase.

### Pantalla 03 · Acceso con celular (`687:48`)

- Contexto y captura del nodo Figma consultados. A petición del usuario se retiró la fotografía decorativa de la interfaz de acceso; el archivo compartido sigue disponible para el catálogo. El icono de regreso es un SVG local.
- Captura estándar sin imagen: `tmp/mobile-qa/signin-final.png`. Captura con texto a escala 1.3: `tmp/mobile-qa/signin-large.png`; título, descripción, campo y acciones permanecen legibles. La escala 1.0 se restauró al terminar la revisión.
- El campo acepta texto local con foco visible. El regreso volvió a Bienvenida y «Seguir como invitado» abrió la Tienda. La acción de código permanece deshabilitada y no llama a Supabase Auth.
- La ayuda visible indica que el acceso con código está pendiente, en vez de prometer un envío que aún no existe. Quedan pendientes proveedor OTP, límites contra abuso, enlace de identidad y lector de pantalla.
- La revisión Impeccable previa cerró los ajustes de 48 × 48 dp para regreso, 48 dp para el campo y el tono secundario `#5F6B63` del placeholder. La revisión visual posterior confirma que la composición sin fotografía no recorta contenido en escalas 1.0 y 1.3; esto no sustituye la aceptación del usuario ni la prueba con lector de pantalla.

## Pendiente de validación

La bienvenida y la tienda fueron aceptadas por el usuario. Acceso, detalle de producto, categorías y búsqueda esperan revisión; las pantallas restantes siguen pendientes de implementación y revisión individual.
Quedan por comprobar arranque sin red y estados de accesibilidad específicos, incluida la navegación con lector de pantalla.
No se verificaron iOS, tablet, sesión autenticada, RLS de negocio ni operaciones reales.

## Dependencias con avisos

`npm audit` reportó 14 avisos moderados y ninguno alto/crítico. La cifra incluye propagación por el árbol de Expo.
Los avisos de origen revisados son `uuid` (tooling de Xcode) y `decode-uri-component` (decodificación de URI).
Las propuestas automáticas incluyen descensos incompatibles de Expo/Router; no se aplicó `npm audit fix --force`.
Revisar actualizaciones compatibles y el alcance de estas dependencias antes de distribuir una versión de producción.

- https://github.com/advisories/GHSA-w5hq-g745-h8pq
- https://github.com/advisories/GHSA-vcc3-ghjq-m6fr

### Pantalla 04 · Detalle de producto (`/product/[id]`, 25/09/2026)

- Diseño según la composición aportada por el usuario; el layout de Figma `459:199` fue descartado por el usuario.
- Verificado en el AVD: apertura desde las fichas de la tienda, foto a sangre, ficha blanca superpuesta, precio en verde, tarjeta de descripción, stepper (1→2 con «+», «−» deshabilitado en 1), botón de carrito claramente atenuado y carril «De la misma sección» que abre «Arroz extra».
- Capturas: `tmp/mobile-qa/04-detail.png`, `tmp/mobile-qa/04-detail-scrolled.png` y `tmp/mobile-qa/audit-detail-large.png`.
- `npm.cmd run check` sin errores; escala de texto 1.3 verificada sin recortes.
- Pendiente: lector de pantalla.

### Pantalla 05 · Categorías (`/categories`, 25/09/2026)

- Reemplaza la vista de preparación. Las fotografías de categorías se retiraron a petición del usuario: el listado plano es el contenido.
- Verificado en el AVD: pestaña Categorías muestra encabezado, título, subtítulo y las cinco categorías en tarjeta; «Arroces» navega a la tienda con el chip Arroces activo y solo los dos arroces; «Menestras y granos» igual por construir su pre-filtro (mismo mecanismo); «Aceites», «Pastas» y «Azúcar y endulzantes» sin chevron por no tener productos de muestra.
- Capturas: `tmp/mobile-qa/05-categories.png` y `05-store-filtered.png`.
- `npm.cmd run check` sin errores. Escala de texto 1.3 verificada en `tmp/mobile-qa/audit-categories-large.png` sin recortes. Pendiente: lector de pantalla y aprobación del usuario.

### Pantalla 06 · Buscar productos (`/search`, 25/09/2026)

- Nueva pantalla dedicada; el campo de la tienda abre la búsqueda (visual idéntico, interacción movida). Los chips de categoría siguen en la tienda.
- Verificado en el AVD: apertura desde el campo, catálogo completo con contador, filtro en vivo «lenteja» → 1 producto, resultado abre el detalle de Lenteja, botón de borrado y estado vacío con mensaje de recuperación.
- Capturas: `tmp/mobile-qa/06-search.png`, `06-search-results.png`, `06-search-to-detail.png`, `06-search-empty.png`.
- `npm.cmd run check` sin errores. Escala de texto 1.3 verificada en `tmp/mobile-qa/audit-search-large.png`; los nombres aceptan dos líneas y las imágenes decorativas de filas ya no duplican el anuncio de la tarjeta. Pendiente: lector de pantalla y aprobación del usuario.

### Estado vacío del carrito (`/cart`, 25/09/2026)

- Verificado en escalas 1.0 y 1.3: contador, mensaje, ambas acciones y barra inferior permanecen visibles y dentro de la zona segura.
- Captura ampliada: `tmp/mobile-qa/audit-cart-large.png`.

### Pantalla 12 · Carrito con productos (`500:6`, 25/09/2026)

- La imagen del usuario guía las tarjetas y el resumen fijo; el bloque de Frijol canario procede de Figma. Los productos iniciales se cargan desde `src/services/mock/cart.ts` y el catálogo de muestra.
- Verificados en Android: tres artículos, escala de texto 1.3, incremento de cantidades y recálculo del subtotal, desplazamiento hasta la sugerencia y alternancia Entrega/Recojo. El pago está deshabilitado y los costes del servicio quedan sin confirmar.
- Capturas: `tmp/mobile-qa/12-cart-first.png`, `12-cart-large.png`, `12-cart-suggestion.png`, `12-cart-pickup.png`.

### Pantalla 13 · Entrega o recojo (`500:7`, 25/09/2026)

- Se retiró la fotografía decorativa por indicación del usuario. La pantalla conserva las opciones Entrega y Recojo, con controles amplios y selección visible.
- El carrito abre `/fulfillment` con su opción elegida. Se comprobó Recojo desde el carrito a escala de texto 1.3, regreso al carrito y barra de estado legible. «Continuar con entrega» abre la pantalla 14; la acción de recojo permanece inactiva hasta implementar su paso específico. Capturas: `tmp/mobile-qa/13-fulfillment-final.png` y `13-from-cart-pickup.png`.
- No se presentan direcciones ni horarios inventados. Quedan pendientes la prueba con lector de pantalla y la aceptación visual del usuario.

### Pantalla 14 · Datos de entrega (`500:8`, 26/09/2026)

- Se sustituyeron la dirección, el contacto y la franja ficticios de Figma por campos locales vacíos y un estado de horario pendiente. El borrador permanece solo en memoria durante el recorrido y no se envía a servicios externos.
- Verificada en Android a escala de texto 1.0 y 1.3: campos visibles, entrada con teclado, contenido desplazable, navegación 13 → 14 y regreso a Entrega o recojo.
- Capturas: `tmp/mobile-qa/14-delivery-details.png`, `14-delivery-details-large.png` y `14-delivery-details-keyboard.png`. Se corrigieron el contraste del aviso, la separación de 20 dp entre campos, el título de 22 sp y la navegación «Siguiente» entre campos. Veredicto Impeccable: apta para entregar como pantalla 14 dentro del alcance local actual. Quedan pendientes lector de pantalla, validación de campos, disponibilidad real y aceptación visual del usuario.

### Pantalla 15 · Revisar pedido (`500:9`, 26/09/2026)

- La composición se adaptó desde la imagen del usuario: productos en un bloque compacto, entrega separada, totales planos y acción fija inferior. Se mantuvieron colores, tipografía, márgenes y zonas seguras de Cogana.
- Los tres productos y sus importes proceden de los adaptadores de muestra. El subtotal se calcula localmente; envío y total final no se inventan.
- El borrador local de pantalla 14 mostró la dirección completa (dirección y distrito) en pantalla 15 sin parámetros de ruta ni escrituras externas. El carrito también comparte estado: incrementar Lenteja en pantalla 12 produjo `x2` y subtotal S/ 34.10 en la revisión, sin reconstruir un estado obsoleto. `resetCheckoutDraft` existe; su invocación queda pendiente de las futuras rutas de finalización o abandono.
- Verificada en Android con texto 1.0 y 1.3. La segunda captura confirma la flecha de regreso y el nuevo contraste de 6.04:1 del botón inactivo. La implementación etiqueta el indicador de carga como barra de progreso y anuncia el error mediante una región activa con acción «Reintentar». Capturas: `tmp/mobile-qa/15-order-review.png` y `15-order-review-large.png`. Veredicto Impeccable: apta para entregar como pantalla 15 dentro del alcance local actual. Pendientes: prueba con lector de pantalla, disponibilidad/tarifa real y aprobación del usuario.

### Pantallas 18 y 19 · Medio de pago (`518:6`, `518:34`, 26/09/2026)

- Se consultaron el contexto y las capturas de ambos nodos mediante Figma MCP. Una sola vista parametrizada implementa las variantes de entrega y recojo.
- Entrega muestra Yape y Plin; recojo añade efectivo. Los controles tienen estado de radio accesible, objetivo táctil mayor de 48 dp y selección local persistida en el borrador del checkout.
- El subtotal de S/ 28.90 procede de los tres productos de muestra actuales. Entrega muestra su tarifa como «Por confirmar»; recojo indica «Gratis». Ninguna selección cobra, verifica ni confirma el pedido.
- Verificadas en `emulator-5554`. La variante de recojo pasó escala de texto 1.3 sin recortes y la escala se restauró a 1.0. Capturas: `tmp/mobile-qa/18-payment-delivery.png`, `19-payment-pickup.png` y `19-payment-pickup-large.png`.

### Pantallas 20 · Mis pedidos y 21 · Tu espacio (26/09/2026)

- 21 reemplaza la vista de preparación de la pestaña Cuenta: sin foto, tarjeta de invitado, filas de actividad con chevron solo en Mis pedidos, y enlace discreto «Acceso de equipo» preservado.
- 20 es el estado vacío real (sin pedidos simulados) con chip «SIN COMPRAS» (nuevo token `surfaceSuccess` #EFF5EE) y CTA a la tienda.
- Verificado en el AVD: pestaña Cuenta → Mis pedidos → regreso. Capturas `tmp/mobile-qa/21-account.png` y `20-orders.png`.
- `npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla y aprobación del usuario.

### Pantallas 22 · Mis direcciones y 23 · Nueva dirección (26/09/2026)

- 22: lista vacía real con chip «ACCESO PENDIENTE» y CTA a la 23. Accesible desde la pestaña Cuenta (fila con chevron ahora activa).
- 23: formulario con etiquetas mayúsculas del estándar; casilla «Usar como principal» funcional; guardado deshabilitado con nota honesta (requiere cuenta de cliente).
- Capturas: `tmp/mobile-qa/22-addresses.png`, `23-new-address.png`, `23-checkbox.png`.
- `npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y contrato de guardado.

### Pantallas 24–27 · Sección Más de tu cuenta (26/09/2026)

- 24: hub con tres opciones reales y nota honesta; accesible con el botón «Más de tu cuenta» agregado a la pestaña Cuenta.
- 25: preferencias con chips «POR CARGAR» y guardado deshabilitado (sin cuenta no hay valores); se corrigió en caliente la barra de regreso faltante.
- 26: bandeja inexistente con chip «FUNCIÓN NO DISPONIBLE» y salida a Mis pedidos.
- 27: «Eliminar mi cuenta» en rojo de peligro (nuevo token `danger` #A63D2F) y solicitud deshabilitada.
- Capturas: `tmp/mobile-qa/24-more.png`, `25-preferences.png`, `26-notifications.png`, `27-privacy.png`.
- `npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla y aprobación del usuario.

### Pantallas 28 · Granel y 29 · Horario (26/09/2026)

- 28: variante por peso/monto del detalle (catálogo ampliado con `preview-lentils-bulk`, S/ 10.40 por kilo). Verificados en el AVD ambos modos: 500 g → «≈ S/ 5.20» y S/ 5 → «≈ 481 g»; cambiar de modo limpia el campo.
- 29: fecha y franja de ejemplo marcadas como tales, selección alternable, CTA «Horario no disponible». La tarjeta «Horario» de la 14 ahora abre `/schedule`.
- Capturas: `tmp/mobile-qa/28-search.png`, `28-bulk.png`, `28-bulk-estimate.png`, `28-bulk-amount.png`, `29-schedule.png`, `29-schedule-slot.png`.
- `npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla, aprobación del usuario, contratos de carrito para granel y de capacidad real.

### Pantallas 30–33 · Post-pago (26/09/2026)

- El pago (18/19) habilita «Continuar» al elegir método y abre 30 · Pago pendiente (llegada real verificada desde Yape).
- 30 → 31 → 32 → 33 encadenan con enlaces «· ejemplo» (el lenguaje honesto del sistema); todos los CTA finales deshabilitados con notas de contrato pendiente.
- Capturas: `tmp/mobile-qa/30-pending.png`, `31-received.png`, `32-tracking.png`, `33-substitution.png`.
- `npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla, aprobación del usuario y los contratos de cobros/pedidos/sustituciones del servidor.

### Operaciones · Pasada 1 (26/09/2026)

- 01 · Entra a tu tienda: correo de trabajo con validación local; sin foto.
- 02 · Elige tu tienda: tarjeta única con chip Administrador y nota de alcance.
- 03 · Panel: métricas de muestra, siguiente acción y estado de tienda; barra de pestañas propia con íconos nuevos (receipt/box/sliders).
- Acceso compartido verificado: Sign-in → «Acceso de equipo» y Cuenta → «Acceso de equipo».
- Correcciones en caliente: claves del mapa de pestañas y ruta muerta operations/index.
- Capturas: `tmp/mobile-qa/op1.png`, `op1-filled.png`, `op2.png`, `op3c.png`, `op-pedidos.png`.
- `npm.cmd run check` sin errores. Pendiente: pasadas 2–4, escala 1.3, lector de pantalla, contrato de identidad por correo.

### UI/UX · Arreglos P0+P1 de la auditoría (02-10-2026)

- Portada de marca por defecto (`ProductCover`) para productos sin foto: fichas de tienda, carril de relacionados, búsqueda, carrito y héroe del detalle con inicial en Fraunces sobre superficie de marca.
- Chip único de estado («Disponible»/«Sin stock», «Foto referencial» como chip de contorno) reemplaza las líneas sueltas; el CTA del detalle mantiene su señal de acción.
- Stepper y selector de granel ocultos cuando availableQuantity es 0 (antes quedaban activos en productos sin stock).
- Detalle: barra de regreso persistente en carga y error; esqueleto animado con fade; timeout de 12 s que degrada a error con «Reintentar» (recarga el catálogo) y «Volver a la tienda».
- Verificado en el emulador: grilla equilibrada con portadas, detalle sin stock correcto, detalle cargado correcto. El esqueleto y el timeout no se capturaron en vivo (la carga tardó <1 s con el catálogo caliente; el código queda para redes lentas).
- `npm.cmd run check` sin errores.

### UI/UX · P2 de la auditoría: Inventario de operaciones (02-10-2026)

- Lista de inventario y catálogo con buscador (filtra por nombre en es-PE), encabezado con totales («Coincidencias · N de M» al filtrar) y línea agregada: «N con stock · M sin stock» (inventario) / «N con precio activo · M sin precio» (catálogo).
- Chip de estado por fila: «Con stock»/«Sin stock» en inventario; «Con precio»/«Sin precio» en catálogo.
- Verificado en vivo con sesión owner (el usuario se logueó con su OTP): buscador «arroz» → «Coincidencias · 2 de 26» con Arroz extra y Arroz superior; agregado «0 con stock · 26 sin stock»; chip «Sin stock» por fila (26 productos sin lotes cargados, estado real).
- Capturas: `tmp/mobile-qa/p2-inventory.png` y `p2-inventory-search.png`.
- `npm.cmd run check` sin errores.
