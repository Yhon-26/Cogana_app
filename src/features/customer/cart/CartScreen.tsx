import { resolveCartLine } from '@/services/customer/cart';
import { useCallback, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { useFocusEffect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { ProductCover } from '../products/ProductCover';
import { Button } from '@/components/Button';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { colors, fonts, layout, spacing } from '@/theme/tokens';
import type { CatalogItem } from '@/types/catalog';
import { formatSoles } from '../products/formatPrice';
import { cartContent } from './cartContent';
import { useCheckoutDraft } from '../checkout/CheckoutDraftContext';

const trashIcon = require('../../../assets/cart/trash.svg');
type CartLine = { product: CatalogItem; quantity: number; bulk: boolean };

function QuantityControl({
  name,
  quantity,
  maxQuantity,
  onDecrease,
  onIncrease,
}: {
  name: string;
  quantity: number;
  maxQuantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Quitar una unidad de ${name}`}
        onPress={onDecrease}
        style={styles.stepperAction}
      >
        <View style={styles.minus} />
      </Pressable>
      <AppText style={styles.quantity} accessibilityLiveRegion="polite">
        {quantity}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Agregar una unidad de ${name}`}
        accessibilityState={{ disabled: quantity >= maxQuantity }}
        disabled={quantity >= maxQuantity}
        onPress={onIncrease}
        style={styles.stepperAction}
      >
        <View style={styles.minus} />
        <View style={styles.plusVertical} />
      </Pressable>
    </View>
  );
}

function CartProductCard({
  line,
  onChange,
  onRemove,
}: {
  line: CartLine;
  onChange: (amount: number) => void;
  onRemove: () => void;
}) {
  const { product, quantity } = line;
  return (
    <View style={styles.productCard}>
      <View style={styles.productImageWrap}>
        <ProductCover product={product} style={styles.productImage} />
      </View>
      <View style={styles.productCopy}>
        <View style={styles.productHeading}>
          <AppText style={styles.productName}>{product.name}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${product.name} del carrito`}
            onPress={onRemove}
            style={styles.remove}
          >
            <Image source={trashIcon} style={styles.trashIcon} accessible={false} />
          </Pressable>
        </View>
        {product.presentation.trim().toLocaleLowerCase() !==
          product.name.trim().toLocaleLowerCase() && (
          <AppText style={styles.presentation}>{product.presentation}</AppText>
        )}
        <View style={styles.productBottom}>
          <AppText style={styles.itemPrice}>{formatSoles(product.priceCents)}</AppText>
          {line.bulk ? (
            <Button
              label="Editar cantidad"
              variant="ghost"
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
            />
          ) : (
            <QuantityControl
              name={product.name}
              quantity={quantity}
              maxQuantity={product.maxPresentations}
              onDecrease={() => onChange(quantity - 1)}
              onIncrease={() => onChange(quantity + 1)}
            />
          )}
        </View>
        {quantity > product.maxPresentations && <AppText secondary>Stock insuficiente</AppText>}
      </View>
    </View>
  );
}

export function CartScreen() {
  const [catalog, setCatalog] = useState<readonly CatalogItem[] | null>(null);
  const { cartLines: lines, setCartLines: setLines, cartError } = useCheckoutDraft();
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listCustomerCatalog()
        .then((items) => {
          if (!active) return;
          setCatalog(items);
        })
        .catch(() => {
          if (active) setError(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const cartLines = useMemo<CartLine[]>(() => {
    if (!catalog || !lines) return [];
    return lines.flatMap((line) => {
      const product = catalog.find((item) => item.id === line.productId);
      return product ? [resolveCartLine(product, line)] : [];
    });
  }, [catalog, lines]);
  const subtotalCents = cartLines.reduce(
    (sum, line) => sum + line.product.priceCents * line.quantity,
    0,
  );
  const count = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const suggestion = catalog?.find(
    (product) =>
      product.maxPresentations > 0 && !lines?.some((line) => line.productId === product.id),
  );

  // El carrito persiste los cambios; el servidor confirma precio y stock al comprar.
  const updateQuantity = (id: string, next: number) => {
    setLines(
      (current) =>
        current?.flatMap((line) =>
          line.productId === id
            ? next < 1
              ? []
              : [{ ...line, quantity: Math.min(99, next) }]
            : [line],
        ) ?? [],
    );
  };

  if (error || cartError)
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'left', 'right']}>
        <AppText>No pudimos cargar el carrito. Vuelve a abrir esta pantalla.</AppText>
      </SafeAreaView>
    );
  if (!catalog || !lines)
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText style={styles.title} accessibilityRole="header">
          {cartContent.title}
        </AppText>
        <AppText style={styles.count}>
          {count} {count === 1 ? 'artículo' : 'artículos'}
        </AppText>
      </View>

      {lines.length > cartLines.length && (
        <View style={styles.content}>
          <AppText>Hay productos que ya no están publicados. Retíralos para continuar.</AppText>
          <Button
            label="Retirar productos no disponibles"
            variant="secondary"
            onPress={() =>
              setLines(
                lines.filter((line) => catalog.some((product) => product.id === line.productId)),
              )
            }
          />
        </View>
      )}
      {cartLines.length === 0 ? (
        <View style={styles.emptyBlock}>
          <AppText style={styles.emptyTitle}>{cartContent.emptyTitle}</AppText>
          <AppText secondary style={styles.emptySubtitle}>
            {cartContent.emptySubtitle}
          </AppText>
          <View style={styles.emptyActions}>
            <Button
              label={cartContent.explore}
              size="large"
              onPress={() => router.navigate('/store')}
            />
            <Button
              label={cartContent.seeCategories}
              variant="secondary"
              size="large"
              onPress={() => router.navigate('/categories')}
            />
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <AppText style={styles.previewLabel}>{cartContent.preview}</AppText>
              <View style={styles.productList}>
                {cartLines.map((line) => (
                  <CartProductCard
                    key={line.product.id}
                    line={line}
                    onChange={(next) => updateQuantity(line.product.id, next)}
                    onRemove={() => updateQuantity(line.product.id, 0)}
                  />
                ))}
              </View>
              {suggestion && (
                <View style={styles.suggestionSection}>
                  <AppText style={styles.suggestionTitle} accessibilityRole="header">
                    {cartContent.suggestions}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${suggestion.name}, ${suggestion.presentation}`}
                    onPress={() =>
                      router.push({ pathname: '/product/[id]', params: { id: suggestion.id } })
                    }
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                  >
                    <Image
                      source={suggestion.image}
                      contentFit="cover"
                      style={styles.suggestionImage}
                      accessible={false}
                    />
                    <View style={styles.suggestionCopy}>
                      <AppText style={styles.suggestionName}>{suggestion.name}</AppText>
                      <AppText style={styles.suggestionDetail}>
                        {suggestion.presentation} · {formatSoles(suggestion.priceCents)}
                      </AppText>
                    </View>
                    <View style={styles.chevron} />
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.summary}>
            <View style={styles.summaryInner}>
              <View style={styles.summaryRow}>
                <AppText style={styles.totalLabel}>{cartContent.total}</AppText>
                <AppText style={styles.totalValue}>{formatSoles(subtotalCents)}</AppText>
              </View>
              <AppText style={styles.summaryHint}>Entrega y pago se eligen al continuar.</AppText>
              <Button
                label={cartContent.checkout}
                disabled={
                  lines.length !== cartLines.length ||
                  cartLines.some((line) => line.quantity > line.product.maxPresentations)
                }
                size="form"
                onPress={() => router.push('/checkout')}
              />
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.page },
  header: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: { fontFamily: fonts.brandBold, fontSize: 26, lineHeight: 34 },
  count: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  scroll: { paddingBottom: spacing.xl },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.page,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  productList: { gap: 0 },
  productCard: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  productImageWrap: {
    width: 72,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  productImage: { width: 72, height: 88, borderRadius: 12 },
  productCopy: { flex: 1, minWidth: 0 },
  productHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  productName: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  presentation: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  productBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  itemPrice: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  remove: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.sm,
    marginRight: -spacing.sm,
  },
  trashIcon: { width: 18, height: 18 },
  stepper: {
    height: 48,
    width: 124,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E7F0EA',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D4E1D9',
  },
  stepperAction: {
    width: 48,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minus: { width: 10, height: 1.5, backgroundColor: colors.primary },
  plusVertical: { position: 'absolute', width: 1.5, height: 10, backgroundColor: colors.primary },
  quantity: {
    minWidth: 18,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionSection: { marginTop: spacing.xxl },
  suggestionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    marginBottom: spacing.md,
  },
  suggestion: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  suggestionImage: { width: 68, height: 68, borderRadius: 10 },
  suggestionCopy: { flex: 1, gap: spacing.xs },
  suggestionName: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  suggestionDetail: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  chevron: {
    width: 9,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '-45deg' }],
    marginRight: spacing.xs,
  },
  pressed: { opacity: 0.75 },
  summary: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  summaryInner: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  summaryHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  summaryRow: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  totalValue: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 18, lineHeight: 23 },
  emptyBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  emptyTitle: { fontFamily: fonts.brandBold, fontSize: 27, lineHeight: 34 },
  emptySubtitle: { fontSize: 15, lineHeight: 21 },
  emptyActions: { marginTop: spacing.xl, gap: spacing.md },
});
