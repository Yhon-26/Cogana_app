import type { ComponentProps, ReactNode } from 'react';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

export type AppTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type TabDefinition = { label: string; icon: ComponentProps<typeof Image>['source'] };

// Cliente y operación comparten medidas y estados; sus destinos siguen separados.
export function AppTabBar({
  state,
  navigation,
  tabs,
  appearance = 'default',
  renderIcon,
}: AppTabBarProps & {
  tabs: Readonly<Record<string, TabDefinition>>;
  appearance?: 'default' | 'store';
  renderIcon?: (routeName: string, icon: ReactNode) => ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const tab = tabs[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.textSecondary;
          const icon = (
            <Image
              source={tab.icon}
              style={[
                styles.icon,
                appearance === 'store' && styles.storeIcon,
                { tintColor: color },
              ]}
              accessible={false}
            />
          );
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.tab,
                appearance === 'store' && styles.storeTab,
                pressed && styles.pressed,
              ]}
            >
              {focused && appearance !== 'store' && <View style={styles.indicator} />}
              {renderIcon ? renderIcon(route.name, icon) : icon}
              <AppText
                style={[
                  styles.label,
                  {
                    color,
                    fontFamily: focused
                      ? appearance === 'store'
                        ? fonts.bold
                        : fonts.semibold
                      : fonts.regular,
                  },
                ]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: 'row', paddingHorizontal: spacing.xs },
  // El alto crece con las etiquetas: no fijar posiciones de texto ni limitar su escala.
  tab: {
    flex: 1,
    minHeight: layout.tabHeight,
    minWidth: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  icon: { width: 24, height: 24 },
  storeIcon: { width: 22, height: 22 },
  storeTab: { gap: 2, paddingVertical: 8 },
  label: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
