# 03 · Acceso con celular

Referencia: [Figma `687:48`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=687-48), página 65 de cliente.
Estado: refinada a petición del usuario; fotografía decorativa eliminada. Pendiente de su nueva revisión visual.

## Implementación y cambios manuales

- Ruta `/sign-in`: `src/app/sign-in.tsx` → `src/features/customer/account/SignInScreen.tsx`.
- Textos de esta pantalla: `src/features/customer/account/signInContent.ts`, con un comentario sobre la activación futura.
- El icono local de regreso está en `src/assets/navigation/back.svg`. La fotografía que aparece en Figma no se muestra en la app: el usuario indicó que no cumple una función en este acceso.
- El campo permite escribir el celular con teclado telefónico. Su valor permanece solo en el estado de la pantalla; no se guarda ni se envía.
- «Seguir como invitado» abre `/store` para explorar el catálogo de muestra. No crea una sesión anónima ni habilita una compra.

La acción «Continuar» está deshabilitada y atenuada: aún faltan el proveedor OTP, el contrato de identidad, los límites contra abuso y la conversión segura de cuenta invitada. Por ese motivo el texto de ayuda cambia la promesa futura del prototipo por un aviso honesto de disponibilidad pendiente. No se llama a Supabase Auth desde esta pantalla.

## Revisión

Capturas locales actualizadas: `tmp/mobile-qa/signin-final.png` (escala 1.0) y `tmp/mobile-qa/signin-large.png` (escala 1.3). La composición sin imagen agrupa título, campo y acciones con espaciado de los tokens existentes; no se añadió contenido de relleno. Se comprobó el ingreso local de texto, el foco del campo, regreso a la bienvenida y navegación invitada a la tienda. El botón gris de herramientas pertenece a Expo Go.

La revisión Impeccable anterior cerró los problemas de áreas táctiles y placeholder. Tras retirar la imagen, el control de regreso conserva 48 × 48 dp y el campo 48 dp de alto; el placeholder usa `#5F6B63`. La nueva composición se comprobó a escalas 1.0 y 1.3 sin recortes.

Faltan la aprobación visual del usuario, la comprobación con lector de pantalla y el contrato real de autenticación. La pantalla siguiente del mapa de compra es 04 · Producto Arroz superior (`459:199`).
