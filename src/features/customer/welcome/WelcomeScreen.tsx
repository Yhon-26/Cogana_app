import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Animated, Easing, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { fonts, welcomeTheme as theme } from '@/theme/tokens';
import { welcomeContent } from './welcomeContent';

const layers = [
  {
    source: require('../../../assets/welcome/rice-grains.svg'),
    style: { top: '17%', left: '14%', width: 142, height: 106, opacity: 0.82 },
    duration: 10000,
    dx: 12,
    dy: 22,
    rotate: 7,
    phase: 0,
  },
  {
    source: require('../../../assets/welcome/lentil-cluster.svg'),
    style: { top: '39%', right: -10, width: 126, height: 100, opacity: 0.9 },
    duration: 12000,
    dx: -8,
    dy: 30,
    rotate: -8,
    phase: 0.33,
  },
  {
    source: require('../../../assets/welcome/corn-cob.svg'),
    style: { top: '-5%', right: -18, width: 124, height: 174 },
    duration: 11000,
    dx: -5,
    dy: 19,
    rotate: -5,
    phase: 0.64,
  },
  {
    source: require('../../../assets/welcome/grain-sack.svg'),
    style: { left: -48, bottom: -31, width: 245, height: 233, zIndex: 4 },
    duration: 12000,
    dx: 5,
    dy: -11,
    rotate: 2,
    phase: 0.25,
  },
  {
    source: require('../../../assets/welcome/wooden-spoon.svg'),
    style: { right: -78, bottom: '4%', width: 265, height: 159, zIndex: 5 },
    duration: 9000,
    dx: -11,
    dy: -18,
    rotate: -3,
    phase: 0.56,
  },
  {
    source: require('../../../assets/welcome/chickpea-sprig.svg'),
    style: { top: '19%', left: -12, width: 90, height: 112, opacity: 0.88 },
    duration: 13000,
    dx: 10,
    dy: 24,
    rotate: 9,
    phase: 0.62,
  },
] as const;

