import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AppText } from '@/components/AppText';
import { colors, fonts, layout, radii, spacing } from '@/theme/tokens';
import { storeSelectContent } from './operationsContent';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';
import { useState } from 'react';

const backIcon = require('../../../assets/navigation/back.svg');

// 02 · Solo se ofrecen tiendas de membresía owner/admin activa.
export function StoreSelectScreen() {
  const { stores, loading, error, refresh, select } = useOperationsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stores.find((item) => item.id === selectedId);
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
          <Image source={backIcon} tintColor={colors.primary} style={styles.backIcon} />
        </Pressable>
        <AppText style={styles.topBarTitle} accessibilityRole="header">
          {storeSelectContent.topBar}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title} accessibilityRole="header">
          {storeSelectContent.title}
        </AppText>
        <AppText secondary style={styles.subtitle}>
          {storeSelectContent.subtitle}
        </AppText>

        {loading && <AppText secondary>Cargando tiendas autorizadas…</AppText>}
        {error && (
          <Pressable
            onPress={() => void refresh()}
            accessibilityRole="button"
            style={styles.storeCard}
          >
            <AppText>{error} Toca para reintentar.</AppText>
          </Pressable>
        )}
        {!loading && !error && stores.length === 0 && (
          <View style={[styles.storeCard, { borderColor: colors.border }]}>
            <AppText>Inicia sesión con el correo owner/admin de tu tienda para continuar.</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/operations')}
              style={{ minHeight: layout.touchTarget, justifyContent: 'center' }}
            >
              <AppText style={{ color: colors.primary, fontFamily: fonts.semibold }}>
                Acceder con correo
              </AppText>
            </Pressable>
          </View>
        )}
        {stores.map((store) => (
          <Pressable
            key={store.id}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedId === store.id }}
            accessibilityLabel={`${store.name}. ${store.role === 'owner' ? 'Propietario' : 'Administrador'}`}
            onPress={() => setSelectedId(store.id)}
            style={[styles.storeCard, selectedId !== store.id && { borderColor: colors.border }]}
          >
            <AppText style={styles.storeName}>{store.name}</AppText>
            <AppText style={styles.storeAddress}>
              {[store.address, store.district].filter(Boolean).join(' · ')}
            </AppText>
            <View style={styles.roleChip}>
              <AppText style={styles.roleChipText}>
                {store.role === 'owner' ? 'Propietario' : 'Administrador'}
              </AppText>
            </View>
          </Pressable>
        ))}

        <View style={styles.divider} />
        <AppText style={styles.scopeNote}>{storeSelectContent.scopeNote}</AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={storeSelectContent.panelCta}
          onPress={() => {
            if (selected) {
              select(selected);
              router.replace('/panel');
            }
          }}
          accessibilityState={{ disabled: !selected }}
          style={({ pressed }) => [
            styles.panelButton,
            !selected && { backgroundColor: colors.surfaceMuted },
            pressed && styles.pressed,
          ]}
        >
          <AppText style={[styles.panelButtonText, !selected && { color: colors.textSecondary }]}>
            {storeSelectContent.panelCta}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  scroll: {
    flexGrow: 1,
    padding: spacing.page,
    paddingBottom: spacing.section,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  storeCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  storeName: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  storeAddress: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    marginTop: spacing.sm,
  },
  roleChipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xl },
  scopeNote: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.md,
  },
  panelButton: {
    marginTop: spacing.xl,
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pressed: { opacity: 0.85 },
  panelButtonText: {
    color: colors.onPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
});
