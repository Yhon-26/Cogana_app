import { requireAuthorizedStore } from './access';
import { getSupabaseClient } from '@/services/supabase/client';

export type BusinessHoursInput = {
  weekday: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
};

const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const SCHEDULED_ORDERS_MESSAGE =
  'Hay pedidos futuros programados. Revisa sus compromisos antes de cambiar el horario.';

export function validateBusinessHours(input: BusinessHoursInput): string | null {
  if (!Number.isInteger(input.weekday) || input.weekday < 1 || input.weekday > 7)
    return 'Selecciona un día válido.';
  if (input.isClosed) return null;
  if (!validTime(input.opensAt) || !validTime(input.closesAt))
    return 'Escribe ambas horas en formato de 24 horas (HH:MM).';
  if (input.closesAt <= input.opensAt) return 'La hora de cierre debe ser posterior a la apertura.';
  return null;
}

// La interfaz valida antes de llamar, pero el servicio vuelve a validar para
// proteger a futuros consumidores. La RPC verifica el rol y guarda de forma
// transaccional; la tabla no admite escrituras directas desde la app.
export async function saveBusinessHours(storeId: string, input: BusinessHoursInput) {
  const validationError = validateBusinessHours(input);
  if (validationError) throw new Error(validationError);
  await requireAuthorizedStore(storeId);
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  // La RPC toma el mismo bloqueo de tienda que checkout y aplica la regla
  // de pedidos programados dentro de la transacción, antes de escribir.
  const { data, error } = await client.rpc('set_store_business_hours', {
    p_store_id: storeId,
    p_weekday: input.weekday,
    p_is_closed: input.isClosed,
    p_opens_at: input.isClosed ? null : input.opensAt,
    p_closes_at: input.isClosed ? null : input.closesAt,
  });
  if (error?.message === SCHEDULED_ORDERS_MESSAGE) throw new Error(SCHEDULED_ORDERS_MESSAGE);
  if (error) throw error;
  return data;
}
