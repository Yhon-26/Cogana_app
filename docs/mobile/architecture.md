# Estructura y decisiones

```text
src/
  app/                     Expo Router: composición y navegación
    (customer)/            Tienda, Categorías, Carrito, Cuenta
    index.tsx               Bienvenida de cliente
    sign-in.tsx             Acceso con celular (OTP aún deshabilitado)
    operations/            Entrada de equipo sin acceso operativo
  features/
    customer/              welcome, store, search, products, cart, account, checkout
    operations/            dashboard, orders, inventory, catalog, management
  components/              Screen, AppText, Button, CustomerTabBar, PreparationScreen
  theme/                   tokens centrales
  services/                config, auth, supabase y catálogo visual provisional
  types/                   esquema Supabase generado y estados asíncronos
  assets/                  fotos de producto, bienvenida e iconos de navegación locales
scripts/                   inicio Android y comprobación de conexión
docs/mobile/               instalación, arquitectura, Figma y validación
design/, database/, supabase/, tools/, docs/  material previo conservado
```

Las rutas solo componen vistas. La interfaz no consulta tablas; ESLint impide importar el cliente directamente desde rutas/features/componentes.
El catálogo de `services/mock/` está aislado de Supabase; la tienda muestra dos fichas de muestra y permite buscar y filtrar localmente las cuatro fichas.
La compra y la ficha de detalle no se activan hasta contar con publicación, disponibilidad y contratos de carrito reales.
No se añade un gestor global ni una biblioteca de consultas antes de definir un caso real. Cada feature podrá incorporar hooks, modelos y pruebas según crezca.
TypeScript estricto, alias `@/`, ESLint, Prettier y lockfile quedan configurados. Los tipos de Supabase provienen del proyecto vivo; no se aplicaron migraciones.

## Antes de datos reales

- Confirmar tienda inicial, publicación de catálogo y contratos de lectura mínimos; luego implementar servicios y estados de carga/vacío/error.
- Definir acceso invitado, OTP, proveedores, retorno de autenticación y cierre de sesión. Verificar tamaños de sesión y comportamiento de SecureStore con el proveedor elegido.
- Aplicar autorización por rol y tienda en servidor/RLS antes de añadir pantallas operativas. Una ruta oculta no protege datos.
- Revisar funciones de checkout, reserva, pago e inventario, idempotencia y pruebas de concurrencia ya documentadas.
- Seleccionar consultas/cache cuando haya datos: no añadir Zustand/TanStack Query por anticipado.
- Aprobar fotos de productos, exportaciones de marca, iconos finales y estados accesibles por pantalla. Bienvenida `459:196` y Tienda `459:197` ya se reprodujeron; las demás siguen pendientes.
- Continuar la validación visual por pantalla en el AVD ya conectado; después elegir identificadores Android/iOS, iconos/splash, EAS y builds de desarrollo.
- Acordar alcance iOS, tablet y modo oscuro. La base actual está dirigida a teléfono Android en modo claro.
- Revisar los avisos transitivos de npm descritos en `validation.md` antes de publicar.

No hacen falta más dependencias para navegar por la estructura inicial. Los módulos de negocio se incorporarán conforme a contratos reales.
