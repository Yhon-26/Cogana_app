import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '@/services/supabase/client';

export type SealedPackageInput = { presentation_id: string; units: number };

export type ReceiveLotInput = {
  storeId: string;
  productId: string;
  lotCode: string;
  expiresOn?: string | null;
  supplierId?: string | null;
  looseQuantity?: number;
  sealed?: SealedPackageInput[];
  notes?: string | null;
  operationId: string;
};

export type ReceiveLotResult = {
  lot_id: string;
  loose_quantity_added: number;
  sealed_units_added: number;
  idempotent_replay: boolean;
};

const LOT_CODE_MESSAGE = 'Escribe un código de lote.';
const EMPTY_ENTRY_MESSAGE =
  'Registra al menos existencias sueltas o paquetes sellados.';

export function validateReceiveLot(input: ReceiveLotInput): string | null {
  if (!input.lotCode.trim()) return LOT_CODE_MESSAGE;
  if (!Number.isInteger(input.looseQuantity) || (input.looseQuantity ?? 0) < 0)
    return 'La cantidad suelta debe ser un número entero.';
  const sealedUnits = (input.sealed ?? []).reduce((sum, item) => sum + item.units, 0);
  if ((input.looseQuantity ?? 0) === 0 && sealedUnits === 0) return EMPTY_ENTRY_MESSAGE;
  return null;
}

// La interfaz valida antes de llamar; la RPC vuelve a verificar el rol
// owner/admin, valida el producto y registra lote, paquetes y movimiento
// 'receipt' en una sola transacción idempotente.
export async function receiveInventoryLot(input: ReceiveLotInput) {
  const validationError = validateReceiveLot(input);
  if (validationError) throw new Error(validationError);
  await requireAuthorizedStore(input.storeId);
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data, error } = await client.rpc('receive_inventory_lot', {
    p_store_id: input.storeId,
    p_product_id: input.productId,
    p_lot_code: input.lotCode.trim(),
    p_expires_on: input.expiresOn?.trim() ? input.expiresOn.trim() : undefined,
    p_supplier_id: input.supplierId ?? undefined,
    p_loose_quantity: input.looseQuantity ?? 0,
    p_sealed: input.sealed?.length ? input.sealed : undefined,
    p_notes: input.notes?.trim() ? input.notes.trim() : undefined,
    p_operation_id: input.operationId,
  });
  if (error?.message === LOT_CODE_MESSAGE) throw new Error(LOT_CODE_MESSAGE);
  if (error) throw error;
  return data as ReceiveLotResult;
}
