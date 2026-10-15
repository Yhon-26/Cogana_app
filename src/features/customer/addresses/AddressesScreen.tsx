import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { deleteCustomerAddress, loadCustomerAccount } from '@/services/customer/account';
import { useOrderAction } from '@/features/operations/useOrderAction';
import { useCheckoutDraft } from '../checkout/CheckoutDraftContext';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { addressesContent } from './addressesContent';

const backIcon = require('../../../assets/navigation/back.svg');

// 22 · Mis direcciones: estado vacío real (sin cuenta no hay direcciones), sin fotografía.
export function AddressesScreen() {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof loadCustomerAccount>> | null>(
    null,
  );
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const action = useOrderAction(() => setRevision((value) => value + 1));
  const { setDeliveryField } = useCheckoutDraft();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setAccount(null);
      setError('');
      void loadCustomerAccount()
        .then((value) => {
          if (active) setAccount(value);
        })
        .catch((failure) => {
          if (active)
            setError(
              failure instanceof Error ? failure.message : 'No pudimos cargar tus direcciones.',
            );
        });
      return () => {
        active = false;
      };
      // Explicit retry reloads the focused query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision]),
  );
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
          {addressesContent.listTitle}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>{addressesContent.listTitle}</AppText>
        <AppText secondary style={styles.subtitle}>
          {addressesContent.listSubtitle}
        </AppText>

        {(error || action.error) && (
          <View style={styles.emptyCard}>
            <AppText accessibilityLiveRegion="assertive">{error || action.error}</AppText>
            <Button label="Reintentar" onPress={() => setRevision((value) => value + 1)} />
            <Button
              label="Ingresar a mi cuenta"
              variant="secondary"
              onPress={() => router.push('/sign-in')}
            />
          </View>
        )}
        {!account && !error && <AppText>Cargando direcciones…</AppText>}
        {account?.addresses.map((item) => (
          <View key={item.id} style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>
              {item.label}
              {item.isDefault ? ' · Principal' : ''}
            </AppText>
            <AppText>{item.address}</AppText>
            <AppText secondary>
              {item.district}
              {item.reference ? ` · ${item.reference}` : ''}
            </AppText>
            <Button
              label="Usar para esta entrega"
              disabled={action.busy}
              variant="secondary"
              onPress={() => {
                setDeliveryField('address', item.address);
                setDeliveryField('district', item.district);
                setDeliveryField('reference', item.reference);
                setDeliveryField('zoneId', '');
                setDeliveryField('phone', account.customer?.phone ?? '');
                router.push('/delivery-details');
              }}
            />
            <Button
              label="Eliminar dirección"
              variant="ghost"
              disabled={action.busy}
              onPress={() =>
                Alert.alert(
                  'Eliminar dirección',
                  `Se eliminará ${item.label} de tus direcciones guardadas.`,
                  [
                    { text: 'Volver', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () =>
                        void action.run(`delete:${item.id}`, () => deleteCustomerAddress(item.id)),
                    },
                  ],
                )
              }
            />
          </View>
        ))}
        {account?.addresses.length === 0 && (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>{addressesContent.emptyTitle}</AppText>
            <AppText style={styles.emptyBody}>{addressesContent.emptyBody}</AppText>
            <View style={styles.chip}>
              <AppText style={styles.chipText}>{addressesContent.emptyChip}</AppText>
            </View>
          </View>
        )}

        <Button
          label={addressesContent.newCta}
          size="large"
          onPress={() => router.push('/address/new')}
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
