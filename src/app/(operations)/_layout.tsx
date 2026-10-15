import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { OperationsTabBar } from '@/components/OperationsTabBar';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { colors } from '@/theme/tokens';

export default function OperationsLayout() {
  const { store, loading } = useOperationsStore();
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  if (!store) return <Redirect href="/operations-select" />;
  return (
    <Tabs
      key={store.id}
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <OperationsTabBar {...props} />}
    >
      <Tabs.Screen name="panel" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="pedidos" options={{ title: 'Pedidos' }} />
      <Tabs.Screen name="inventario" options={{ title: 'Inventario' }} />
      <Tabs.Screen name="gestion" options={{ title: 'Gestión' }} />
    </Tabs>
  );
}
