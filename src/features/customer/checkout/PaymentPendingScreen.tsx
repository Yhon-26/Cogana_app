import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { loadCustomerOrder, reportCustomerPayment } from '@/services/customer/payments';
import { formatSoles } from '../products/formatPrice';

export function PaymentPendingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<Awaited<ReturnType<typeof loadCustomerOrder>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setOrder(null);
      setLoading(true);
      const load = async () => {
        try {
          const result = await loadCustomerOrder(orderId);
          if (active) {
            setOrder(result);
            setError('');
          }
        } catch (failure) {
          if (active) {
            setOrder(null);
            setError(
              failure instanceof Error ? failure.message : 'No pudimos consultar el pedido.',
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };
      void load();
      const timer = setInterval(() => void load(), 15000);
      return () => {
        active = false;
        clearInterval(timer);
      };
      // Explicit retry invalidates the current focused request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, revision]),
  );
  const instructions = order?.payment_instructions;
  const recipient =
    instructions && typeof instructions === 'object' && !Array.isArray(instructions)
      ? instructions
      : null;
  const remaining = order?.payment_due_at
    ? Math.max(0, Math.ceil((Date.parse(order.payment_due_at) - now) / 1000))
    : 0;
  const reported = order?.payment_status === 'processing';
  const paid = order?.payment_status === 'paid';
  const cash = order?.payment_method === 'cash';
  const cancelled = order?.status === 'cancelled';
  const canReport = Boolean(
    order && !cash && !paid && !reported && !cancelled && remaining > 0 && !error,
  );
  const report = async () => {
    if (!order || busy) return;
    setBusy(true);
    setError('');
    try {
      await reportCustomerPayment(order.id, reference);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos registrar el aviso.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppText style={styles.title} accessibilityRole="header">
          {loading
            ? 'Consultando pedido…'
            : cancelled
              ? 'Pedido cancelado'
              : paid
                ? 'Pago confirmado'
                : reported
                  ? 'Pago en revisión'
                  : cash
                    ? 'Pedido recibido'
                    : order
                      ? 'Completa tu pago'
                      : 'No hay un pedido para mostrar'}
        </AppText>
        {error && <AppText accessibilityLiveRegion="assertive">{error}</AppText>}
        {order && (
          <>
            <AppText style={styles.subtitle}>Pedido {order.order_number}</AppText>
            <AppText style={styles.cardName}>{formatSoles(order.estimated_total_cents)}</AppText>
            <AppText style={styles.cardBody}>
              {cash
                ? 'Paga al recoger tu pedido.'
                : reported
                  ? 'Aviso recibido. La tienda comprobará el dinero recibido antes de confirmar el pago. Tu reserva se conserva durante la revisión.'
                  : paid
                    ? 'La tienda confirmó la recepción del pago.'
                    : cancelled
                      ? 'No realices otro pago para este pedido. Si ya transferiste, contacta a la tienda.'
                      : 'Realiza la transferencia y registra su referencia. Informar un pago no equivale a confirmarlo.'}
            </AppText>
            {!cash && !paid && !reported && !cancelled && recipient && (
              <View style={styles.card}>
                <AppText style={styles.cardName}>
                  {order.payment_method === 'yape' ? 'Yape' : 'Plin'}
                </AppText>
                <AppText selectable>{String(recipient.name ?? '')}</AppText>
                <AppText selectable>{String(recipient.phone ?? '')}</AppText>
                <AppText style={styles.cardBody}>
                  {remaining > 0
                    ? `Tiempo restante: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
                    : 'El plazo venció. No realices la transferencia; si ya pagaste, contacta a la tienda.'}
                </AppText>
              </View>
            )}
            {canReport && (
              <>
                <TextInput
                  accessibilityLabel="Referencia de transferencia"
                  placeholder="Referencia de la transferencia"
                  value={reference}
                  onChangeText={setReference}
                  maxLength={100}
                  editable={!busy}
                  style={{
                    minHeight: 48,
                    fontFamily: fonts.regular,
                    fontSize: 16,
                    color: colors.text,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                />
                <AppText style={styles.ctaNote}>
                  Usa la referencia del movimiento. No ingreses claves ni códigos de acceso.
                </AppText>
                <Button
                  label={busy ? 'Enviando…' : 'Ya pagué: enviar a revisión'}
                  disabled={busy || reference.trim().length < 4}
                  onPress={() => void report()}
                />
              </>
            )}
            {!cash && recipient && (
              <AppText style={styles.cardBody}>
                Contacto del pago: {String(recipient.phone ?? '')}
              </AppText>
            )}
          </>
        )}
        {order && <Button label="Ver preparación y seguimiento" onPress={()=>router.push({pathname:'/order-tracking',params:{orderId:order.id}})}/>}
        <Button
          label="Actualizar estado"
          variant="secondary"
          onPress={() => setRevision((value) => value + 1)}
        />
        {!order && !loading && (
          <Button
            label="Ingresar a mi cuenta"
            variant="secondary"
            onPress={() => router.push('/sign-in')}
          />
        )}
        <Button
          label="Volver a la tienda"
          variant="ghost"
          onPress={() => router.replace('/store')}
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
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cardName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  cardBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  noteBar: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radii.control,
    minHeight: layout.touchTarget - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  noteText: { color: colors.primary, fontSize: 12, lineHeight: 17 },
  cta: {
    marginTop: spacing.lg,
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ctaText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  ctaNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  exampleLink: {
    minHeight: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  exampleLinkText: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
});
