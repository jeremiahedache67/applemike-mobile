import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Linking, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { ProductCard } from '@/components/product-card';
import { ProductImage } from '@/components/product-image';
import { Button, EmptyState, IconButton, Pill, QtyStepper, s } from '@/components/ui';
import { conditionLabel, liveVariants, type Product } from '@/lib/catalog';
import { store, whatsappLink } from '@/lib/config';
import { naira } from '@/lib/format';
import { useCart } from '@/providers/cart';
import { useCatalog } from '@/providers/catalog';
import { useFavourites } from '@/providers/favourites';
import { colors, fonts, PAGE, radius } from '@/theme';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { bySlug, products, loading } = useCatalog();
  const product = bySlug.get(slug);

  if (!product) {
    return loading ? null : (
      <EmptyState icon="alert-circle-outline" title="Product not found" body="It may have sold out or been removed." action={<Button title="Back to shop" onPress={() => router.back()} />} />
    );
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id && p.status === 'active').slice(0, 4);
  return <ProductDetail key={product.id} product={product} related={related} />;
}

function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { width } = useWindowDimensions();
  const cart = useCart();
  const favourites = useFavourites();
  const variants = liveVariants(product);
  const [variantId, setVariantId] = useState((variants.find((v) => v.stock > 0) ?? variants[0])?.id);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState<'add' | 'buy' | null>(null);

  const variant = variants.find((v) => v.id === variantId);
  const soldOut = product.status === 'sold' || !variant || variant.stock <= 0;
  const maxQty = Math.min(variant?.stock ?? 1, 20);
  const saved = favourites.has(product.id);
  const images = product.images.length ? product.images : [null];
  const ask = whatsappLink(`Hi Apple Mike, I'm interested in the ${product.name}${variant ? ` (${variant.label}) listed at ${naira(variant.price)}` : ''}. Is it available?`);

  const add = async (mode: 'add' | 'buy') => {
    if (!variant || soldOut || busy) return;
    setBusy(mode);
    const error = await cart.add(variant.id, qty);
    setBusy(null);
    if (error) return Alert.alert("Couldn't add to cart", error);
    if (mode === 'buy') router.push('/checkout');
    else Alert.alert('Added to cart', `${product.name} is in your cart.`, [{ text: 'Keep shopping' }, { text: 'View cart', onPress: () => router.navigate('/cart') }]);
  };

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => <ProductImage src={item} name={product.name} dimmed={soldOut} style={{ width, aspectRatio: 4 / 5 }} />}
        />
        {images.length > 1 && (
          <View style={st.dots} accessibilityLabel={`Photo ${photo + 1} of ${images.length}`}>
            {images.map((_, i) => (
              <View key={i} style={[st.dot, i === photo && { backgroundColor: colors.ink950, width: 18 }]} />
            ))}
          </View>
        )}

        <View style={{ paddingHorizontal: PAGE, paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ fontWeight: '600', color: colors.ink600 }}>{product.brand}</Text>
            {product.condition && <Pill>{conditionLabel[product.condition]}</Pill>}
            {product.isNew && !soldOut && <Pill tone="brand">NEW IN</Pill>}
          </View>
          <Text style={[s.h1, { marginTop: 6 }]}>{product.name}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
            <Text style={[st.price, soldOut && { color: colors.ink400 }]}>{variant ? naira(variant.price) : '—'}</Text>
            {variant?.compareAtPrice && variant.compareAtPrice > variant.price ? <Text style={st.was}>{naira(variant.compareAtPrice)}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={[st.stockDot, { backgroundColor: soldOut ? colors.ink200 : colors.ok }]} />
            <Text style={{ color: soldOut ? colors.ink500 : colors.ok, fontWeight: '600' }}>
              {product.status === 'sold' ? 'Sold — ask us for a similar one' : soldOut ? 'Out of stock' : variant && variant.stock <= 2 ? `In stock · only ${variant.stock} left` : 'In stock'}
            </Text>
          </View>

          {variants.length > 1 && (
            <View style={{ marginTop: 20 }}>
              <Text style={s.label}>Option: <Text style={{ fontWeight: '400', color: colors.ink600 }}>{variant?.label}</Text></Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {variants.map((v) => {
                  const active = v.id === variantId;
                  return (
                    <Text
                      key={v.id}
                      onPress={() => {
                        setVariantId(v.id);
                        setQty(1);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[st.option, active && { backgroundColor: colors.ink950, color: colors.white, borderColor: colors.ink950 }, v.stock <= 0 && { textDecorationLine: 'line-through', color: colors.ink400 }]}>
                      {v.label}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}

          {!soldOut && maxQty > 1 && (
            <View style={{ marginTop: 20, gap: 10 }}>
              <Text style={s.label}>Quantity</Text>
              <QtyStepper value={qty} max={maxQty} onChange={(n) => setQty(Math.max(1, Math.min(maxQty, n)))} />
            </View>
          )}

          {product.specs.length > 0 && (
            <View style={st.specs}>
              {[...product.specs, ...(product.year ? [{ label: 'Year', value: String(product.year) }] : [])].map((sp) => (
                <View key={sp.label} style={st.spec}>
                  <Text style={{ fontSize: 12, color: colors.ink500 }}>{sp.label}</Text>
                  <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15, color: colors.ink950, marginTop: 2 }}>{sp.value}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: 18, gap: 10 }}>
            <Info icon="car-outline" title="Nationwide delivery." body="Delivery fee is confirmed with you before dispatch." />
            <Info icon="location-outline" title="Free pick-up" body={`at ${store.address}.`} />
            {product.warranty && <Info icon="shield-checkmark-outline" title={`${product.warranty} warranty`} body="from Apple Mike." />}
          </View>

          {/* Same placement as the website: actions sit directly under "About this item". */}
          <View style={st.about}>
            <Text style={s.h2}>About this item</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <IconButton icon="logo-whatsapp" color={colors.whatsapp} label="Ask about this item on WhatsApp" onPress={() => Linking.openURL(ask)} />
              <IconButton
                icon={saved ? 'heart' : 'heart-outline'}
                color={saved ? colors.brand : colors.ink950}
                label={saved ? 'Remove from favourites' : 'Save to favourites'}
                onPress={async () => {
                  const res = await favourites.toggle(product.id);
                  if (res.error) Alert.alert('Favourites', res.error);
                }}
              />
              {soldOut ? (
                <Button title="Ask for a similar one" variant="dark" style={{ flex: 1, height: 48 }} onPress={() => Linking.openURL(ask)} />
              ) : (
                <>
                  <Button title="Add to cart" style={{ flex: 1, height: 48, paddingHorizontal: 8 }} loading={busy === 'add'} disabled={!!busy} onPress={() => add('add')} />
                  <Button title="Buy now" variant="dark" style={{ flex: 1, height: 48, paddingHorizontal: 8 }} loading={busy === 'buy'} disabled={!!busy} onPress={() => add('buy')} />
                </>
              )}
            </View>
            {product.description ? <Text style={st.desc}>{product.description}</Text> : null}
          </View>
        </View>

        {related.length > 0 && (
          <View style={{ paddingHorizontal: PAGE, marginTop: 32 }}>
            <Text style={s.h2}>You might also like</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 22, columnGap: 12 }}>
              {related.map((p) => (
                <View key={p.id} style={{ width: (width - PAGE * 2 - 12) / 2 }}>
                  <ProductCard product={p} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function Info({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Ionicons name={icon} size={20} color={colors.brand} />
      <Text style={{ flex: 1, color: colors.ink700, fontSize: 14, lineHeight: 20 }}>
        <Text style={{ fontWeight: '700', color: colors.ink950 }}>{title}</Text> {body}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink200 },
  price: { fontFamily: fonts.display, fontSize: 30, color: colors.ink950 },
  was: { fontFamily: fonts.display, fontSize: 17, color: colors.ink400, textDecorationLine: 'line-through' },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  option: { minWidth: 88, textAlign: 'center', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.ink200, fontWeight: '700', color: colors.ink950, overflow: 'hidden' },
  specs: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', borderRadius: radius.card, borderWidth: 1, borderColor: colors.ink100, overflow: 'hidden' },
  spec: { width: '50%', padding: 14, borderColor: colors.ink100, borderBottomWidth: 1, borderRightWidth: 1 },
  about: { marginTop: 26, paddingTop: 22, borderTopWidth: 1, borderTopColor: colors.ink100 },
  desc: { marginTop: 16, fontSize: 16, lineHeight: 24, color: colors.ink700 },
});