function FloatingGrain({
  layer,
  reducedMotion,
}: {
  layer: (typeof layers)[number];
  reducedMotion: boolean;
}) {
  const progress = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    progress.setValue(reducedMotion ? 0 : layer.phase);
    if (reducedMotion) return;
    const timing = (toValue: number, duration: number) =>
      Animated.timing(progress, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
    const animation = Animated.sequence([
      timing(1, layer.duration * (1 - layer.phase)),
      Animated.loop(Animated.sequence([timing(0, layer.duration), timing(1, layer.duration)]), {
        resetBeforeIteration: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [progress, layer, reducedMotion]);
  return (
    <Animated.View
      style={[
        styles.floatLayer,
        layer.style,
        {
          transform: [
            {
              translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, layer.dx] }),
            },
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, layer.dy] }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${layer.rotate}deg`],
              }),
            },
          ],
        },
      ]}
    >
      <Image
        source={layer.source}
        contentFit="fill"
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
    </Animated.View>
  );
}

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const entry = useState(() => new Animated.Value(reducedMotion ? 1 : 0))[0];
  const short = height <= 720;
  useEffect(() => {
    if (reducedMotion) {
      entry.setValue(1);
      return;
    }
    const animation = Animated.timing(entry, {
      toValue: 1,
      duration: 800,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entry, reducedMotion]);

  return (
    <>
      <StatusBar style="light" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.hero, { minHeight: Math.max(320, height * (short ? 0.54 : 0.58)) }]}>
          <LinearGradient
            colors={[theme.heroStart, theme.heroMiddle, theme.heroEnd]}
            locations={[0, 0.48, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.ambientOne} />
            <View style={styles.ambientTwo} />
            {layers.map((layer, index) => (
              <FloatingGrain key={index} layer={layer} reducedMotion={reducedMotion} />
            ))}
            <View style={styles.blurBeanOne} />
            <View style={styles.blurBeanTwo} />
          </View>
          <View style={[styles.heroHeader, { paddingTop: Math.max(28, insets.top + 12) }]}>
            <AppText style={styles.logo} accessibilityLabel={welcomeContent.brand}>
              {welcomeContent.brand}
              <AppText style={styles.brandDot}>.</AppText>
            </AppText>
            <View style={styles.locality} accessible accessibilityLabel={welcomeContent.locality}>
              <Image
                source={require('../../../assets/welcome/redesign-map-pin.svg')}
                style={styles.locationIcon}
                accessible={false}
              />
              <AppText style={styles.localityText}>{welcomeContent.locality}</AppText>
            </View>
          </View>
          <AppText style={styles.heroNote}>{welcomeContent.heroNote}</AppText>
        </View>
        <Animated.View
          style={[
            styles.sheet,
            {
              minHeight: height * (short ? 0.52 : 0.48),
              marginTop: -height * (short ? 0.06 : 0.07),
              paddingTop: short ? 14 : 18,
              paddingBottom: Math.max(26, insets.bottom + 12),
              opacity: entry,
              transform: [
                { translateY: entry.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
              ],
            },
          ]}
        >
          <View
            style={[styles.handle, { marginBottom: short ? 12 : 22 }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowRule} />
            <AppText style={styles.eyebrowText}>{welcomeContent.eyebrow}</AppText>
          </View>
          <AppText
            accessibilityRole="header"
            style={[
              styles.title,
              {
                fontSize: short ? 40 : Math.max(40, Math.min(52, width * 0.12)),
                lineHeight: short ? 40 : Math.max(40, Math.min(52, width * 0.12)),
              },
            ]}
          >
            {welcomeContent.titleLines}
          </AppText>
          <AppText style={[styles.detail, short && styles.shortDetail]}>
            {welcomeContent.detail}
          </AppText>
          <Button
            label={welcomeContent.exploreAction}
            size="large"
            style={styles.primaryButton}
            textStyle={styles.primaryText}
            trailingIcon={
              <Image
                source={require('../../../assets/welcome/redesign-arrow.svg')}
                style={styles.arrow}
                accessible={false}
              />
            }
            onPress={() => router.replace('/store')}
          />
          <Button
            label={welcomeContent.accountAction}
            variant="ghost"
            style={styles.accountButton}
            textStyle={styles.accountText}
            onPress={() => router.push('/sign-in')}
          />
        </Animated.View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.surface },
  scrollContent: { flexGrow: 1 },
  hero: { overflow: 'hidden' },
  floatLayer: { position: 'absolute' },
  ambientOne: {
    position: 'absolute',
    top: '18%',
    left: '31%',
    width: 205,
    height: 205,
    borderRadius: 999,
    backgroundColor: 'rgba(255,220,143,0.05)',
  },
  ambientTwo: {
    position: 'absolute',
    right: '-20%',
    bottom: '-8%',
    width: 260,
    height: 260,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,223,169,0.08)',
  },
  blurBeanOne: {
    position: 'absolute',
    top: '9%',
    left: '49%',
    width: 52,
    height: 33,
    borderRadius: 999,
    backgroundColor: '#E3BD71',
    opacity: 0.15,
    filter: [{ blur: 5 }],
  },
  blurBeanTwo: {
    position: 'absolute',
    top: '50%',
    left: '22%',
    width: 38,
    height: 23,
    borderRadius: 999,
    backgroundColor: '#E3BD71',
    opacity: 0.15,
    filter: [{ blur: 5 }],
  },
  heroHeader: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 20,
  },
  logo: {
    color: theme.brand,
    fontFamily: fonts.brandBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    flexShrink: 1,
  },
  brandDot: { color: theme.accent, fontFamily: fonts.brandBold, fontSize: 32 },
  locality: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 10,
    paddingRight: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    backgroundColor: 'rgba(10,42,31,0.28)',
  },
  locationIcon: { width: 17, height: 17 },
  localityText: {
    color: '#FFFDF6',
    fontFamily: theme.semiboldFont,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  heroNote: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    color: 'rgba(255,250,238,0.72)',
    fontFamily: theme.boldFont,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
    transform: [{ rotate: '-4deg' }],
  },
  sheet: {
    flexGrow: 1,
    paddingHorizontal: 28,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    boxShadow: '0 -12px 40px rgba(7,31,23,0.18)',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: theme.handle,
  },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrowRule: { width: 19, height: 1, backgroundColor: '#D2A557' },
  eyebrowText: {
    color: theme.eyebrow,
    fontFamily: theme.boldFont,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: { color: theme.text, fontFamily: fonts.brandBold, letterSpacing: -2, maxWidth: 330 },
  detail: {
    color: theme.textSecondary,
    fontFamily: theme.regularFont,
    fontSize: 15,
    lineHeight: 23.25,
    maxWidth: 310,
    marginTop: 15,
    marginBottom: 22,
  },
  shortDetail: { marginTop: 10, marginBottom: 16 },
  primaryButton: {
    minHeight: 58,
    backgroundColor: theme.primary,
    boxShadow: '0 10px 24px rgba(28,87,63,0.2)',
  },
  primaryText: { color: theme.onPrimary, fontFamily: theme.boldFont, fontSize: 16 },
  arrow: { width: 19, height: 19 },
  accountButton: { alignSelf: 'center', marginTop: 17, paddingHorizontal: 14, paddingVertical: 8 },
  accountText: { color: theme.primary, fontFamily: theme.boldFont, fontSize: 14 },
});
