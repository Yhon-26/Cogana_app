import { useCallback, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { useFocusEffect, router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { ProductCover } from '../products/ProductCover';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import type { AsyncState } from '@/types/async-state';
import type { CatalogItem } from '@/types/catalog';
import { formatSoles } from '../products/formatPrice';
import { searchContent } from './searchContent';

const backIcon = require('../../../assets/navigation/back.svg');
const searchIcon = require('../../../assets/store/search.svg');

// 06 · Buscar productos: resultados en lista que abren el detalle de producto.
export function SearchScreen() {
  const [catalog, setCatalog] = useState<AsyncState<readonly CatalogItem[]>>({
    status: 'loading',
  });
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      listCustomerCatalog()
        .then((items) => {
          if (mounted) setCatalog({ status: 'success', data: items });
        })
        .catch(() => {
          if (mounted) setCatalog({ status: 'error', message: searchContent.catalogError });
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  const results = useMemo(() => {
    if (catalog.status !== 'success') return [];
    const search = query.trim().toLocaleLowerCase('es-PE');
    if (!search) return catalog.data;
    return catalog.data.filter((item) =>
      `${item.name} ${item.presentation}`.toLocaleLowerCase('es-PE').includes(search),
    );
  }, [catalog, query]);

  const trimmed = query.trim();

  if (catalog.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (catalog.status === 'error') {
    return (
      <SafeAreaView
        style={[styles.safe, styles.center, styles.pad]}
        edges={['top', 'left', 'right']}
      >
        <AppText style={styles.centerText}>{searchContent.catalogError}</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backFallback}
        >
          <AppText style={styles.backFallbackText}>Volver</AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
        >
          <Image
            source={backIcon}
            tintColor={colors.primary}
            style={styles.backIcon}
            accessible={false}
          />
        </Pressable>
        <AppText style={styles.topBarTitle} accessibilityRole="header">
          {searchContent.title}
        </AppText>
      </View>

      <View style={styles.body}>
        <View style={styles.field}>
          <Image source={searchIcon} style={styles.fieldIcon} accessible={false} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchContent.placeholder}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            returnKeyType="search"
            autoFocus
            accessibilityLabel="Buscar productos"
            style={styles.fieldInput}
          />
          {trimmed.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setQuery('')}
              hitSlop={10}
              style={styles.clearButton}
            >
              <View style={[styles.clearBar, styles.clearBarA]} />
              <View style={[styles.clearBar, styles.clearBarB]} />
            </Pressable>
          )}
        </View>

        <AppText style={styles.count}>
          {results.length}{' '}
          {results.length === 1 ? searchContent.countSuffixSingular : searchContent.countSuffix}
        </AppText>

        {results.length === 0 ? (
          <AppText style={styles.empty}>
            {searchContent.notFoundPrefix} &quot;{trimmed}&quot;. {searchContent.notFoundSuffix}
          </AppText>
        ) : (
          <ScrollView
            contentContainerStyle={styles.results}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {results.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${item.name}, ${item.presentation}`}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowPhotoWrap}>
                  <ProductCover product={item} style={styles.rowPhoto} />
                </View>
                <View style={styles.rowData}>
                  <AppText style={styles.rowName} numberOfLines={2}>
                    {item.name}
                  </AppText>
                  <AppText style={styles.rowPresentation} numberOfLines={1}>
                    {item.presentation}
                  </AppText>
                  <AppText style={styles.rowPrice}>{formatSoles(item.priceCents)}</AppText>
                  <AppText secondary>
                    {item.availableQuantity > 0 ? 'Disponible' : 'Sin stock'}
                  </AppText>
                  {item.imageIsReference && <AppText secondary>Imagen referencial</AppText>}
                </View>
                <View style={styles.rowChevron} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  pad: { padding: spacing.page },
  centerText: { textAlign: 'center' },
  backFallback: {
    minHeight: layout.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backFallbackText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 15 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: { width: 22, height: 22 },
  topBarTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.page,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.sm,
  },
  fieldIcon: { width: 22, height: 22 },
  fieldInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  clearButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    marginRight: -spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBar: {
    position: 'absolute',
    width: 14,
    height: 1.8,
    backgroundColor: colors.textSecondary,
  },
  clearBarA: { transform: [{ rotate: '45deg' }] },
  clearBarB: { transform: [{ rotate: '-45deg' }] },
  count: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 17,
    marginTop: spacing.lg,
  },
  results: { paddingTop: spacing.sm, paddingBottom: spacing.section, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: layout.touchTarget + 28,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowPhotoWrap: { width: 76, height: 76, borderRadius: 12, overflow: 'hidden' },
  rowPhoto: { width: 76, height: 76, borderRadius: 12 },
  rowData: { flex: 1, gap: 2 },
  rowName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  rowPresentation: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  rowPrice: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
    marginTop: 2,
  },
  rowChevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '-45deg' }],
  },
  empty: {
    marginTop: spacing.xl,
    fontSize: 15,
    lineHeight: 22,
  },
});
