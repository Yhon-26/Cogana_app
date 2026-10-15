import { resolveCartLine } from '@/services/customer/cart';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { useFocusEffect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import type { CatalogItem } from '@/types/catalog';
import { formatSoles } from '../products/formatPrice';
import { useCheckoutDraft, type PaymentMethod } from './CheckoutDraftContext';
import { useDeliveryZones } from './useDeliveryZones';
import { CheckoutFulfillment } from './CheckoutFulfillment';
import { formatCheckoutSlot } from '@/services/customer/checkoutSchedule';
import { getCustomerAuthClient } from '@/services/customer/auth';
import { submitCheckout, acknowledgeCheckout } from '@/services/customer/checkout';
import { loadCustomerPaymentSettings } from '@/services/customer/payments';
import {
  paymentMethodContent as content,
  type PaymentMode,
  type PaymentOptionContent,
} from './paymentMethodContent';

const backIcon = require('../../../assets/navigation/back.svg');

function PaymentOption({
  option,
  selected,
  onSelect,
  disabled,
}: {
  option: PaymentOptionContent;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${option.label}. ${option.detail}`}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={[styles.methodMark, option.id === 'cash' && styles.cashMark]}>
        <AppText style={[styles.methodMarkText, option.id === 'cash' && styles.cashMarkText]}>
          {option.mark}
        </AppText>
      </View>
      <View style={styles.optionCopy}>
        <AppText style={styles.optionLabel}>{option.label}</AppText>
        <AppText style={styles.optionDetail}>{option.detail}</AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
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

// Pantallas 18 y 19 comparten esta vista. Mantener aquí las diferencias de
// modalidad evita que futuras correcciones visuales se dupliquen entre rutas.
export function PaymentMethodScreen({
  mode: initialMode,
  unified = false,
}: {
  mode: PaymentMode;
  unified?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const {
    delivery,
    fulfillmentMode,
    cartLines: cart,
    cartError,
    reloadCart,
    paymentMethod,
    setPaymentMethod,
    selectedSlot,
    setCartLines,
    flushCartPersistence,
    setDeliveryField,
  } = useCheckoutDraft();
  const mode = unified ? fulfillmentMode : initialMode;
  const [customerName, setCustomerName] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);
  const [submitError, setSubmitError] = useState('');
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getCustomerAuthClient()
        .auth.getUser()
        .then(({ data }) => {
          if (active) setSignedIn(Boolean(data.user && !data.user.is_anonymous));
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const zoneState = useDeliveryZones();
  const zone =
    !zoneState.loading && !zoneState.error
      ? zoneState.zones.find((item) => item.id === delivery.zoneId)
      : undefined;
  const [catalog, setCatalog] = useState<readonly CatalogItem[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<Awaited<
    ReturnType<typeof loadCustomerPaymentSettings>
  > | null>(null);
  const modeContent = content[mode];
  const allowedMethods = useMemo(
    () =>
      new Set<PaymentMethod>(
        modeContent.options
          .filter((option) => paymentSettings?.[option.id])
          .map((option) => option.id),
      ),
    [modeContent.options, paymentSettings],
  );
  const selected = paymentMethod && allowedMethods.has(paymentMethod) ? paymentMethod : null;

  const loadCatalog = useCallback(() => {
    setCatalogError(false);
    setCatalog(null);
    void Promise.all([listCustomerCatalog(), loadCustomerPaymentSettings()])
      .then(([items, settings]) => {
        setCatalog(items);
        setPaymentSettings(settings);
      })
      .catch(() => setCatalogError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setCatalogError(false);
      void Promise.all([listCustomerCatalog(), loadCustomerPaymentSettings()])
        .then(([items, settings]) => {
          if (active) {
            setCatalog(items);
            setPaymentSettings(settings);
          }
        })
        .catch(() => {
          if (active) setCatalogError(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const subtotalCents = useMemo(() => {
    if (!catalog || !cart) return 0;
    return cart.reduce((sum, line) => {
      const product = catalog.find((item) => item.id === line.productId);
      if (!product) return sum;
      const resolved = resolveCartLine(product, line);
      return sum + resolved.product.priceCents * resolved.quantity;
    }, 0);
  }, [catalog, cart]);

  const invalidCart =
    !catalog ||
    !cart?.length ||
    cart.some((line) => {
      const product = catalog.find((item) => item.id === line.productId);
      if (!product) return true;
      const resolved = resolveCartLine(product, line);
      return resolved.quantity > resolved.product.maxPresentations;
    });
  const ready = Boolean(
    selected &&
    customerName.trim() &&
    delivery.phone.trim() &&
    selectedSlot?.mode === mode &&
    !invalidCart &&
    (mode === 'pickup' ||
      (zone &&
        delivery.address.trim() &&
        delivery.district.trim() &&
        subtotalCents >= zone.minimum_order_cents)),
  );
  const total =
    mode === 'pickup'
      ? formatSoles(subtotalCents)
      : zone
        ? formatSoles(subtotalCents + zone.fee_cents)
        : content.pendingAmount;
  const chooseSchedule = () =>
    router.push(mode === 'delivery' ? '/schedule' : '/schedule?mode=pickup');

  const goBack = () => {
    if (unified) {
      router.navigate('/cart');
      return;
    }
    if (mode === 'delivery') router.navigate('/order-review');
    else router.navigate('/fulfillment?mode=pickup');
  };
  const submit = async () => {
    if (sending.current) return;
    if (!signedIn) {
      router.push('/sign-in');
      return;
    }
    if (!ready || !selected || !selectedSlot || !catalog?.[0] || !cart) return;
    sending.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const storeId = catalog[0].storeId;
      const result = await submitCheckout({
        storeId,
        mode,
        paymentMethod: selected,
        customer: { name: customerName, phone: delivery.phone },
        scheduledFor: selectedSlot.starts_at,
        lines: cart,
        delivery: mode === 'delivery' ? delivery : undefined,
      });
      if (result.matchesCurrentCart) setCartLines([]);
      // The durable last-order pointer makes the result recoverable after restart.
      // Keep the submission journal until the purchased cart is durably cleared.
      await flushCartPersistence()
        .then(() => acknowledgeCheckout(storeId, result.orderId))
        .catch(() => undefined);
      router.replace({ pathname: '/payment/pending', params: { orderId: result.orderId } });
    } catch (failure) {
      setSubmitError(
        failure instanceof Error ? failure.message : 'No pudimos confirmar el pedido. Reintenta.',
      );
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

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
        <AppText accessibilityRole="header" style={styles.sectionHeading}>
          Tu carrito está vacío
        </AppText>
        <AppText style={styles.errorText}>Agrega productos antes de elegir el pago.</AppText>
        <Button label="Explorar la tienda" onPress={() => router.replace('/store')} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            unified
              ? 'Volver al carrito'
              : mode === 'delivery'
                ? 'Volver a revisar pedido'
                : 'Volver a entrega o recojo'
          }
          disabled={submitting}
          onPress={goBack}
          style={styles.backButton}
        >
          <Image
            source={backIcon}
            tintColor={colors.primary}
            style={styles.backIcon}
            accessible={false}
          />
        </Pressable>
        <AppText accessibilityRole="header" style={styles.topBarTitle}>
          {unified ? 'Finalizar compra' : content.topBarTitle}
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.content}>
          {unified ? (
            <CheckoutFulfillment
              zones={zoneState.zones}
              loading={zoneState.loading}
              error={zoneState.error}
              onRetry={zoneState.retry}
              disabled={submitting}
            />
          ) : (
            <>
              <AppText accessibilityRole="header" style={styles.heading}>
                {content.heading}
              </AppText>
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>{modeContent.badge}</AppText>
              </View>
            </>
          )}
          <View style={styles.section}>
            <AppText accessibilityRole="header" style={styles.sectionHeading}>
              Contacto del pedido
            </AppText>
            <TextInput
              accessibilityLabel="Nombre de quien recibe"
              placeholder="Nombre de quien recibe"
              placeholderTextColor={colors.textSecondary}
              value={customerName}
              onChangeText={setCustomerName}
              autoComplete="name"
              maxLength={120}
              editable={!submitting}
              style={styles.contactInput}
            />
            <TextInput
              accessibilityLabel="Celular de contacto"
              placeholder="Celular de contacto"
              placeholderTextColor={colors.textSecondary}
              value={delivery.phone}
              onChangeText={(value) => setDeliveryField('phone', value)}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={20}
              editable={!submitting}
              style={styles.contactInput}
            />
          </View>
          <View style={styles.section}>
            <AppText accessibilityRole="header" style={styles.sectionHeading}>
              {mode === 'delivery' ? 'Horario de entrega' : 'Horario de recojo'}
            </AppText>
            {selectedSlot?.mode === mode && (
              <AppText style={styles.scheduleText}>{formatCheckoutSlot(selectedSlot)}</AppText>
            )}
            <Button
              label={selectedSlot?.mode === mode ? 'Cambiar horario' : 'Elegir horario'}
              variant="secondary"
              disabled={submitting}
              onPress={chooseSchedule}
            />
            <AppText style={styles.helpText}>
              La disponibilidad se confirma al crear el pedido.
            </AppText>
          </View>
          <View style={styles.section}>
            <AppText accessibilityRole="header" style={styles.sectionHeading}>
              {content.methodHeading}
            </AppText>
            <View style={styles.options} accessibilityRole="radiogroup">
              {modeContent.options
                .filter((option) => allowedMethods.has(option.id))
                .map((option) => (
                  <PaymentOption
                    key={option.id}
                    option={option}
                    selected={selected === option.id}
                    disabled={submitting}
                    onSelect={() => setPaymentMethod(option.id)}
                  />
                ))}
            </View>
            {allowedMethods.size === 0 && (
              <AppText style={styles.helpText}>
                No hay medios de pago disponibles para esta modalidad.
              </AppText>
            )}
          </View>
          <View style={styles.section}>
            <View style={styles.summaryHeadingRow}>
              <AppText accessibilityRole="header" style={styles.sectionHeading}>
                {content.summaryHeading}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar productos del carrito"
                disabled={submitting}
                onPress={() => router.navigate('/cart')}
                style={styles.editButton}
              >
                <AppText style={styles.editText}>Editar</AppText>
              </Pressable>
            </View>
            {invalidCart && (
              <AppText style={styles.helpText}>
                Hay productos sin disponibilidad suficiente. Revisa el carrito para continuar.
              </AppText>
            )}
            {mode === 'delivery' && !unified && zoneState.error && (
              <Button
                label="Reintentar consultar envío"
                variant="secondary"
                onPress={zoneState.retry}
                disabled={submitting}
              />
            )}
            {mode === 'delivery' && !zoneState.loading && !zone && (
              <AppText style={styles.helpText}>
                Selecciona una zona disponible para calcular el envío.
              </AppText>
            )}
            {mode === 'delivery' && zone && subtotalCents < zone.minimum_order_cents && (
              <AppText style={styles.helpText}>
                El mínimo de productos para esta zona es {formatSoles(zone.minimum_order_cents)}.
              </AppText>
            )}
            <SummaryRow label={content.products} value={formatSoles(subtotalCents)} />
            <SummaryRow
              label={mode === 'delivery' ? content.deliveryLabel : content.pickupLabel}
              value={
                mode === 'delivery'
                  ? zone
                    ? formatSoles(zone.fee_cents)
                    : content.pendingAmount
                  : content.pickupFree
              }
            />
            <View style={styles.totalRow}>
              <AppText style={styles.totalLabel}>{content.total}</AppText>
              <AppText style={styles.totalValue}>{total}</AppText>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.footerContent}>
          <Button
            label={
              submitting ? 'Creando pedido…' : signedIn ? 'Crear pedido' : 'Ingresar para comprar'
            }
            size="form"
            disabled={submitting || (signedIn && !ready)}
            onPress={() => void submit()}
          />
          <AppText style={styles.footerNote} accessibilityLiveRegion="polite">
            {submitError ||
              (selected === 'cash'
                ? 'Paga en efectivo al recoger tu pedido en tienda.'
                : paymentSettings?.minutes
                  ? `Yape y Plin: ${paymentSettings.minutes} minutos para realizar e informar el pago. La tienda verifica su recepción.`
                  : 'La tienda verificará el pago según el medio elegido.')}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contactInput: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontFamily: fonts.regular,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
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
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  heading: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  badge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor: '#EDF4EF',
  },
  badgeText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
  },
  methodHeading: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    marginTop: spacing.xxl,
  },
  sectionHeading: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },
  options: { gap: spacing.sm },
  option: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#EDF4EF' },
  optionPressed: { opacity: 0.82 },
  methodMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  cashMark: { backgroundColor: colors.surfaceMuted },
  methodMarkText: {
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
  cashMarkText: { color: colors.primary },
  optionCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  optionLabel: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  optionDetail: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  section: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  scheduleText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.primary },
  helpText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  summaryHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  editButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  editText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 20 },
  summaryRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  summaryValue: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, textAlign: 'right' },
  totalRow: {
    minHeight: 48,
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
  totalValue: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
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
  footerNote: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
