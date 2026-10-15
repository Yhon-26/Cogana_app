import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useIsFocused } from 'expo-router';
import { AppText } from '@/components/AppText';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { formatSoles } from '@/features/customer/products/formatPrice';
import { loadOperationsOrder } from '@/services/operations/data';
import { colors, fonts, layout, spacing } from '@/theme/tokens';
import { OrderActions } from './OrderActions';

type Detail = Awaited<ReturnType<typeof loadOperationsOrder>>;
export function OrderPreparationScreen({
  id,
  step,
}: {
  id: string;
  step?: 'result' | 'substitution';
}) {
  const { store } = useOperationsStore();
  const isFocused = useIsFocused();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!store || !isFocused) return;
    let active = true;
    void loadOperationsOrder(store.id, id)
      .then((value) => {
        if (active) {
          setDetail(value);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [store, id, revision, isFocused]);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a pedidos"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/pedidos'))}
          style={styles.back}
        >
          <AppText style={styles.link}>‹ Pedidos</AppText>
        </Pressable>
        <AppText accessibilityRole="header" style={styles.title}>
          {step === 'result'
            ? 'Resultado por artículo'
            : step === 'substitution'
              ? 'Sustitución'
              : 'Detalle y preparación'}
        </AppText>
        {error ? (
          <View style={styles.box}>
            <AppText>No se pudo cargar el pedido.</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError(false);
                setRevision((value) => value + 1);
              }}
              style={styles.back}
            >
              <AppText style={styles.link}>Reintentar</AppText>
            </Pressable>
          </View>
        ) : !detail ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : !detail.order ? (
          <View style={styles.box}>
            <AppText>
              Este pedido no pertenece a la tienda seleccionada o ya no está disponible.
            </AppText>
          </View>
        ) : (
          <>
            <AppText style={styles.code}>{detail.order.order_number}</AppText>
            <View style={styles.box}>
              <AppText>Pedido: {detail.order.status}</AppText>
              <AppText>Pago: {detail.order.payment_status}</AppText>
              <AppText>{detail.order.fulfillment_type === 'pickup' ? 'Recojo' : 'Entrega'}</AppText>
              <AppText style={styles.total}>
                Total{' '}
                {formatSoles(detail.order.final_total_cents ?? detail.order.estimated_total_cents)}
              </AppText>
            </View>
            <AppText accessibilityRole="header" style={styles.heading}>
              Productos · {detail.items.length}
            </AppText>
            {detail.items.map((item) => (
              <View key={item.id} style={styles.row}>
                <AppText style={styles.name}>{item.product_name_snapshot}</AppText>
                <AppText secondary>
                  {item.presentation_name_snapshot} ·{' '}
                  {item.requested_quantity ?? 'cantidad por confirmar'}
                </AppText>
                <AppText style={styles.link}>
                  {formatSoles(item.final_line_cents ?? item.estimated_line_cents)}
                </AppText>
              </View>
            ))}
            <View style={styles.notice}>
              <AppText secondary>
                {step === 'substitution'
                  ? 'Consulta al cliente y verifica el reemplazo antes de finalizar.'
                  : step === 'result'
                    ? 'El resultado por artículo requiere pesos y cantidades verificados antes de guardarse.'
                    : 'Verifica las cantidades físicas antes de marcar el pedido listo.'}
              </AppText>
            </View>
            {store && (
              <OrderActions
                key={`${revision}:${detail.order.status}:${detail.order.final_total_cents}:${detail.items.map((item) => item.estimated_quantity).join(',')}`}
                storeId={store.id}
                detail={detail}
                onSaved={() => setRevision((value) => value + 1)}
              />
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
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  back: { minHeight: layout.touchTarget, justifyContent: 'center' },
  link: { color: colors.primary, fontFamily: fonts.semibold },
  title: { fontFamily: fonts.semibold, fontSize: 22, marginTop: spacing.xl },
  code: { fontFamily: fonts.semibold, fontSize: 18, marginTop: spacing.xl },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  total: { fontFamily: fonts.semibold },
  heading: { fontFamily: fonts.semibold, fontSize: 17, marginTop: spacing.xxl },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  name: { fontFamily: fonts.semibold },
  notice: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.xxl,
  },
});
