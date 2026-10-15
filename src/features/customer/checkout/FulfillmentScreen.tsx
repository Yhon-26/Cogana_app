import { useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { fulfillmentContent } from './fulfillmentContent';

const backIcon = require('../../../assets/navigation/back.svg');
type FulfillmentMode = 'delivery' | 'pickup';

function FulfillmentOption({
  mode,
  selected,
  onSelect,
}: {
  mode: FulfillmentMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const delivery = mode === 'delivery';
  const title = delivery ? fulfillmentContent.delivery : fulfillmentContent.pickup;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={
        delivery ? fulfillmentContent.deliveryDetail : fulfillmentContent.pickupDetail
      }
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={styles.optionCopy}>
        <AppText style={styles.optionTitle}>{title}</AppText>
        <AppText style={styles.optionDetail}>
          {delivery ? fulfillmentContent.deliveryDetail : fulfillmentContent.pickupDetail}
        </AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

// Pantalla 13: la ruta de entrega ya continúa al formulario local. Recojo se
// habilitará con su pantalla específica; aquí no se reservan franjas.
export function FulfillmentScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [choice, setChoice] = useState<FulfillmentMode | null>(null);
  const selected = choice ?? (mode === 'pickup' ? 'pickup' : 'delivery');
  const goBack = () => router.navigate('/cart');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al carrito"
          onPress={goBack}
          style={styles.backButton}
        >
          <Image
            source={backIcon}
            tintColor={colors.primary}
            style={styles.backIcon}
            accessible={false}
          />
        </Pressable>
        <AppText style={styles.topBarTitle}>{fulfillmentContent.title}</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <AppText style={styles.heading} accessibilityRole="header">
            {fulfillmentContent.heading}
          </AppText>
          <AppText style={styles.introduction}>{fulfillmentContent.introduction}</AppText>
          <View style={styles.options} accessibilityRole="radiogroup">
            <FulfillmentOption
              mode="delivery"
              selected={selected === 'delivery'}
              onSelect={() => setChoice('delivery')}
            />
            <FulfillmentOption
              mode="pickup"
              selected={selected === 'pickup'}
              onSelect={() => setChoice('pickup')}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.footerContent}>
          <Button
            label={
              selected === 'delivery'
                ? fulfillmentContent.continueDelivery
                : fulfillmentContent.continuePickup
            }
            size="form"
            onPress={() => router.push(selected === 'pickup' ? '/payment/pickup' : '/delivery-details')}
            accessibilityHint={
              selected === 'delivery'
                ? fulfillmentContent.continueDeliveryHint
                : 'Elegir contacto, horario y medio de pago para recoger en tienda'
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    gap: spacing.xs,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.section,
  },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  heading: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32 },
  introduction: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  options: { gap: spacing.md, marginTop: spacing.xxl },
  option: {
    minHeight: 106,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { backgroundColor: '#EDF4EF', borderColor: colors.primary },
  optionPressed: { opacity: 0.82 },
  optionCopy: { flex: 1, gap: spacing.sm },
  optionTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  optionDetail: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
  },
  footerContent: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  footerNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
