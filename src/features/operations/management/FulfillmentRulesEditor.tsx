import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { saveFulfillmentRule, type FulfillmentRule } from '@/services/operations/fulfillmentRules';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';

type Mode = 'pickup' | 'delivery';
type Draft = { mode: Mode; duration: string; capacity: string; notice: string; staff: string };
const labels = { pickup: 'Recojo en tienda', delivery: 'Entrega a domicilio' };

// Un mismo formulario edita cada modalidad; el cupo de delivery siempre es por
// repartidor. No convertirlo en capacidad total contando usuarios registrados.
export function FulfillmentRulesEditor({
  storeId,
  rules,
  onSaved,
}: {
  storeId: string;
  rules: FulfillmentRule[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const save = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      if (
        !draft.duration ||
        !draft.capacity ||
        !draft.notice ||
        (draft.mode === 'delivery' && !draft.staff)
      )
        throw new Error('Completa todos los valores.');
      await saveFulfillmentRule(storeId, {
        mode: draft.mode,
        slotMinutes: Number(draft.duration),
        maxOrders: Number(draft.capacity),
        noticeMinutes: Number(draft.notice),
        deliveryStaffCount: draft.mode === 'delivery' ? Number(draft.staff) : undefined,
      });
      setFailed(false);
      setMessage(`${labels[draft.mode]}: reglas guardadas.`);
      setDraft(null);
      onSaved();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar. Reintenta.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={styles.section}>
      <AppText style={styles.heading} accessibilityRole="header">
        Reglas por modalidad
      </AppText>
      <AppText secondary>
        Se aplican dentro del horario de atención. El cupo de entrega es por repartidor disponible
        en cada franja.
      </AppText>
      {message && (
        <AppText
          accessibilityLiveRegion="polite"
          style={{ color: failed ? colors.danger : colors.primary }}
        >
          {message}
        </AppText>
      )}
      {(['pickup', 'delivery'] as const).map((mode) => {
        const rule = rules.find((item) => item.fulfillment_type === mode);
        return (
          <View key={mode} style={styles.card}>
            <AppText style={styles.heading}>{labels[mode]}</AppText>
            {draft?.mode === mode ? (
              <>
                {(
                  [
                    ['duration', 'Duración de franja (minutos)'],
                    [
                      'capacity',
                      mode === 'delivery'
                        ? 'Pedidos por franja y repartidor'
                        : 'Pedidos por franja',
                    ],
                    ['notice', 'Anticipación mínima (minutos)'],
                  ] as const
                ).map(([field, label]) => (
                  <View key={field} style={styles.field}>
                    <AppText>{label}</AppText>
                    <TextInput
                      accessibilityLabel={`${labels[mode]}: ${label}`}
                      value={draft[field]}
                      onChangeText={(value) =>
                        setDraft({ ...draft, [field]: value.replace(/\D/g, '') })
                      }
                      editable={!saving}
                      keyboardType="number-pad"
                      maxLength={5}
                      style={styles.input}
                    />
                  </View>
                ))}
                {mode === 'delivery' && (
                  <View style={styles.field}>
                    <AppText>Personas disponibles para reparto</AppText>
                    <AppText secondary>
                      Incluye al dueño si también reparte. Cuenta solo a quienes estén disponibles
                      durante todo el horario de la tienda. Actualiza este número al incorporar
                      personal o ante ausencias; 0 indica que no hay capacidad de reparto.
                    </AppText>
                    <TextInput
                      accessibilityLabel="Personas disponibles para reparto"
                      value={draft.staff}
                      onChangeText={(value) =>
                        setDraft({ ...draft, staff: value.replace(/\D/g, '') })
                      }
                      editable={!saving}
                      keyboardType="number-pad"
                      maxLength={3}
                      style={styles.input}
                    />
                  </View>
                )}
                <Button
                  label={saving ? 'Guardando…' : 'Guardar reglas'}
                  disabled={saving}
                  onPress={() => void save()}
                />
                <Button
                  label="Cancelar"
                  variant="ghost"
                  disabled={saving}
                  onPress={() => {
                    setDraft(null);
                    setMessage(null);
                  }}
                />
              </>
            ) : (
              <>
                <AppText secondary>
                  {rule
                    ? `Franjas de ${rule.slot_minutes} min · ${rule.max_orders_per_slot} pedidos${mode === 'delivery' ? ' por repartidor' : ''}\nAnticipación mínima: ${rule.minimum_notice_minutes} min`
                    : 'Sin reglas configuradas'}
                </AppText>
                {mode === 'delivery' && rule && (
                  <AppText secondary>
                    {rule.delivery_staff_count ?? 0} personas disponibles · Capacidad configurada:{' '}
                    {(rule.delivery_staff_count ?? 0) * rule.max_orders_per_slot} pedidos por
                    franja.
                    {'\n'}Horario de reparto: el mismo de la tienda, incluidos cierres y
                    excepciones.
                  </AppText>
                )}
                <Button
                  label={`Editar ${mode === 'pickup' ? 'recojo' : 'entrega'}`}
                  variant="secondary"
                  disabled={Boolean(draft)}
                  onPress={() => {
                    setMessage(null);
                    setDraft({
                      mode,
                      duration: rule ? String(rule.slot_minutes) : '',
                      capacity: rule ? String(rule.max_orders_per_slot) : '',
                      notice: rule ? String(rule.minimum_notice_minutes) : '',
                      staff:
                        rule?.delivery_staff_count != null ? String(rule.delivery_staff_count) : '',
                    });
                  }}
                />
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl, gap: spacing.md },
  heading: { fontFamily: fonts.semibold, fontSize: 18 },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.surface,
    gap: spacing.md,
  },
  field: { gap: spacing.sm },
  input: {
    minHeight: layout.touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});
