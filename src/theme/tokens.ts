export const colors = {
  background: '#FCF9F1',
  primary: '#295D43',
  text: '#1B241E',
  textSecondary: '#5F6B63',
  border: '#E4DED2',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EDE3',
  surfaceSuccess: '#EFF5EE',
  onPrimary: '#FFFFFF',
  danger: '#A63D2F',
} as const;

// Palette scoped to the welcome redesign supplied as a Figma Make ZIP.
export const welcomeTheme = {
  background: '#173F30',
  heroStart: '#285B45',
  heroMiddle: '#1F4D3A',
  heroEnd: '#12372A',
  surface: '#FFFDF9',
  text: '#18392D',
  textSecondary: '#68746D',
  primary: '#246248',
  onPrimary: '#FFFDF7',
  brand: '#FFFAF0',
  accent: '#E2B65E',
  eyebrow: '#9A6E30',
  handle: '#E9E3D8',
  regularFont: 'DMSans_400Regular',
  semiboldFont: 'DMSans_600SemiBold',
  boldFont: 'DMSans_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  page: 20,
  xl: 24,
  xxl: 32,
  section: 48,
} as const;
export const radii = { control: 14, surface: 16 } as const;
export const layout = { touchTarget: 48, contentMaxWidth: 600, tabHeight: 64 } as const;
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  brand: 'Fraunces_600SemiBold',
  brandBold: 'Fraunces_700Bold',
} as const;
export const typography = {
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  secondary: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  brand: { fontFamily: fonts.brand, fontSize: 40, lineHeight: 48 },
  welcomeLogo: { fontFamily: fonts.brandBold, fontSize: 28, lineHeight: 36 },
  welcomeTitle: { fontFamily: fonts.brandBold, fontSize: 28, lineHeight: 34 },
} as const;
