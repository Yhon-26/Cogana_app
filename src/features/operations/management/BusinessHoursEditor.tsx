import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import {
  SCHEDULED_ORDERS_MESSAGE,
  saveBusinessHours,
  validateBusinessHours,
  type BusinessHoursInput,
} from '@/services/operations/hours';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';

type Hours = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};
type Exception = {
  id: string;
  local_date: string;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  public_message: string | null;
};

const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const shortTime = (time: string | null) => time?.slice(0, 5) ?? '';

export function BusinessHoursEditor({
  storeId,
  timezone,
  hours,
  exceptions,
  onSaved,
}: {
  storeId: string;
  timezone: string;
  hours: Hours[];
  exceptions: Exception[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<BusinessHoursInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const validationError = draft ? validateBusinessHours(draft) : null;

  const edit = (weekday: number) => {
    const current = hours.find((item) => item.weekday === weekday);
    setDraft({
      weekday,
      isClosed: current?.is_closed ?? false,
      opensAt: shortTime(current?.opens_at ?? null),
      closesAt: shortTime(current?.closes_at ?? null),
    });
    setError(null);
    setNotice(null);
  };

  const save = async () => {
    if (!draft || validationError || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveBusinessHours(storeId, draft);
      setNotice(`${weekdays[draft.weekday - 1]} guardado.`);
      setDraft(null);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === SCHEDULED_ORDERS_MESSAGE
          ? SCHEDULED_ORDERS_MESSAGE
          : 'No se pudo guardar el horario. Comprueba tu acceso y conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" style={styles.heading}>
        Semana habitual
      </AppText>
      <AppText secondary style={styles.intro}>
        Configura cada día según la atención real de tu tienda. Zona horaria: {timezone}.
      </AppText>
      {notice && <AppText style={styles.success}>{notice}</AppText>}
      {weekdays.map((name, index) => {
        const weekday = index + 1;
        const current = hours.find((item) => item.weekday === weekday);
        const isEditing = draft?.weekday === weekday;
        return (
          <View key={weekday} style={styles.day}>
            <View style={styles.dayHeader}>
              <View style={styles.daySummary}>
                <AppText style={styles.dayName}>{name}</AppText>
                <AppText secondary>
                  {!current
                    ? 'Sin configurar'
                    : current.is_closed
                      ? 'Cerrado'
                      : `${shortTime(current.opens_at)}–${shortTime(current.closes_at)}`}
                </AppText>
              </View>
              {!isEditing && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${current ? 'Editar' : 'Configurar'} horario de ${name}`}
                  accessibilityState={{ disabled: Boolean(draft) }}
                  disabled={Boolean(draft)}
                  onPress={() => edit(weekday)}
                  style={[styles.editButton, draft && styles.disabledButton]}
                >
                  <AppText style={styles.editText}>{current ? 'Editar' : 'Configurar'}</AppText>
                </Pressable>
              )}
            </View>
            {isEditing && draft && (
              <View style={styles.form}>
                <View style={styles.closedRow}>
                  <AppText style={styles.fieldLabel}>Cerrado este día</AppText>
                  <Switch
                    accessibilityLabel={`${name} cerrado`}
                    value={draft.isClosed}
                    onValueChange={(isClosed) => setDraft({ ...draft, isClosed })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
                {!draft.isClosed && (
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <AppText style={styles.fieldLabel}>Apertura</AppText>
                      <TextInput
                        accessibilityLabel={`Apertura de ${name}`}
                        value={draft.opensAt}
                        onChangeText={(opensAt) => setDraft({ ...draft, opensAt })}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.timeField}>
                      <AppText style={styles.fieldLabel}>Cierre</AppText>
                      <TextInput
                        accessibilityLabel={`Cierre de ${name}`}
                        value={draft.closesAt}
                        onChangeText={(closesAt) => setDraft({ ...draft, closesAt })}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                        style={styles.input}
                      />
                    </View>
                  </View>
                )}
                {validationError && !draft.isClosed && (
                  <AppText style={styles.hint}>{validationError}</AppText>
                )}
                {error && <AppText style={styles.error}>{error}</AppText>}
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={saving}
                    onPress={() => {
                      setDraft(null);
                      setError(null);
                    }}
                    style={styles.cancelButton}
                  >
                    <AppText style={styles.cancelText}>Cancelar</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: Boolean(validationError || saving) }}
                    disabled={Boolean(validationError || saving)}
                    onPress={() => void save()}
                    style={[
                      styles.saveButton,
                      (validationError || saving) && styles.disabledButton,
                    ]}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <AppText style={styles.saveText}>Guardar día</AppText>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}
      <AppText accessibilityRole="header" style={styles.exceptionsHeading}>
        Excepciones
      </AppText>
      {exceptions.length ? (
        exceptions.map((item) => (
          <View key={item.id} style={styles.exception}>
            <AppText style={styles.dayName}>{item.local_date}</AppText>
            <AppText secondary>
              {item.is_closed
                ? 'Cerrado'
                : `${shortTime(item.opens_at)}–${shortTime(item.closes_at)}`}
              {item.public_message ? ` · ${item.public_message}` : ''}
            </AppText>
          </View>
        ))
      ) : (
        <AppText secondary>No hay excepciones registradas.</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xxl },
  heading: { fontFamily: fonts.semibold, fontSize: 18 },
  intro: { marginTop: spacing.sm, marginBottom: spacing.md },
  day: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: spacing.md },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  daySummary: { flex: 1, gap: spacing.xs },
  dayName: { fontFamily: fonts.semibold },
  editButton: {
    minHeight: layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  editText: { color: colors.primary, fontFamily: fonts.semibold },
  form: { gap: spacing.md, paddingTop: spacing.lg },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.touchTarget,
  },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 14 },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1, gap: spacing.sm },
  input: {
    minHeight: layout.touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  hint: { color: colors.textSecondary, fontSize: 14 },
  error: { color: colors.danger },
  success: { color: colors.primary, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  cancelButton: {
    flex: 1,
    minHeight: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.primary, fontFamily: fonts.semibold },
  saveButton: {
    flex: 1,
    minHeight: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.control,
    backgroundColor: colors.primary,
  },
  disabledButton: { opacity: 0.45 },
  saveText: { color: colors.onPrimary, fontFamily: fonts.semibold },
  exceptionsHeading: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  exception: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
});
