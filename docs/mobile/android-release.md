# Preparación de distribución Android

El build `release` requiere una clave de firma propia; no usa la clave de debug. No se ha publicado ninguna versión ni se han creado credenciales en esta sesión.

Configurar estas variables en el entorno privado de compilación, nunca en `EXPO_PUBLIC_*`, código o chat:

- `COGANA_ANDROID_KEYSTORE`: ruta absoluta del archivo de firma.
- `COGANA_ANDROID_KEYSTORE_PASSWORD`: contraseña del almacén.
- `COGANA_ANDROID_KEY_ALIAS`: alias de la clave.
- `COGANA_ANDROID_KEY_PASSWORD`: contraseña de la clave.

La clave debe respaldarse fuera del repositorio. `android/` ya está excluido de Git en este checkout. No guardar claves de producción en la carpeta del proyecto.

Antes de generar el AAB, completar la prueba privada de acceso/OTP, una compra con stock físico y pagos verificados, preparación, reparto/recojo y cancelación/devolución. Verificar pantallas en Android, imágenes y datos finales del catálogo, soporte y textos de privacidad. La eliminación definitiva de cuentas aún requiere autorización y su implementación.

Comprobaciones locales: `npm run check`, `npm run security:links`, `node scripts/test-customer-continuity.mjs`, `npm run doctor` y `npm run export:android`. El export valida el bundle; no equivale a un APK/AAB firmado ni a una compra real.

Con firma configurada y pruebas concluidas, ejecutar `./gradlew bundleRelease` desde `android/`. La publicación externa requiere aprobación final del usuario sobre el artefacto concreto.
