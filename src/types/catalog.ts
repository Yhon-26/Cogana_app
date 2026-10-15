import type { ImageSourcePropType } from 'react-native';

// Presentation-level shape: price belongs to a presentation, not to a product.
export type CatalogPreviewItem = {
  id: string;
  productSku: string;
  presentationSku: string;
  name: string;
  presentation: string;
  category: 'arroces' | 'menestras-granos' | 'aceites';
  priceCents: number;
  soldByWeight?: boolean;
  pricePerKgCents?: number;
  description: string;
  image: ImageSourcePropType;
};

// Public server projection. id always identifies a purchasable presentation.
export type CatalogItem = Omit<CatalogPreviewItem, 'category' | 'image'> & {
  storeId: string;
  productId: string;
  category: string;
  categoryName: string;
  image: ImageSourcePropType | null;
  imageIsReference: boolean;
  baseQuantity: number;
  baseUnit: string;
  availableQuantity: number;
  maxPresentations: number;
  allowsQuantity: boolean;
  allowsMoney: boolean;
  minimumQuantity: number;
  quantityStep: number;
  priceMode: string;
  isSealed: boolean;
};
