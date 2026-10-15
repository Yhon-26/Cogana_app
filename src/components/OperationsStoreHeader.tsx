import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, fonts, spacing } from '@/theme/tokens';
import { useOperationsStore } from '@/features/operations/OperationsStoreContext';

// Contexto común de las pantallas operativas; la tienda seleccionada proviene de Supabase.
export function OperationsStoreHeader() {
  const { store } = useOperationsStore();
  return (
    <View style={styles.header}>
      <AppText style={styles.brand}>Cogana</AppText>
      <AppText style={styles.badge}>OPERACIÓN</AppText>
      <View style={styles.storeChip}>
        <AppText style={styles.storeChipText}>{store?.district ?? store?.name ?? 'Tienda'}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brand: { fontFamily: fonts.brandBold, fontSize: 24, lineHeight: 30 },
  badge: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
  storeChip: {
    marginLeft: 'auto',
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  storeChipText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
});
