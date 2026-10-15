import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { AppText } from '@/components/AppText';
import { OperationsStoreHeader } from '@/components/OperationsStoreHeader';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { loadOperationsOrders } from '@/services/operations/data';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

type Orders = Awaited<ReturnType<typeof loadOperationsOrders>>;
export function OrdersQueueScreen() {
  const { store } = useOperationsStore();
  const [orders, setOrders] = useState<Orders | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!store) return;
    let active = true;
    void loadOperationsOrders(store.id)
      .then((value) => {
        if (active) setOrders(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [store, revision]);
  const visible =
    orders?.filter((item) =>
      item.order_number.toLowerCase().includes(query.trim().toLowerCase()),
    ) ?? [];
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <OperationsStoreHeader />
        <AppText accessibilityRole="header" style={styles.title}>
          Cola de pedidos
        </AppText>
        <AppText secondary style={styles.subtitle}>
          Pedidos registrados en {store?.name}
        </AppText>
        <TextInput
          accessibilityLabel="Buscar por número de pedido"
          placeholder="Buscar por número de pedido"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        {error ? (
          <View style={styles.empty}>
            <AppText>No se pudo cargar la cola.</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError(false);
                setRevision((value) => value + 1);
              }}
            >
              <AppText style={styles.link}>Reintentar</AppText>
            </Pressable>
          </View>
        ) : !orders ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <>
            <View style={styles.summary}>
              <AppText style={styles.summaryText}>
                {orders.length} {orders.length === 1 ? 'pedido reciente' : 'pedidos recientes'}
              </AppText>
            </View>
            {visible.length ? (
              visible.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Pedido ${item.order_number}`}
                  onPress={() =>
                    router.push({ pathname: '/pedidos/[id]', params: { id: item.id } } as Href)
                  }
                  style={styles.row}
                >
                  <AppText style={styles.code}>{item.order_number}</AppText>
                  <AppText secondary>
                    {item.fulfillment_type === 'pickup' ? 'Recojo' : 'Entrega'} · {item.status}
                  </AppText>
                  <AppText style={styles.payment}>Pago: {item.payment_status}</AppText>
                </Pressable>
              ))
            ) : (
              <View style={styles.empty}>
                <AppText secondary>
                  {query
                    ? 'No hay pedidos con ese número.'
                    : 'Aún no hay pedidos registrados en esta tienda.'}
                </AppText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.semibold, fontSize: 22, marginTop: spacing.xl },
  subtitle: { fontSize: 13, marginTop: spacing.xs },
  search: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  summary: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.page,
  },
  summaryText: { fontFamily: fonts.semibold },
  row: {
    minHeight: 100,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  code: { fontFamily: fonts.semibold, fontSize: 16 },
  payment: { color: colors.primary, fontSize: 12 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  link: { color: colors.primary, fontFamily: fonts.semibold, minHeight: layout.touchTarget },
});
