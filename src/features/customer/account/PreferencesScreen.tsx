import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { preferencesContent } from './accountSettingsContent';

const backIcon = require('../../../assets/navigation/back.svg');

// 25 · Tus preferencias: valores por cargar (no hay cuenta que los respalde),
// guardado deshabilitado hasta el contrato de identidad.
export function PreferencesScreen() {
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
          {preferencesContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title} accessibilityRole="header">
          {preferencesContent.title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {preferencesContent.subtitle}
        </AppText>

        <View style={styles.list}>
          {preferencesContent.settings.map((setting) => (
            <View key={setting.key} style={styles.row}>
              <View style={styles.rowText}>
                <AppText style={styles.rowName}>{setting.name}</AppText>
                <AppText style={styles.rowDescription}>{setting.description}</AppText>
              </View>
              <View style={styles.chip}>
                <AppText style={styles.chipText}>{preferencesContent.pendingChip}</AppText>
              </View>
            </View>
          ))}
        </View>

        <Button label={preferencesContent.saveCta} size="large" disabled />
        <AppText style={styles.saveNote}>{preferencesContent.saveNote}</AppText>
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
  list: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: layout.touchTarget + 12,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  rowDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  chip: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  chipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
  saveNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
