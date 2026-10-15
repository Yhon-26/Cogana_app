import type { CustomerCartLine } from './cart';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseSavedCart(input: string | null): readonly CustomerCartLine[] {
  if (!input) return [];
  const saved: unknown = JSON.parse(input);
  if (
    !saved ||
    typeof saved !== 'object' ||
    !('version' in saved) ||
    saved.version !== 1 ||
    !('lines' in saved) ||
    !Array.isArray(saved.lines) ||
    saved.lines.length > 100
  )
    throw new Error('No pudimos recuperar el carrito guardado.');
  const seen = new Set<string>();
  return saved.lines.map((value: unknown) => {
    if (
      !value ||
      typeof value !== 'object' ||
      !('productId' in value) ||
      typeof value.productId !== 'string' ||
      !uuid.test(value.productId) ||
      seen.has(value.productId) ||
      !('quantity' in value) ||
      typeof value.quantity !== 'number' ||
      !Number.isSafeInteger(value.quantity) ||
      value.quantity < 1
    )
      throw new Error('El carrito guardado contiene datos inválidos.');
    seen.add(value.productId);
    const line: CustomerCartLine = { productId: value.productId, quantity: value.quantity };
    if ('bulk' in value && value.bulk !== undefined) {
      const bulk = value.bulk;
      if (
        !bulk ||
        typeof bulk !== 'object' ||
        !('mode' in bulk) ||
        (bulk.mode !== 'quantity' && bulk.mode !== 'money') ||
        !('value' in bulk) ||
        typeof bulk.value !== 'number' ||
        !Number.isSafeInteger(bulk.value) ||
        bulk.value <= 0 ||
        line.quantity !== 1
      )
        throw new Error('El carrito guardado contiene un peso o monto inválido.');
      line.bulk = { mode: bulk.mode, value: bulk.value };
    }
    return line;
  });
}
export function serializeCart(lines: readonly CustomerCartLine[]) {
  const value = JSON.stringify({ version: 1, lines });
  parseSavedCart(value);
  return value;
}
export function mergeSavedCart(
  saved: readonly CustomerCartLine[],
  guest: readonly CustomerCartLine[],
) {
  const result = [...new Map([...saved, ...guest].map((line) => [line.productId, line])).values()];
  return parseSavedCart(serializeCart(result));
}
