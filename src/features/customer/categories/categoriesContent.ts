import type { CatalogPreviewItem } from '@/types/catalog';

// Copia y categorías de la pantalla 05 · Categorías.
// `sampleCategory` apunta a la categoría del catálogo de muestra; las filas sin
// categoría con productos no navegan todavía (no se promete una navegación vacía).
export const categoriesIntro = {
  brand: 'Cogana',
  locality: 'Santa Anita',
  title: 'Categorías',
  subtitle: 'Todo lo que necesitas para tu despensa.',
} as const;

export type CategoryLink = {
  key: string;
  name: string;
  description: string;
  sampleCategory?: CatalogPreviewItem['category'];
};

export const categoryLinks: readonly CategoryLink[] = [
  {
    key: 'arroces',
    name: 'Arroces',
    description: 'Granos largos y cortos para tu olla.',
    sampleCategory: 'arroces',
  },
  {
    key: 'menestras-granos',
    name: 'Menestras y granos',
    description: 'Lentejas, frijoles y más.',
    sampleCategory: 'menestras-granos',
  },
  {
    key: 'aceites',
    name: 'Aceites',
    description: 'Para cocinar todos los días.',
  },
  {
    key: 'pastas',
    name: 'Pastas',
    description: 'Fideos y más.',
  },
  {
    key: 'azucar-endulzantes',
    name: 'Azúcar y endulzantes',
    description: 'Para tu cocina.',
  },
] as const;
