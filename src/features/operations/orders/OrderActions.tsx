import { useEffect, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { loadOperationsDeliveries, loadOperationsOrder } from '@/services/operations/data';
import { changeOrderStatus, runOrderOperation } from '@/services/operations/fulfillment';
import { useOrderAction } from '../useOrderAction';
import { spacing } from '@/theme/tokens';
import { SubstitutionProposal } from './SubstitutionProposal';
import { operationInputStyle } from './operationInputStyle';

type Detail = Awaited<ReturnType<typeof loadOperationsOrder>>;

export function OrderActions({
  storeId,
  detail,
  onSaved,
}: {
  storeId: string;
  detail: Detail;
  onSaved: () => void;
}) {
  const order = detail.order;
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      detail.items.map((item) => [
        item.id,
        String(item.prepared_quantity ?? item.estimated_quantity),
      ]),
    ),
  );
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const [assignment, setAssignment] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState('');
  const { run, busy, error } = useOrderAction(onSaved);
  useEffect(() => {
    if (!order || order.fulfillment_type !== 'delivery') return;
    let active = true;
    void loadOperationsDeliveries(storeId)
      .then((value) => {
        if (active)
          setAssignment(
            value.assignments.find(
              (item) =>
                item.order_id === order.id &&
                ['assigned', 'accepted', 'picked_up', 'delivering'].includes(item.status),
            )?.id ?? null,
          );
      })
      .catch(() => {
        if (active) setAssignmentError('No pudimos consultar la asignación. Actualiza el pedido.');
      });
    return () => {
      active = false;
    };
  }, [storeId, order]);
  if (!order || ['completed', 'cancelled'].includes(order.status)) return null;
  const transition = (status: string) =>
    void run(`status:${status}`, (operationId) =>
      changeOrderStatus(storeId, order.id, status, operationId),
    );
  const prepared = order.final_total_cents !== null;
  const next =
    order.status === 'queued'
      ? 'confirmed'
      : order.status === 'confirmed'
        ? 'preparing'
        : order.status === 'preparing' && prepared
          ? order.fulfillment_type === 'pickup'
            ? 'ready_for_pickup'
            : 'ready_for_delivery'
          : order.status === 'ready_for_delivery' && assignment
            ? 'out_for_delivery'
            : null;
  return (
    <View style={{ gap: spacing.md, paddingVertical: spacing.xl }}>
      {(error || assignmentError) && (
        <AppText accessibilityLiveRegion="assertive">{error || assignmentError}</AppText>
      )}
      {next && (
        <Button
          disabled={busy}
          label={
            next === 'confirmed'
              ? 'Aceptar pedido'
              : next === 'preparing'
                ? 'Iniciar preparación'
                : next === 'out_for_delivery'
                  ? 'Iniciar reparto'
                  : 'Marcar listo'
          }
          onPress={() => transition(next)}
        />
      )}
      {order.status === 'preparing' && !prepared && (
        <>
          <AppText accessibilityRole="header">Cantidades físicas preparadas</AppText>
          <AppText secondary>
            Registra cantidades en la unidad indicada. Un paquete sellado debe mantenerse entero;
            cero retira el artículo y recalcula el total.
          </AppText>
          {detail.items.map((item) => (
            <View key={item.id} style={{ gap: spacing.sm }}>
              <AppText>
                {item.product_name_snapshot} · {item.presentation_name_snapshot}
              </AppText>
              <AppText secondary>
                Reserva: {item.estimated_quantity}{' '}
                {item.base_unit_snapshot === 'gram'
                  ? 'g'
                  : item.base_unit_snapshot === 'milliliter'
                    ? 'ml'
                    : 'unidades'}
              </AppText>
              <TextInput
                style={operationInputStyle}
                accessibilityLabel={`Cantidad preparada de ${item.product_name_snapshot}`}
                value={quantities[item.id] ?? ''}
                onChangeText={(value) =>
                  setQuantities((current) => ({ ...current, [item.id]: value }))
                }
                keyboardType="number-pad"
                editable={!busy}
                maxLength={12}
              />
            </View>
          ))}
          <Button
            label={busy ? 'Guardando…' : 'Finalizar cantidades y calcular total'}
            disabled={busy || detail.items.some((item) => !/^\d+$/.test(quantities[item.id] ?? ''))}
            onPress={() => {
              const items = detail.items.map((item) => ({
                order_item_id: item.id,
                prepared_quantity: Number(quantities[item.id]),
              }));
              Alert.alert(
                'Finalizar preparación',
                'Se descontará el stock preparado y se calcularán cobros o devoluciones. Confirma las cantidades físicas.',
                [
                  { text: 'Revisar', style: 'cancel' },
                  {
                    text: 'Finalizar',
                    onPress: () =>
                      void run(`finalize:${JSON.stringify(items)}`, (operationId) =>
                        runOrderOperation('finalize_weighted_order', {
                          p_store_id: storeId,
                          p_order_id: order.id,
                          p_items: items,
                          p_operation_id: operationId,
                        }),
                      ),
                  },
                ],
              );
            }}
          />
          <SubstitutionProposal
            storeId={storeId}
            orderId={order.id}
            items={detail.items}
            onSaved={onSaved}
          />
        </>
      )}
      {order.status === 'awaiting_adjustment' && (
        <>
          <AppText>Verifica la diferencia de pago antes de marcar listo.</AppText>
          <Button
            label="Revisar cobros y devoluciones"
            onPress={() => router.push('/gestion/pagos')}
          />
        </>
      )}
      {order.status === 'ready_for_delivery' && !assignment && (
        <Button
          disabled={busy}
          label="Asignar reparto"
          onPress={() =>
            router.push({ pathname: '/gestion/reparto/asignar', params: { id: order.id } })
          }
        />
      )}
      {(order.status === 'ready_for_pickup' ||
        (order.status === 'out_for_delivery' && assignment)) && (
        <>
          <AppText>Pide al cliente el código que aparece en el seguimiento de su pedido.</AppText>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!busy}
            maxLength={8}
            accessibilityLabel="Código de entrega o recojo"
            style={operationInputStyle}
          />
          <Button
            disabled={busy || !/^[A-Fa-f0-9]{8}$/.test(code.trim())}
            label={
              order.payment_method === 'cash'
                ? 'Cobré el efectivo y entregué el pedido'
                : 'Confirmar entrega al cliente'
            }
            onPress={() =>
              Alert.alert(
                'Completar pedido',
                order.payment_method === 'cash'
                  ? 'Confirma que cobraste el total final en efectivo y entregaste el pedido.'
                  : 'Confirma que entregaste el pedido al cliente.',
                [
                  { text: 'Volver', style: 'cancel' },
                  {
                    text: 'Completar',
                    onPress: () =>
                      void run(`complete:${code.trim().toUpperCase()}`, (operationId) =>
                        order.fulfillment_type === 'pickup'
                          ? runOrderOperation('complete_pickup', {
                              p_store_id: storeId,
                              p_order_id: order.id,
                              p_confirmation_code: code.trim().toUpperCase(),
                              p_operation_id: operationId,
                            })
                          : runOrderOperation('complete_delivery', {
                              p_store_id: storeId,
                              p_assignment_id: assignment!,
                              p_confirmation_code: code.trim().toUpperCase(),
                              p_evidence_storage_path: '',
                              p_recipient_name: '',
                              p_operation_id: operationId,
                            }),
                      ),
                  },
                ],
              )
            }
          />
        </>
      )}
      <AppText accessibilityRole="header">Cancelar pedido</AppText>
      <TextInput
        value={reason}
        onChangeText={setReason}
        editable={!busy}
        maxLength={150}
        placeholder="Motivo de cancelación"
        accessibilityLabel="Motivo de cancelación"
        style={operationInputStyle}
      />
      <Button
        label="Cancelar y liberar reservas"
        variant="secondary"
        disabled={busy || !reason.trim()}
        onPress={() =>
          Alert.alert(
            'Cancelar pedido',
            'Las reservas se liberarán. Si hay dinero recibido, quedará una devolución por realizar y verificar en Pagos.',
            [
              { text: 'Volver', style: 'cancel' },
              {
                text: 'Cancelar pedido',
                style: 'destructive',
                onPress: () =>
                  void run(`cancel:${reason.trim()}`, (operationId) =>
                    changeOrderStatus(storeId, order.id, 'cancelled', operationId, reason.trim()),
                  ),
              },
            ],
          )
        }
      />
    </View>
  );
}
