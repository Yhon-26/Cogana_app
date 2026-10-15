import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { notificationsContent } from './accountSettingsContent';

const backIcon = require('../../../assets/navigation/back.svg');

// 26 · Notificaciones: la bandeja de mensajes aún no existe; se ofrece la
// salida honesta hacia los pedidos.
export function NotificationsScreen() {
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
          {notificationsContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title} accessibilityRole="header">
          {notificationsContent.title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {notificationsContent.subtitle}
        </AppText>

        <View style={styles.emptyCard}>
          <AppText style={styles.emptyTitle}>{notificationsContent.emptyTitle}</AppText>
          <AppText style={styles.emptyBody}>{notificationsContent.emptyBody}</AppText>
          <View style={styles.chip}>
            <AppText style={styles.chipText}>{notificationsContent.chip}</AppText>
          </View>
        </View>

        <Button
          label={notificationsContent.ordersCta}
          size="large"
          onPress={() => router.push('/orders')}
        />
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
  emptyCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.brandBold, fontSize: 21, lineHeight: 27 },
  emptyBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    marginTop: spacing.xs,
  },
  chipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
  },
});
