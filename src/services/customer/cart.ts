import type { CatalogItem } from '@/types/catalog';

// Local intent only. No inventory reservation or trusted checkout totals here.
export type CustomerCartLine = {
  productId: string; // Presentation UUID; retained name for existing UI consumers.
  quantity: number;
  bulk?: BulkRequest;
};

export type BulkRequest = { mode: 'quantity' | 'money'; value: number };

// Parse strings instead of multiplying decimal floats (S/ 1.10 = exactly 110).
export function parseBulkRequest(mode: BulkRequest['mode'], input: string): BulkRequest {
  const value = input.trim().replace(',', '.');
  if (!(mode === 'quantity' ? /^\d+$/ : /^\d+(\.\d{1,2})?$/).test(value))
    throw new Error(
      mode === 'quantity' ? 'Ingresa gramos enteros.' : 'Ingresa soles con hasta dos decimales.',
    );
  const [whole, fraction = ''] = value.split('.');
  const integer =
    mode === 'quantity' ? Number(whole) : Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(integer) || integer <= 0)
    throw new Error('Ingresa un valor mayor a cero.');
  return { mode, value: integer };
}

// Integer arithmetic follows private.create_checkout_order: quantity rounds to
// cents; money rounds DOWN to the configured step, then down to chargeable cents.
// This remains an estimate; the server quotes again and performs FEFO atomically.
export function quoteBulk(product: CatalogItem, request: BulkRequest) {
  if (
    !Number.isSafeInteger(request.value) ||
    request.value <= 0 ||
    product.isSealed ||
    product.priceMode !== 'proportional' ||
    product.baseQuantity <= 0 ||
    product.priceCents <= 0 ||
    product.quantityStep <= 0
  )
    throw new Error('La cantidad o presentación no es válida.');
  const amount = BigInt(request.value);
  const base = BigInt(product.baseQuantity);
  const price = BigInt(product.priceCents);
  const step = BigInt(product.quantityStep);
  let grams: bigint;
  let cents: bigint;
  if (request.mode === 'quantity') {
    if (!product.allowsQuantity) throw new Error('Esta presentación no admite compra por peso.');
    grams = amount;
    if (grams % step !== 0n)
      throw new Error(`El peso debe ser múltiplo de ${product.quantityStep} g.`);
    cents = (grams * price + base / 2n) / base;
  } else {
    if (!product.allowsMoney) throw new Error('Esta presentación no admite compra por monto.');
    grams = ((amount * base) / price / step) * step;
    cents = (grams * price) / base;
  }
  if (grams < BigInt(product.minimumQuantity) || cents <= 0n)
    throw new Error(`La cantidad mínima es ${product.minimumQuantity} g.`);
  if (grams > BigInt(Number.MAX_SAFE_INTEGER) || cents > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('La cantidad es demasiado grande.');
  return {
    quantity: Number(grams),
    cents: Number(cents),
    available: grams <= BigInt(product.availableQuantity),
  };
}

export function setBulkLine(
  lines: readonly CustomerCartLine[],
  product: CatalogItem,
  request: BulkRequest,
): readonly CustomerCartLine[] {
  if (!quoteBulk(product, request).available)
    throw new Error('No hay stock suficiente para esa cantidad.');
  const next = { productId: product.id, quantity: 1, bulk: { ...request } };
  return lines.some((line) => line.productId === product.id)
    ? lines.map((line) => (line.productId === product.id ? next : line))
    : [...lines, next];
}

// Shared by cart, review and payment to prevent totals drifting between screens.
export function resolveCartLine(product: CatalogItem, line: CustomerCartLine) {
  if (!line.bulk) return { product, quantity: line.quantity, bulk: false };
  try {
    const quote = quoteBulk(product, line.bulk);
    return {
      product: {
        ...product,
        priceCents: quote.cents,
        presentation: `${quote.quantity} g · estimado`,
        maxPresentations: quote.available ? 1 : 0,
      },
      quantity: 1,
      bulk: true,
    };
  } catch {
    return {
      product: {
        ...product,
        priceCents: 0,
        presentation: 'Revisa el peso o monto',
        maxPresentations: 0,
      },
      quantity: 1,
      bulk: true,
    };
  }
}

// Only intent is sent. Never send client prices as authoritative checkout data.
export function cartLinePayload(line: CustomerCartLine) {
  return {
    presentation_id: line.productId,
    request_mode: line.bulk?.mode ?? 'presentation',
    requested_quantity: line.bulk?.mode === 'money' ? null : (line.bulk?.value ?? line.quantity),
    requested_money_cents: line.bulk?.mode === 'money' ? line.bulk.value : null,
  };
}

export function addPresentation(
  lines: readonly CustomerCartLine[],
  product: CatalogItem,
  quantity: number,
): readonly CustomerCartLine[] {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Cantidad inválida.');
  if (lines.find((line) => line.productId === product.id)?.bulk)
    throw new Error('Edita el peso o monto desde el producto.');
  const existing = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
  if (existing + quantity > product.maxPresentations)
    throw new Error('No hay stock suficiente para esa cantidad.');
  return existing
    ? lines.map((line) =>
        line.productId === product.id ? { ...line, quantity: line.quantity + quantity } : line,
      )
    : [...lines, { productId: product.id, quantity }];
}
