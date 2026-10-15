# Revisión de seguridad con MobSF

## Alcance y evidencia

Análisis local de Cogana, sin publicar código ni binarios. MobSF 4.5.4, revisión
`7a4785fb3b55949231dd2b5d7df82ccba02a114f`, Python 3.12.14. Herramienta en
`tools/MobSF`, entorno aislado en `tools/mobsf-venv`, resultados privados en
`tmp/security`. Esas carpetas están excluidas del control de versiones.

Se ejecutaron las API oficiales de carga, análisis y reporte de MobSF mediante
su cliente Django local, sin abrir un servidor HTTP. VirusTotal y consultas de
reputación de dominios están desactivados. El analizador puede descargar sus
bases de firmas y comprobar actualizaciones; no se usó mobsf.live.

Reportes de código Android: `mobsf-before.json` y `mobsf-after.json`.
Son análisis de las fuentes nativas, **no cobertura del TypeScript ni del APK
compilado completo**. No equivalen a una certificación ni a una prueba dinámica.
No se generó ni analizó un IPA de iOS.

## Cambios

APK local de auditoría compilado e instalado en el emulador:
`android/app/build/outputs/apk/release/app-release.apk`, ABI x86_64, 58.471.707 bytes,
SHA-256 `d42d537ec548e2d598efcd8fbb3c78589c727cc94d0baf4468d31748cacadef7`.
El manifiesto release fusionado pasó `security-manifest.mjs`: target 36, sin
debug, backups ni HTTP; no aparecen los tres permisos bloqueados. Conserva
permisos normales de red/vibración y los de biometría aportados por SecureStore.
La firma es de prueba, no apta para publicar.

Prueba de humo en el APK: bienvenida visible (`tmp/security/startup-final.png`),
enlace `cogana://sign-in` abre Cuenta (`valid-link.xml`) y enlace con `%FF` vuelve
a bienvenida (`invalid-link.xml`). No se enviaron OTP ni se crearon pedidos.
El enlace inválido también volvió a bienvenida desde arranque en frío
(`cold-invalid-link.xml`).
Esta comprobación ADB no es un análisis dinámico instrumentado con MobSF.

- Backups Android deshabilitados en `app.json` y en el manifiesto generado.
  MobSF dejó de reportar `app_allowbackup` tras el cambio.
- Bloqueados los permisos READ/WRITE_EXTERNAL_STORAGE y SYSTEM_ALERT_WINDOW;
  el flujo actual no los necesita. Los marcadores `tools:node="remove"` se deben
  comprobar en el manifiesto fusionado del APK: MobSF fuente los enumera como si
  fueran permisos concedidos.
- Plugin reproducible `plugins/with-android-security.cjs`: tráfico HTTP
  deshabilitado y afinidad de tarea vacía. Se conserva `singleTask` para no romper
  la navegación de Expo. El manifiesto debug permite HTTP para Metro; esa
  excepción no debe aparecer en release.
- Actualizado únicamente `xcode > uuid` a 11.1.1 mediante override y lockfile.
  Verificada la generación de UUID que utiliza xcode. No se degradó Expo.
- `+native-intent.tsx` rechaza enlaces superiores a 2048 caracteres y codificación
  URI inválida antes de que Router procese parámetros. Se conserva el enlace
  válido sin decodificarlo dos veces. Pruebas de enlaces válidos, inválidos y de
  desarrollo en `scripts/test-security-links.mjs`.

## Interpretación de resultados

### APK: reporte completo

`tmp/security/mobsf-apk.json` y su respuesta de análisis
`mobsf-apk.scan.json` corresponden al SHA-256 anterior. MobSF terminó sin errores
de análisis registrados. Resultado bruto: **4 altos, 7 advertencias, puntuación
39/100, 0 rastreadores detectados**. Es una puntuación automatizada del artefacto
de prueba; no una medida de probabilidad de intrusión ni una certificación.

