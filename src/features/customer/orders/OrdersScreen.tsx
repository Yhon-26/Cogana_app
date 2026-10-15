import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { listCustomerOrders } from '@/services/customer/payments';
import { formatSoles } from '../products/formatPrice';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { ordersContent } from './ordersContent';

const backIcon = require('../../../assets/navigation/back.svg');

// 20 · Mis pedidos: estado vacío real (aún no hay pedidos), sin fotografía.
export function OrdersScreen() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof listCustomerOrders>> | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setOrders(null);
      setError('');
      void listCustomerOrders()
        .then((items) => {
          if (active) setOrders(items);
        })
        .catch((failure) => {
          if (active)
            setError(failure instanceof Error ? failure.message : 'No pudimos cargar tus pedidos.');
        });
      return () => {
        active = false;
      };
      // Retry explicitly restarts the focused query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision]),
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
        >
          <Image source={backIcon} tintColor={colors.primary} style={styles.backIcon} />
        </Pressable>
        <AppText style={styles.topBarTitle} accessibilityRole="header">
          {ordersContent.title}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>{ordersContent.title}</AppText>
        <AppText secondary style={styles.subtitle}>
          {ordersContent.subtitle}
        </AppText>

        {error && (
          <View style={styles.emptyCard}>
            <AppText accessibilityLiveRegion="polite">{error}</AppText>
            <Button
              label="Reintentar"
              variant="secondary"
              onPress={() => setRevision((value) => value + 1)}
            />
            <Button label="Ingresar a mi cuenta" onPress={() => router.push('/sign-in')} />
          </View>
        )}
        {!error && orders === null && <AppText>Cargando pedidos…</AppText>}
        {orders?.map((order) => (
          <Pressable
            key={order.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/order-tracking', params: { orderId: order.id } })
            }
            style={styles.emptyCard}
          >
            <AppText style={styles.emptyTitle}>
              {order.order_number} ·{' '}
              {formatSoles(order.final_total_cents ?? order.estimated_total_cents)}
            </AppText>
            <AppText>
              {order.status === 'cancelled'
                ? 'Cancelado'
                : order.payment_status === 'paid'
                  ? 'Pago confirmado'
                  : order.payment_status === 'processing'
                    ? 'Pago en revisión'
                    : 'Ver pedido y pago'}
            </AppText>
          </Pressable>
        ))}
        {orders?.length === 0 && (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>{ordersContent.emptyTitle}</AppText>
            <AppText style={styles.emptyBody}>{ordersContent.emptyBody}</AppText>
            <View style={styles.chip}>
              <AppText style={styles.chipText}>{ordersContent.emptyChip}</AppText>
            </View>
          </View>
        )}

        <Button
          label={ordersContent.explore}
          size="large"
          onPress={() => router.navigate('/store')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: { width: 22, height: 22 },
  topBarTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  emptyCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.brandBold, fontSize: 21, lineHeight: 27 },
  emptyBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    marginTop: spacing.xs,
  },
  chipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
});
