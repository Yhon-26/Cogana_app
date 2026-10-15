import type { PaymentMethod } from './CheckoutDraftContext';

export type PaymentMode = 'delivery' | 'pickup';

export type PaymentOptionContent = {
  id: PaymentMethod;
  mark: string;
  label: string;
  detail: string;
};

const deliveryOptions = [
  { id: 'yape', mark: 'Y', label: 'Yape', detail: 'Pago digital' },
  { id: 'plin', mark: 'P', label: 'Plin', detail: 'Pago digital' },
] satisfies readonly PaymentOptionContent[];

const pickupOptions = [
  ...deliveryOptions,
  { id: 'cash', mark: 'S/', label: 'Efectivo', detail: 'Al recoger tu pedido' },
] satisfies readonly PaymentOptionContent[];

export const paymentMethodContent = {
  topBarTitle: 'Medio de pago',
  heading: '¿Cómo prefieres pagar?',
  methodHeading: 'Elige un método',
  summaryHeading: 'Resumen',
  products: 'Productos',
  deliveryLabel: 'Entrega',
  pickupLabel: 'Recojo',
  pickupFree: 'Gratis',
  pendingAmount: 'Por confirmar',
  total: 'Total',
  deliveryTotal: 'Total de productos',
  action: 'Compra aún no disponible',
  loadingLabel: 'Cargando resumen de pago',
  loadError: 'No pudimos cargar el resumen.',
  retryAction: 'Reintentar',
  integrationPending:
    'Aún falta completar la conexión de compra. No se creó un pedido ni se inició un pago.',
  delivery: { badge: 'Entrega a domicilio', options: deliveryOptions },
  pickup: { badge: 'Recojo en tienda', options: pickupOptions },
} as const;
