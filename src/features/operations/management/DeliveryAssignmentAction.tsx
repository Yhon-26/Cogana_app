import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { loadDeliveryTeam, runOrderOperation } from '@/services/operations/fulfillment';
import { useOrderAction } from '../useOrderAction';
import { spacing } from '@/theme/tokens';

export function DeliveryAssignmentAction({
  storeId,
  orderId,
  onSaved,
}: {
  storeId: string;
  orderId: string;
  onSaved: () => void;
}) {
  const [team, setTeam] = useState<Awaited<ReturnType<typeof loadDeliveryTeam>> | null>(null);
  const [error, setError] = useState('');
  const { run, busy, error: actionError } = useOrderAction(onSaved);
  useEffect(() => {
    let active = true;
    void loadDeliveryTeam(storeId)
      .then((value) => {
        if (active) setTeam(value);
      })
      .catch(() => {
        if (active) setError('No pudimos cargar el equipo. Vuelve a abrir esta pantalla.');
      });
    return () => {
      active = false;
    };
  }, [storeId]);
  return (
    <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
      <AppText>Selecciona quién realizará esta entrega.</AppText>
      {team === null && !error && <AppText>Cargando equipo…</AppText>}
      {(error || actionError) && (
        <AppText accessibilityLiveRegion="assertive">{error || actionError}</AppText>
      )}
      {team?.length === 0 && <AppText>No hay cuentas activas de reparto.</AppText>}
      {team?.map((member) => (
        <Button
          key={member.user_id}
          label={`${member.name} · ${member.role === 'owner' ? 'Dueño' : member.role === 'admin' ? 'Administrador' : 'Repartidor'}`}
          disabled={busy}
          onPress={() =>
            void run(`assign:${member.user_id}`, (operationId) =>
              runOrderOperation('assign_delivery', {
                p_store_id: storeId,
                p_order_id: orderId,
                p_driver_user_id: member.user_id,
                p_operation_id: operationId,
              }),
            )
          }
        />
      ))}
    </View>
  );
}
