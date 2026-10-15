import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { listCustomerNotifications } from '@/services/customer/account';
import { orderStatusLabels } from '@/services/customer/orderDetails';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

export function CustomerNotificationsScreen() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof listCustomerNotifications>> | null>(
    null,
  );
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setItems(null);
      setError('');
      void listCustomerNotifications()
        .then((value) => {
          if (active) setItems(value);
        })
        .catch((failure) => {
          if (active)
            setError(failure instanceof Error ? failure.message : 'No pudimos cargar los avisos.');
        });
      return () => {
        active = false;
      };
      // Explicit retry reloads the focused query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision]),
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.page,
          paddingBottom: spacing.section,
          gap: spacing.md,
          maxWidth: layout.contentMaxWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Button label="‹ Cuenta" variant="ghost" onPress={() => router.back()} />
        <AppText style={{ fontFamily: fonts.brandBold, fontSize: 27 }} accessibilityRole="header">
          Avisos de tus pedidos
        </AppText>
        {error && (
          <View>
            <AppText accessibilityLiveRegion="assertive">{error}</AppText>
            <Button label="Reintentar" onPress={() => setRevision((value) => value + 1)} />
            <Button
              label="Ingresar a mi cuenta"
              variant="secondary"
              onPress={() => router.push('/sign-in')}
            />
          </View>
        )}
        {!items && !error && <AppText>Cargando avisos…</AppText>}
        {items?.length === 0 && (
          <AppText>No hay avisos de pedidos. Puedes activar su consulta en Preferencias.</AppText>
        )}
        {items?.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/order-tracking', params: { orderId: item.orderId } })
            }
            style={{
              minHeight: 48,
              paddingVertical: spacing.lg,
              borderBottomWidth: 1,
              borderColor: colors.border,
              gap: spacing.sm,
            }}
          >
            <AppText style={{ fontFamily: fonts.semibold }}>
              {item.number} · {orderStatusLabels[item.status] ?? item.status}
            </AppText>
            <AppText secondary>
              {new Intl.DateTimeFormat('es-PE', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'America/Lima',
              }).format(new Date(item.at))}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
