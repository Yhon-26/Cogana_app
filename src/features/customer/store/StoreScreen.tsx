import { useCallback, useMemo, useRef, useState } from 'react';
import { useCartFeedback, type CartAddOrigin } from '../cart-feedback/CartFeedbackProvider';
import { useCheckoutDraft } from '../checkout/CheckoutDraftContext';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { AppText } from '@/components/AppText';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { colors, fonts, layout, spacing } from '@/theme/tokens';
import type { AsyncState } from '@/types/async-state';
import type { CatalogItem } from '@/types/catalog';
import { ProductTile } from '../products/ProductTile';
import { storeCategories, storeContent } from './storeContent';
import { PantryBannerArt } from './PantryBannerArt';

const searchIcon = require('../../../assets/store/redesign/search.svg');
const categoryArt = {
  arroces: require('../../../assets/store/redesign/grains.svg'),
  'menestras-granos': require('../../../assets/store/redesign/grains.svg'),
  aceites: require('../../../assets/store/redesign/oil.svg'),
} as const;
const filters = [
  { label: 'Para tu despensa', key: null },
  { label: 'Arroces', key: 'arroces' },
  { label: 'Menestras', key: 'menestras-granos' },
] as const;

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </AppText>
      <Pressable
        onPress={() => router.navigate('/categories')}
        accessibilityRole="link"
        style={styles.sectionActionHit}
      >
        <AppText style={styles.sectionAction}>{action}</AppText>
      </Pressable>
    </View>
  );
}

