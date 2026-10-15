import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/theme/tokens';
import type { CatalogItem } from '@/types/catalog';

type Props = {
  product: CatalogItem;
  style?: object;
  large?: boolean;
  contentFit?: 'cover' | 'contain';
};

// Portada de marca para productos sin fotografía: mantiene el peso visual de
// las fichas y del héroe mientras el catálogo no tenga fotos reales.
export function ProductCover({ product, style, large = false, contentFit = 'cover' }: Props) {
  if (product.image) {
    return (
      <Image
        source={product.image}
        contentFit={contentFit}
        style={[StyleSheet.absoluteFill, style]}
        accessibilityLabel={`Imagen de ${product.name}`}
      />
    );
  }
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.cover, style]}
      accessibilityLabel={`Portada de marca de ${product.name}`}
      accessible
    >
      <AppText style={[styles.initial, large && styles.initialLarge]}>
        {product.name.charAt(0).toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.brandBold,
    fontSize: 30,
    lineHeight: 38,
    color: 'rgba(41, 93, 67, 0.38)',
  },
  initialLarge: { fontSize: 64, lineHeight: 76 },
});
