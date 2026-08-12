import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { productApi } from '@/api/productApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StockBadge } from '@/components/admin/StockBadge';
import { EmptyState, Loading, SearchBar } from '@/components/common';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/types/product';
import { formatCurrency } from '@/utils/formatCurrency';

type Filter = 'all' | 'low' | 'zero';

export default function AdminInventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const debounced = useDebounce(search, 300);

  const fetch = useCallback(async () => {
    setLoading(true);
    const list = await productApi.listAll({
      search: debounced,
      stockStatus: filter,
      includeInactive: true,
    });
    setProducts(list);
    setLoading(false);
  }, [debounced, filter]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch]),
  );

  const adjust = async (product: Product, delta: number) => {
    try {
      const updated = await productApi.updateStock(product.id, delta);
      if (updated) {
        setProducts((curr) =>
          curr.map((p) => (p.id === product.id ? updated : p)),
        );
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falhou',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const lowCount = products.filter(
    (p) => p.active && p.availableQuantity <= 5,
  ).length;

  if (loading && products.length === 0)
    return <Loading message="Carregando estoque..." />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader
        title="Estoque"
        subtitle={`${products.length} produtos no filtro`}
      />

      {lowCount > 0 ? (
        <View className="mx-6 mb-3 flex-row items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <FontAwesome name="exclamation-triangle" size={14} color="#b45309" />
          <Text className="flex-1 text-xs text-yellow-900">
            {lowCount} {lowCount === 1 ? 'produto' : 'produtos'} com estoque
            baixo. Reabasteça em breve.
          </Text>
        </View>
      ) : null}

      <View className="px-6 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar produto..."
        />
      </View>

      <View className="flex-row gap-2 px-6 pb-3">
        {(
          [
            { key: 'all', label: 'Todos' },
            { key: 'low', label: 'Estoque baixo' },
            { key: 'zero', label: 'Zerado' },
          ] as { key: Filter; label: string }[]
        ).map((opt) => {
          const selected = filter === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              className={`rounded-full border px-3 py-1 ${
                selected
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-border bg-white'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  selected ? 'text-white' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {products.length === 0 ? (
        <EmptyState
          icon="archive"
          title="Nenhum produto"
          description="Ajuste os filtros."
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 32,
            gap: 10,
          }}
          renderItem={({ item }) => (
            <InventoryRow
              product={item}
              onIncrement={() => adjust(item, 1)}
              onDecrement={() => adjust(item, -1)}
              onIncrement10={() => adjust(item, 10)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

interface InventoryRowProps {
  product: Product;
  onIncrement: () => void;
  onDecrement: () => void;
  onIncrement10: () => void;
}

function InventoryRow({
  product,
  onIncrement,
  onDecrement,
  onIncrement10,
}: InventoryRowProps) {
  return (
    <View className="rounded-xl border border-border bg-white p-3">
      <View className="flex-row items-center gap-3">
        <View className="h-14 w-14 overflow-hidden rounded-lg bg-surface">
          <Image
            source={{ uri: product.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
        <View className="flex-1">
          <Text
            className="text-sm font-semibold text-gray-900"
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text className="text-xs text-muted">
            {formatCurrency(product.price)}
          </Text>
          <View className="mt-1">
            <StockBadge quantity={product.availableQuantity} />
          </View>
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
        <Pressable
          onPress={onDecrement}
          disabled={product.availableQuantity === 0}
          hitSlop={6}
          className={`h-9 w-9 items-center justify-center rounded-full bg-surface ${
            product.availableQuantity === 0 ? 'opacity-30' : 'active:bg-border'
          }`}
        >
          <FontAwesome name="minus" size={12} color="#374151" />
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">
          {product.availableQuantity}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={onIncrement}
            hitSlop={6}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface active:bg-border"
          >
            <FontAwesome name="plus" size={12} color="#374151" />
          </Pressable>
          <Pressable
            onPress={onIncrement10}
            hitSlop={6}
            className="h-9 items-center justify-center rounded-full bg-primary-500 px-3 active:bg-primary-600"
          >
            <Text className="text-xs font-semibold text-white">+10</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
