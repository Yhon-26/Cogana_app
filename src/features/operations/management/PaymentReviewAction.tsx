import { useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { confirmReceivedPayment } from '@/services/operations/payments';
import { runOrderOperation } from '@/services/operations/fulfillment';
import { colors, fonts, spacing } from '@/theme/tokens';

export function PaymentReviewAction({
  storeId,
  orderId,
  transactionId,
  transactionType = 'charge',
  onSaved,
}: {
  storeId: string;
  orderId: string;
  transactionId: string;
  transactionType?: string;
  onSaved: () => void;
}) {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const operation = useRef<string | null>(null);
  const rejectionOperation = useRef<string | null>(null);
  const [reason, setReason] = useState('');
  const sending = useRef(false);
  const confirm = async () => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError('');
    operation.current ??= randomUUID();
    try {
      if (transactionType === 'charge')
        await confirmReceivedPayment(storeId, orderId, transactionId, reference, operation.current);
      else
        await runOrderOperation('settle_manual_difference', {
          p_store_id: storeId,
          p_transaction_id: transactionId,
          p_reference: reference.trim(),
          p_operation_id: operation.current,
        });
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos confirmar el pago.');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  const reject = async () => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError('');
    rejectionOperation.current ??= randomUUID();
    try {
      await runOrderOperation('reject_manual_payment', {
        p_store_id: storeId,
        p_transaction_id: transactionId,
        p_reason: reason.trim(),
        p_operation_id: rejectionOperation.current,
      });
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos rechazar el pago.');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
      <AppText>
        {transactionType === 'refund'
          ? 'Comprueba que devolviste el importe al cliente e ingresa la referencia de salida.'
          : 'Comprueba el ingreso y el importe en la cuenta de la tienda. La referencia del cliente todavía no acredita el pago.'}
      </AppText>
      <TextInput
        value={reference}
        onChangeText={setReference}
        editable={!busy}
        placeholder="Referencia verificada en tu cuenta"
        accessibilityLabel="Referencia verificada"
        maxLength={100}
        style={{
          minHeight: 48,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          fontFamily: fonts.regular,
          color: colors.text,
          fontSize: 16,
        }}
      />
      {transactionType === 'charge' && (
        <>
          <TextInput
            value={reason}
            onChangeText={setReason}
            editable={!busy}
            maxLength={250}
            placeholder="Motivo tras revisar tu cuenta"
            accessibilityLabel="Motivo de rechazo del pago"
            style={{
              fontSize: 16,
              color: colors.text,
              minHeight: 48,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          />
          <Button
            label="No recibí el dinero: rechazar y cancelar"
            variant="secondary"
            disabled={busy || !reason.trim()}
            onPress={() =>
              Alert.alert(
                'Rechazar referencia',
                'Confirma que revisaste tu cuenta y no recibiste el importe. Se cancelará el pedido y se liberará la reserva.',
                [
                  { text: 'Volver', style: 'cancel' },
                  { text: 'Rechazar', style: 'destructive', onPress: () => void reject() },
                ],
              )
            }
          />
        </>
      )}
      {error && <AppText accessibilityLiveRegion="assertive">{error}</AppText>}
      <Button
        label={
          busy
            ? 'Confirmando…'
            : transactionType === 'refund'
              ? 'Confirmar devolución realizada'
              : 'Confirmar dinero recibido'
        }
        disabled={busy || !reference.trim()}
        onPress={() =>
          Alert.alert(
            'Confirmar recepción',
            transactionType === 'refund'
              ? 'Confirma solo si ya devolviste el importe al cliente.'
              : 'Confirma solo si verificaste el importe recibido en la cuenta de la tienda.',
            [
              { text: 'Volver', style: 'cancel' },
              { text: 'Confirmar pago', onPress: () => void confirm() },
            ],
          )
        }
      />
    </View>
  );
}
