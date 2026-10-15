// Datos de demostración. Sustituir al conectar el contrato de carrito real.
export type SampleCartLine = { productId: string; quantity: number };

export async function listSampleCart(): Promise<readonly SampleCartLine[]> {
  return [
    { productId: 'preview-lentils-500g', quantity: 1 },
    { productId: 'preview-rice-superior-5kg', quantity: 1 },
    { productId: 'preview-rice-extra-1kg', quantity: 1 },
  ];
}
