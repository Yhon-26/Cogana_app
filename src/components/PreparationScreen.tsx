import { View, StyleSheet } from 'react-native';
import type { PropsWithChildren } from 'react';
import { AppText } from './AppText';
import { Screen } from './Screen';
import { colors, spacing } from '@/theme/tokens';

type Props = PropsWithChildren<{ title: string; description: string }>;

export function PreparationScreen({ title, description, children }: Props) {
  return (
    <Screen>
      <AppText variant="brand" style={{ color: colors.primary }}>
        Cogana
      </AppText>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        <AppText secondary>{description}</AppText>
      </View>
      {children}
      <View style={styles.note}>
        <AppText variant="secondary" secondary>
          Estamos preparando esta sección. Todavía no hay compras ni operaciones disponibles.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.md, paddingTop: spacing.xxl },
  note: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
