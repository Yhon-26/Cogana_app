# Auditoría UI/UX · 01-10-2026

> **Actualización 02-10-2026:** P0-1, P0-2, P1-3 y P1-4 quedaron implementados y verificados en el
> emulador (portada de marca `ProductCover` compartida por ficha/detalle/búsqueda/carrito, chip único
> de estado, stepper oculto sin stock, detalle con barra de regreso persistente, esqueleto animado,
> timeout de 12 s con «Reintentar»). P2 (chips de estado en Inventario) queda para la siguiente ronda.

Análisis con la app corriendo en el emulador (`emulator-5554`), capturas propias y capturas
autenticadas de la sesión del 28–30/09. Cubre tienda, detalle, carrito, cuenta, acceso y el
lado operación (Panel, Cola, Inventario, Horarios).

## Contexto nuevo desde la última pasada

Las pasadas 2–4 de operaciones están completas y **operaciones ya lee Supabase real**
(catálogo, pedidos, inventario, gestión) con validación de membresía y RLS como barrera.
El acceso del dueño funciona con OTP por correo (Brevo + plantilla con `{{ .Token }}`).
El catálogo del cliente viene del RPC `get_customer_catalog` (responde ~1.9 s).

## Hallazgos priorizados

### P0 · Trampas y contradicciones (corregir primero)

1. **Detalle de producto: el estado de carga es una trampa.** Es un spinner a pantalla
   completa **sin botón de regreso, sin título y sin timeout** (`ProductDetailScreen`).
   Se reprodujo un cuelgue >10 s desde la tienda; la única salida fue el gesto del sistema.
   Fix: cabecera con regreso siempre visible + `ActivityIndicator` acompañado de esqueleto
   (foto/cards) + límite de espera con error recuperable («Reintentar»).
2. **Producto agotado permite elegir cantidad.** El stepper «− 1 +» está activo en un
   producto «Sin stock» y recién el CTA final dice «Sin stock». Contradicción de estado.
   Fix: con cantidad disponible 0, el bloque CANTIDAD se oculta (o se bloquea) y el CTA
   pasa a ser la única señal.

### P1 · El catálogo real se ve roto (impacto visual alto)

3. **Productos sin fotografía colapsan las fichas.** De 25 productos, casi todos tienen
   `image_path: null`; en la grilla quedan fichas solo-texto junto a fichas con foto —
   el ritmo de la grilla se rompe y «arroz» parece el único producto real. En el detalle,
   la ficha blanca flota sin héroe y deja un vacío arriba.
   Fix recomendado: **portada de marca por defecto** (campo degradado verde/crema con el
   símbolo o la inicial del producto, generado en el componente) para que toda ficha tenga
   el mismo peso visual; y en el detalle, héroe con esa portada a menor altura.
   Es también el hueco pendiente del [protocolo fotográfico](../design/system/consistency-rules.md):
   cargar las fotos reales por familia de producto.
4. **«Sin stock» repetido y débil.** Aparece como línea gris bajo el precio (en TODAS las
   fichas) y otra vez en el CTA del detalle. La referencia de comercio (Albert Heijn/TU Delft)
   pide etiqueta clara sin tapar foto/nombre/precio y sin duplicar.
   Fix: chip «Sin stock» gris-piedra junto a la presentación (una sola vez), quitar la línea
   bajo el precio; el CTA del detalle ya dice «Sin stock».

### P2 · Operación: escaneo y filtros

5. **Inventario: 25 filas idénticas «0 unidades base sueltas · 0 lotes».** Monótono y sin
   jerarquía para el dueño. Fix: chip de estado por fila (verde «Con stock» / gris «Sin stock»
   / ámbar «Poco»), encabezado agregado («0 de 25 con stock») y buscador como en Cola.
6. **Cola de pedidos** ya tiene buscador y estado vacío honesto (bien). Al llegar pedidos
   reales conviene agrupar por estado con contadores (por preparar / listos / por confirmar).

### P3 · Menores

7. Detalle sin descripción deja el hueco de la tarjeta DESCRIPCIÓN; con portada por defecto
   y el bloque CANTIDAD condicionado, la pantalla queda equilibrada; completar descripciones
   en catálogo cuando existan.
8. La tienda se ve «muerta» mientras no haya inventario publicado (todo agotado). No es un
   bug: es el estado real. Cuando la tienda cargue lotes, revisar que el «+» de las fichas
   aparezca y el flujo de compra se sienta vivo; considerar un aviso contextual arriba
   («Stock por publicar») solo si el estado se mantiene más de una sesión.

## Referencias del sector usadas

- Albert Heijn / TU Delft (estudio de estantería vacía): etiqueta clara, no tapar
  foto–nombre–precio, indicar cuándo vuelve, alternativas proactivas y mensaje empático.
- Quick-commerce UX (ProductGrowth): «Solo quedan X» para stock bajo, transparencia por
  tienda, sustitución con aceptación del 40–50 %.
- MYBE Digital (Grocerly): estados vacíos/edge como constructores de confianza, WCAG 2.1 AA.
- Patrón de color de estado (verde/ámbar/rojo) adaptado a la paleta Cogana (verde/piedra).

## Qué NO tocar

- La bienvenida, el carrito vacío, la cuenta, el acceso (Correo/Celular con OTP real) y el
  Panel de tienda se ven sólidos y honestos: no requieren cambios de diseño en esta ronda.
