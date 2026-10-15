# Catálogo de muestra

`catalog.ts` contiene presentaciones y precios documentados en la semilla inicial, con imágenes conceptuales locales.
La tienda `459:197` muestra arroz superior y lenteja; su búsqueda y sus filtros consultan localmente las cuatro fichas de este adaptador.
Sirve para construir y revisar las próximas pantallas de catálogo sin depender de datos reales.
No contiene existencias, publicación, disponibilidad ni permisos de compra.
Al conectar el backend, sustituir el adaptador y conservar `CatalogPreviewItem` solo si el contrato real lo permite.
