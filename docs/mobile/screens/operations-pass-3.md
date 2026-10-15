# Operaciones · Pasada 3: inventario y catálogo

- **06 · Inventario**: pestaña `/inventario`, Figma `545:3`. Sustituye la vista provisional y muestra tres presentaciones del catálogo de muestra. Cada fila indica «Sin lectura» porque aún no existen existencias, reservas, lotes, vencimientos ni alertas verificadas.
- **07 · Catálogo y precios**: `/inventario/catalogo`, Figma `545:4`. Reutiliza la misma muestra de productos y fotos locales. Los importes están señalados como precios de muestra; la publicación vigente no está conectada.
- **Registrar movimiento**: `/inventario/movimiento`, Figma `641:63`. Borrador local con lote, cantidad, vencimiento y motivo vacíos. Registrar entrada permanece deshabilitado.
- **Producto y presentación**: `/inventario/catalogo/[id]`, Figma `642:2`. Permite revisar y modificar temporalmente nombre y presentación de la muestra; SKU y precio quedan informativos. Guardar cambios permanece deshabilitado.
- **Precio e historial**: `/inventario/catalogo/precio?id=…`, Figma `642:35`. Se abre desde el producto elegido, muestra su precio provisional, permite redactar un nuevo importe y motivo y presenta un estado vacío de historial. Guardar precio permanece deshabilitado.

Estas vistas no duplican variantes de carga, vacío o error de Figma: las tratan como estados de la ruta correspondiente. La barra inferior existente se conserva y no se agregaron imágenes decorativas. `src/services/mock/operationsCatalog.ts` filtra el catálogo visual ya existente; no llama a Supabase ni afirma que las presentaciones estén publicadas. Los campos de borrador se pierden al salir.

La implementación conserva el sistema visual de `DESIGN.md`: fondo crema `#FCF9F1`, verde `#295D43`, tipografía Inter en operaciones, filas planas separadas por bordes y contenido con margen lateral de 20 dp. Usa los tokens de `src/theme/tokens.ts`, el encabezado de tienda y la barra inferior de cuatro pestañas ya existentes; Fraunces queda reservado para los momentos de marca. Los controles y enlaces de estas rutas tienen un área táctil mínima de 48 dp.

Antes de activar lecturas o escrituras reales: exigir membresía owner/admin activa para Santa Anita, resolver tienda y permisos en servidor, definir disponibilidad por presentación/lote, publicar precios vigentes e historial auditado y registrar movimientos de forma transaccional e idempotente. Las rutas no conceden acceso por sí mismas.

Validación: `npm run check` aprobado. En `emulator-5554` se abrieron Inventario, Catálogo, Registrar movimiento, Editar producto y Precio e historial; el enlace desde producto al precio se probó tocando la pantalla. Capturas en `tmp/mobile-qa/op6-inventory.png`, `op7-catalog-final.png`, `op43-movement-final.png`, `op44-product-final.png` y `op45-price-final.png`. Falta confirmar escala de texto 1.3 y lector de pantalla; el cambio de escala reinició Expo Go en la prueba.
