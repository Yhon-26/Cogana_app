import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getCustomerAuthClient } from '@/services/customer/auth';
import { useCheckoutDraft } from '../checkout/CheckoutDraftContext';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { accountHomeContent } from './accountHomeContent';

// 21 · Tu espacio (pestaña Cuenta): hub sin fotografía decorativa, según las
// decisiones del usuario. Mis direcciones se muestra sin chevron porque su
// pantalla aún no existe; el acceso de equipo se conserva como enlace discreto.
export function AccountScreen() {
  const [identity, setIdentity] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { resetCheckoutDraft } = useCheckoutDraft();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getCustomerAuthClient()
        .auth.getUser()
        .then(({ data }) => {
          if (active) setIdentity(data.user?.email ?? data.user?.phone ?? null);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const signOut = async () => {
    const { error: failure } = await getCustomerAuthClient().auth.signOut();
    if (failure) {
      setError('No pudimos cerrar la sesión. Reintenta.');
      return;
    }
    resetCheckoutDraft();
    setIdentity(null);
    setError('');
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <AppText style={styles.title} accessibilityRole="header">
            {accountHomeContent.title}
          </AppText>
          <AppText secondary style={styles.subtitle}>
            {accountHomeContent.subtitle}
          </AppText>
        </View>

        <View style={styles.guestCard}>
          <AppText style={styles.guestTitle}>
            {identity ? 'Sesión iniciada' : accountHomeContent.guestCardTitle}
          </AppText>
          <AppText style={styles.guestBody}>{identity ?? accountHomeContent.guestCardBody}</AppText>
          {error && <AppText accessibilityLiveRegion="assertive">{error}</AppText>}
          <Button
            label={identity ? 'Cerrar sesión de cliente' : 'Ingresar a mi cuenta'}
            variant="secondary"
            onPress={() => (identity ? void signOut() : router.push('/sign-in'))}
          />
        </View>

        <AppText style={styles.sectionTitle} accessibilityRole="header">
          {accountHomeContent.activityTitle}
        </AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mis pedidos"
          onPress={() => router.push('/orders')}
          style={({ pressed }) => [styles.rowCard, pressed && styles.rowPressed]}
        >
          <View style={styles.rowText}>
            <AppText style={styles.rowName}>{accountHomeContent.ordersRow.name}</AppText>
            <AppText style={styles.rowDescription}>
              {accountHomeContent.ordersRow.description}
            </AppText>
          </View>
          <View style={styles.chevron} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mis direcciones"
          onPress={() => router.push('/addresses')}
          style={({ pressed }) => [styles.rowCard, pressed && styles.rowPressed]}
        >
          <View style={styles.rowText}>
            <AppText style={styles.rowName}>{accountHomeContent.addressesRow.name}</AppText>
            <AppText style={styles.rowDescription}>
              {accountHomeContent.addressesRow.description}
            </AppText>
          </View>
          <View style={styles.chevron} />
        </Pressable>

        <Button
          label={accountHomeContent.moreCta}
          size="large"
          onPress={() => router.push('/account/more')}
        />

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/operations')}
          hitSlop={8}
          style={styles.teamEntry}
        >
          <AppText style={styles.teamEntryText}>{accountHomeContent.teamEntry}</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  titleBlock: { gap: spacing.xs },
  title: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  guestCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  guestTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  guestBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
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
  teamEntry: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    alignItems: 'center',
    minHeight: layout.touchTarget,
    justifyContent: 'center',
  },
  teamEntryText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
});
