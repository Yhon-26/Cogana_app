import type { OperationsOrderPreview } from '@/types/operationsOrder';

// Pedidos de composición de Figma. Nunca usarlos como cola, pago o stock reales.
const previewOrders: readonly OperationsOrderPreview[] = [
  {
    id: 'example-cg-2847',
    code: 'CG-2847',
    fulfillment: 'pickup',
    timeLabel: '16:00',
    status: 'to_prepare',
    paymentLabel: 'Pago confirmado',
    items: [
      { productId: 'preview-rice-superior-5kg', quantity: 1 },
      { productId: 'preview-lentils-500g', quantity: 1 },
    ],
  },
  {
    id: 'example-cg-2846',
    code: 'CG-2846',
    fulfillment: 'delivery',
    timeLabel: '16:00–18:00',
    status: 'payment_pending',
    paymentLabel: 'Yape por revisar',
    items: [
      { productId: 'preview-rice-superior-5kg', quantity: 1 },
      { productId: 'preview-lentils-500g', quantity: 1 },
    ],
  },
];

export async function listPreviewOperationsOrders(): Promise<readonly OperationsOrderPreview[]> {
  return previewOrders;
}

export async function getPreviewOperationsOrder(
  id: string,
): Promise<OperationsOrderPreview | null> {
  return previewOrders.find((order) => order.id === id) ?? null;
}
