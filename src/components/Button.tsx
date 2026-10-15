import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colors, layout, radii, spacing } from '@/theme/tokens';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  secondary?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'medium' | 'large' | 'form';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  trailingIcon?: ReactNode;
};

export function Button({
  label,
  secondary = false,
  variant,
  size = 'medium',
  disabled,
  style,
  textStyle,
  trailingIcon,
  ...props
}: Props) {
  // `secondary` keeps the existing screens compatible; new screens should use `variant`.
  const appearance = variant ?? (secondary ? 'secondary' : 'primary');
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        size === 'large' && styles.large,
        size === 'form' && styles.form,
        styles[appearance],
        trailingIcon != null && styles.withIcon,
        style,
        disabled && styles.disabled,
        { opacity: pressed && !disabled ? 0.8 : 1 },
      ]}
    >
      <AppText
        variant="label"
        style={[
          {
            color: disabled
              ? colors.primary
              : appearance === 'primary'
                ? colors.onPrimary
                : colors.primary,
            textAlign: 'center',
            fontSize: size === 'large' ? 16 : 15,
          },
          textStyle,
        ]}
      >
        {label}
      </AppText>
      {trailingIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.control,
  },
  primary: { backgroundColor: colors.primary },
  withIcon: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  secondary: { borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  large: { minHeight: 56, borderRadius: 999, paddingVertical: spacing.lg },
  form: { minHeight: 52, borderRadius: radii.control },
  disabled: { backgroundColor: '#DCE7E0', borderColor: '#DCE7E0' },
});
