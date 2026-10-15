import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '@/components/AppText';
import { ProductCover } from './ProductCover';
import { colors, fonts, layout, spacing } from '@/theme/tokens';
import type { CartAddOrigin } from '../cart-feedback/CartFeedbackProvider';
import type { CatalogItem } from '@/types/catalog';
import { formatSoles } from './formatPrice';

type Props = {
  product: CatalogItem;
  onAdd?: (product: CatalogItem, origin?: CartAddOrigin) => Promise<boolean>;
  reducedMotion?: boolean;
  onOpen?: () => void;
  variant?: 'grid' | 'rail';
  appearance?: 'default' | 'store';
};

export function ProductTile({
  product,
  onAdd,
  onOpen,
  variant = 'grid',
  appearance = 'default',
  reducedMotion = true,
}: Props) {
  const photo = useRef<View>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lift] = useState(() => new Animated.Value(0));
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (reset.current) clearTimeout(reset.current);
      lift.stopAnimation();
    };
  }, [lift]);
  const add = async () => {
    if (!onAdd || pending.current || product.availableQuantity <= 0) return;
    pending.current = true;
    setAdding(true);
    try {
      const origin = await new Promise<CartAddOrigin | undefined>((resolve) => {
        if (photo.current)
          photo.current.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
        else resolve(undefined);
      });
      const success = await onAdd(product, origin);
      if (!mounted.current) return;
      if (success) {
        setAdded(true);
        lift.setValue(0);
        if (!reducedMotion)
          Animated.sequence([
            Animated.timing(lift, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(lift, { toValue: 0, duration: 520, useNativeDriver: true }),
          ]).start();
        reset.current = setTimeout(
          () => {
            if (mounted.current) {
              setAdded(false);
              setAdding(false);
            }
            pending.current = false;
          },
          reducedMotion ? 700 : 1460,
        );
      } else {
        setAdding(false);
        pending.current = false;
      }
    } catch {
      if (mounted.current) setAdding(false);
      pending.current = false;
    }
  };
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.1;
  const inStock = product.availableQuantity > 0;
  const compact = appearance === 'store';
  const stockChip = (
    <View style={[styles.chip, !inStock && styles.chipMuted, compact && styles.overlayChip]}>
      <AppText style={[styles.chipText, !inStock && styles.chipTextMuted]}>
        {inStock ? 'Disponible' : 'Sin stock'}
      </AppText>
    </View>
  );
  const body = (
    <>
      <View
        ref={photo}
        collapsable={false}
        style={[styles.photoWrap, compact && styles.storePhoto]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
              ],
            },
          ]}
        >
          <ProductCover product={product} style={styles.photoFill} />
        </Animated.View>
        {compact && stockChip}
      </View>
      <AppText
        style={[styles.name, compact && styles.storeName]}
        numberOfLines={largeText ? undefined : 2}
      >
        {product.name}
      </AppText>
      <View style={styles.metaRow}>
        <AppText style={styles.presentation} numberOfLines={largeText ? undefined : 1}>
          {product.presentation}
        </AppText>
      </View>
      {(!compact || product.imageIsReference) && (
        <View style={styles.chipRow}>
          {!compact && stockChip}
          {product.imageIsReference && (
            <View style={styles.chipOutline}>
              <AppText style={styles.chipOutlineText}>Foto referencial</AppText>
            </View>
          )}
        </View>
      )}
      <View style={styles.priceRow}>
        <AppText style={styles.price}>{formatSoles(product.priceCents)}</AppText>
        {onAdd && (
          <Pressable
            disabled={!inStock}
            onPress={(event) => {
              event.stopPropagation();
              void add();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Añadir ${product.name}`}
            accessibilityState={{ disabled: !inStock || adding, busy: adding && !added }}
            style={({ pressed }) => [
              styles.addButton,
              (pressed || !inStock) && styles.addButtonDisabled,
            ]}
          >
            <View style={[styles.addButtonFace, added && styles.addButtonAdded]}>
              {added ? (
                <View style={styles.checkMark} />
              ) : (
                <>
                  <View style={styles.plusHorizontal} />
                  <View style={styles.plusVertical} />
                </>
              )}
            </View>
          </Pressable>
        )}
      </View>
    </>
  );
  if (!onOpen) {
    return (
      <View
        style={[
          styles.tile,
          compact && styles.storeTile,
          largeText && variant === 'grid' && { width: '100%' },
          variant === 'rail' && [styles.tileRail, { width: 160 * Math.max(1, fontScale) }],
        ]}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${product.name}`}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.tile,
        compact && styles.storeTile,
        largeText && variant === 'grid' && { width: '100%' },
        variant === 'rail' && [styles.tileRail, { width: 160 * Math.max(1, fontScale) }],
        pressed && styles.tilePressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: '48%', minWidth: 0 },
  storeTile: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E4E9DF',
    borderRadius: 16,
    backgroundColor: '#FFFEFA',
  },
  tileRail: { width: 148 },
  tilePressed: { opacity: 0.8 },
  photoWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoFill: { borderRadius: 14 },
  storePhoto: { aspectRatio: undefined, height: 126, borderRadius: 12 },
  storeName: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, marginTop: 8 },
  overlayChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  name: { marginTop: 6, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  metaRow: { marginTop: spacing.xs },
  presentation: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipMuted: { backgroundColor: colors.surfaceMuted },
  chipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  chipTextMuted: { color: colors.textSecondary },
  chipOutline: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipOutlineText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  priceRow: {
    marginTop: 3,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  addButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: layout.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonFace: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    width: 14,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '-45deg' }],
    marginTop: -3,
  },
  addButtonAdded: { backgroundColor: colors.surfaceSuccess },
  addButtonDisabled: { opacity: 0.45 },
  plusHorizontal: {
    position: 'absolute',
    width: 12,
    height: 1.8,
    backgroundColor: colors.onPrimary,
  },
  plusVertical: { position: 'absolute', width: 1.8, height: 12, backgroundColor: colors.onPrimary },
});
