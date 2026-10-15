import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { requestCustomerAccountDeletion } from '@/services/customer/account';
import { useOrderAction } from '@/features/operations/useOrderAction';
import { Button } from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { privacyContent } from './accountSettingsContent';

const backIcon = require('../../../assets/navigation/back.svg');

// 27 · Privacidad y cuenta: la eliminación de cuenta pertenece al contrato de
// identidad; el título destructivo usa el rojo de peligro del sistema.
export function PrivacyScreen() {
  const [requested, setRequested] = useState(false);
  const action = useOrderAction(() => setRequested(true));
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
          {privacyContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title} accessibilityRole="header">
          {privacyContent.title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {privacyContent.subtitle}
        </AppText>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>{privacyContent.dataTitle}</AppText>
          <AppText style={styles.cardBody}>{privacyContent.dataBody}</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={[styles.cardTitle, styles.dangerTitle]}>
            {privacyContent.deleteTitle}
          </AppText>
          <AppText style={styles.cardBody}>
            Puedes registrar una solicitud de eliminación. Quedará pendiente de atención; tu acceso
            y tus datos se conservan hasta que se complete.
          </AppText>
          <View style={styles.chip}>
            <AppText style={styles.chipText}>
              {requested ? 'Solicitud registrada' : 'Solicitud por atender'}
            </AppText>
          </View>
        </View>

        {action.error && <AppText accessibilityLiveRegion="assertive">{action.error}</AppText>}
        <Button
          label={requested ? 'Solicitud registrada' : 'Solicitar eliminación de mi cuenta'}
          disabled={action.busy || requested}
          variant="secondary"
          onPress={() =>
            Alert.alert(
              'Solicitar eliminación',
              'Se registrará la solicitud para su atención. Esta acción todavía no elimina tu cuenta.',
              [
                { text: 'Volver', style: 'cancel' },
                {
                  text: 'Solicitar',
                  onPress: () =>
                    void action.run('deletion-request', () => requestCustomerAccountDeletion()),
                },
              ],
            )
          }
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
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  dangerTitle: { color: colors.danger },
  cardBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
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
  deleteButton: {
    marginTop: spacing.xl,
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  deleteButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
});
