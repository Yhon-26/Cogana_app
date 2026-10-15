import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { loadCustomerAccount, saveCustomerAccount } from '@/services/customer/account';
import { useOrderAction } from '@/features/operations/useOrderAction';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

export function AccountPreferencesForm() {
  const [account, setAccount] = useState<Awaited<ReturnType<typeof loadCustomerAccount>> | null>(
    null,
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [substitution, setSubstitution] = useState('contact');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState(false);
  const action = useOrderAction(() => {
    setSaved(true);
    setRevision((value) => value + 1);
  });
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setAccount(null);
      void loadCustomerAccount()
        .then((value) => {
          if (active) {
            setAccount(value);
            setName(value.customer?.name ?? '');
            setPhone(value.customer?.phone ?? '');
            setOrderNotifications(value.preferences.order_notifications);
            setPromotions(value.preferences.promotion_notifications);
            setMarketing(value.preferences.marketing_consent);
            setSubstitution(value.preferences.substitution_default);
            setError('');
          }
        })
        .catch((failure) => {
          if (active)
            setError(
              failure instanceof Error ? failure.message : 'No pudimos cargar tus preferencias.',
            );
        });
      return () => {
        active = false;
      };
      // Explicit retry reloads the focused query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision]),
  );
  const fields = {
    name: name.trim(),
    phone: phone.replace(/[\s()-]/g, ''),
    preferences: {
      order_notifications: orderNotifications,
      promotion_notifications: promotions,
      marketing_consent: marketing,
      substitution_default: substitution,
    },
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <Button label="‹ Cuenta" variant="ghost" onPress={() => router.back()} />
        <AppText style={styles.title} accessibilityRole="header">
          Tus datos y preferencias
        </AppText>
        {(error || action.error) && (
          <>
            <AppText accessibilityLiveRegion="assertive">{error || action.error}</AppText>
            <Button label="Reintentar" onPress={() => setRevision((value) => value + 1)} />
            <Button
              label="Ingresar a mi cuenta"
              variant="secondary"
              onPress={() => router.push('/sign-in')}
            />
          </>
        )}
        {!account && !error && <AppText>Cargando preferencias…</AppText>}
        {account && (
          <>
            <AppText>Nombre</AppText>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setSaved(false);
              }}
              accessibilityLabel="Tu nombre"
              editable={!action.busy}
              maxLength={100}
              autoComplete="name"
              style={styles.input}
            />
            <AppText>Celular de contacto</AppText>
            <TextInput
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setSaved(false);
              }}
              accessibilityLabel="Celular de contacto"
              editable={!action.busy}
              keyboardType="phone-pad"
              maxLength={15}
              autoComplete="tel"
              style={styles.input}
            />
            {[
              {
                label: 'Avisos de pedidos en la app',
                value: orderNotifications,
                set: setOrderNotifications,
              },
              {
                label: 'Deseo recibir novedades de promociones',
                value: promotions,
                set: setPromotions,
              },
              { label: 'Autorizo comunicaciones comerciales', value: marketing, set: setMarketing },
            ].map((item) => (
              <View key={item.label} style={styles.row}>
                <AppText style={{ flex: 1 }}>{item.label}</AppText>
                <Switch
                  value={item.value}
                  onValueChange={(value) => {
                    item.set(value);
                    setSaved(false);
                  }}
                  disabled={action.busy}
                  accessibilityLabel={item.label}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            ))}
            <AppText secondary>
              Los avisos de pedidos se consultan dentro de la app. Las preferencias comerciales
              quedan guardadas en tu cuenta.
            </AppText>
            <AppText accessibilityRole="header">Si un producto falta</AppText>
            {(
              [
                ['contact', 'Consultarme antes de sustituir'],
                ['allow_similar', 'Aceptar uno similar sin costo adicional'],
                ['remove', 'Retirar el artículo'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                label={label}
                variant={substitution === value ? 'primary' : 'secondary'}
                disabled={action.busy}
                onPress={() => {
                  setSubstitution(value);
                  setSaved(false);
                }}
              />
            ))}
            <Button
              label={action.busy ? 'Guardando…' : 'Guardar datos y preferencias'}
              disabled={
                action.busy ||
                name.trim().length < 2 ||
                !/^\+?519\d{8}$|^9\d{8}$/.test(fields.phone)
              }
              onPress={() =>
                void action.run(JSON.stringify(fields), (operationId) =>
                  saveCustomerAccount(account.storeId, fields, operationId),
                )
              }
            />
            {saved && (
              <AppText accessibilityLiveRegion="polite">
                Tus preferencias quedaron guardadas.
              </AppText>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.page,
    paddingBottom: spacing.section,
    gap: spacing.md,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  input: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    minHeight: 48,
    padding: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
});
