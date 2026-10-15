import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useIsFocused, type Href } from 'expo-router';
import { AppText } from '@/components/AppText';
import { OperationsStoreHeader } from '@/components/OperationsStoreHeader';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { operationalStatusLabel } from '@/features/operations/storeStatus';
import { BusinessHoursEditor } from './BusinessHoursEditor';
import { FulfillmentRulesEditor } from './FulfillmentRulesEditor';
import { PaymentReviewAction } from './PaymentReviewAction';
import { StoreStateControl } from './StoreStateControl';
import { DeliveryAssignmentAction } from './DeliveryAssignmentAction';
import { formatSoles } from '@/features/customer/products/formatPrice';
import {
  loadOperationsActivity,
  loadOperationsDeliveries,
  loadOperationsPayments,
  loadStoreManagement,
} from '@/services/operations/data';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

export type ManagementMode =
  | 'home'
  | 'store'
  | 'hours'
  | 'zones'
  | 'payments'
  | 'payment-review'
  | 'delivery'
  | 'assignment'
  | 'activity';
type Management = Awaited<ReturnType<typeof loadStoreManagement>>;
type Payments = Awaited<ReturnType<typeof loadOperationsPayments>>;
type Delivery = Awaited<ReturnType<typeof loadOperationsDeliveries>>;
type Activity = Awaited<ReturnType<typeof loadOperationsActivity>>;
type Line = { id: string; title: string; detail?: string; href?: Href };
const titles: Record<ManagementMode, string> = {
  home: 'Gestiona tu tienda',
  store: 'Tu tienda',
  hours: 'Horarios',
  zones: 'Zonas',
  payments: 'Pagos',
  'payment-review': 'Revisar pago',
  delivery: 'Reparto',
  assignment: 'Asignar repartidor',
  activity: 'Actividad',
};
const date = (value: string) =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
const line = (id: string, title: string, detail?: string, href?: Href): Line => ({
  id,
  title,
  detail,
  href,
});

