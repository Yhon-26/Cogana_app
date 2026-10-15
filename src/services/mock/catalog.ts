import type { CatalogPreviewItem } from '@/types/catalog';

// UI-only sample adapter for upcoming customer catalog screens.
// Names/presentations/amounts mirror database/seeds/20260918_initial_catalog_snapshot.sql.
// They are not current prices, publication status, availability, stock, or a Supabase read.
// Replace this adapter with an authorized catalog service after server contracts are ready.
const sampleCatalog: readonly CatalogPreviewItem[] = [
  {
    id: 'preview-rice-superior-5kg',
    productSku: 'COG-ARROZ-SUPERIOR',
    presentationSku: 'COG-ARROZ-SUPERIOR-5KG',
    name: 'Arroz superior',
    presentation: 'Bolsa 5 kg',
    category: 'arroces',
    priceCents: 1950,
    description:
      'Arroz superior de grano largo, de cocción soltada y rendidora. El básico de la olla de todos los días.',
    image: require('../../assets/products/rice-superior.png'),
  },
  {
    id: 'preview-rice-extra-1kg',
    productSku: 'COG-ARROZ-EXTRA',
    presentationSku: 'COG-ARROZ-EXTRA-1KG',
    name: 'Arroz extra',
    presentation: 'Bolsa 1 kg',
    category: 'arroces',
    priceCents: 420,
    description:
      'Arroz extra de grano corto y fino, perfecto para arroces con sofrito y guisos caseros.',
    image: require('../../assets/products/rice-extra.png'),
  },
  {
    id: 'preview-lentils-500g',
    productSku: 'COG-LENTEJA',
    presentationSku: 'COG-LENTEJA-500G',
    name: 'Lenteja',
    presentation: 'Bolsa 500 g',
    category: 'menestras-granos',
    priceCents: 520,
    description:
      'Lenteja de primera selección, rica en hierro, proteínas y fibra vegetal. No necesita remojo largo.',
    image: require('../../assets/products/lentils.png'),
  },
  {
    id: 'preview-canary-beans-500g',
    productSku: 'COG-FRIJOL-CANARIO',
    presentationSku: 'COG-FRIJOL-CANARIO-500G',
    name: 'Frijol canario',
    presentation: 'Bolsa 500 g',
    category: 'menestras-granos',
    priceCents: 650,
    description:
      'Frijol canario de grano tierno y piel suave, ideal para menestras cremosas de olla.',
    image: require('../../assets/products/canary-beans.png'),
  },
  {
    id: 'preview-lentils-bulk',
    productSku: 'COG-LENTEJA-GRANEL',
    presentationSku: 'COG-LENTEJA-GRANEL-KG',
    name: 'Lenteja a granel',
    presentation: 'Por kilo',
    category: 'menestras-granos',
    priceCents: 1040,
    soldByWeight: true,
    pricePerKgCents: 1040,
    description: 'Lenteja a granel: pide el peso que necesitas y lo pesamos al momento.',
    image: require('../../assets/products/lentils.png'),
  },
];

export async function listSampleCatalog(): Promise<readonly CatalogPreviewItem[]> {
  return sampleCatalog;
}