| Hallazgo | Evidencia y tratamiento |
| --- | --- |
| Firma debug y certificado SHA-1: 2 altos | Confirmados en este APK de auditoría. Bloquean publicación. Usar firma propia de distribución y certificado moderno; volver a escanear el APK firmado definitivo. No se generaron ni reemplazaron claves de producción. |
| minSdk 24 (Android 7): 1 alto | Confirmado. Está pendiente decidir la compatibilidad mínima pública; se consultó Android 10+ como piso recomendado. No se cambió silenciosamente la compatibilidad del producto. Un mínimo de SO no sustituye las actualizaciones de seguridad del dispositivo. |
| WebView debugging de Expo LogBox: 1 alto | La llamada existe en `ExpoLogBoxWebViewWrapper`, pero `ExpoLogBoxPackage.createReactActivityLifecycleListeners()` del APK decompilado devuelve `emptyList()` en release. Su fuente también exige `BuildConfig.DEBUG`. No se registra ese listener en esta compilación. Se conserva la alerta bruta y esta justificación de revisión, sin modificar reglas del escáner. |
| ProfileInstallReceiver exportado | Protegido por `android.permission.DUMP`. El emulador confirma `signature|privileged|development`; no es un permiso normal obtenible por cualquier app. Conservar comprobación al actualizar dependencias. |
| WebViews/puente JS/acceso a archivos | Señalados en Expo LogBox y Expo DOM WebView. Las pantallas de Cogana no incorporan WebView; no se habilitó contenido web remoto. Revisar de nuevo si se introducen componentes DOM o navegadores embebidos. |
| MD5 | Señalado en utilidades de archivos/assets de Expo. No se usa en Cogana como autenticación, contraseña ni prueba de pago; no se cambian primitivas de la dependencia sin evaluar su contrato. |
| Strings con nombres de claves y alta entropía | 891 candidatos heurísticos, sin coincidencias de formato de secreto etiquetado. Hay nombres C++/Hermes, tablas numéricas y constantes de bibliotecas. Se revisaron ejemplos como `modulesConstants`/`exportedMethods`; no son credenciales. Esto no acredita ausencia absoluta de secretos, especialmente en Hermes. La comprobación acotada de `src` no encontró claves privadas, `sb_secret_` ni claves AWS de formato AKIA. |
| Temporales/logs | Provienen de bibliotecas de imágenes y Expo. No se encontraron logs de aplicación en `src`; no registrar tokens/OTP ni guardar comprobantes privados en cachés públicas al extender la app. |

El análisis ELF enumera 48 entradas por duplicación de rutas, correspondientes
a 24 bibliotecas x86_64 únicas. Conserva avisos FORTIFY en 12 y ausencia de canary
en `libc++_shared.so`; no se modificaron binarios de terceros ni se interpretan
esas heurísticas como exploits demostrados. Revisar versiones/toolchain antes
de distribución y repetir sobre las ABI de producción, especialmente arm64.

### Comparación de fuentes y dependencias

MobSF fuente pasó de 2 altos + 2 advertencias a 2 altos + 1 advertencia.
Los dos altos StrandHogg usan un target SDK inferido de **26**, porque la fuente
no incluye el valor resuelto por Gradle. Gradle confirma minSdk 24 y targetSdk 36;
no se consideran explotaciones demostradas. El reporte APK confirma target 36
y ya no presenta esos dos hallazgos StrandHogg.
La advertencia `singleTask` se mantiene visible, no suprimida.

`npm audit --omit=dev`: antes 14 moderados; después 3 moderados, cero altos o
críticos. Los tres corresponden a la misma cadena
`expo-router > query-string > decode-uri-component`. La versión corregida 0.5.0
es ESM y query-string 7 requiere CommonJS; no se fuerza una sustitución incompatible.
La barrera de enlaces es una mitigación nativa, no elimina el aviso ni protege
una publicación web. Actualizar la cadena con soporte compatible sigue pendiente.

