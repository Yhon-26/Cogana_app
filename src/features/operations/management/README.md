# Gestión

La Pasada 4 implementa Tu tienda, Horarios, Zonas, Pagos, Reparto y Actividad con lecturas autorizadas por tienda. Horarios permite guardar un día habitual a la vez mediante `set_store_business_hours`: la RPC valida owner/admin, se coordina con checkout y bloquea cambios si hay pedidos futuros programados. Las excepciones, zonas, pagos y reparto continúan en lectura hasta cerrar sus contratos de escritura. No hay datos operativos ficticios ni imágenes decorativas. Véase `docs/mobile/screens/operations-pass-4.md`.
