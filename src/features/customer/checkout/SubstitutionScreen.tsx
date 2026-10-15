import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { substitutionContent } from './postOrderContent';

const backIcon = require('../../../assets/navigation/back.svg');

// 33 · Responder sustitución: propuesta de ejemplo sin producto alternativo;
// responder queda deshabilitado hasta el contrato real.
export function SubstitutionScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
          {substitutionContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.eyebrow}>{substitutionContent.eyebrow}</AppText>
        <AppText style={styles.title}>{substitutionContent.title}</AppText>
        <AppText secondary style={styles.subtitle}>
          {substitutionContent.subtitle}
        </AppText>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <AppText style={styles.cardName}>{substitutionContent.original.name}</AppText>
              <AppText style={styles.cardDetail}>{substitutionContent.original.detail}</AppText>
            </View>
            <AppText style={styles.stateStrong}>{substitutionContent.original.state}</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <AppText style={styles.cardName}>{substitutionContent.alternative.name}</AppText>
              <AppText style={styles.cardDetail}>{substitutionContent.alternative.detail}</AppText>
            </View>
            <AppText style={styles.statePending}>{substitutionContent.alternative.state}</AppText>
          </View>
        </View>

        <View style={styles.fieldCard}>
          <AppText style={styles.fieldLabel}>{substitutionContent.deadlineLabel}</AppText>
          <AppText style={styles.fieldValue}>{substitutionContent.deadlineValue}</AppText>
        </View>

        <View style={styles.noteBar}>
          <AppText style={styles.noteText}>{substitutionContent.note}</AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={substitutionContent.cta}
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.cta}
        >
          <AppText style={styles.ctaText}>{substitutionContent.cta}</AppText>
        </Pressable>
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
  eyebrow: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.brandBold, fontSize: 28, lineHeight: 35, marginTop: spacing.xs },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardHeaderText: { flex: 1, gap: 2 },
  cardName: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  cardDetail: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  stateStrong: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  statePending: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  fieldCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
  },
  fieldValue: { color: colors.textSecondary, fontSize: 15, lineHeight: 21 },
  noteBar: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radii.control,
    minHeight: layout.touchTarget - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  noteText: { color: colors.primary, fontSize: 12, lineHeight: 17 },
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
