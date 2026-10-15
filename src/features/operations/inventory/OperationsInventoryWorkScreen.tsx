import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { formatSoles } from '@/features/customer/products/formatPrice';
import { loadOperationsCatalog, loadProductPriceHistory } from '@/services/operations/data';
import { colors, fonts, spacing } from '@/theme/tokens';
import { InformationRow, OperationsInventoryPage } from './OperationsInventoryComponents';

type Catalog = Awaited<ReturnType<typeof loadOperationsCatalog>>;
type PriceHistory = Awaited<ReturnType<typeof loadProductPriceHistory>>;
export function OperationsInventoryWorkScreen({
  mode,
  id,
}: {
  mode: 'product' | 'price';
  id?: string;
}) {
  const { store } = useOperationsStore();
  const [data, setData] = useState<Catalog | null>(null);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<PriceHistory | null>(null);
  useEffect(() => {
    if (!store) return;
    let active = true;
    void loadOperationsCatalog(store.id)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [store]);
  const product = data?.products.find(
    (item) =>
      item.id === id ||
      data.presentations.some(
        (presentation) => presentation.id === id && presentation.product_id === item.id,
      ),
  );
  const presentations = data?.presentations.filter((item) => item.product_id === product?.id) ?? [];
  useEffect(() => {
    const ids =
      data?.presentations
        .filter((item) => item.product_id === product?.id)
        .map((item) => item.id) ?? [];
    if (!store || mode !== 'price' || !ids.length) return;
    let active = true;
    void loadProductPriceHistory(store.id, ids)
      .then((value) => {
        if (active) setHistory(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [store, mode, data, product?.id]);
  return (
    <OperationsInventoryPage
      title={mode === 'product' ? 'Producto y presentación' : 'Precio e historial'}
      subtitle={store?.name ?? 'Tienda'}
      backLabel="Catálogo"
      backDestinationLabel="Catálogo"
    >
      {error ? (
        <AppText>No pudimos cargar el producto.</AppText>
      ) : !data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : !product ? (
        <AppText style={{ marginTop: spacing.xl }}>
          El producto no pertenece a esta tienda o no está disponible.
        </AppText>
      ) : (
        <>
          <AppText
            accessibilityRole="header"
            style={{ fontFamily: fonts.semibold, fontSize: 18, marginTop: spacing.xl }}
          >
            {product.name}
          </AppText>
          <InformationRow label="SKU" value={product.sku ?? 'Sin SKU'} />
          {presentations.map((item) => (
            <InformationRow
              key={item.id}
              label={item.name.toUpperCase()}
              value={`${item.sku} · ${formatSoles(item.price_cents)}${item.is_active ? '' : ' · inactiva'}`}
            />
          ))}
          {mode === 'price' && (
            <>
              <AppText
                accessibilityRole="header"
                style={{ fontFamily: fonts.semibold, fontSize: 17, marginTop: spacing.xl }}
              >
                Historial de precios
              </AppText>
              {history === null ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : history.length ? (
                history.map((item) => (
                  <InformationRow
                    key={item.id}
                    label={new Date(item.changed_at).toLocaleDateString('es-PE')}
                    value={`${item.old_price_cents === null ? 'Inicial' : formatSoles(item.old_price_cents)} → ${formatSoles(item.new_price_cents)}`}
                  />
                ))
              ) : (
                <AppText secondary>No hay cambios de precio registrados.</AppText>
              )}
            </>
          )}
          <View
            style={{
              backgroundColor: colors.surfaceSuccess,
              borderRadius: 10,
              padding: spacing.md,
              marginTop: spacing.xl,
            }}
          >
            <AppText secondary>
              {mode === 'price'
                ? 'El cambio de precio requiere historial auditado y validación del servidor.'
                : 'La edición de productos requiere permisos owner/admin y validación antes de publicarse.'}
            </AppText>
          </View>
        </>
      )}
    </OperationsInventoryPage>
  );
}
