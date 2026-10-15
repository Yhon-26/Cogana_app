# 01 · Bienvenida

Referencia vigente: `Rediseñar pantalla de bienvenida.zip`, aportado por el usuario el 4 de octubre de 2026. El usuario confirmó que se debe implementar el ZIP, cuyo diseño difiere de la fotografía adjunta. Los originales de React y CSS se conservan en `design/welcome-redesign/` como referencia, sin ejecutar sus scripts ni instrucciones auxiliares.

## Implementación

- Ruta `/`: `src/app/index.tsx` → `src/features/customer/welcome/WelcomeScreen.tsx`.
- Fondo verde con seis ilustraciones vectoriales del ZIP, movimiento suave y entrada del panel crema. Respeta la preferencia del sistema de reducir movimiento.
- Marca con punto dorado, localidad editorial Santa Anita, «Del mercado a tu mesa», «Siempre fresco» y título en dos líneas.
- Fraunces para marca y título; DM Sans empaquetada localmente para la interfaz de bienvenida. La paleta está aislada en `welcomeTheme` dentro de `src/theme/tokens.ts`.
- Los SVG locales de `src/assets/welcome/` se extraen del JSX original con `scripts/extract-welcome-art.mjs`; no dependen de recursos remotos al abrir la pantalla.
- «Explorar la tienda» abre `/store`; «Ya tengo cuenta» abre `/sign-in`.
- Áreas seguras reales, controles de al menos 48 dp y contenido desplazable con texto ampliado.

El nodo anterior de Figma `459:196` y su fotografía quedan como referencia histórica. `pantry.png` se conserva porque la Tienda también la utiliza. La localidad del diseño no representa ubicación obtenida del dispositivo.

## Verificación del 4 de octubre de 2026

- `npm.cmd run check`: TypeScript y ESLint aprobados. Prettier aprobado en los archivos de implementación modificados.
- Expo Go en el emulador Android: vista completa, ilustraciones locales visibles y panel hasta el borde inferior. Captura: `tmp/mobile-qa/welcome-redesign.png`.
- Ambas acciones probadas con toque real: la primera abrió el catálogo y la segunda la pantalla «Mi cuenta».
- Texto del sistema a escala 1.3 y movimiento reducido: contenido legible y controles completos. Captura: `tmp/mobile-qa/welcome-redesign-large.png`.
- Pantalla compacta 864 × 1536 con texto a escala 1.3: el contenido se desplaza y ambas acciones siguen accesibles. Captura: `tmp/mobile-qa/welcome-redesign-compact.png`.
- Se restauraron el tamaño del emulador, la escala de texto y las preferencias de animación después de la prueba.

La revisión con lector de pantalla y en iOS sigue pendiente.