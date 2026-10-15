// Copia de las pantallas 30–33: estados posteriores al pago, todos de ejemplo.
// No hay cobros, pedidos ni propuestas reales; los textos lo dicen y los CTA
// permanecen deshabilitados hasta que existan los contratos del servidor.
export const paymentPendingContent = {
  topBar: 'Pago',
  title: 'Pago pendiente',
  subtitle: 'Vista futura, sin cobro iniciado.',
  sectionTitle: 'Después de pagar',
  cards: [
    { name: 'Respuesta del pago', body: 'El proveedor aún no la confirma.' },
    { name: 'Acción necesaria', body: 'Se indicará aquí, si corresponde.' },
  ],
  note: 'Ningún cobro se inició en esta app.',
  cta: 'Continuar',
  ctaNote: 'El estado real vendrá del proveedor.',
  exampleLink: 'Ver pedido recibido · ejemplo',
} as const;

export const orderReceivedContent = {
  topBar: 'Mis pedidos',
  title: 'Pedido recibido',
  subtitle: 'Vista futura, sin pedido real.',
  cardTitle: 'Solicitud registrada',
  cardBody: 'Pago y preparación se revisan por separado.',
  chip: 'SOLO EJEMPLO',
  cta: 'Seguir explorando',
  exampleLink: 'Ver detalle y seguimiento · ejemplo',
} as const;

export const orderTrackingContent = {
  topBar: 'Mis pedidos',
  title: 'Sigue tu pedido',
  subtitle: 'Estado de ejemplo, sin lectura real.',
  articlesTitle: 'Artículos · ejemplo',
  itemUnit: '1 unid.',
  deliveryCard: {
    name: 'Entrega a domicilio',
    detail: 'Dirección y horario por consultar',
    zone: 'Zona por confirmar',
  },
  paymentCard: { name: 'Estado del pago', detail: 'Por consultar' },
  summary: [
    { label: 'Pedido', value: 'Por confirmar', highlight: false },
    { label: 'Pago', value: 'Por consultar', highlight: false },
    { label: 'Entrega', value: 'Sin asignar', highlight: true },
  ],
  note: 'Sin pedido consultado en esta vista.',
  cta: 'Detalle no disponible',
  exampleLink: 'Ver cambio propuesto · ejemplo',
} as const;

export const substitutionContent = {
  topBar: 'Sustitución',
  eyebrow: 'EJEMPLO VISUAL · CAMBIO',
  title: 'Un cambio en tu compra',
  subtitle: 'Revisa la propuesta de la tienda.',
  original: { name: 'Tu producto', detail: 'Lenteja · bolsa 500 g', state: 'Original' },
  alternative: { name: 'Alternativa', detail: 'Sin producto propuesto', state: 'Pendiente' },
  deadlineLabel: 'PLAZO DE RESPUESTA',
  deadlineValue: 'Por confirmar',
  note: 'Sin propuesta real para responder',
  cta: 'Responder no disponible',
} as const;
