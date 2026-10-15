export type OperationsOrderStatus = 'to_prepare' | 'payment_pending';

export type OperationsOrderPreview = {
  id: string;
  code: string;
  fulfillment: 'pickup' | 'delivery';
  timeLabel: string;
  status: OperationsOrderStatus;
  paymentLabel: string;
  items: readonly { productId: string; quantity: number }[];
};
