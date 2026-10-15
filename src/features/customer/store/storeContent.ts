// Diseño vigente: ZIP de Inicio aportado por el usuario. Datos del catálogo sin cambios.
// Productos, precios y stock se consultan en services/customer/catalog.ts.
export const storeContent = {
  brand: 'Cogana',
  locality: 'Santa Anita',
  searchPlaceholder: '¿Qué se te antoja hoy?',
  localityLabel: 'Tu tienda',
  fulfillmentLabel: 'Entrega o recojo',
  hoursAction: 'Ver horarios',
  bannerEyebrow: 'TU DESPENSA',
  bannerTitle: 'Básicos de casa',
  bannerAction: 'Descubrir',
  categoryTitle: 'Compra por categoría',
  categoryAction: 'Ver todas',
  productsTitle: 'Para tu despensa',
  productsAction: 'Ver más',
  noMatches: 'No encontramos productos con esa búsqueda.',
  noCategoryItems: 'Pronto encontrarás productos de esta categoría.',
  catalogError: 'No pudimos cargar los productos. Revisa tu conexión e intenta de nuevo.',
} as const;

export const storeCategories = [
  { label: 'Arroces', key: 'arroces', width: 101 },
  { label: 'Menestras', key: 'menestras-granos', width: 116 },
  { label: 'Aceites', key: 'aceites', width: 116 },
] as const;

// Orden editorial de la tienda. Se reemplazará por la selección publicada del backend.
export const featuredPresentationSkus = ['COG-ARROZ-SUPERIOR-5KG', 'COG-LENTEJA-500G'];
