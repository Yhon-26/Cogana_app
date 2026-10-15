import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import type { AsyncState } from '@/types/async-state';
import type { CatalogItem } from '@/types/catalog';
import { ProductCover } from './ProductCover';
import { ProductTile } from './ProductTile';
import { formatSoles } from './formatPrice';
import { useCheckoutDraft } from '../checkout/CheckoutDraftContext';
import { parseBulkRequest, quoteBulk, type BulkRequest } from '@/services/customer/cart';

const CATALOG_TIMEOUT_MS = 12000;

export function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const [dockHeight, setDockHeight] = useState(112);
  const stackedDock = fontScale > 1.15 || width < 360;
  const photoHeight = Math.min(270, Math.max(180, height * 0.3));
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart, addBulkToCart, cartLines } = useCheckoutDraft();
  const savedBulk = cartLines?.find((line) => line.productId === id)?.bulk;
  const [catalog, setCatalog] = useState<AsyncState<readonly CatalogItem[]>>({
    status: 'loading',
  });
  const [quantity, setQuantity] = useState(1);
  const [bulkMode, setBulkMode] = useState<'weight' | 'amount'>(
    savedBulk?.mode === 'money' ? 'amount' : 'weight',
  );
  const [bulkInput, setBulkInput] = useState(
    savedBulk
      ? savedBulk.mode === 'money'
        ? (savedBulk.value / 100).toFixed(2)
        : String(savedBulk.value)
      : '',
  );
  const [adding, setAdding] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setCatalog({ status: 'loading' });
      const timeout = setTimeout(() => {
        if (mounted)
          setCatalog((current) =>
            current.status === 'loading'
              ? {
                  status: 'error',
                  message: 'Tardó demasiado en cargar. Revisa tu conexión e inténtalo de nuevo.',
                }
              : current,
          );
      }, CATALOG_TIMEOUT_MS);
      listCustomerCatalog()
        .then((items) => {
          if (mounted) setCatalog({ status: 'success', data: items });
        })
        .catch(() => {
          if (mounted)
            setCatalog({
              status: 'error',
              message: 'No pudimos cargar el producto. Revisa tu conexión e inténtalo de nuevo.',
            });
        });
      return () => {
        mounted = false;
        clearTimeout(timeout);
      };
      // `attempt` reintenta a propósito aunque no se lea dentro.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt]),
  );

  const product = useMemo(() => {
    if (catalog.status !== 'success') return null;
    return catalog.data.find((item) => item.id === id) ?? null;
  }, [catalog, id]);

  const related = useMemo(() => {
    if (catalog.status !== 'success' || !product) return [];
    return catalog.data.filter(
      (item) => item.category === product.category && item.id !== product.id,
    );
  }, [catalog, product]);

  if (catalog.status === 'loading') {
    return <DetailSkeleton insets={insets} />;
  }

  if (catalog.status === 'error' || !product) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.loadingBack}
          >
            <AppText style={styles.loadingBackText}>‹</AppText>
          </Pressable>
        </View>
        <View style={[styles.center, styles.pad]}>
          <AppText style={styles.centerText}>
            {catalog.status === 'error'
              ? catalog.message
              : 'Este producto ya no está disponible. Vuelve a la tienda para ver el catálogo.'}
          </AppText>
          {catalog.status === 'error' && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setAttempt((value) => value + 1)}
              style={styles.retryButton}
            >
              <AppText style={styles.retryText}>Reintentar</AppText>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.backFallback}
          >
            <AppText style={styles.backFallbackText}>Volver a la tienda</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(product.maxPresentations, q + 1));
  const inStock = product.availableQuantity > 0;
  const canAdd = inStock && quantity > 0 && quantity <= product.maxPresentations && !adding;
  const effectiveBulkMode = !product.allowsQuantity
    ? 'amount'
    : !product.allowsMoney
      ? 'weight'
      : bulkMode;
  let bulkRequest: BulkRequest | null = null;
  let bulkQuote: ReturnType<typeof quoteBulk> | null = null;
  let bulkError = '';
  if (product.soldByWeight && bulkInput.trim()) {
    try {
      bulkRequest = parseBulkRequest(
        effectiveBulkMode === 'weight' ? 'quantity' : 'money',
        bulkInput,
      );
      bulkQuote = quoteBulk(product, bulkRequest);
      if (!bulkQuote.available) bulkError = 'No hay stock suficiente para esa cantidad.';
    } catch (error) {
      bulkError = error instanceof Error ? error.message : 'Revisa la cantidad.';
    }
  }
  const canAddBulk = inStock && Boolean(bulkRequest && bulkQuote?.available && !adding);
  const addBulk = async () => {
    if (!canAddBulk || !bulkRequest) return;
    setAdding(true);
    setCartMessage('');
    try {
      await addBulkToCart(product.id, bulkRequest);
      setCartMessage('Cantidad guardada en el carrito.');
    } catch (error) {
      setCartMessage(error instanceof Error ? error.message : 'No se pudo agregar.');
    } finally {
      setAdding(false);
    }
  };
  const add = async () => {
    if (!canAdd) return;
    setAdding(true);
    setCartMessage('');
    try {
      await addToCart(product.id, quantity);
      setCartMessage('Agregado al carrito.');
    } catch (error) {
      setCartMessage(error instanceof Error ? error.message : 'No se pudo agregar. Reintenta.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: dockHeight + spacing.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.hero,
            { height: insets.top + (product.image ? photoHeight : 140) + spacing.xl },
          ]}
        >
          <View style={[styles.heroImage, { top: insets.top + spacing.lg }]}>
            <ProductCover product={product} large={!product.image} contentFit="contain" />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { top: insets.top + spacing.sm },
              !product.image && { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <AppText
              style={[styles.backChevron, !product.image && styles.backChevronPrimary]}
              accessible={false}
            >
              ‹
            </AppText>
          </Pressable>
        </View>

        {/* Sin foto no hay solapamiento: conservar completo el objetivo de Volver. */}
        <View style={[styles.sheet, !product.image && { marginTop: 0 }]}>
          <AppText style={styles.eyebrow}>{product.categoryName}</AppText>
          <AppText variant="title" style={styles.title} accessibilityRole="header">
            {product.name}
          </AppText>
          <AppText style={styles.presentation}>
            {product.soldByWeight ? 'Elige peso o monto' : product.presentation}
          </AppText>
          <View style={styles.priceRow}>
            <AppText
              style={styles.price}
              accessibilityLabel={`Precio: ${formatSoles(product.soldByWeight ? product.pricePerKgCents! : product.priceCents)}${
                product.soldByWeight ? ' por kilo' : ''
              }`}
            >
              {formatSoles(product.soldByWeight ? product.pricePerKgCents! : product.priceCents)}
            </AppText>
            {product.soldByWeight && <AppText style={styles.priceUnit}>por kilo</AppText>}
          </View>
          <View style={styles.chipRow}>
            <View style={[styles.chip, !inStock && styles.chipMuted]}>
              <AppText style={[styles.chipText, !inStock && styles.chipTextMuted]}>
                {inStock ? 'Disponible' : 'Sin stock'}
              </AppText>
            </View>
            {product.imageIsReference && (
              <View style={styles.chipOutline}>
                <AppText style={styles.chipOutlineText}>Foto referencial</AppText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionGap}>
          {product.soldByWeight ? (
            inStock ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: effectiveBulkMode === 'weight',
                    disabled: !product.allowsQuantity,
                  }}
                  disabled={!product.allowsQuantity || adding}
                  accessibilityLabel="Comprar por peso"
                  onPress={() => {
                    setBulkMode('weight');
                    setBulkInput('');
                  }}
                  style={[
                    styles.bulkCard,
                    effectiveBulkMode === 'weight' && styles.bulkCardSelected,
                  ]}
                >
                  <View style={styles.bulkText}>
                    <AppText style={styles.bulkName}>Por peso</AppText>
                    <AppText style={styles.bulkHint}>Ingresa gramos</AppText>
                  </View>
                  <AppText style={styles.bulkExample}>Ej. 500 g</AppText>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: effectiveBulkMode === 'amount',
                    disabled: !product.allowsMoney,
                  }}
                  disabled={!product.allowsMoney || adding}
                  accessibilityLabel="Comprar por monto"
                  onPress={() => {
                    setBulkMode('amount');
                    setBulkInput('');
                  }}
                  style={[
                    styles.bulkCard,
                    effectiveBulkMode === 'amount' && styles.bulkCardSelected,
                  ]}
                >
                  <View style={styles.bulkText}>
                    <AppText style={styles.bulkName}>Por monto</AppText>
                    <AppText style={styles.bulkHint}>Ingresa soles</AppText>
                  </View>
                  <AppText style={styles.bulkExample}>Ej. S/ 5</AppText>
                </Pressable>

                <View style={styles.card}>
                  <AppText style={styles.cardLabel}>
                    {effectiveBulkMode === 'weight' ? 'Peso en gramos' : 'Monto en soles'}
                  </AppText>
                  <TextInput
                    value={bulkInput}
                    onChangeText={setBulkInput}
                    keyboardType={effectiveBulkMode === 'weight' ? 'number-pad' : 'decimal-pad'}
                    editable={!adding}
                    maxLength={12}
                    placeholder={
                      effectiveBulkMode === 'weight' ? 'Ingresa el peso' : 'Ingresa el monto'
                    }
                    placeholderTextColor={colors.textSecondary}
                    selectionColor={colors.primary}
                    accessibilityLabel={
                      effectiveBulkMode === 'weight' ? 'Peso en gramos' : 'Monto en soles'
                    }
                    style={styles.bulkInput}
                  />
                  <AppText secondary>
                    Mínimo {product.minimumQuantity} g · incrementos de {product.quantityStep} g
                  </AppText>
                  {bulkQuote && (
                    <AppText accessibilityLiveRegion="polite">
                      ≈ {bulkQuote.quantity} g · {formatSoles(bulkQuote.cents)}
                    </AppText>
                  )}
                  {bulkError ? (
                    <AppText accessibilityLiveRegion="polite">{bulkError}</AppText>
                  ) : null}
                </View>

                <View style={styles.noteBar}>
                  <AppText style={styles.noteBarText}>
                    El peso y el importe son estimados. Si ya está en el carrito, esta selección
                    reemplaza su cantidad.
                  </AppText>
                </View>
              </>
            ) : (
              <OutOfStockNotice />
            )
          ) : (
            <>
              {!!product.description?.trim() && (
                <View style={styles.card}>
                  <AppText style={styles.cardLabel}>Descripción</AppText>
                  <AppText style={styles.cardBody}>{product.description}</AppText>
                </View>
              )}
            </>
          )}

          {related.length > 0 && (
            <View>
              <AppText style={styles.relatedTitle} accessibilityRole="header">
                De la misma sección
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
              >
                {related.map((item) => (
                  <ProductTile
                    key={item.id}
                    product={item}
                    variant="rail"
                    onOpen={() =>
                      router.push({ pathname: '/product/[id]', params: { id: item.id } })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
      <View
        onLayout={({ nativeEvent }) => setDockHeight(nativeEvent.layout.height)}
        style={[
          styles.purchaseDock,
          {
            paddingBottom: insets.bottom + spacing.sm,
            paddingLeft: Math.max(insets.left, spacing.md),
            paddingRight: Math.max(insets.right, spacing.md),
          },
        ]}
      >
        <View style={styles.purchaseCard}>
          {product.soldByWeight && bulkQuote && (
            <AppText style={styles.dockMessage}>
              ? {bulkQuote.quantity} g ? {formatSoles(bulkQuote.cents)}
            </AppText>
          )}
          <View style={[styles.purchaseRow, stackedDock && styles.purchaseRowStacked]}>
            {!product.soldByWeight && inStock && (
              <View style={styles.stepperRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quitar una unidad"
                  accessibilityState={{ disabled: quantity <= 1 || adding }}
                  disabled={quantity <= 1 || adding}
                  onPress={decrement}
                  style={[
                    styles.stepperButton,
                    (quantity <= 1 || adding) && styles.stepperButtonDisabled,
                  ]}
                >
                  <View style={[styles.bar, styles.barMuted]} />
                </Pressable>
                <AppText style={styles.quantity} accessibilityLiveRegion="polite">
                  {quantity}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Agregar una unidad"
                  accessibilityState={{ disabled: quantity >= product.maxPresentations || adding }}
                  disabled={quantity >= product.maxPresentations || adding}
                  onPress={increment}
                  style={[
                    styles.stepperButton,
                    styles.stepperIncrease,
                    (quantity >= product.maxPresentations || adding) &&
                      styles.stepperButtonDisabled,
                  ]}
                >
                  <View style={[styles.bar, styles.barLight]} />
                  <View style={[styles.barVertical, styles.barLight]} />
                </Pressable>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                product.soldByWeight ? 'Guardar en carrito' : 'Agregar al carrito'
              }
              accessibilityHint="Guarda la cantidad elegida; no reserva inventario"
              accessibilityState={{
                disabled: !(product.soldByWeight ? canAddBulk : canAdd),
                busy: adding,
              }}
              disabled={!(product.soldByWeight ? canAddBulk : canAdd)}
              onPress={() => void (product.soldByWeight ? addBulk() : add())}
              style={[
                styles.addToCart,
                styles.dockAdd,
                stackedDock && styles.dockAddStacked,
                !(product.soldByWeight ? canAddBulk : canAdd) && styles.addToCartDisabled,
              ]}
            >
              <AppText
                style={[
                  styles.addToCartText,
                  !(product.soldByWeight ? canAddBulk : canAdd) && styles.addToCartTextDisabled,
                ]}
              >
                {adding
                  ? product.soldByWeight
                    ? 'Guardando?'
                    : 'Agregando?'
                  : !inStock || (!product.soldByWeight && product.maxPresentations === 0)
                    ? 'Sin stock'
                    : product.soldByWeight
                      ? 'Guardar en carrito'
                      : 'Agregar al carrito'}
              </AppText>
            </Pressable>
          </View>
          {cartMessage ? (
            <AppText style={styles.dockMessage} accessibilityLiveRegion="polite">
              {cartMessage}
            </AppText>
          ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estado sin stock: una sola señal, sin stepper ni selector que confundan.
function OutOfStockNotice() {
  return (
    <View style={styles.outOfStock}>
      <AppText style={styles.outOfStockTitle}>Sin stock por ahora</AppText>
      <AppText style={styles.outOfStockBody}>
        Cuando la tienda repose este producto, podrás elegir cantidad aquí.
      </AppText>
    </View>
  );
}

// Carga: barra de regreso siempre visible + esqueleto; nunca una trampa sin salida.
function DetailSkeleton({ insets }: { insets: { top: number } }) {
  const pulse = useMemo(() => new Animated.Value(0.45), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.screen}>
      <View style={[styles.loadingBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.loadingBack}
        >
          <AppText style={styles.loadingBackText}>‹</AppText>
        </Pressable>
      </View>
      <View style={styles.loadingBody}>
        <Animated.View style={[styles.skeletonHero, { opacity: pulse }]} />
        <Animated.View style={[styles.skeletonLine, { opacity: pulse }]} />
        <Animated.View
          style={[styles.skeletonLine, styles.skeletonLineShort, { opacity: pulse }]}
        />
        <Animated.View style={[styles.skeletonCard, { opacity: pulse }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  centerText: { textAlign: 'center' },
  pad: { padding: spacing.page },
  loadingBar: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.sm,
  },
  loadingBack: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  loadingBackText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 26,
    lineHeight: 32,
  },
  loadingBody: {
    flex: 1,
    padding: spacing.page,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  skeletonHero: {
    height: 220,
    borderRadius: radii.surface,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonLine: {
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.lg,
  },
  skeletonLineShort: { width: '55%' },
  skeletonCard: {
    height: 120,
    borderRadius: radii.surface,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.xl,
  },
  retryButton: {
    minHeight: layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  backFallback: {
    minHeight: layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backFallbackText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 15 },
  hero: { width: '100%', backgroundColor: colors.surface },
  heroImage: { position: 'absolute', left: spacing.page, right: spacing.page, bottom: spacing.xl },
  backButton: {
    position: 'absolute',
    left: spacing.page,
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: layout.touchTarget / 2,
    backgroundColor: 'rgba(27,36,30,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 30,
  },
  backChevronPrimary: { color: colors.primary },
  sheet: {
    backgroundColor: colors.surface,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { fontSize: 28, lineHeight: 34, marginTop: spacing.sm },
  presentation: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },
  price: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 30,
    lineHeight: 36,
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
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
  outOfStock: {
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    width: '100%',
  },
  outOfStockTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  outOfStockBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  sectionGap: {
    gap: spacing.lg,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.section,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
  },
  cardLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  cardBody: { fontSize: 15, lineHeight: 22 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    borderRadius: 999,
    backgroundColor: colors.surfaceSuccess,
    alignSelf: 'center',
  },
  stepperButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: layout.touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperIncrease: { backgroundColor: colors.primary },
  stepperButtonDisabled: { opacity: 0.4 },
  bar: { width: 14, height: 1.8, backgroundColor: colors.text },
  barMuted: { backgroundColor: colors.textSecondary },
  barVertical: {
    position: 'absolute',
    width: 1.8,
    height: 14,
    backgroundColor: colors.primary,
  },
  barLight: { backgroundColor: colors.onPrimary },
  quantity: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    minWidth: 28,
    textAlign: 'center',
  },
  purchaseDock: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: spacing.md },
  purchaseCard: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: 24,
    backgroundColor: colors.surface,
    elevation: 8,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 12,
  },
  purchaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  purchaseRowStacked: { flexDirection: 'column', alignItems: 'stretch' },
  dockAdd: { flex: 1, minWidth: 0, paddingHorizontal: spacing.md },
  dockAddStacked: { flex: 0, width: '100%' },
  dockMessage: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  addToCart: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  addToCartDisabled: { backgroundColor: '#E4E8E3' },
  addToCartText: {
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  addToCartTextDisabled: { color: colors.textSecondary },
  relatedTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  rail: { gap: spacing.md, paddingRight: spacing.page },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  priceUnit: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  bulkCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bulkCardSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  bulkText: { flex: 1, gap: 2 },
  bulkName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  bulkHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  bulkExample: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
  },
  bulkInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  noteBar: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: radii.control,
    minHeight: layout.touchTarget - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  noteBarText: { color: colors.primary, fontSize: 12, lineHeight: 17 },
});
