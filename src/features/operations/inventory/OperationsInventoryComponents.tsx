import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { OperationsStoreHeader } from '@/components/OperationsStoreHeader';
import { colors, fonts, layout, spacing } from '@/theme/tokens';
import type { CatalogPreviewItem } from '@/types/catalog';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';

const backIcon = require('../../../assets/navigation/back.svg');

export function OperationsInventoryPage({
  title,
  subtitle,
  backLabel,
  backDestinationLabel,
  fallbackHref = '/inventario',
  children,
}: {
  title: string;
  subtitle: string;
  backLabel?: string;
  backDestinationLabel?: string;
  fallbackHref?: Href;
  children: ReactNode;
}) {
  const { store } = useOperationsStore();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {backLabel ? (
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Volver a ${backDestinationLabel ?? backLabel}`}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref))}
              style={styles.backButton}
            >
              <Image
                source={backIcon}
                tintColor={colors.primary}
                style={styles.backIcon}
                accessible={false}
              />
            </Pressable>
            <AppText style={styles.topBarTitle}>{backLabel}</AppText>
            <View style={styles.storeChip}>
              <AppText style={styles.storeChipText}>
                {store?.district ?? store?.name ?? 'Tienda'}
              </AppText>
            </View>
          </View>
        ) : (
          <OperationsStoreHeader />
        )}
        <AppText accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {subtitle}
        </AppText>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function OperationsProductRow({
  item,
  detail,
  value,
  onPress,
  actionHint,
}: {
  item: CatalogPreviewItem;
  detail: string;
  value: string;
  onPress: () => void;
  actionHint: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${detail}, ${value}`}
      accessibilityHint={actionHint}
      onPress={onPress}
      style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}
    >
      <Image
        source={item.image}
        contentFit="cover"
        style={styles.productImage}
        accessible={false}
      />
      <View style={styles.productCopy}>
        <AppText style={styles.productName} numberOfLines={2}>
          {item.name}
        </AppText>
        <AppText secondary style={styles.productDetail} numberOfLines={2}>
          {detail}
        </AppText>
      </View>
      <AppText style={styles.productValue}>{value}</AppText>
    </Pressable>
  );
}

export function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.informationRow}>
      <AppText style={styles.informationLabel}>{label}</AppText>
      <AppText style={styles.informationValue}>{value}</AppText>
    </View>
  );
}

export const inventoryStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, flexShrink: 1 },
  note: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
  },
  noteTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19 },
  noteBody: { fontSize: 12, lineHeight: 18 },
  footerLink: { marginTop: spacing.xl, minHeight: layout.touchTarget, justifyContent: 'center' },
  footerLinkText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  message: { marginTop: spacing.xl, gap: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.section,
  },
  topBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  backIcon: { width: 22, height: 22 },
  topBarTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23 },
  storeChip: {
    marginLeft: 'auto',
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  storeChipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
  },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 29, marginTop: spacing.lg },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  productRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.65 },
  productImage: { width: 66, height: 66, borderRadius: 10 },
  productCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  productName: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  productDetail: { fontSize: 12, lineHeight: 17 },
  productValue: {
    maxWidth: 86,
    textAlign: 'right',
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
  },
  informationRow: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  informationLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.3,
  },
  informationValue: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
});
