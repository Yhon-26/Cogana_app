import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { accountMoreContent } from './accountMoreContent';

const backIcon = require('../../../assets/navigation/back.svg');

const optionRoutes = {
  preferences: '/preferences',
  notifications: '/notifications',
  privacy: '/privacy',
} as const;

// 24 · Más de tu cuenta: hub de ajustes, sin fotografía decorativa.
export function AccountMoreScreen() {
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
          {accountMoreContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>{accountMoreContent.title}</AppText>
        <AppText secondary style={styles.subtitle}>
          {accountMoreContent.subtitle}
        </AppText>

        <AppText style={styles.sectionTitle} accessibilityRole="header">
          {accountMoreContent.sectionTitle}
        </AppText>

        {accountMoreContent.options.map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${option.name}`}
            onPress={() => router.push(optionRoutes[option.key as keyof typeof optionRoutes])}
            style={({ pressed }) => [styles.rowCard, pressed && styles.rowPressed]}
          >
            <View style={styles.rowText}>
              <AppText style={styles.rowName}>{option.name}</AppText>
              <AppText style={styles.rowDescription}>{option.description}</AppText>
            </View>
            <View style={styles.chevron} />
          </Pressable>
        ))}

        <View style={styles.note}>
          <AppText style={styles.noteText}>{accountMoreContent.pendingNote}</AppText>
        </View>
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
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    paddingHorizontal: spacing.lg,
    minHeight: layout.touchTarget + 20,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  rowDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '-45deg' }],
  },
  note: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radii.control,
    minHeight: layout.touchTarget - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  noteText: { color: colors.primary, fontSize: 12, lineHeight: 17 },
});
