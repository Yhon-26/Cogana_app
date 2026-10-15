// Copia de las pantallas 25 · Tus preferencias, 26 · Notificaciones y
// 27 · Privacidad y cuenta. Estados honestos: los valores de preferencias no
// están cargados (no hay cuenta), la bandeja de avisos no existe y la
// eliminación de cuenta pertenece al contrato de identidad.
export const preferencesContent = {
  topBar: 'Más',
  title: 'Tus preferencias',
  subtitle: 'Ajusta cómo compras en Cogana.',
  settings: [
    { key: 'order-notices', name: 'Avisos de pedido', description: 'Estado de tus compras' },
    { key: 'offers', name: 'Ofertas', description: 'Novedades de la tienda' },
    { key: 'commercial', name: 'Permiso comercial', description: 'Consentimiento separado' },
    { key: 'substitutions', name: 'Sustituciones', description: 'Elección habitual' },
  ],
  pendingChip: 'POR CARGAR',
  saveCta: 'Guardar cambios',
  saveNote: 'Se activará cuando exista tu cuenta.',
} as const;

export const notificationsContent = {
  topBar: 'Más',
  title: 'Notificaciones',
  subtitle: 'Lo importante de tus compras.',
  emptyTitle: 'Avisos en preparación',
  emptyBody: 'Aún no hay una bandeja de mensajes.',
  chip: 'FUNCIÓN NO DISPONIBLE',
  ordersCta: 'Ver mis pedidos',
} as const;

export const privacyContent = {
  topBar: 'Más',
  title: 'Privacidad y cuenta',
  subtitle: 'Control sobre tus datos.',
  dataTitle: 'Tus datos',
  dataBody: 'Solo con identidad verificada.',
  deleteTitle: 'Eliminar mi cuenta',
  deleteBody: 'Estado de solicitud por cargar.',
  deleteChip: 'NO DISPONIBLE',
  deleteCta: 'Solicitar eliminación',
} as const;