export function StoreScreen() {
  const { addToCart } = useCheckoutDraft();
  const adding = useRef(false);
  const { showAdded, reducedMotion } = useCartFeedback();
  const [cartError, setCartError] = useState('');
  const add = async (product: CatalogItem, origin?: CartAddOrigin) => {
    if (!product.isSealed) {
      router.push({ pathname: '/product/[id]', params: { id: product.id } });
      return false;
    }
    if (adding.current) return false;
    adding.current = true;
    setCartError('');
    try {
      await addToCart(product.id, 1);
      showAdded(product, origin);
      return true;
    } catch (failure) {
      setCartError(failure instanceof Error ? failure.message : 'No pudimos agregar el producto.');
      return false;
    } finally {
      adding.current = false;
    }
  };
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.1;
  const [catalog, setCatalog] = useState<AsyncState<readonly CatalogItem[]>>({
    status: 'loading',
  });
  const [category, setCategory] = useState<CatalogItem['category'] | null>(null);
  // La pantalla de categorías llega con ?categoria= para pre-filtrar el catálogo de la base.
  // El parámetro se aplica ajustando el estado durante el render (sin effects).
  const { categoria } = useLocalSearchParams<{ categoria?: string }>();
  const paramCategory = typeof categoria === 'string' ? categoria : null;
  const [lastParamCategory, setLastParamCategory] = useState(paramCategory);
  if (paramCategory !== lastParamCategory) {
    setLastParamCategory(paramCategory);
    setCategory(paramCategory);
  }

  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      if (retry > 0) setCatalog({ status: 'loading' });
      listCustomerCatalog()
        .then((items) => {
          if (mounted) setCatalog({ status: 'success', data: items });
        })
        .catch(() => {
          if (mounted) setCatalog({ status: 'error', message: storeContent.catalogError });
        });
      return () => {
        mounted = false;
      };
    }, [retry]),
  );

  const products = useMemo(() => {
    if (catalog.status !== 'success') return [];
    if (category) return catalog.data.filter((item) => item.category === category);
    return catalog.data;
  }, [catalog, category]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.locality} accessible accessibilityLabel={storeContent.locality}>
              <View style={styles.localityLabelRow}>
                <Image
                  source={require('../../../assets/store/redesign/pin.svg')}
                  style={styles.pinIcon}
                  accessible={false}
                />
                <AppText style={styles.localityLabel}>{storeContent.localityLabel}</AppText>
              </View>
              <AppText style={styles.localityText}>{storeContent.locality}</AppText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar productos"
            onPress={() => router.push('/search')}
            style={({ pressed }) => [styles.search, pressed && styles.searchPressed]}
          >
            <Image source={searchIcon} style={styles.searchIcon} accessible={false} />
            <AppText style={styles.searchPlaceholder}>{storeContent.searchPlaceholder}</AppText>
          </Pressable>

          <View style={styles.deliveryStrip}>
            <View style={styles.deliveryDot} />
            <AppText style={styles.deliveryText}>{storeContent.fulfillmentLabel}</AppText>
            <Pressable
              onPress={() => router.push('/schedule')}
              accessibilityRole="link"
              style={styles.hoursHit}
            >
              <AppText style={styles.hoursText}>{storeContent.hoursAction}</AppText>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.navigate('/categories')}
            accessibilityRole="link"
            accessibilityLabel={`${storeContent.bannerTitle}. ${storeContent.bannerAction}`}
            style={[styles.banner, { minHeight: Math.max(144, 144 * fontScale) }]}
          >
            <Image
              source={require('../../../assets/store/redesign/banner-pattern.svg')}
              contentFit="fill"
              style={[StyleSheet.absoluteFill, styles.pattern]}
              accessible={false}
            />
            <PantryBannerArt />
            <View style={styles.bannerCopy}>
              <AppText style={styles.bannerEyebrow}>{storeContent.bannerEyebrow}</AppText>
              <View style={styles.bannerTitleWrap}>
                <AppText style={styles.bannerTitle}>{'Básicos de\ncasa'}</AppText>
                <View style={styles.bannerUnderline} />
              </View>
              <AppText style={styles.bannerAction}>{storeContent.bannerAction}</AppText>
            </View>
          </Pressable>

          <View style={styles.categoriesSection}>
            <SectionHeader
              title={storeContent.categoryTitle}
              action={storeContent.categoryAction}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              {storeCategories.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setCategory((current) => (current === item.key ? null : item.key))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === item.key }}
                  style={({ pressed }) => [styles.categoryHit, pressed && styles.searchPressed]}
                >
                  <View style={[styles.category, category === item.key && styles.categorySelected]}>
                    <Image
                      source={categoryArt[item.key]}
                      contentFit="contain"
                      style={styles.categoryIcon}
                      accessible={false}
                    />
                  </View>
                  <AppText
                    style={[
                      styles.categoryText,
                      category === item.key && styles.categoryTextSelected,
                    ]}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.productsSection}>
            <SectionHeader
              title={storeContent.productsTitle}
              action={storeContent.productsAction}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {filters.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === item.key }}
                  onPress={() => setCategory(item.key)}
                  style={styles.filterHit}
                >
                  <View style={[styles.filter, category === item.key && styles.filterSelected]}>
                    <AppText
                      style={[
                        styles.filterText,
                        category === item.key && styles.filterTextSelected,
                      ]}
                    >
                      {item.label}
                    </AppText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            {cartError && (
              <AppText accessibilityLiveRegion="polite" style={{ paddingVertical: spacing.md }}>
                {cartError}
              </AppText>
            )}
            {catalog.status === 'success' && products.length > 0 ? (
              <View style={[styles.productGrid, largeText && styles.productGridLarge]}>
                {products.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    appearance="store"
                    onAdd={add}
                    reducedMotion={reducedMotion}
                    onOpen={() =>
                      router.push({ pathname: '/product/[id]', params: { id: product.id } })
                    }
                  />
                ))}
              </View>
            ) : (
              <View style={styles.catalogState} accessibilityLiveRegion="polite">
                {catalog.status === 'loading' && <ActivityIndicator color={colors.primary} />}
                <AppText style={styles.stateText}>
                  {catalog.status === 'error'
                    ? catalog.message
                    : catalog.status === 'loading'
                      ? 'Cargando productos…'
                      : storeContent.noCategoryItems}
                </AppText>
                {catalog.status === 'error' && (
                  <Button
                    label="Reintentar"
                    variant="secondary"
                    onPress={() => {
                      setCatalog({ status: 'loading' });
                      setRetry((value) => value + 1);
                    }}
                  />
                )}
                {catalog.status === 'success' && category && (
                  <Button
                    label="Ver todos los productos"
                    variant="ghost"
                    onPress={() => setCategory(null)}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.page, paddingTop: 18, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center' },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  locality: { gap: 2, flexShrink: 1 },
  localityLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinIcon: { width: 14, height: 14 },
  localityLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  localityText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, lineHeight: 21 },
  search: {
    minHeight: layout.touchTarget,
    paddingVertical: 12,
    marginTop: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  searchIcon: { width: 22, height: 22 },
  searchPlaceholder: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  searchPressed: { opacity: 0.72 },
  deliveryStrip: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  deliveryText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
  },
  hoursHit: {
    marginLeft: 'auto',
    minHeight: layout.touchTarget,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  hoursText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, lineHeight: 18 },
  banner: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.primary },
  pattern: { opacity: 0.13 },
  bannerCopy: { paddingTop: 18, paddingBottom: 16, paddingLeft: 20, maxWidth: '60%' },
  bannerEyebrow: {
    color: colors.onPrimary,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  bannerTitle: {
    marginTop: 4,
    fontFamily: fonts.brandBold,
    fontSize: 28,
    lineHeight: 28,
    letterSpacing: -1,
    color: colors.onPrimary,
  },
  bannerTitleWrap: { alignSelf: 'flex-start' },
  bannerUnderline: {
    height: 3,
    marginTop: 2,
    marginLeft: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
    transform: [{ rotate: '-2deg' }],
  },
  bannerAction: {
    marginTop: 14,
    color: colors.onPrimary,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 17,
  },
  categoriesSection: { marginTop: 12 },
  sectionHeader: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  sectionActionHit: { minHeight: layout.touchTarget, justifyContent: 'center', paddingLeft: 8 },
  sectionAction: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, lineHeight: 17 },
  categories: { flexGrow: 1, flexDirection: 'row', gap: 8, paddingBottom: 2 },
  categoryHit: {
    minHeight: 72,
    minWidth: 72,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  category: {
    width: 54,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSuccess,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
  },
  categorySelected: { borderColor: colors.primary, backgroundColor: '#DDEADD' },
  categoryIcon: { width: 35, height: 35 },
  categoryText: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  categoryTextSelected: { color: colors.primary, fontFamily: fonts.bold },
  productsSection: { marginTop: 8 },
  filters: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  filterHit: { minHeight: layout.touchTarget, justifyContent: 'center' },
  filter: {
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  filterTextSelected: { color: colors.onPrimary, fontFamily: fonts.bold },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginTop: 4,
  },
  productGridLarge: { columnGap: spacing.md },
  catalogState: { paddingVertical: spacing.xl, gap: spacing.lg },
  stateText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
});
