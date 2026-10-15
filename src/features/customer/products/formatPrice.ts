// El catálogo provisional almacena importes enteros en céntimos para evitar errores de coma flotante.
export function formatSoles(priceCents: number): string {
  return `S/ ${(priceCents / 100).toFixed(2)}`;
}
