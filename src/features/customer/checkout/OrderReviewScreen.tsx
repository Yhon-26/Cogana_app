import { resolveCartLine } from '@/services/customer/cart';
import { useCallback, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { useFocusEffect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import type { CatalogItem } from '@/types/catalog';
import { formatSoles } from '../products/formatPrice';
import { useCheckoutDraft } from './CheckoutDraftContext';
import { formatCheckoutSlot } from '@/services/customer/checkoutSchedule';
import { orderReviewContent as content } from './orderReviewContent';
import { useDeliveryZones } from './useDeliveryZones';

const backIcon = require('../../../assets/navigation/back.svg');
const deliveryIcon = require('../../../assets/checkout/delivery.svg');
type ReviewLine = { product: CatalogItem; quantity: number };

function ProductRow({ line, last }: { line: ReviewLine; last: boolean }) {
  const lineTotal = line.product.priceCents * line.quantity;
  return (
    <View style={[styles.productRow, !last && styles.productDivider]}>
      <Image
        source={line.product.image}
        contentFit="cover"
        style={styles.productImage}
        accessible={false}
      />
      <View style={styles.productCopy}>
        <AppText style={styles.productName} numberOfLines={2}>
          {line.product.name}
        </AppText>
        <AppText style={styles.productDetail}>
          {line.product.presentation} · x{line.quantity}
        </AppText>
      </View>
      <AppText style={styles.productPrice}>{formatSoles(lineTotal)}</AppText>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <AppText style={styles.summaryLabel}>{label}</AppText>
      <AppText style={styles.summaryValue}>{value}</AppText>
    </View>
  );
}

// Catálogo y tarifas se refrescan desde servicios públicos. La transacción
// de creación de pedido debe revalidar importes, mínimos, stock y horario.
export function OrderReviewScreen() {
  const insets = useSafeAreaInsets();
  const { delivery, cartLines: cart, cartError, reloadCart, selectedSlot } = useCheckoutDraft();
  const zoneState = useDeliveryZones();
  const zone =
    !zoneState.loading && !zoneState.error
      ? zoneState.zones.find((item) => item.id === delivery.zoneId)
      : undefined;
  const [catalog, setCatalog] = useState<readonly CatalogItem[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);

  const loadCatalog = useCallback(() => {
    setCatalogError(false);
    setCatalog(null);
    void listCustomerCatalog()
      .then(setCatalog)
      .catch(() => setCatalogError(true));
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void listCustomerCatalog()
        .then((items) => {
          if (active) setCatalog(items);
        })
        .catch(() => {
          if (active) setCatalogError(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const lines = useMemo<ReviewLine[]>(() => {
    if (!catalog || !cart) return [];
    return cart.flatMap((line) => {
      const product = catalog.find((item) => item.id === line.productId);
      return product ? [resolveCartLine(product, line)] : [];
    });
  }, [catalog, cart]);
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0,
  );
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const address = [delivery.address.trim(), delivery.district.trim()].filter(Boolean).join(', ');

  if (catalogError || cartError)
    return (
      <SafeAreaView
        style={[styles.safe, styles.center]}
        edges={['top', 'left', 'right']}
        accessibilityLiveRegion="assertive"
      >
        <AppText style={styles.errorText}>{content.loadError}</AppText>
        <Button
          label={content.retryAction}
          variant="secondary"
          onPress={() => {
            loadCatalog();
            reloadCart();
          }}
        />
      </SafeAreaView>
    );
  if (!catalog || !cart)
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator
          color={colors.primary}
          size="large"
          accessibilityRole="progressbar"
          accessibilityLabel={content.loadingLabel}
        />
      </SafeAreaView>
    );

  if (cart.length === 0)
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom', 'left', 'right']}>
        <AppText accessibilityRole="header" style={styles.heading}>
          Tu carrito está vacío
        </AppText>
        <AppText style={styles.errorText}>Agrega productos antes de revisar el pedido.</AppText>
        <Button label="Explorar la tienda" onPress={() => router.replace('/store')} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a datos de entrega"
          onPress={() => router.navigate('/delivery-details')}
          style={styles.backButton}
        >
          <Image
            source={backIcon}
            tintColor={colors.primary}
            style={styles.backIcon}
            accessible={false}
          />
        </Pressable>
        <AppText style={styles.topBarTitle}>{content.topBarTitle}</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <AppText accessibilityRole="header" style={styles.heading}>
            {content.heading}
          </AppText>

          <View style={[styles.surface, styles.productsSurface]}>
            <AppText style={styles.eyebrow} accessibilityRole="header">
              {content.products} · {itemCount}
            </AppText>
            {lines.map((line, index) => (
              <ProductRow key={line.product.id} line={line} last={index === lines.length - 1} />
            ))}
          </View>

          <View style={[styles.surface, styles.deliverySurface]}>
            <AppText style={styles.eyebrow} accessibilityRole="header">
              {content.delivery}
            </AppText>
            <View style={styles.deliveryRow}>
              <View style={styles.iconSurface}>
                <Image source={deliveryIcon} style={styles.deliveryIcon} accessible={false} />
              </View>
              <View style={styles.deliveryCopy}>
                <AppText style={styles.deliveryMethod}>{content.deliveryMethod}</AppText>
                <AppText style={styles.deliveryAddress}>
                  {address || content.addressPending}
                </AppText>
                <AppText style={styles.deliverySchedule}>
                  {selectedSlot?.mode === 'delivery'
                    ? `${formatCheckoutSlot(selectedSlot)} · Por confirmar`
                    : content.schedulePending}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.totals}>
            <SummaryRow label={content.subtotal} value={formatSoles(subtotalCents)} />
            <SummaryRow
              label={content.deliveryFee}
              value={zone ? formatSoles(zone.fee_cents) : content.feePending}
            />
            <AppText>{zone?.name ?? 'Selecciona una zona disponible en datos de entrega.'}</AppText>
            {zoneState.error && (
              <Button
                label="Reintentar consultar envío"
                variant="secondary"
                onPress={zoneState.retry}
              />
            )}
            {zone && subtotalCents < zone.minimum_order_cents && (
              <AppText accessibilityLiveRegion="polite">
                Faltan {formatSoles(zone.minimum_order_cents - subtotalCents)} en productos para
                alcanzar el mínimo de esta zona.
              </AppText>
            )}
            <View style={styles.totalRow}>
              <AppText style={styles.totalLabel}>{content.total}</AppText>
              <AppText style={styles.totalValue}>
                {zone ? formatSoles(subtotalCents + zone.fee_cents) : 'Por calcular'}
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.footerContent}>
          <Button
            label={content.paymentAction}
            disabled={
              !zone ||
              subtotalCents < zone.minimum_order_cents ||
              lines.length === 0 ||
              lines.length !== cart.length ||
              lines.some((line) => line.quantity > line.product.maxPresentations)
            }
            size="form"
            onPress={() => router.push('/payment/delivery')}
            accessibilityHint={content.paymentPending}
          />
          <AppText style={styles.footerNote}>{content.paymentPending}</AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.page,
    gap: spacing.lg,
  },
  errorText: { textAlign: 'center' },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    gap: spacing.xs,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
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
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.md,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  surface: { backgroundColor: colors.surface, borderRadius: radii.surface, padding: spacing.lg },
  productsSurface: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    marginBottom: spacing.md,
  },
  productRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  productImage: { width: 58, height: 58, borderRadius: 10 },
  productCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  productName: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  productDetail: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  productPrice: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'right',
  },
  deliverySurface: { gap: spacing.xs },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconSurface: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryIcon: { width: 24, height: 24 },
  deliveryCopy: { flex: 1, minWidth: 0, gap: 3 },
  deliveryMethod: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  deliveryAddress: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  deliverySchedule: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  totals: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  summaryRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  summaryValue: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, textAlign: 'right' },
  totalRow: {
    minHeight: 49,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  totalValue: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 25 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
  },
  footerContent: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  footerNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
