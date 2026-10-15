// Etiquetas de interfaz para los estados persistidos por Supabase.
// Conservamos los valores originales en los servicios y solo traducimos al presentar.
const operationalStatusLabels: Record<string, string> = {
  closed: 'Cerrada',
  accepting_orders: 'Recibiendo pedidos',
  preparing_orders: 'Preparando pedidos',
  paused: 'Pausada',
};

export function operationalStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Sin estado operativo registrado';
  return operationalStatusLabels[status] ?? 'Estado no disponible';
}
