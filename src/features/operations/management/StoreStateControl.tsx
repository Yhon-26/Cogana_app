import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { operationalStatusLabel } from '@/features/operations/storeStatus';
import { setStoreOperationalStatus, type OperationalStatus } from '@/services/operations/status';
import { fonts, spacing } from '@/theme/tokens';

type Action = Extract<OperationalStatus, 'closed' | 'accepting_orders' | 'paused'>;

const KNOWN_STATUSES: OperationalStatus[] = [
  'closed',
  'accepting_orders',
  'preparing_orders',
  'paused',
];

const actions: { status: Action; label: string; confirm?: string }[] = [
  { status: 'accepting_orders', label: 'Abrir tienda' },
  { status: 'paused', label: 'Pausar pedidos' },
  {
    status: 'closed',
    label: 'Cerrar tienda',
    confirm: 'Los clientes no podrán pedir hasta que la abras de nuevo.',
  },
];

// Control del estado operativo de la tienda. Cambiar el estado aquí no valida
// franjas ni stock: el guard de checkout en la base sigue exigiendo franja
// futura, capacidad y tienda aceptando pedidos para cada pedido nuevo.
export function StoreStateControl({
  status,
  onSaved,
}: {
  status: string | null | undefined;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const { store } = useOperationsStore();
  const current = KNOWN_STATUSES.includes(status as OperationalStatus)
    ? (status as OperationalStatus)
    : null;
  const apply = (action: Action, confirm?: string) => {
    const run = async () => {
      if (!store) return;
      setBusy(action);
      setError('');
      try {
        await setStoreOperationalStatus(store.id, action);
        onSaved();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : 'No pudimos cambiar el estado.');
      } finally {
        setBusy(null);
      }
    };
    if (confirm) {
      Alert.alert('Cerrar tienda', confirm, [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cerrar', style: 'destructive', onPress: () => void run() },
      ]);
      return;
    }
    void run();
  };
  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" style={styles.title}>
        Estado operativo
      </AppText>
      <AppText secondary>
        {`Hoy: ${operationalStatusLabel(current)}. ${
          current === 'accepting_orders'
            ? 'Los clientes pueden pedir según tus horarios y franjas publicadas.'
            : 'Abre la tienda para recibir pedidos según tus horarios y franjas publicadas.'
        }`}
      </AppText>
      <View style={styles.actions}>
        {actions.map((action) => {
          const isCurrent = current === action.status;
          return (
            <Button
              key={action.status}
              label={
                busy === action.status
                  ? 'Guardando…'
                  : isCurrent
                    ? `${action.label} · actual`
                    : action.label
              }
              variant={isCurrent ? 'secondary' : 'primary'}
              disabled={busy !== null || isCurrent}
              onPress={() => apply(action.status, action.confirm)}
            />
          );
        })}
      </View>
      {error ? (
        <AppText accessibilityLiveRegion="assertive" style={{ marginTop: spacing.md }}>
          {error}
        </AppText>
      ) : null}
      <AppText secondary style={{ marginTop: spacing.md }}>
        Con la tienda abierta el catálogo público muestra el stock real; cada pedido además
        requiere una franja publicada con cupo y existencias suficientes.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xxl },
  title: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, marginBottom: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
