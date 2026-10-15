# Cogana móvil

Base Expo + React Native + TypeScript. Conserva los directorios de diseño, documentación y base de datos existentes.
Abre en la bienvenida de Figma (`459:196`). La tienda (`459:197`) muestra un catálogo visual de muestra con búsqueda y filtros locales. El acceso con celular (`687:48`) permite explorar como invitado; el envío de códigos sigue deshabilitado.
Incluye cuatro pestañas cliente y una entrada de equipo aún no habilitada; las pantallas restantes son vistas de preparación, no las 84 pantallas implementadas.
El botón «Explorar la tienda» abre `/store`. «Ya tengo cuenta» llega a la pantalla de acceso `/sign-in`; su autenticación con código sigue pendiente.

## Inicio rápido (Windows)

```powershell
cd C:\Cogana_app
npm.cmd ci
npm.cmd start
```

Escanea el QR con Expo Go compatible con SDK 57 y conecta móvil/PC a la misma red.
Para Android Studio, crea e inicia un AVD en Device Manager y ejecuta `npm.cmd run android`.
Se usa `.cmd` porque este equipo bloquea `npm.ps1`; no es necesario cambiar la política de PowerShell.

La configuración local de Supabase ya está en `.env.local` (ignorada por Git).
En otro equipo, copia `.env.example` a `.env.local` y completa la clave **publishable** del proyecto Cogana.

## Comprobaciones

```powershell
npm.cmd run check
npm.cmd run doctor
npm.cmd run check:connection
npm.cmd run export:android
```

Documentación: [arranque y Android](docs/mobile/setup.md), [arquitectura y pendientes](docs/mobile/architecture.md),
[referencias Figma](docs/mobile/figma.md). Contexto de Impeccable: [PRODUCT.md](PRODUCT.md) y [DESIGN.md](DESIGN.md).

Avance visual: [01 · Bienvenida](docs/mobile/screens/01-welcome.md), [02 · Tienda](docs/mobile/screens/02-store.md) y [03 · Acceso con celular](docs/mobile/screens/03-sign-in.md).
Los textos de tienda se editan en `src/features/customer/store/storeContent.ts`; los datos e imágenes de muestra en `src/services/mock/catalog.ts` y `src/assets/products/`. Todavía no se consultan desde Supabase ni se habilita la compra.

[04 · Detalle de producto](docs/mobile/screens/04-product-detail.md) se construyó con la composición aportada por el usuario (foto a sangre, descripción, cantidad y relacionados); el botón de carrito queda deshabilitado hasta tener el contrato real. [05 · Categorías](docs/mobile/screens/05-categories.md) se rehízo como listado plano sin fotografías, con navegación pre-filtrada a la tienda. [06 · Buscar productos](docs/mobile/screens/06-search.md) es una pantalla dedicada: el campo de la tienda abre la búsqueda y los resultados abren el detalle. El checkout vive en [12](docs/mobile/screens/12-cart.md)–[19](docs/mobile/screens/18-payment-delivery.md) con carrito de muestra y borrador local; la pestaña Cuenta ([21](docs/mobile/screens/21-account-home.md)) ya es real y lleva a [20 · Mis pedidos](docs/mobile/screens/20-orders.md) [22/23 · Direcciones](docs/mobile/screens/22-addresses.md) y el hub [24 · Más de tu cuenta](docs/mobile/screens/24-account-more.md) con sus hijas [25](docs/mobile/screens/25-preferences.md), [26](docs/mobile/screens/26-notifications.md) y [27](docs/mobile/screens/27-privacy.md). La compra a granel ([28](docs/mobile/screens/28-bulk-detail.md), por peso o monto) es una variante del detalle; el horario ([29](docs/mobile/screens/29-schedule.md)) se abre desde Datos de entrega; y los estados post-pago ([30](docs/mobile/screens/30-payment-pending.md)–[33](docs/mobile/screens/33-substitution.md)) encadenan con enlaces de ejemplo. Con esto, el recorrido cliente 01–33 está implementado. El lado operación arrancó: [Pasada 1](docs/mobile/screens/operations-pass-1.md) (Acceso de equipo, Elige tu tienda y Panel con su propia barra de pestañas) reachable desde el acceso del cliente.

Resultados y límites de las comprobaciones: [validación](docs/mobile/validation.md).
