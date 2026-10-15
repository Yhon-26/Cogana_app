import { Text, type TextProps } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Props = TextProps & { variant?: keyof typeof typography; secondary?: boolean };

export function AppText({ variant = 'body', secondary = false, style, ...props }: Props) {
  return (
    <Text
      {...props}
      style={[
        typography[variant],
        { color: secondary ? colors.textSecondary : colors.text },
        style,
      ]}
    />
  );
}