// Las lecturas y acciones están acotadas a la tienda seleccionada. El editor
// guarda horarios y reglas; los cobros manuales requieren verificación y permiso owner/admin.
export function ManagementScreen({ mode, id }: { mode: ManagementMode; id?: string }) {
  const { store } = useOperationsStore();
  const isFocused = useIsFocused();
  const [management, setManagement] = useState<Management | null>(null);
  const [payments, setPayments] = useState<Payments | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!store || !isFocused) return;
    let active = true;
    const onFailure = () => {
      if (active) setError(true);
    };
    if (mode === 'payments' || mode === 'payment-review')
      void loadOperationsPayments(store.id, mode === 'payment-review' ? id : undefined)
        .then((value) => {
          if (active) {
            setPayments(value);
            setError(false);
          }
        })
        .catch(onFailure);
    else if (mode === 'delivery' || mode === 'assignment')
      void loadOperationsDeliveries(store.id)
        .then((value) => {
          if (active) {
            setDelivery(value);
            setError(false);
          }
        })
        .catch(onFailure);
    else if (mode === 'activity')
      void loadOperationsActivity(store.id)
        .then((value) => {
          if (active) {
            setActivity(value);
            setError(false);
          }
        })
        .catch(onFailure);
    else
      void loadStoreManagement(store.id)
        .then((value) => {
          if (active) {
            setManagement(value);
            setError(false);
          }
        })
        .catch(onFailure);
    return () => {
      active = false;
    };
  }, [store, mode, id, revision, isFocused]);

  const sections: { title: string; rows: Line[]; empty: string }[] = [];
  const add = (title: string, rows: Line[], empty: string) => sections.push({ title, rows, empty });
  if (mode === 'home')
    add(
      'Operación',
      [
        line('store', 'Tu tienda', 'Horarios, zonas y estado operativo', '/gestion/tienda' as Href),
        line('payments', 'Pagos', 'Movimientos y casos por revisar', '/gestion/pagos' as Href),
        line('delivery', 'Reparto', 'Pedidos listos y asignaciones', '/gestion/reparto' as Href),
        line(
          'activity',
          'Actividad',
          'Cambios recientes de esta tienda',
          '/gestion/actividad' as Href,
        ),
      ],
      '',
    );
  if (mode === 'store' && management) {
    add(
      management.settings?.display_name ?? store?.name ?? 'Tienda',
      [
        line(
          'address',
          'Dirección',
          [store?.address, store?.district].filter(Boolean).join(' · ') ||
            'Sin dirección configurada',
        ),
        line('state', 'Estado operativo', operationalStatusLabel(management.state?.status)),
        line('phone', 'Teléfono', management.settings?.phone ?? 'Sin teléfono configurado'),
      ],
      '',
    );
    add(
      'Configurar',
      [
        line(
          'hours',
          'Horarios',
          `${management.hours.length} días configurados`,
          '/gestion/horarios' as Href,
        ),
        line(
          'zones',
          'Zonas de entrega',
          `${management.zones.filter((item) => item.is_active).length} zonas activas`,
          '/gestion/zonas' as Href,
        ),
      ],
      '',
    );
  }
  if (mode === 'zones' && management)
    add(
      'Cobertura',
      management.zones.map((item) =>
        line(
          item.id,
          item.name,
          `${item.district} · mínimo ${formatSoles(item.minimum_order_cents)} · tarifa ${formatSoles(item.fee_cents)}${item.is_active ? '' : ' · Inactiva'}`,
        ),
      ),
      'No hay zonas configuradas.',
    );
  if (mode === 'payments' && payments) {
    add(
      'Por revisar',
      payments
        .filter((item) => ['pending', 'requires_action', 'processing'].includes(item.status))
        .map((item) =>
          line(
            item.id,
            `${item.transaction_type === 'refund' ? 'Devolución' : item.transaction_type === 'adjustment' ? 'Ajuste' : 'Cobro'} · ${item.method} · ${formatSoles(item.amount_cents)}`,
            `${item.status === 'processing' ? 'En revisión' : 'Por confirmar'} · ${date(item.created_at)}`,
            { pathname: '/gestion/pagos/revisar', params: { id: item.id } } as Href,
          ),
        ),
      'No hay pagos pendientes de revisión.',
    );
    add(
      'Movimientos recientes',
      payments.map((item) =>
        line(
          item.id,
          `${item.transaction_type === 'refund' ? 'Devolución' : item.transaction_type === 'adjustment' ? 'Ajuste' : 'Cobro'} · ${item.method} · ${formatSoles(item.amount_cents)}`,
          `${item.status} · ${date(item.created_at)}`,
          { pathname: '/gestion/pagos/revisar', params: { id: item.id } } as Href,
        ),
      ),
      'Aún no hay movimientos de pago.',
    );
  }
  const paymentToReview = payments?.find((item) => item.id === id);
  if (mode === 'payment-review' && payments)
    add(
      'Seguimiento',
      paymentToReview
        ? [
            line('amount', 'Importe', formatSoles(paymentToReview.amount_cents)),
            line(
              'type',
              'Tipo',
              paymentToReview.transaction_type === 'refund'
                ? 'Devolución'
                : paymentToReview.transaction_type === 'adjustment'
                  ? 'Ajuste'
                  : 'Cobro',
            ),
            line('state', 'Estado', paymentToReview.status),
            line('method', 'Método', paymentToReview.method),
            line(
              'reference',
              'Referencia informada por el cliente',
              paymentToReview.customer_payment_reference ?? 'Sin referencia',
            ),
            line('created', 'Iniciado', date(paymentToReview.created_at)),
          ]
        : [],
      'No hay pagos para revisar.',
    );
  if (mode === 'delivery' && delivery) {
    add(
      'Listos para asignar',
      delivery.orders
        .filter(
          (order) =>
            order.status === 'ready_for_delivery' &&
            !delivery.assignments.some((item) => item.order_id === order.id),
        )
        .map((item) =>
          line(
            item.id,
            item.order_number,
            item.scheduled_for ? date(item.scheduled_for) : 'Sin horario confirmado',
            { pathname: '/gestion/reparto/asignar', params: { id: item.id } } as Href,
          ),
        ),
      'No hay entregas listas para asignar.',
    );
    add(
      'En reparto',
      delivery.assignments
        .filter((item) => ['assigned', 'accepted', 'picked_up', 'delivering'].includes(item.status))
        .map((item) =>
          line(
            item.id,
            delivery.orders.find((order) => order.id === item.order_id)?.order_number ?? 'Entrega',
            item.status,
            { pathname: '/pedidos/[id]', params: { id: item.order_id } } as Href,
          ),
        ),
      'No hay asignaciones activas.',
    );
  }
  if (mode === 'assignment')
    add('Asignación pendiente', [], 'Selecciona abajo quién llevará este pedido.');
  if (mode === 'activity' && activity)
    add(
      'Actividad reciente',
      activity.map((item) => line(item.id, item.title, date(item.at))),
      'No hay actividad registrada en pedidos, inventario o precios. Esta vista no es un registro de auditoría exhaustivo.',
    );
  const loaded =
    mode === 'payments' || mode === 'payment-review'
      ? payments !== null
      : mode === 'delivery' || mode === 'assignment'
        ? delivery !== null
        : mode === 'activity'
          ? activity !== null
          : management !== null;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {mode === 'home' ? (
          <OperationsStoreHeader />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Gestión"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/gestion'))}
            style={styles.back}
          >
            <AppText style={styles.backText}>‹ Gestión</AppText>
          </Pressable>
        )}
        <AppText accessibilityRole="header" style={styles.title}>
          {titles[mode]}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {mode === 'home' ? 'Configuración y seguimiento operativo' : (store?.name ?? 'Tienda')}
        </AppText>
        {error ? (
          <View style={styles.empty}>
            <AppText>No pudimos cargar los datos de esta tienda.</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError(false);
                setRevision((value) => value + 1);
              }}
              style={styles.back}
            >
              <AppText style={styles.backText}>Reintentar</AppText>
            </Pressable>
          </View>
        ) : !loaded ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : mode === 'hours' && management && store ? (
          <>
            <FulfillmentRulesEditor
              storeId={store.id}
              rules={management.rules}
              onSaved={() => setRevision((value) => value + 1)}
            />
            <BusinessHoursEditor
              storeId={store.id}
              timezone={store.timezone}
              hours={management.hours}
              exceptions={management.exceptions}
              onSaved={() => setRevision((value) => value + 1)}
            />
          </>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <AppText accessibilityRole="header" style={styles.sectionTitle}>
                {section.title}
              </AppText>
              {section.rows.length ? (
                section.rows.map((item) => (
                  <Pressable
                    key={item.id}
                    disabled={!item.href}
                    accessibilityRole={item.href ? 'button' : 'text'}
                    onPress={() => item.href && router.push(item.href)}
                    style={({ pressed }) => [styles.row, pressed && { opacity: 0.65 }]}
                  >
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <AppText style={styles.rowTitle}>{item.title}</AppText>
                      {item.detail && (
                        <AppText secondary style={styles.rowDetail}>
                          {item.detail}
                        </AppText>
                      )}
                    </View>
                    {item.href && <AppText style={styles.arrow}>›</AppText>}
                  </Pressable>
                ))
              ) : (
                <View style={styles.empty}>
                  <AppText secondary>{section.empty}</AppText>
                </View>
              )}
            </View>
          ))
        )}
        {loaded && mode === 'store' && management && store && (
          <StoreStateControl
            status={management.state?.status}
            onSaved={() => setRevision((value) => value + 1)}
          />
        )}
        {loaded && mode === 'payments' && (
          <View style={styles.note}>
            <AppText secondary>El estado del pago es independiente del estado del pedido.</AppText>
          </View>
        )}
        {loaded && mode === 'payment-review' && (
          <View style={styles.note}>
            <AppText secondary>
              {paymentToReview?.transaction_type === 'refund'
                ? 'Confirma únicamente después de realizar y comprobar la devolución.'
                : 'Confirma únicamente después de comprobar el dinero recibido.'}
            </AppText>
          </View>
        )}
        {loaded &&
          mode === 'payment-review' &&
          store &&
          paymentToReview &&
          (['yape', 'plin'].includes(paymentToReview.method) ||
            paymentToReview.transaction_type !== 'charge') &&
          ['requires_action', 'processing', 'pending'].includes(paymentToReview.status) && (
            <PaymentReviewAction
              key={paymentToReview.id}
              storeId={store.id}
              orderId={paymentToReview.order_id}
              transactionId={paymentToReview.id}
              transactionType={paymentToReview.transaction_type}
              onSaved={() => setRevision((value) => value + 1)}
            />
          )}
        {loaded && mode === 'assignment' && store && id && (
          <DeliveryAssignmentAction
            storeId={store.id}
            orderId={id}
            onSaved={() => router.replace({ pathname: '/pedidos/[id]', params: { id } })}
          />
        )}
        {loaded && mode === 'payment-review' && paymentToReview && (
          <Pressable
            accessibilityRole="button"
            style={styles.back}
            onPress={() =>
              router.push({ pathname: '/pedidos/[id]', params: { id: paymentToReview.order_id } })
            }
          >
            <AppText style={styles.backText}>Ver pedido y cancelación</AppText>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.page,
    paddingBottom: spacing.section,
  },
  back: { minHeight: layout.touchTarget, justifyContent: 'center' },
  backText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 15 },
  title: { fontFamily: fonts.semibold, fontSize: 23, lineHeight: 30, marginTop: spacing.xl },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  section: { marginTop: spacing.xxl },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },
  row: {
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  rowDetail: { fontSize: 12, lineHeight: 18 },
  arrow: { color: colors.primary, fontSize: 25 },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  note: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.xxl,
  },
});
