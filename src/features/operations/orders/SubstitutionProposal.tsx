import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { loadOperationsCatalog, loadOperationsOrder } from '@/services/operations/data';
import { runOrderOperation } from '@/services/operations/fulfillment';
import { useOrderAction } from '../useOrderAction';
import { formatSoles } from '@/features/customer/products/formatPrice';
import { operationInputStyle } from './operationInputStyle';
import { colors, spacing } from '@/theme/tokens';

export function SubstitutionProposal({
  storeId,
  orderId,
  items,
  onSaved,
}: {
  storeId: string;
  orderId: string;
  items: Awaited<ReturnType<typeof loadOperationsOrder>>['items'];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof loadOperationsCatalog>> | null>(
    null,
  );
  const [loadError, setLoadError] = useState('');
  const [itemId, setItemId] = useState('');
  const [replacement, setReplacement] = useState('');
  const [quantity, setQuantity] = useState('');
  const { run, busy, error } = useOrderAction(onSaved);
  useEffect(() => {
    if (!open) return;
    let active = true;
    void loadOperationsCatalog(storeId)
      .then((value) => {
        if (active) {
          setCatalog(value);
          setLoadError('');
        }
      })
      .catch(() => {
        if (active)
          setLoadError('No pudimos cargar los reemplazos. Cierra y vuelve a abrir esta sección.');
      });
    return () => {
      active = false;
    };
  }, [open, storeId]);
  return (
    <View style={{ gap: spacing.md }}>
      <Button
        label={open ? 'Cerrar sustitución' : 'Proponer sustitución'}
        variant="secondary"
        disabled={busy}
        onPress={() => setOpen((value) => !value)}
      />
      {open && (
        <>
          <AppText>Artículo que falta</AppText>
          {items.map((item) => (
            <Button
              key={item.id}
              variant={itemId === item.id ? 'primary' : 'secondary'}
              label={item.product_name_snapshot}
              disabled={busy}
              onPress={() => {
                setItemId(item.id);
                setQuantity(String(item.estimated_quantity));
              }}
            />
          ))}
          <AppText>Reemplazo del catálogo</AppText>
          {catalog?.presentations
            .filter(
              (item) =>
                item.is_active &&
                catalog.products.some(
                  (product) => product.id === item.product_id && product.is_active,
                ),
            )
            .map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: replacement === item.id, disabled: busy }}
                disabled={busy}
                onPress={() => setReplacement(item.id)}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}
              >
                <AppText style={{ color: replacement === item.id ? colors.primary : colors.text }}>
                  {replacement === item.id ? '● ' : '○ '}
                  {catalog.products.find((product) => product.id === item.product_id)?.name} ·{' '}
                  {item.name} · {formatSoles(item.price_cents)}
                </AppText>
              </Pressable>
            ))}
          <AppText>Cantidad propuesta en la unidad base del reemplazo</AppText>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            editable={!busy}
            maxLength={12}
            accessibilityLabel="Cantidad base del reemplazo"
            style={operationInputStyle}
          />
          <AppText secondary>
            La propuesta sigue la preferencia del cliente. Su aceptación reservará stock; el
            servidor verificará disponibilidad y precio.
          </AppText>
          {(error || loadError) && (
            <AppText accessibilityLiveRegion="assertive">{error || loadError}</AppText>
          )}
          <Button
            label="Enviar propuesta"
            disabled={
              busy || !itemId || !replacement || !/^\d+$/.test(quantity) || Number(quantity) <= 0
            }
            onPress={() =>
              void run(`sub:${itemId}:${replacement}:${quantity}`, (operationId) =>
                runOrderOperation('propose_substitution', {
                  p_store_id: storeId,
                  p_order_id: orderId,
                  p_order_item_id: itemId,
                  p_replacement_presentation_id: replacement,
                  p_proposed_quantity: Number(quantity),
                  p_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                  p_operation_id: operationId,
                }),
              )
            }
          />
        </>
      )}
    </View>
  );
}
