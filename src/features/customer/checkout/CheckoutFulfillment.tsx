import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, spacing } from '@/theme/tokens';
import type { DeliveryZone } from '@/services/customer/deliveryZones';
import { useCheckoutDraft } from './CheckoutDraftContext';
import { formatSoles } from '../products/formatPrice';

export function CheckoutFulfillment({
  zones,
  loading,
  error,
  onRetry,
  disabled,
}: {
  zones: readonly DeliveryZone[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  disabled: boolean;
}) {
  const {
    fulfillmentMode: mode,
    setFulfillmentMode,
    delivery,
    setDeliveryField,
  } = useCheckoutDraft();
  return (
    <View style={styles.section}>
      <AppText accessibilityRole="header" style={styles.heading}>
        ¿Cómo recibirás tu pedido?
      </AppText>
      <View style={styles.choices} accessibilityRole="radiogroup">
        {(['delivery', 'pickup'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: mode === value, disabled }}
            disabled={disabled}
            onPress={() => setFulfillmentMode(value)}
            style={[styles.choice, mode === value && styles.selected]}
          >
            <View style={styles.radio}>{mode === value && <View style={styles.dot} />}</View>
            <View style={styles.copy}>
              <AppText style={styles.label}>
                {value === 'delivery' ? 'Envío a domicilio' : 'Recojo en tienda'}
              </AppText>
              <AppText style={styles.hint}>
                {value === 'delivery' ? 'A la dirección que indiques' : 'Sin costo de envío'}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
      {mode === 'delivery' ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" style={styles.heading}>
            Dirección de entrega
          </AppText>
          <AppText style={styles.hint}>Selecciona tu zona de Santa Anita.</AppText>
          {loading && (
            <ActivityIndicator
              color={colors.primary}
              accessibilityLabel="Cargando zonas de entrega"
            />
          )}
          {error && (
            <Button
              label="Reintentar cargar zonas"
              variant="secondary"
              onPress={onRetry}
              disabled={disabled}
            />
          )}
          {!loading && !error && zones.length === 0 && (
            <AppText>No hay zonas de entrega disponibles.</AppText>
          )}
          {zones.map((zone) => (
            <Pressable
              key={zone.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: delivery.zoneId === zone.id, disabled }}
              disabled={disabled}
              onPress={() => {
                setDeliveryField('zoneId', zone.id);
                setDeliveryField('district', zone.district);
              }}
              style={[styles.zone, delivery.zoneId === zone.id && styles.selected]}
            >
              <View style={styles.zoneHeading}>
                <AppText style={[styles.label, styles.copy]}>{zone.name}</AppText>
                <View style={styles.radio}>
                  {delivery.zoneId === zone.id && <View style={styles.dot} />}
                </View>
              </View>
              <AppText style={styles.hint}>
                Envío {formatSoles(zone.fee_cents)} · Mínimo {formatSoles(zone.minimum_order_cents)}
              </AppText>
              {zone.restrictions && <AppText style={styles.hint}>{zone.restrictions}</AppText>}
            </Pressable>
          ))}
          <TextInput
            accessibilityLabel="Dirección de entrega"
            placeholder="Calle, número y departamento"
            value={delivery.address}
            onChangeText={(value) => setDeliveryField('address', value)}
            editable={!disabled}
            maxLength={160}
            autoCapitalize="sentences"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Referencia de entrega, opcional"
            placeholder="Referencia (opcional)"
            value={delivery.reference}
            onChangeText={(value) => setDeliveryField('reference', value)}
            editable={!disabled}
            maxLength={160}
            autoCapitalize="sentences"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            style={styles.input}
          />
        </View>
      ) : (
        <AppText style={styles.hint}>
          Retira tu pedido en la tienda cuando esté listo, dentro del horario elegido.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  choices: { gap: spacing.sm },
  choice: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceSuccess },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  copy: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  hint: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  zone: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  zoneHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  input: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
