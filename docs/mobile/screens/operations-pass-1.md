# Operaciones · Pasada 1: acceso, tienda y panel (01–03)

Implementada y verificada en el emulador; pendiente de revisión visual del usuario.

## Pantallas

- **01 · Entra a tu tienda** (`/operations`, reemplaza la vista de preparación):
  credenciales del equipo. Correo de trabajo con validación local (Continuar se habilita
  con email válido) y nota «Usa el correo asociado a tu tienda.». Sin fotografía.
- **02 · Elige tu tienda** (`/operations-select`): tarjeta única «Cogana · Santa Anita»
  (Av. Los Eucaliptos 315) con chip «Administrador», nota de alcance y «Entrar al panel».
- **03 · Panel de tienda** (grupo de pestañas `(operations)`): encabezado con marca +
  «OPERACIÓN» + chip de tienda; «Operación de hoy» con **fecha real dinámica** (es-PE);
  Resumen con métricas de muestra (7/2/1, mismo criterio que el carrito de muestra);
  «Siguiente acción» con orden CG-2847 que lleva a la pestaña Pedidos; barra «Tienda abierta».

## Navegación y acceso compartido

- **Barra de pestañas de operación propia**: Inicio, Pedidos, Inventario, Gestión
  (`OperationsTabBar` + íconos locales `receipt/box/sliders.svg` en el trazo de la marca).
- El flujo: Cuenta → «Acceso de equipo» o **Sign-in → «Acceso de equipo»** (enlace
  discreto agregado al pie del acceso del cliente: misma puerta de login, dos identidades:
  cliente = celular/OTP pendiente; owner = correo/enlace mágico ya validado en Supabase).
- Inventario y Gestión quedan como vistas de preparación. Pedidos se sustituyó en la [Pasada 2](operations-pass-2.md).

## Revisión

Capturas: `tmp/mobile-qa/op1.png` (01 vacío), `op1-filled.png` (email válido habilita),
`op2.png` (02), `op3-panel.png`/`op3c.png` (03 con barra completa) y `op-pedidos.png`
(pestaña Pedidos). Se corrigieron en caliente: claves del mapa de pestañas (panel/pedidos/
inventario/gestion) y la ruta muerta `operations/index` en el stack raíz.
`npm.cmd run check` sin errores. Pendiente: escala 1.3, lector de pantalla, aprobación
del usuario, y el contrato de identidad por correo (enlace mágico) para reemplazar el
avance local.
