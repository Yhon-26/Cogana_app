// Copia de la pantalla 06 · Buscar productos.
// La búsqueda filtra el catálogo de muestra por nombre y presentación;
// los resultados abren el detalle de producto. No consulta Supabase.
export const searchContent = {
  title: 'Buscar productos',
  placeholder: 'Busca arroz, lentejas y más',
  countSuffix: 'productos del catálogo',
  countSuffixSingular: 'producto del catálogo',
  emptyHint: 'Busca por producto o presentación: arroz, lenteja, bolsa 5 kg…',
  notFoundPrefix: 'No encontramos',
  notFoundSuffix: 'Prueba con arroz, lenteja o frijol.',
  catalogError: 'No pudimos cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.',
} as const;
