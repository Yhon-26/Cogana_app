// Copia de la pantalla 20 · Mis pedidos (estado vacío).
// No hay pedidos reales ni simulados: mostrar uno inventado contradiría el
// contrato. Cuando exista el servicio de pedidos, esta lista se llena desde él.
export const ordersContent = {
  title: 'Mis pedidos',
  subtitle: 'Tus compras, siempre a mano.',
  emptyTitle: 'Aún no tienes pedidos',
  emptyBody: 'Cuando hagas una compra, la verás aquí.',
  emptyChip: 'SIN COMPRAS',
  explore: 'Explorar la tienda',
} as const;
