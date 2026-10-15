import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { OperationsStoreHeader } from '@/components/OperationsStoreHeader';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { operationalStatusLabel } from '@/features/operations/storeStatus';
import { loadOperationsOverview } from '@/services/operations/data';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

type Overview = Awaited<ReturnType<typeof loadOperationsOverview>>;
export function OperationsPanelScreen() {
  const { store } = useOperationsStore();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!store) return;
    let active = true;
    void loadOperationsOverview(store.id)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [store, revision]);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <OperationsStoreHeader />
        <AppText accessibilityRole="header" style={styles.title}>
          Panel de tienda
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {store?.name ?? 'Tienda'} · datos de la tienda
        </AppText>
        {error ? (
          <View style={styles.message}>
            <AppText>No se pudo cargar el panel.</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError(false);
                setRevision((value) => value + 1);
              }}
              style={styles.action}
            >
              <AppText style={styles.actionText}>Reintentar</AppText>
            </Pressable>
          </View>
        ) : !data ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <>
            <AppText accessibilityRole="header" style={styles.sectionTitle}>
              Resumen
            </AppText>
            <View style={styles.metrics}>
              {[
                ['Pedidos totales', String(data.total)],
                ['Por preparar', String(data.preparing)],
                ['Pago pendiente', String(data.pending)],
              ].map(([label, value]) => (
                <View key={label} style={styles.metric}>
                  <AppText style={styles.value}>{value}</AppText>
                  <AppText secondary style={styles.label}>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>
            <AppText accessibilityRole="header" style={styles.sectionTitle}>
              Siguiente acción
            </AppText>
            {data.orders[0] ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/pedidos')}
                style={styles.message}
              >
                <AppText style={styles.actionText}>{data.orders[0].order_number}</AppText>
                <AppText secondary>Ver pedidos de la tienda</AppText>
              </Pressable>
            ) : (
              <View style={styles.message}>
                <AppText secondary>Aún no hay pedidos registrados.</AppText>
              </View>
            )}
            <View style={styles.state}>
              <AppText style={styles.actionText}>Estado de la tienda</AppText>
              <AppText secondary>{operationalStatusLabel(data.state?.status)}</AppText>
              {!!data.state?.public_message && (
                <AppText secondary>{data.state.public_message}</AppText>
              )}
            </View>
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
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 31, marginTop: spacing.xl },
  subtitle: { marginTop: spacing.xs, fontSize: 13 },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  metrics: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
  },
  metric: { flex: 1, alignItems: 'center', gap: spacing.xs },
  value: { fontFamily: fonts.semibold, fontSize: 24, color: colors.primary },
  label: { textAlign: 'center', fontSize: 11 },
  message: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  state: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  action: { minHeight: layout.touchTarget, justifyContent: 'center' },
  actionText: { color: colors.primary, fontFamily: fonts.semibold },
});
