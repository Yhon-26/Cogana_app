import type { ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { AppTabBar, type AppTabBarProps } from './AppTabBar';
import { useCartFeedback } from '@/features/customer/cart-feedback/CartFeedbackProvider';
import { useCheckoutDraft } from '@/features/customer/checkout/CheckoutDraftContext';
import { colors, fonts } from '@/theme/tokens';

const tabs = {
  store: { label: 'Inicio', icon: require('../assets/navigation/home.svg') },
  categories: { label: 'Categorías', icon: require('../assets/navigation/categories.svg') },
  cart: { label: 'Carrito', icon: require('../assets/navigation/cart.svg') },
  account: { label: 'Cuenta', icon: require('../assets/navigation/account.svg') },
} as const;

export function CustomerTabBar(props: AppTabBarProps) {
  const { cartTarget, pulse, reducedMotion } = useCartFeedback();
  const { cartLines } = useCheckoutDraft();
  const count = (cartLines ?? []).reduce((sum, line) => sum + (line.bulk ? 1 : line.quantity), 0);
  const renderIcon = (route: string, icon: ReactNode) => {
    if (route !== 'cart') return icon;
    return (
      <View ref={cartTarget} collapsable={false} style={styles.target}>
        {!reducedMotion && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                opacity: pulse.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 0.7, 0] }),
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.8] }) },
                ],
              },
            ]}
          />
        )}
        <Animated.View
          style={{
            transform: [
              {
                translateY: pulse.interpolate({
                  inputRange: [0, 0.3, 0.6, 1],
                  outputRange: [0, 3, -4, 0],
                }),
              },
              {
                scale: pulse.interpolate({
                  inputRange: [0, 0.3, 0.6, 1],
                  outputRange: [1, 0.9, 1.18, 1],
                }),
              },
            ],
          }}
        >
          {icon}
          {count > 0 && (
            <View style={styles.badge} pointerEvents="none">
              <AppText style={styles.badgeText}>{count > 99 ? '99+' : count}</AppText>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };
  return <AppTabBar {...props} tabs={tabs} appearance="store" renderIcon={renderIcon} />;
}

const styles = StyleSheet.create({
  target: { width: 22, height: 22 },
  ring: {
    position: 'absolute',
    left: -9,
    right: -9,
    top: -9,
    bottom: -9,
    borderWidth: 1.5,
    borderColor: '#83A569',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    right: -10,
    top: -8,
    minWidth: 17,
    minHeight: 17,
    paddingHorizontal: 3,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10, lineHeight: 14, color: colors.onPrimary },
});
