import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { useCheckoutDraft } from './CheckoutDraftContext';
import { StatusBar } from 'expo-status-bar';
import { AppText } from '@/components/AppText';
import {
  customerStoreSlug,
  loadPublicCheckoutSchedule,
  type PublicCheckoutSchedule,
} from '@/services/customer/checkoutSchedule';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { scheduleContent } from './scheduleContent';

const backIcon = require('../../../assets/navigation/back.svg');

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const shortTime = (value: string | null) => value?.slice(0, 5) ?? '';

// Elegir solo guarda una preferencia; el pedido consume capacidad en el servidor.
export function ScheduleScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'pickup' ? 'pickup' : 'delivery';
  const { selectedSlot, setSelectedSlot } = useCheckoutDraft();
  const [schedule, setSchedule] = useState<PublicCheckoutSchedule | null>(null);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<string | null>(
    selectedSlot?.mode === mode && selectedSlot.storeSlug === customerStoreSlug
      ? selectedSlot.starts_at
      : null,
  );
  const [day, setDay] = useState<string | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const id = ++request.current;
    setError(false);
    try {
      const result = await loadPublicCheckoutSchedule(customerStoreSlug, mode);
      if (id === request.current) setSchedule(result);
      return result;
    } catch {
      if (id === request.current) {
        setError(true);
        setSchedule(null);
      }
      return null;
    }
  }, [mode]);
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), 60000);
      return () => {
        clearInterval(timer);
        request.current += 1;
      };
    }, [load]),
  );
  const timezone = schedule?.timezone ?? 'America/Lima';
  const localDay = (value: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));
  const days = [...new Set((schedule?.slots ?? []).map((slot) => localDay(slot.starts_at)))];
  const activeDay = day && days.includes(day) ? day : days[0];
  const time = (value: string) =>
    new Intl.DateTimeFormat('es-PE', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  const chosen = schedule?.slots.find((slot) => slot.starts_at === selected && slot.available);
  const confirm = async () => {
    if (!chosen || saving) return;
    setSaving(true);
    setMessage('');
    const current = await load();
    const slot = current?.slots.find(
      (item) => item.starts_at === chosen.starts_at && item.available,
    );
    if (!slot || !current) {
      setSelected(null);
      setSelectedSlot(null);
      setMessage(
        current
          ? 'Esa franja ya no está disponible. Elige otra.'
          : 'No pudimos verificar la franja. Reintenta.',
      );
      setSaving(false);
      return;
    }
    setSelectedSlot({ ...slot, storeSlug: customerStoreSlug, mode, timezone: current.timezone });
    setSaving(false);
    if (router.canGoBack()) router.back();
    else router.replace('/delivery-details');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
        >
          <Image source={backIcon} tintColor={colors.primary} style={styles.backIcon} />
        </Pressable>
        <AppText style={styles.topBarTitle} accessibilityRole="header">
          {mode === 'pickup' ? 'Recojo' : scheduleContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title} accessibilityRole="header">
          {scheduleContent.title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {scheduleContent.subtitle}
        </AppText>
        {error ? (
          <View style={styles.messageCard} accessibilityLiveRegion="assertive">
            <AppText>No pudimos consultar el horario de la tienda.</AppText>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}>
              <AppText style={styles.retryText}>Reintentar</AppText>
            </Pressable>
          </View>
        ) : !schedule ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.loading}
            accessibilityLabel="Cargando horario de la tienda"
          />
        ) : (
          <>
            <View style={styles.messageCard} accessibilityLiveRegion="polite">
              <AppText style={styles.messageTitle}>
                {schedule.operationalStatus === 'accepting_orders'
                  ? 'Tienda atendiendo pedidos'
                  : 'Tienda cerrada para pedidos por ahora'}
              </AppText>
              <AppText secondary>Horario local: {schedule.timezone}</AppText>
            </View>
            <AppText style={styles.sectionTitle} accessibilityRole="header">
              Franjas disponibles
            </AppText>
            {schedule.slots.length === 0 ? (
              <AppText secondary style={styles.subtitle}>
                {schedule.operationalStatus === 'accepting_orders'
                  ? 'No hay franjas disponibles para esta modalidad en los próximos 7 días.'
                  : 'Las franjas estarán disponibles cuando la tienda acepte pedidos.'}
              </AppText>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.days}
                >
                  {days.map((date) => {
                    const first = schedule.slots.find((slot) => localDay(slot.starts_at) === date)!;
                    const label = new Intl.DateTimeFormat('es-PE', {
                      timeZone: timezone,
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(first.starts_at));
                    return (
                      <Pressable
                        key={date}
                        accessibilityRole="button"
                        accessibilityState={{ selected: date === activeDay }}
                        onPress={() => {
                          setDay(date);
                          setSelected(null);
                        }}
                        style={[styles.dateButton, date === activeDay && styles.selected]}
                      >
                        <AppText>{label}</AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {schedule.slots
                  .filter((slot) => localDay(slot.starts_at) === activeDay)
                  .map((slot) => (
                    <Pressable
                      key={slot.starts_at}
                      accessibilityRole="radio"
                      accessibilityLabel={`${time(slot.starts_at)} a ${time(slot.ends_at)}${slot.available ? '' : ', sin cupo'}`}
                      accessibilityState={{
                        checked: selected === slot.starts_at,
                        disabled: !slot.available || saving,
                      }}
                      disabled={!slot.available || saving}
                      onPress={() => {
                        setSelected(slot.starts_at);
                        setMessage('');
                      }}
                      style={[styles.slot, selected === slot.starts_at && styles.selected]}
                    >
                      <AppText>
                        {time(slot.starts_at)}–{time(slot.ends_at)}
                      </AppText>
                      <AppText secondary>
                        {!slot.available
                          ? 'Sin cupo'
                          : selected === slot.starts_at
                            ? 'Elegida'
                            : 'Disponible'}
                      </AppText>
                    </Pressable>
                  ))}
              </>
            )}
            {message ? (
              <AppText accessibilityLiveRegion="polite" style={styles.subtitle}>
                {message}
              </AppText>
            ) : null}
            <View style={styles.noteBar}>
              <AppText style={styles.noteText}>{scheduleContent.pendingNote}</AppText>
            </View>
            <View style={styles.confirm}>
              <Button
                label={saving ? 'Verificando…' : 'Elegir esta franja'}
                disabled={!chosen || saving}
                onPress={() => void confirm()}
              />
            </View>
            <AppText style={styles.sectionTitle} accessibilityRole="header">
              Semana habitual
            </AppText>
            {dayNames.map((name, index) => {
              const day = schedule.hours.find((item) => item.weekday === index + 1);
              return (
                <View key={name} style={styles.dayRow}>
                  <AppText style={styles.dayName}>{name}</AppText>
                  <AppText secondary>
                    {!day
                      ? 'Sin horario publicado'
                      : day.is_closed
                        ? 'Cerrado'
                        : `${shortTime(day.opens_at)}–${shortTime(day.closes_at)}`}
                  </AppText>
                </View>
              );
            })}
            {schedule.exceptions.length > 0 && (
              <>
                <AppText style={styles.sectionTitle} accessibilityRole="header">
                  Cambios próximos
                </AppText>
                {schedule.exceptions.map((item) => (
                  <View key={item.local_date} style={styles.dayRow}>
                    <AppText style={styles.dayName}>{item.local_date}</AppText>
                    <AppText secondary>
                      {item.is_closed
                        ? 'Cerrado'
                        : `${shortTime(item.opens_at)}–${shortTime(item.closes_at)}`}
                      {item.public_message ? ` · ${item.public_message}` : ''}
                    </AppText>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: { width: 22, height: 22 },
  topBarTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  messageCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  messageTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  loading: { marginTop: spacing.xxl },
  retry: { minHeight: layout.touchTarget, justifyContent: 'center' },
  retryText: { color: colors.primary, fontFamily: fonts.semibold },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 18, marginTop: spacing.xxl },
  dayRow: {
    minHeight: 52,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dayName: { fontFamily: fonts.medium },
  noteBar: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radii.control,
    minHeight: layout.touchTarget - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  noteText: { color: colors.primary, fontSize: 12, lineHeight: 17 },
  days: { gap: spacing.sm, paddingVertical: spacing.md },
  dateButton: {
    minHeight: layout.touchTarget,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceSuccess },
  slot: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
  },
  confirm: { marginTop: spacing.lg },
  cta: {
    marginTop: spacing.lg,
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ctaText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
});
