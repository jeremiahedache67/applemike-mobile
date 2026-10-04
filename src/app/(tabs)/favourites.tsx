import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { ProductCard } from '@/components/product-card';
import { Button, EmptyState } from '@/components/ui';
import type { Product } from '@/lib/catalog';
import { useCatalog } from '@/providers/catalog';
import { useFavourites } from '@/providers/favourites';
import { colors, PAGE } from '@/theme';

export default function FavouritesScreen() {
  const { ids, refresh } = useFavourites();
  const { byId, refresh: refreshCatalog } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);
  const items = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: PAGE, gap: 22, flexGrow: 1 }}
      renderItem={({ item }) => (
        <View style={{ flex: 1 / 2 }}>
          <ProductCard product={item} />
        </View>
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.brand}
          colors={[colors.brand]}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([refresh(), refreshCatalog()]);
            setRefreshing(false);
          }}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="No favourites yet"
          body="Tap the heart on any product to keep an eye on it. Favourites sync with your account on the website."
          action={<Button title="Browse gadgets" onPress={() => router.navigate('/')} />}
        />
      }
    />
  );
}
