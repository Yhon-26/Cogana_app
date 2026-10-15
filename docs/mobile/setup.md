# Ejecutar Cogana

## Entorno

Node 22.22.3 y npm están disponibles. La base usa Expo SDK 57 con versiones nativas resueltas por `expo install`.
El lockfile fija el árbol instalado. Usar `npm.cmd ci` para repetir la instalación.
No hay Babel/Metro personalizado: las configuraciones oficiales de Expo bastan para esta etapa.

## Expo Go

1. En la raíz: `npm.cmd start`.
2. Instalar una versión de Expo Go compatible con SDK 57 desde https://expo.dev/go.
3. Mantener móvil y PC en la misma red y escanear el QR.
4. Si aparece incompatibilidad de SDK, actualizar Expo Go a la versión correspondiente.
5. `npm.cmd run start:clear` limpia la caché de Metro cuando sea necesario.

No se necesita una cuenta EAS para este arranque. Un development build será necesario si se incorporan módulos nativos no incluidos en Expo Go.
En Windows no se ejecuta el simulador iOS; `npm.cmd run ios` es para un equipo macOS con Xcode.
`npm.cmd run web` ofrece una vista auxiliar y no sustituye la validación Android.

## Android Studio

En la revisión inicial: SDK instalado en `%LOCALAPPDATA%\Android\Sdk`, imágenes Android 34, 36.1 y 37.1;
ningún AVD listado y ningún dispositivo conectado.

Actualización 25/09/2026: ya está conectado el AVD `Solas_Cogana` (`emulator-5554`).
La app abrió en Expo Go y pasó una primera revisión visual de la navegación base; ver `validation.md`.

1. Abrir Android Studio > Device Manager > Create Virtual Device.
2. Elegir un teléfono Pixel y una imagen instalada estable (por ejemplo API 34), finalizar y arrancar.
3. Esperar a que Android termine de iniciar.
4. En Cogana: `npm.cmd run android`. El script detecta el SDK, prepara las variables solo para ese proceso y abre Expo Go con Metro.
5. Expo CLI puede descargar Expo Go compatible la primera vez; permitir su instalación en el emulador.

Expo Router resuelve rutas dentro de la app. La conexión al emulador se realiza mediante Expo CLI + ADB.
No se ha generado `android/` ni ejecutado prebuild: no hace falta para Expo Go.

## Supabase

Proyecto confirmado: **Cogana**, `mstcxtpjncozqztkawjg`, región sa-east-1. Nombre del pedido «Coagana» interpretado como este proyecto existente.
El conector MCP y el cliente de la app son conexiones distintas. MCP permite inspección durante desarrollo;
la app usa `.env.local` con URL y clave publishable, nunca credenciales administrativas.

`npm.cmd run check:connection` verifica `/auth/v1/settings` en solo lectura; no valida permisos de negocio ni ejecuta SQL.
Reiniciar Metro después de cambiar `.env.local`.

## Referencias oficiales

- https://docs.expo.dev/router/installation/
- https://docs.expo.dev/get-started/create-a-project/
- https://docs.expo.dev/workflow/android-studio-emulator/
- https://supabase.com/docs/guides/auth/quickstarts/react-native
