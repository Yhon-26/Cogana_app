import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import {
  loadCustomerOrderDetails,
  orderStatusLabels,
  decideCustomerSubstitution,
  cancelCustomerOrder,
  reportCustomerAdjustment,
} from '@/services/customer/orderDetails';
import { useOrderAction } from '@/features/operations/useOrderAction';
import { formatSoles } from '../products/formatPrice';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';

const date = (value: string) =>
  new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date(value));
export function CustomerOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof loadCustomerOrderDetails>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [references, setReferences] = useState<Record<string, string>>({});
  const action = useOrderAction(() => setRevision((value) => value + 1));
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let querying = false;
      setDetail(null);
      setLoading(true);
      setError('');
      const load = async () => {
        if (querying) return;
        querying = true;
        try {
          const value = await loadCustomerOrderDetails(orderId);
          if (active) {
            setDetail(value);
            setNow(Date.now());
            setError('');
          }
        } catch (failure) {
          if (active)
            setError(
              failure instanceof Error ? failure.message : 'No pudimos consultar el pedido.',
            );
        } finally {
          querying = false;
          if (active) setLoading(false);
        }
      };
      void load();
      const timer = setInterval(() => void load(), 15000);
      return () => {
        active = false;
        clearInterval(timer);
      };
      // Explicit retry reloads the focused query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, revision]),
  );
  const order = detail?.order;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Button label="‹ Mis pedidos" variant="ghost" onPress={() => router.replace('/orders')} />
        <AppText style={styles.title} accessibilityRole="header">
          Tu pedido
        </AppText>
        {loading && <AppText>Cargando pedido…</AppText>}
        {(error || action.error) && (
          <View style={styles.card}>
            <AppText accessibilityLiveRegion="assertive">{error || action.error}</AppText>
            <Button
              label="Actualizar pedido"
              variant="secondary"
              disabled={action.busy}
              onPress={() => setRevision((value) => value + 1)}
            />
          </View>
        )}
        {!loading && !error && !order && (
          <AppText>No hay un pedido seleccionado. Elige uno en Mis pedidos.</AppText>
        )}
        {detail && order && (
          <>
            <View style={styles.card}>
              <AppText style={styles.heading}>{order.number}</AppText>
              <AppText style={styles.heading}>
                {orderStatusLabels[order.status] ?? order.status}
              </AppText>
              <AppText>
                {order.mode === 'pickup' ? 'Recojo en tienda' : 'Entrega a domicilio'}
              </AppText>
              {order.scheduledFor && <AppText>{date(order.scheduledFor)}</AppText>}
              <AppText>
                Pago:{' '}
                {order.paymentStatus === 'paid'
                  ? 'Confirmado'
                  : order.paymentStatus === 'processing'
                    ? 'En revisión'
                    : order.paymentStatus === 'refunded'
                      ? 'Devuelto'
                      : order.paymentStatus === 'partially_refunded'
                        ? 'Devolución parcial'
                        : order.paymentMethod === 'cash'
                          ? 'Efectivo al recoger'
                          : 'Por confirmar'}
              </AppText>
            </View>
            {detail.code && (
              <View style={styles.codeCard}>
                <AppText style={styles.heading}>
                  Código de {order.mode === 'pickup' ? 'recojo' : 'entrega'}
                </AppText>
                <AppText selectable style={styles.code}>
                  {detail.code}
                </AppText>
                <AppText>Muéstralo cuando recibas el pedido.</AppText>
              </View>
            )}
            <AppText accessibilityRole="header" style={styles.heading}>
              Artículos
            </AppText>
            {detail.items.map((item) => (
              <View key={item.id} style={styles.card}>
                <AppText style={styles.heading}>{item.name}</AppText>
                <AppText secondary>{item.presentation}</AppText>
                <AppText>
                  {item.preparedQuantity === null ? 'Cantidad estimada' : 'Cantidad preparada'}:{' '}
                  {item.preparedQuantity ?? item.estimatedQuantity}{' '}
                  {item.unit === 'gram' ? 'g' : item.unit === 'milliliter' ? 'ml' : 'unidades'}
                </AppText>
                <AppText>
                  {formatSoles((item.finalLine ?? item.estimatedLine) - item.discount)}
                </AppText>
              </View>
            ))}
            <View style={styles.card}>
              <AppText style={styles.heading}>
                {order.finalTotal === null ? 'Total estimado' : 'Total final'} ·{' '}
                {formatSoles(order.finalTotal ?? order.estimatedTotal)}
              </AppText>
              {order.finalTotal === null && (
                <AppText secondary>Se confirma al finalizar la preparación.</AppText>
              )}
            </View>
            {detail.substitutions.map((sub) => {
              const pending = sub.status === 'pending';
              const expired = sub.expiresAt !== null && Date.parse(sub.expiresAt) <= now;
              return (
                <View key={sub.id} style={styles.card}>
                  <AppText style={styles.heading}>
                    Sustitución{' '}
                    {pending
                      ? 'por responder'
                      : sub.status === 'accepted' || sub.status === 'auto_accepted'
                        ? 'aceptada'
                        : sub.status === 'rejected'
                          ? 'rechazada'
                          : 'vencida'}
                  </AppText>
                  <AppText>
                    {sub.name} · {sub.presentation} · {sub.quantity} unidades base
                  </AppText>
                  <AppText>
                    Diferencia: {sub.difference >= 0 ? '+' : ''}
                    {formatSoles(sub.difference)}
                  </AppText>
                  {sub.expiresAt && (
                    <AppText secondary>Responder hasta {date(sub.expiresAt)}</AppText>
                  )}
                  {pending && !expired && (
                    <>
                      <Button
                        label="Aceptar reemplazo"
                        disabled={action.busy}
                        onPress={() =>
                          void action.run(`accept:${sub.id}`, (operationId) =>
                            decideCustomerSubstitution(
                              order.storeId,
                              sub.id,
                              'accepted',
                              operationId,
                            ),
                          )
                        }
                      />
                      <Button
                        label="Rechazar reemplazo"
                        variant="secondary"
                        disabled={action.busy}
                        onPress={() =>
                          void action.run(`reject:${sub.id}`, (operationId) =>
                            decideCustomerSubstitution(
                              order.storeId,
                              sub.id,
                              'rejected',
                              operationId,
                            ),
                          )
                        }
                      />
                    </>
                  )}
                  {pending && expired && (
                    <AppText>
                      El plazo venció. La tienda debe resolver el artículo antes de continuar.
                    </AppText>
                  )}
                </View>
              );
            })}
            {detail.differences.map((item) => (
              <View key={item.id} style={styles.card}>
                <AppText>
                  {item.type === 'refund' ? 'Devolución' : 'Cobro adicional'} ·{' '}
                  {formatSoles(item.amount)}
                </AppText>
                <AppText secondary>
                  {item.status === 'succeeded'
                    ? 'Confirmado por la tienda'
                    : 'Pendiente de realizar y verificar con la tienda'}
                </AppText>
                {item.type === 'adjustment' &&
                  ['pending', 'requires_action'].includes(item.status) &&
                  detail.recipient && (
                    <>
                      <AppText>
                        Envía {formatSoles(item.amount)} por{' '}
                        {order.paymentMethod === 'yape' ? 'Yape' : 'Plin'} a {detail.recipient.name}{' '}
                        · {detail.recipient.phone}.
                      </AppText>
                      <TextInput
                        value={references[item.id] ?? ''}
                        onChangeText={(value) =>
                          setReferences((current) => ({ ...current, [item.id]: value }))
                        }
                        editable={!action.busy}
                        maxLength={100}
                        autoCapitalize="none"
                        accessibilityLabel="Referencia del cobro adicional"
                        placeholder="Referencia del movimiento"
                        style={{
                          fontSize: 16,
                          color: colors.text,
                          minHeight: 48,
                          borderBottomWidth: 1,
                          borderColor: colors.border,
                        }}
                      />
                      <Button
                        label="Enviar referencia a revisión"
                        disabled={action.busy || (references[item.id]?.trim().length ?? 0) < 4}
                        onPress={() =>
                          void action.run(
                            `report-adjustment:${item.id}:${references[item.id]}`,
                            () => reportCustomerAdjustment(item.id, references[item.id] ?? ''),
                          )
                        }
                      />
                    </>
                  )}
              </View>
            ))}
            {order.status === 'pending_payment' && order.paymentMethod !== 'cash' && (
              <Button
                label="Ver instrucciones y reportar pago"
                disabled={action.busy}
                onPress={() =>
                  router.push({ pathname: '/payment/pending', params: { orderId: order.id } })
                }
              />
            )}
            {order.status === 'pending_payment' && order.paymentStatus !== 'processing' && (
              <Button
                label="Cancelar pedido sin pagar"
                variant="secondary"
                disabled={action.busy}
                onPress={() =>
                  Alert.alert('Cancelar pedido', 'Se liberarán las existencias reservadas.', [
                    { text: 'Volver', style: 'cancel' },
                    {
                      text: 'Cancelar pedido',
                      style: 'destructive',
                      onPress: () =>
                        void action.run(`cancel:${order.id}`, (operationId) =>
                          cancelCustomerOrder(order.id, operationId),
                        ),
                    },
                  ])
                }
              />
            )}
            <AppText accessibilityRole="header" style={styles.heading}>
              Seguimiento
            </AppText>
            {detail.history.map((item, index) => (
              <View key={`${item.at}:${index}`} style={styles.history}>
                <AppText>{orderStatusLabels[item.status] ?? item.status}</AppText>
                <AppText secondary>{date(item.at)}</AppText>
              </View>
            ))}
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
    gap: spacing.md,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  codeCard: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  code: { fontFamily: fonts.semibold, fontSize: 28, letterSpacing: 3, color: colors.primary },
  history: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
});
