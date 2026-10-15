import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/theme/tokens';

// Decorative CSS illustration from the ZIP; never used as a product photograph.
export function PantryBannerArt() {
  return (
    <View
      style={styles.scene}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.bag}>
        <View style={styles.bagSeam} />
        {[18, 40, 62, 84].map((left) => (
          <View key={left} style={[styles.bagThread, { left }]} />
        ))}
      </View>
      <View style={styles.label}>
        <AppText allowFontScaling={false} style={styles.labelText}>
          {'ARROZ\nEXTRA'}
        </AppText>
      </View>
      <View style={styles.bowl}>
        {[
          [10, 9],
          [35, 14],
          [54, 8],
          [21, 32],
          [48, 32],
        ].map(([left, top], index) => (
          <View key={index} style={[styles.lentil, { left, top }]} />
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  scene: { position: 'absolute', right: -3, bottom: -8, width: 176, height: 145 },
  bag: {
    position: 'absolute',
    right: 43,
    bottom: 0,
    width: 104,
    height: 118,
    overflow: 'hidden',
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    backgroundColor: colors.surfaceMuted,
    transform: [{ rotate: '8deg' }],
  },
  bagSeam: {
    position: 'absolute',
    top: 17,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.border,
  },
  bagThread: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  label: {
    position: 'absolute',
    right: 60,
    bottom: 29,
    paddingHorizontal: 7,
    paddingVertical: 6,
    backgroundColor: colors.background,
    transform: [{ rotate: '8deg' }],
  },
  labelText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 10,
    lineHeight: 10.5,
    letterSpacing: 0.5,
  },
  bowl: {
    position: 'absolute',
    right: -12,
    bottom: -4,
    width: 95,
    height: 63,
    borderWidth: 8,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    transform: [{ rotate: '-16deg' }],
  },
  lentil: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
});
