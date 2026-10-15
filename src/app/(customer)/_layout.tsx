import { Tabs } from 'expo-router';
import { CartFeedbackProvider } from '@/features/customer/cart-feedback/CartFeedbackProvider';
import { CustomerTabBar } from '@/components/CustomerTabBar';

export default function CustomerLayout() {
  return (
    <CartFeedbackProvider>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomerTabBar {...props} />}
      >
        <Tabs.Screen name="store" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="categories" options={{ title: 'Categorías' }} />
        <Tabs.Screen name="cart" options={{ title: 'Carrito' }} />
        <Tabs.Screen name="account" options={{ title: 'Cuenta' }} />
      </Tabs>
    </CartFeedbackProvider>
  );
}
