import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { ProductCard } from '@/components/product-card';
import { Button, EmptyState } from '@/components/ui';
import { matches } from '@/lib/catalog';
import { useCatalog } from '@/providers/catalog';
import { colors, PAGE, radius } from '@/theme';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { products, categories, loading, error, refresh } = useCatalog();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const list = useMemo(
    () => products.filter((p) => (!category || p.category === category) && (!query.trim() || matches(p, query))),
    [products, category, query],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const header = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <Logo />
      <View style={st.search}>
        <Ionicons name="search" size={18} color={colors.ink400} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search iPhone, MacBook, Samsung…"
          placeholderTextColor={colors.ink400}
          style={st.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search products"
          autoCorrect={false}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
        {[{ slug: null as string | null, name: 'All' }, ...categories].map((c) => {
          const active = c.slug === category;
          return (
            <Pressable
              key={c.name}
              onPress={() => setCategory(c.slug)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[st.chip, active && { backgroundColor: colors.brand }]}>
              <Text style={[st.chipText, active && { color: colors.white }]}>{c.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {!loading && !error && (
        <Text style={st.count}>
          {list.length} item{list.length === 1 ? '' : 's'}
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={loading || error ? [] : list}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ paddingHorizontal: PAGE, paddingBottom: 24, gap: 22 }}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={{ flex: 1 / 2 }}>
          <ProductCard product={item} />
        </View>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}
      keyboardDismissMode="on-drag"
      initialNumToRender={6}
      windowSize={7}
      ListEmptyComponent={
        loading ? (
          <View style={{ paddingVertical: 60 }}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : error ? (
          <EmptyState icon="cloud-offline-outline" title="Couldn't load products" body={error} action={<Button title="Try again" onPress={refresh} />} />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Nothing matches that yet"
            body="Stock moves fast. Try another search, or ask us on WhatsApp — we'll source it."
            action={
              <Button
                title="Clear filters"
                variant="outline"
                onPress={() => {
                  setQuery('');
                  setCategory(null);
                }}
              />
            }
          />
        )
      }
    />
  );
}

const st = StyleSheet.create({
  search: { marginTop: 14, height: 48, borderRadius: radius.pill, backgroundColor: colors.ink100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink950, height: '100%' },
  chips: { gap: 8, paddingVertical: 14 },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.ink100, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink700 },
  count: { fontSize: 13, color: colors.ink500, marginBottom: 4 },
});
