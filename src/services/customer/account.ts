import { getCustomerAuthClient } from './auth';
import { customerStoreSlug } from './checkoutSchedule';
import type { Json } from '@/types/database.generated';
import { randomUUID } from 'expo-crypto';

function obj(value: Json | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('No pudimos leer tu cuenta.');
  return value;
}
function text(value: Json | undefined) {
  if (typeof value !== 'string') throw new Error('No pudimos leer los datos de tu cuenta.');
  return value;
}
export async function loadCustomerAccount() {
  const { data, error } = await getCustomerAuthClient().rpc('get_customer_account', {
    p_store_slug: customerStoreSlug,
  });
  if (error)
    throw new Error(
      error.code === '42501' ? error.message : 'No pudimos consultar tu cuenta. Reintenta.',
    );
  const account = obj(data);
  const customer = account.customer === null ? null : obj(account.customer);
  const preferences = account.preferences === null ? null : obj(account.preferences);
  if (!Array.isArray(account.addresses)) throw new Error('No pudimos leer tus direcciones.');
  return {
    storeId: text(account.store_id),
    customer: customer
      ? { id: text(customer.id), name: text(customer.name), phone: text(customer.phone) }
      : null,
    preferences: {
      order_notifications: preferences?.order_notifications !== false,
      promotion_notifications: preferences?.promotion_notifications === true,
      marketing_consent: preferences?.marketing_consent === true,
      substitution_default:
        typeof preferences?.substitution_default === 'string'
          ? preferences.substitution_default
          : 'contact',
    },
    addresses: account.addresses.map((value) => {
      const address = obj(value);
      return {
        id: text(address.id),
        label: text(address.label),
        address: text(address.address_line),
        district: text(address.district),
        reference: typeof address.reference === 'string' ? address.reference : '',
        isDefault: address.is_default === true,
      };
    }),
  };
}
export async function saveCustomerAccount(
  storeId: string,
  payload: Json,
  operationId = randomUUID(),
) {
  const { error } = await getCustomerAuthClient().rpc('save_customer_account', {
    p_store_id: storeId,
    p_payload: payload,
    p_operation_id: operationId,
  });
  if (error)
    throw new Error(
      ['P0001', '22023', '42501'].includes(error.code)
        ? error.message
        : 'No pudimos guardar. Actualiza tu cuenta antes de reintentar.',
    );
}
export async function listCustomerNotifications() {
  const { data, error } = await getCustomerAuthClient().rpc('get_customer_notifications', {
    p_store_slug: customerStoreSlug,
  });
  if (error)
    throw new Error(error.code === '42501' ? error.message : 'No pudimos consultar los avisos.');
  if (!Array.isArray(data)) throw new Error('No pudimos leer los avisos.');
  return data.map((value) => {
    const item = obj(value);
    return {
      id: text(item.id),
      orderId: text(item.order_id),
      number: text(item.order_number),
      status: text(item.status),
      at: text(item.at),
    };
  });
}
export async function deleteCustomerAddress(addressId: string) {
  const { error } = await getCustomerAuthClient().rpc('delete_customer_address', {
    p_address_id: addressId,
  });
  if (error)
    throw new Error(
      error.code === '42501' ? error.message : 'No pudimos eliminar la dirección. Reintenta.',
    );
}
export async function requestCustomerAccountDeletion() {
  const { error } = await getCustomerAuthClient().rpc('request_customer_account_deletion');
  if (error)
    throw new Error(
      error.code === '42501' ? error.message : 'No pudimos registrar la solicitud. Reintenta.',
    );
}
