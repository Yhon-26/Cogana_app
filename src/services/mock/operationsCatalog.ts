import { listSampleCatalog } from './catalog';

// Misma muestra visual que el cliente; no representa publicaciones, precios ni stock vigentes.
const operationsPreviewIds = new Set([
  'preview-rice-superior-5kg',
  'preview-lentils-500g',
  'preview-canary-beans-500g',
]);

export async function listOperationsCatalogPreview() {
  const catalog = await listSampleCatalog();
  return catalog.filter((item) => operationsPreviewIds.has(item.id));
}

export async function getOperationsCatalogPreview(id: string) {
  const catalog = await listOperationsCatalogPreview();
  return catalog.find((item) => item.id === id) ?? null;
}
