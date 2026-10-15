import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { formatSoles } from '@/features/customer/products/formatPrice';
import { loadOperationsCatalog } from '@/services/operations/data';
import { colors, fonts, spacing } from '@/theme/tokens';
import { OperationsInventoryPage } from './OperationsInventoryComponents';

type Catalog = Awaited<ReturnType<typeof loadOperationsCatalog>>;

// Escaneo rápido: buscador + chip de estado por fila (stock en inventario,
// precio activo en catálogo). Sin filtros de servidor: la lista es corta.
// Se recarga al recuperar el foco para reflejar entradas registradas.
export function OperationsInventoryListScreen({ mode }: { mode: 'inventory' | 'catalog' }) {
  const { store } = useOperationsStore();
  const [data, setData] = useState<Catalog | null>(null);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false);
  const [query, setQuery] = useState('');
  const loaded = useRef(false);
  const requestRef = useRef(0);
  const load = useCallback(async () => {
    if (!store) return;
    const requestId = ++requestRef.current;
    try {
      const value = await loadOperationsCatalog(store.id);
      if (requestRef.current !== requestId) return;
      loaded.current = true;
      setData(value);
      setError(false);
      setStale(false);
    } catch {
      if (requestRef.current !== requestId) return;
      if (loaded.current) setStale(true);
      else setError(true);
    }
  }, [store]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const catalog = mode === 'catalog';

  const rows = useMemo(() => {
    if (!data) return [];
    const search = query.trim().toLocaleLowerCase('es-PE');
    return data.products
      .filter((product) =>
        search ? product.name.toLocaleLowerCase('es-PE').includes(search) : true,
      )
      .map((product) => {
        const presentations = data.presentations.filter((item) => item.product_id === product.id);
        const activePresentations = presentations.filter((item) => item.is_active);
        const lotCount = data.lots.filter((item) => item.product_id === product.id).length;
        const looseStock = data.lots
          .filter((item) => item.product_id === product.id && item.status === 'available')
          .reduce((sum, item) => sum + item.loose_on_hand_quantity, 0);
        const availableLotIds = new Set(
          data.lots
            .filter((item) => item.product_id === product.id && item.status === 'available')
            .map((item) => item.id),
        );
        const sealedStock = data.packages
          .filter((item) => availableLotIds.has(item.lot_id))
          .reduce((sum, item) => sum + item.sealed_on_hand_units, 0);
        return { product, presentations, activePresentations, lotCount, looseStock, sealedStock };
      });
  }, [data, query]);

  const total = data?.products.length ?? 0;
  const withStock = rows.filter((row) => row.looseStock > 0 || row.sealedStock > 0).length;
  const withPrice = rows.filter((row) => row.activePresentations.length > 0).length;

  return (
    <OperationsInventoryPage
      title={catalog ? 'Catálogo y precios' : 'Inventario'}
      subtitle={store?.name ?? 'Tienda'}
      backLabel={catalog ? 'Catálogo' : undefined}
      backDestinationLabel="Inventario"
    >
      {error ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <AppText>No pudimos cargar los productos.</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void load()}
            style={{ minHeight: 48, justifyContent: 'center' }}
          >
            <AppText style={{ color: colors.primary }}>Reintentar</AppText>
          </Pressable>
        </View>
      ) : !data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={catalog ? 'Buscar producto' : 'Buscar producto o lote'}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            autoCorrect={false}
            accessibilityLabel="Buscar producto"
            style={styles.search}
          />

          <AppText
            accessibilityRole="header"
            style={{ fontFamily: fonts.semibold, fontSize: 17, marginTop: spacing.lg }}
          >
            {query.trim() ? `Coincidencias · ${rows.length} de ${total}` : `Productos · ${total}`}
          </AppText>
          {stale && (
            <AppText secondary style={{ marginTop: spacing.xs }}>
              No pudimos actualizar el listado; esta información puede estar desactualizada.
            </AppText>
          )}
          {!catalog && total > 0 && (
            <AppText secondary style={{ marginTop: spacing.xs }}>
              {withStock} con stock · {total - withStock} sin stock
            </AppText>
          )}
          {catalog && total > 0 && (
            <AppText secondary style={{ marginTop: spacing.xs }}>
              {withPrice} con precio activo · {total - withPrice} sin precio
            </AppText>
          )}

          {rows.length ? (
            rows.map(
              ({
                product,
                presentations,
                activePresentations,
                lotCount,
                looseStock,
                sealedStock,
              }) => {
                const inStock = looseStock > 0 || sealedStock > 0;
                const priced = activePresentations.length > 0;
                return (
                  <Pressable
                    key={product.id}
                    accessibilityRole="button"
                    accessibilityLabel={product.name}
                    onPress={() =>
                      router.push({
                        pathname: catalog ? '/inventario/catalogo/[id]' : '/inventario/movimiento',
                        params: { id: product.id },
                      } as Href)
                    }
                    style={styles.row}
                  >
                    <View style={styles.rowCopy}>
                      <AppText style={styles.rowName}>{product.name}</AppText>
                      <AppText secondary>
                        {catalog
                          ? `${presentations.length} presentaciones · ${priced ? `desde ${formatSoles(Math.min(...activePresentations.map((item) => item.price_cents)))}` : 'sin precio activo'}`
                          : `${looseStock} unidades base sueltas · ${lotCount} lotes`}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.rowChip,
                        (catalog ? priced : inStock) ? styles.rowChipOk : styles.rowChipMuted,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.rowChipText,
                          !(catalog ? priced : inStock) && styles.rowChipTextMuted,
                        ]}
                      >
                        {catalog
                          ? priced
                            ? 'Con precio'
                            : 'Sin precio'
                          : inStock
                            ? 'Con stock'
                            : 'Sin stock'}
                      </AppText>
                    </View>
                  </Pressable>
                );
              },
            )
          ) : (
            <View style={{ marginTop: spacing.xl }}>
              <AppText secondary>
                {query.trim()
                  ? `No encontramos "${query.trim()}". Prueba con otro nombre.`
                  : 'No hay productos registrados para esta tienda.'}
              </AppText>
            </View>
          )}
          {!catalog && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/inventario/catalogo' as Href)}
              style={{ minHeight: 48, justifyContent: 'center', marginTop: spacing.xl }}
            >
              <AppText style={{ color: colors.primary, fontFamily: fonts.semibold }}>
                Ver catálogo y precios
              </AppText>
            </Pressable>
          )}
          <View
            style={{
              backgroundColor: colors.surfaceSuccess,
              padding: spacing.md,
              borderRadius: 10,
              marginTop: spacing.xl,
            }}
          >
            <AppText secondary>
              {catalog
                ? 'Los precios proceden de las presentaciones registradas en esta tienda.'
                : 'Se muestran existencias f?sicas sueltas y selladas. La disponibilidad para venta tambi?n depende de las reservas y los vencimientos.'}
            </AppText>
          </View>
        </>
      )}
    </OperationsInventoryPage>
  );
}

const styles = StyleSheet.create({
  search: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  rowName: { fontFamily: fonts.semibold },
  rowChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  rowChipOk: { backgroundColor: colors.surfaceSuccess },
  rowChipMuted: { backgroundColor: colors.surfaceMuted },
  rowChipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  rowChipTextMuted: { color: colors.textSecondary },
});
