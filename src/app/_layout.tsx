import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { startSessionLifecycle } from '@/services/auth/session';
import { CheckoutDraftProvider } from '@/features/customer/checkout/CheckoutDraftContext';
import { OperationsStoreProvider } from '@/features/operations/OperationsStoreContext';
import { colors, spacing } from '@/theme/tokens';

export { ErrorBoundary } from 'expo-router';
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  useEffect(() => startSessionLifecycle(), []);
  if (!loaded && !error) return null;
  if (error)
    return (
      <View style={styles.error}>
        <Text>No pudimos cargar las fuentes de Cogana. Cierra y vuelve a abrir la app.</Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <CheckoutDraftProvider>
        <OperationsStoreProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(operations)" />
            <Stack.Screen name="sign-in" />
          </Stack>
        </OperationsStoreProvider>
      </CheckoutDraftProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.section,
    backgroundColor: colors.background,
  },
});
