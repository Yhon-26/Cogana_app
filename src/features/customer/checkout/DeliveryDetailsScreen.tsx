import { useRef, useState, type RefObject } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { deliveryDetailsContent as content } from './deliveryDetailsContent';
import { useCheckoutDraft } from './CheckoutDraftContext';
import { formatCheckoutSlot } from '@/services/customer/checkoutSchedule';
import { useDeliveryZones } from './useDeliveryZones';
import { formatSoles } from '../products/formatPrice';

const backIcon = require('../../../assets/navigation/back.svg');

type DeliveryFieldProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'inputMode'
  | 'keyboardType'
  | 'maxLength'
  | 'returnKeyType'
  | 'onSubmitEditing'
> & {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  inputRef?: RefObject<TextInput | null>;
};

function DeliveryField({
  label,
  placeholder,
  value,
  onChangeText,
  inputRef,
  ...inputProps
}: DeliveryFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <TextInput
        ref={inputRef}
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        accessibilityLabel={label}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

// Las zonas se consultan mediante el servicio público; los datos personales
// permanecen en el borrador local hasta crear el pedido.
export function DeliveryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { delivery, setDeliveryField, selectedSlot } = useCheckoutDraft();
  const { address, reference, phone } = delivery;
  const { zones, loading, error, retry } = useDeliveryZones();
  const zone = zones.find((item) => item.id === delivery.zoneId);
  const addressRef = useRef<TextInput>(null);
  const referenceRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const canReview = Boolean(zone && !loading && !error && address.trim() && phone.trim());

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a entrega o recojo"
            onPress={() => router.navigate('/fulfillment?mode=delivery')}
            style={styles.backButton}
          >
            <Image
              source={backIcon}
              tintColor={colors.primary}
              style={styles.backIcon}
              accessible={false}
            />
          </Pressable>
          <AppText style={styles.topBarTitle}>{content.topBarTitle}</AppText>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <AppText accessibilityRole="header" style={styles.heading}>
              {content.heading}
            </AppText>

            <View style={styles.fields}>
              <AppText style={styles.sectionTitle}>Zona de entrega · Santa Anita</AppText>
              <AppText>Elige la zona donde está tu dirección.</AppText>
              {loading && <AppText>Cargando zonas…</AppText>}
              {error && (
                <Button label="Reintentar cargar zonas" variant="secondary" onPress={retry} />
              )}
              {!loading && !error && zones.length === 0 && (
                <AppText>No hay zonas de entrega disponibles.</AppText>
              )}
              {zones.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item.id === delivery.zoneId }}
                  onPress={() => {
                    setDeliveryField('zoneId', item.id);
                    setDeliveryField('district', item.district);
                  }}
                  style={[
                    styles.schedule,
                    {
                      borderWidth: 1,
                      backgroundColor: item.id === delivery.zoneId ? '#EDF4EF' : colors.surface,
                      borderColor: item.id === delivery.zoneId ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={styles.zoneHeading}>
                    <AppText style={[styles.scheduleAction, { flex: 1 }]}>{item.name}</AppText>
                    <View style={styles.radio}>
                      {item.id === delivery.zoneId && <View style={styles.radioDot} />}
                    </View>
                  </View>
                  <AppText>
                    Envío {formatSoles(item.fee_cents)} · Mínimo{' '}
                    {formatSoles(item.minimum_order_cents)}
                  </AppText>
                  {item.restrictions && (
                    <AppText style={styles.scheduleDetail}>{item.restrictions}</AppText>
                  )}
                </Pressable>
              ))}
              <DeliveryField
                label={content.addressLabel}
                placeholder={content.addressPlaceholder}
                value={address}
                onChangeText={(value) => setDeliveryField('address', value)}
                autoCapitalize="sentences"
                returnKeyType="next"
                maxLength={160}
                inputRef={addressRef}
                onSubmitEditing={() => referenceRef.current?.focus()}
              />
              <DeliveryField
                label={content.referenceLabel}
                placeholder={content.referencePlaceholder}
                value={reference}
                onChangeText={(value) => setDeliveryField('reference', value)}
                autoCapitalize="sentences"
                returnKeyType="next"
                maxLength={160}
                inputRef={referenceRef}
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{content.scheduleTitle}</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={content.scheduleAction}
                accessibilityHint={content.schedulePending}
                onPress={() => router.push('/schedule')}
                style={({ pressed }) => [styles.schedule, pressed && { opacity: 0.8 }]}
              >
                <AppText style={styles.scheduleAction}>{content.scheduleAction}</AppText>
                <AppText style={styles.scheduleDetail}>
                  {selectedSlot?.mode === 'delivery'
                    ? `${formatCheckoutSlot(selectedSlot)} · Se confirma al crear el pedido`
                    : 'Elige entre las franjas disponibles'}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{content.contactTitle}</AppText>
              <DeliveryField
                label={content.phoneLabel}
                placeholder={content.phonePlaceholder}
                value={phone}
                onChangeText={(value) => setDeliveryField('phone', value)}
                inputMode="tel"
                keyboardType="phone-pad"
                returnKeyType="done"
                maxLength={20}
                inputRef={phoneRef}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.footerContent}>
            <Button
              label={content.reviewAction}
              size="form"
              disabled={!canReview}
              onPress={() => router.push('/order-review')}
              accessibilityHint={canReview ? content.reviewReady : content.reviewPending}
            />
            <AppText style={styles.footerNote} accessibilityLiveRegion="polite">
              {canReview ? content.reviewReady : content.reviewPending}
            </AppText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  zoneHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  safe: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    gap: spacing.xs,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
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
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
    paddingBottom: spacing.section,
  },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  heading: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  fields: { marginTop: spacing.xxl, gap: spacing.page },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 49,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  inputFocused: { borderBottomColor: colors.primary, borderBottomWidth: 2 },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  schedule: {
    minHeight: 82,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.control,
    backgroundColor: '#EDF4EF',
    gap: spacing.xs,
  },
  scheduleAction: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  scheduleDetail: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
  },
  footerContent: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  footerNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
