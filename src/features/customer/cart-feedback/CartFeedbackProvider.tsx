import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { formatSoles } from '../products/formatPrice';
import { colors, fonts, layout } from '@/theme/tokens';
import type { CatalogItem } from '@/types/catalog';

export type CartAddOrigin = { x: number; y: number; width: number; height: number };
type Feedback = {
  id: number;
  product: CatalogItem;
  origin?: CartAddOrigin;
  target?: CartAddOrigin;
  rootX: number;
  rootY: number;
};
type FeedbackContext = {
  cartTarget: React.RefObject<View | null>;
  pulse: Animated.Value;
  reducedMotion: boolean;
  showAdded: (product: CatalogItem, origin?: CartAddOrigin) => void;
};
const CartFeedbackContext = createContext<FeedbackContext | null>(null);
const checkIcon = require('../../../assets/navigation/check.svg');

// Visual feedback follows a successful cart mutation; it never changes quantity or stock.
export function CartFeedbackProvider({ children }: { children: ReactNode }) {
  const root = useRef<View>(null);
  const cartTarget = useRef<View>(null);
  const nextId = useRef(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [flying, setFlying] = useState(false);
  const [imageReadyId, setImageReadyId] = useState(0);
  const [notice, setNotice] = useState<CatalogItem | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [progress] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));
  const [reveal] = useState(() => new Animated.Value(0));
  const [lifetime] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    let changed = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !changed) setReducedMotion(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      if (active) setReducedMotion(value);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const showAdded = useCallback(
    (product: CatalogItem, origin?: CartAddOrigin) => {
      const id = ++nextId.current;
      const apply = (target?: CartAddOrigin) => {
        const finish = (rootX = 0, rootY = 0) => {
          if (id !== nextId.current) return;
          progress.setValue(0);
          setFlying(!reducedMotion && Boolean(origin && target && target.width > 0));
          setNotice(null);
          setFeedback({ id, product, origin, target, rootX, rootY });
        };
        if (root.current) root.current.measureInWindow((x, y) => finish(x, y));
        else finish();
      };
      if (cartTarget.current)
        cartTarget.current.measureInWindow((x, y, width, height) => apply({ x, y, width, height }));
      else apply();
      AccessibilityInfo.announceForAccessibility('Producto agregado al carrito.');
    },
    [progress, reducedMotion],
  );

  useEffect(() => {
    if (!feedback) return;
    if (!reducedMotion && feedback.product.image && imageReadyId !== feedback.id) {
      const fallback = setTimeout(() => setImageReadyId(feedback.id), 1200);
      return () => clearTimeout(fallback);
    }
    const arrive = () => {
      setFlying(false);
      setNotice(feedback.product);
      reveal.setValue(0);
      lifetime.setValue(0);
      pulse.setValue(reducedMotion ? 1 : 0);
      Animated.parallel([
        Animated.timing(reveal, {
          toValue: 1,
          duration: reducedMotion ? 100 : 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        ...(!reducedMotion
          ? [
              Animated.timing(pulse, {
                toValue: 1,
                duration: 600,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
            ]
          : []),
      ]).start();
      Animated.timing(lifetime, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished)
          Animated.timing(reveal, { toValue: 0, duration: 150, useNativeDriver: true }).start(
            ({ finished: hidden }) => {
              if (hidden) setNotice(null);
            },
          );
      });
    };
    if (reducedMotion || !feedback.origin || !feedback.target || feedback.target.width <= 0) {
      Animated.timing(progress, { toValue: 1, duration: 0, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) arrive();
        },
      );
    } else {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 760,
        easing: Easing.bezier(0.4, 0.05, 0.6, 0.95),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) arrive();
      });
    }
    return () => {
      progress.stopAnimation();
      pulse.stopAnimation();
      reveal.stopAnimation();
      lifetime.stopAnimation();
    };
  }, [feedback, imageReadyId, reducedMotion, progress, pulse, reveal, lifetime]);

  const value = useMemo(
    () => ({ cartTarget, pulse, reducedMotion, showAdded }),
    [pulse, reducedMotion, showAdded],
  );
  const start = feedback?.origin;
  const target = feedback?.target;
  const dx = start && target ? target.x + target.width / 2 - start.x - start.width / 2 : 0;
  const dy = start && target ? target.y + target.height / 2 - start.y - start.height / 2 : 0;
  const dismiss = () => {
    nextId.current += 1;
    setFeedback(null);
    setNotice(null);
    setFlying(false);
    pulse.setValue(1);
  };
  return (
    <CartFeedbackContext.Provider value={value}>
      <View ref={root} collapsable={false} style={styles.root}>
        {children}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {flying && feedback && start && target && (
            <Animated.View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.flying,
                {
                  left: start.x + start.width / 2 - feedback.rootX - 27.5,
                  top: start.y + start.height / 2 - feedback.rootY - 38,
                  opacity: progress.interpolate({
                    inputRange: [0, 0.12, 0.8, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [0, dx * 0.25, dx],
                      }),
                    },
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [0, -100 + dy * 0.1, dy],
                      }),
                    },
                    {
                      scale: progress.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: [1.15, 1.05, 0.18],
                      }),
                    },
                    {
                      rotate: progress.interpolate({
                        inputRange: [0, 0.35, 1],
                        outputRange: ['-7deg', '8deg', '-12deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.thumbnail}>
                {feedback.product.image ? (
                  <Image
                    source={feedback.product.image ?? undefined}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    onLoad={() => setImageReadyId(feedback.id)}
                    onError={() => setImageReadyId(feedback.id)}
                    accessible={false}
                  />
                ) : (
                  <AppText style={{ color: colors.primary, fontSize: 24 }}>
                    {feedback.product.name.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
            </Animated.View>
          )}
          {notice && (
            <Animated.View
              style={[
                styles.notice,
                {
                  bottom: insets.bottom + layout.tabHeight + 12,
                  opacity: reveal,
                  transform: [
                    {
                      translateY: reveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [reducedMotion ? 0 : 16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.check}>
                <Image source={checkIcon} style={styles.checkImage} accessible={false} />
              </View>
              <View style={styles.copy}>
                <AppText style={styles.title}>Producto agregado</AppText>
                <AppText style={styles.caption}>
                  {formatSoles(notice.priceCents)} por unidad
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  dismiss();
                  router.navigate('/cart');
                }}
                style={styles.action}
              >
                <AppText style={styles.actionText}>Ver carrito</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar confirmación"
                onPress={dismiss}
                style={styles.close}
              >
                <Image
                  source={require('../../../assets/navigation/close.svg')}
                  style={styles.checkImage}
                  accessible={false}
                />
              </Pressable>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.timer,
                  {
                    transform: [
                      { scaleX: lifetime.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
                    ],
                  },
                ]}
              />
            </Animated.View>
          )}
        </View>
      </View>
    </CartFeedbackContext.Provider>
  );
}

export function useCartFeedback() {
  const value = useContext(CartFeedbackContext);
  if (!value) throw new Error('CartFeedbackProvider is required.');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flying: {
    position: 'absolute',
    width: 55,
    height: 76,
    padding: 7,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  thumbnail: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  notice: {
    position: 'absolute',
    left: 12,
    right: 12,
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 2,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.text,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSuccess,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkImage: { width: 18, height: 18 },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17 },
  caption: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  actionText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: colors.primary },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  timer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#A9C68A',
    transformOrigin: 'left center',
  },
});