Las sesiones ya usan SecureStore y las consultas exigen HTTPS/clave pública.
MobSF no demuestra por sí solo la corrección de RLS, autorizaciones, precios,
stock o confirmaciones de pago: conservar las pruebas de contratos del checkout.
Se volvió a ejecutar `database/tests/customer_order_submission.sql` dentro de
`BEGIN/ROLLBACK`: pasaron mínimo/tarifa, plazo calculado por servidor, reintento
idempotente, bloqueo de aviso de pago de otra identidad, confirmación manual y
vencimiento. Los datos de prueba se revirtieron; no hubo pedidos ni pagos
persistentes derivados de esta prueba.

El asesor de Supabase también se consultó en vivo: conserva 39 entradas de
políticas que alcanzan al rol `authenticated` y por ello requieren revisar el
caso de usuarios anónimos autenticados, una entrada informativa de RLS sin
políticas en `private.admin_operation_results` y el aviso de protección de
contraseñas filtradas desactivada. No se modificaron políticas ni Auth en esta
pasada y no se declara cerrado el análisis del backend. Referencias de revisión:
[usuarios anónimos autenticados](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins),
[RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Verificación local: `npm run check`, pruebas de enlaces y exportación Android
completados correctamente. El plugin se aplicó con `expo prebuild --platform
android --no-install` y se comprobó el manifiesto generado. La exportación de
JavaScript (`expo export`) no es una compilación APK.

## Repetir

La instalación de la herramienta está separada de las dependencias de la app.
En otra máquina, clonar el repositorio oficial en `tools/MobSF`, seleccionar la
revisión indicada y crear un entorno Python 3.12 en `tools/mobsf-venv`; instalar
ese proyecto con pip/uv dentro del entorno. La lista exacta de paquetes de esta
ejecución está en `tmp/security/mobsf-requirements.txt`.

```powershell
tools/mobsf-venv/Scripts/python.exe scripts/security-mobsf.py INPUT.apk tmp/security/mobsf-apk.json
node scripts/test-security-links.mjs
npm run check
npm audit --omit=dev
node scripts/security-manifest.mjs PATH_TO_MERGED_RELEASE_MANIFEST
```

El script también acepta ZIP de fuentes Android Studio (`app/src/main/...`).
No incluir `.env`, claves de firma, sesiones ni reportes privados en un ZIP.
Los logs locales de MobSF pueden contener su clave API local; no compartirlos.

Durante la compilación se corrigió también un fallo anterior al enlace de
recursos: Expo referenciaba `splashscreen_logo` sin una imagen configurada.
`plugins/with-android-splash.cjs`, registrado antes de `expo-splash-screen`, usa
el drawable transparente del sistema y conserva el fondo crema. Si se configura
una imagen de marca, el plugin deja actuar al plugin oficial. No se añadió una
imagen decorativa ni se modificó WelcomeScreen.

## Puertas pendientes antes de publicar

- Escanear el APK de distribución definitivo, verificar permisos fusionados, firma propia
  de producción, ausencia de debug/HTTP y analizar componentes de dependencias.
  La plantilla local usa firma debug incluso en release: sirve para análisis,
  nunca para distribución de producción.
- Prueba dinámica del APK: navegación/deep links, almacenamiento y tráfico;
  comprobación de acceso cruzado entre clientes y entre tiendas.
- Resolver la actualización compatible del parser de URLs y repetir el audit.
- Resolver la decisión de Android mínimo y revisar los avisos de dependencias
  y de backend anteriores; el análisis no queda declarado globalmente limpio.
- **Al final, por decisión del dueño:** probar SMS real y retirar el OTP fijo de
  Supabase; verificar también el flujo completo de correo/pedido/pago.

## Referencias

- [MobSF oficial](https://github.com/MobSF/Mobile-Security-Framework-MobSF)
- [Aviso del parser URI](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)
- [Entrada de enlaces nativos en Expo](https://docs.expo.dev/router/advanced/native-intent/)
- [Afinidad de tareas Android](https://developer.android.com/guide/topics/manifest/activity-element)
