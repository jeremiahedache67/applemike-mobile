import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { conditionLabel, inStock, liveVariants, priceOf, type Product } from '@/lib/catalog';
import { naira } from '@/lib/format';
import { useFavourites } from '@/providers/favourites';
import { colors, fonts, radius } from '@/theme';
import { ProductImage } from './product-image';
import { Pill } from './ui';

export function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useFavourites();
  const sold = !inStock(product);
  const saved = has(product.id);
  const chips = product.specs.filter((sp) => ['Chip', 'Processor', 'Memory', 'Storage', 'Battery health'].includes(sp.label)).slice(0, 2);

  return (
    <Link href={{ pathname: '/product/[slug]', params: { slug: product.slug } }} asChild>
      <Pressable style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]} accessibilityLabel={`${product.name}, ${naira(priceOf(product))}${sold ? ', sold' : ''}`}>
        <View>
          <ProductImage src={product.images[0]} name={product.name} dimmed={sold} style={st.image} />
          <View style={st.badges}>
            {sold ? <Pill tone="dark">SOLD</Pill> : product.isNew ? <Pill tone="brand">NEW IN</Pill> : null}
            {!sold && product.condition && product.condition !== 'uk-used' ? <Pill>{conditionLabel[product.condition]}</Pill> : null}
          </View>
          <Pressable
            onPress={async () => {
              const res = await toggle(product.id);
              if (res.error) Alert.alert('Favourites', res.error);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
            style={st.heart}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.brand : colors.ink700} />
          </Pressable>
        </View>
        <Text style={st.brand} numberOfLines={1}>
          {product.brand}
          {product.condition === 'uk-used' ? ' · UK Used' : ''}
        </Text>
        <Text style={st.name} numberOfLines={2}>
          {product.name}
        </Text>
        {chips.length > 0 && (
          <Text style={st.chips} numberOfLines={1}>
            {chips.map((c) => c.value).join(' · ')}
          </Text>
        )}
        <Text style={[st.price, sold && { color: colors.ink400, textDecorationLine: 'line-through' }]}>
          {liveVariants(product).length > 1 ? 'From ' : ''}
          {naira(priceOf(product))}
        </Text>
      </Pressable>
    </Link>
  );
}

const st = StyleSheet.create({
  image: { aspectRatio: 1, borderRadius: radius.card },
  badges: { position: 'absolute', top: 10, left: 10, gap: 6 },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { marginTop: 10, fontSize: 12, color: colors.ink500, fontWeight: '500' },
  name: { marginTop: 2, fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 19, color: colors.ink950 },
  chips: { marginTop: 3, fontSize: 12, color: colors.ink500 },
  price: { marginTop: 6, fontFamily: fonts.display, fontSize: 17, color: colors.ink950 },
});
