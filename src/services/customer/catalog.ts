import type { CatalogItem } from '@/types/catalog';
import { customerStoreSlug, getPublicCustomerClient } from './checkoutSchedule';

// Approved provisional images only. Never infer prices or stock from these SKUs.
const referenceImages: Record<string, CatalogItem['image']> = {
  'COG-ARROZ-SUPERIOR': require('../../assets/products/rice-superior.png'),
  'COG-ARROZ-EXTRA': require('../../assets/products/rice-extra.png'),
  'COG-LENTEJA': require('../../assets/products/lentils.png'),
  'COG-LENTEJA-GRANEL': require('../../assets/products/lentils.png'),
  'COG-FRIJOL-CANARIO': require('../../assets/products/canary-beans.png'),
};

export async function listCustomerCatalog(): Promise<readonly CatalogItem[]> {
  const db = getPublicCustomerClient();
  const { data, error } = await db.rpc('get_customer_catalog', { p_store_slug: customerStoreSlug });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Respuesta de catálogo inválida.');
  return data.map((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Producto inválido.');
    const text = (key: string) => (typeof value[key] === 'string' ? (value[key] as string) : '');
    const number = (key: string) => {
      const n = value[key];
      if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0)
        throw new Error('Cantidad o precio inválido.');
      return n;
    };
    const baseQuantity = number('base_quantity');
    if (baseQuantity === 0) throw new Error('Presentación inválida.');
    const availableQuantity = number('available_quantity');
    const priceCents = number('price_cents');
    const path = text('image_path');
    const image = path
      ? { uri: db.storage.from('product-images').getPublicUrl(path).data.publicUrl }
      : (referenceImages[text('product_sku')] ?? null);
    return {
      id: text('id'),
      storeId: text('store_id'),
      productId: text('product_id'),
      productSku: text('product_sku'),
      presentationSku: text('presentation_sku'),
      name: text('name'),
      presentation: text('presentation'),
      description: text('description'),
      category: text('category'),
      categoryName: text('category_name'),
      priceCents,
      baseQuantity,
      baseUnit: text('base_unit'),
      availableQuantity,
      maxPresentations: Math.min(99, Math.floor(availableQuantity / baseQuantity)),
      allowsQuantity: value.allows_quantity_input === true,
      allowsMoney: value.allows_money_input === true,
      minimumQuantity: number('minimum_quantity'),
      quantityStep: number('quantity_step'),
      priceMode: text('price_mode'),
      isSealed: value.is_sealed === true,
      soldByWeight:
        text('base_unit') === 'gram' &&
        (value.allows_quantity_input === true || value.allows_money_input === true),
      pricePerKgCents: Math.round((priceCents * 1000) / baseQuantity),
      image,
      imageIsReference: !path && Boolean(image),
    };
  });
}
