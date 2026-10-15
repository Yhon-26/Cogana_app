import { useCallback, useState } from 'react';
import { listCustomerCatalog } from '@/services/customer/catalog';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { categoriesIntro } from './categoriesContent';

// 05 · Categorías: listado plano sin fotografías, a petición del usuario.
// Las filas con catálogo de muestra navegan a la tienda pre-filtrada; las demás
// se muestran sin chevron porque todavía no tienen productos que mostrar.
export function CategoriesScreen() {
  const [categoryLinks, setCategoryLinks] = useState<
    { key: string; name: string; description: string; sampleCategory: string }[]
  >([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void listCustomerCatalog()
        .then((items) => {
          if (!active) return;
          const categories = [
            ...new Map(
              items.map((item) => [
                item.category,
                {
                  key: item.category,
                  name: item.categoryName,
                  description: '',
                  sampleCategory: item.category,
                },
              ]),
            ).values(),
          ];
          setCategoryLinks(categories);
          setError(false);
          setLoading(false);
        })
        .catch(() => {
          if (active) {
            setError(true);
            setLoading(false);
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="welcomeLogo">{categoriesIntro.brand}</AppText>
          <AppText style={styles.locality}>{categoriesIntro.locality}</AppText>
        </View>

        <View style={styles.titleBlock}>
          <AppText style={styles.title} accessibilityRole="header">
            {categoriesIntro.title}
          </AppText>
          <AppText secondary style={styles.subtitle}>
            {categoriesIntro.subtitle}
          </AppText>
        </View>

        <View style={styles.list}>
          {loading ? (
            <AppText>Cargando categorias...</AppText>
          ) : error ? (
            <AppText>No pudimos cargar las categorias. Vuelve a abrir esta pantalla.</AppText>
          ) : categoryLinks.length === 0 ? (
            <AppText>No hay categorias publicadas.</AppText>
          ) : null}
          {categoryLinks.map((category) => {
            const navigates = Boolean(category.sampleCategory);
            const row = (
              <>
                <View style={styles.rowText}>
                  <AppText style={styles.rowName}>{category.name}</AppText>
                  <AppText style={styles.rowDescription}>{category.description}</AppText>
                </View>
                {navigates && <View style={styles.chevron} />}
              </>
            );
            if (!navigates) {
              return (
                <View key={category.key} style={styles.row}>
                  {row}
                </View>
              );
            }
            return (
              <Pressable
                key={category.key}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${category.name}`}
                onPress={() =>
                  router.navigate({
                    pathname: '/store',
                    params: { categoria: category.sampleCategory ?? '' },
                  })
                }
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                {row}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  locality: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  titleBlock: {
    marginTop: spacing.xl,
    gap: spacing.xs,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 32 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  list: {
    marginTop: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
    borderRadius: radii.surface,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.touchTarget + 8,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  rowDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 17 },
  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '-45deg' }],
    marginLeft: spacing.md,
  },
});
