import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { productApi } from '@/api/productApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StockBadge } from '@/components/admin/StockBadge';
import { EmptyState, Loading, SearchBar } from '@/components/common';
import { useCategories } from '@/hooks/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/types/product';
import { formatCurrency } from '@/utils/formatCurrency';

type StockFilter = 'all' | 'low' | 'zero';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  const debounced = useDebounce(search, 300);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const list = await productApi.listAll({
        search: debounced,
        categoryId: categoryFilter,
        stockStatus: stockFilter,
        includeInactive: true,
      });
      setProducts(list);
    } finally {
      setLoading(false);
    }
  }, [debounced, categoryFilter, stockFilter]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch]),
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return products;
    return products.filter((p) =>
      statusFilter === 'active' ? p.active : !p.active,
    );
  }, [products, statusFilter]);

  const toggleActive = async (product: Product) => {
    try {
      await productApi.setActive(product.id, !product.active);
      Toast.show({
        type: 'success',
        text1: product.active ? 'Produto inativado' : 'Produto ativado',
      });
      fetch();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falhou',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  if (loading && products.length === 0)
    return <Loading message="Carregando produtos..." />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader title="Produtos" subtitle={`${filtered.length} no filtro`} />

      <View className="px-6 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar produto..."
        />
      </View>

      <View className="gap-2 px-6 pb-3">
        <ChipRow
          options={[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Ativos' },
            { key: 'inactive', label: 'Inativos' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
        <ChipRow
          options={[
            { key: 'all', label: 'Todo estoque' },
            { key: 'low', label: 'Estoque baixo' },
            { key: 'zero', label: 'Sem estoque' },
          ]}
          value={stockFilter}
          onChange={(v) => setStockFilter(v as StockFilter)}
        />
        <ChipRow
          options={[
            { key: '', label: 'Todas' },
            ...categories.map((c) => ({ key: c.id, label: c.name })),
          ]}
          value={categoryFilter ?? ''}
          onChange={(v) => setCategoryFilter(v || undefined)}
        />
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="cube"
          title="Nenhum produto encontrado"
          description="Crie um novo produto ou ajuste os filtros."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 96,
            gap: 10,
          }}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onPress={() =>
                router.push(`/(admin)/products/${item.id}`)
              }
              onToggleActive={() => toggleActive(item)}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => router.push('/(admin)/products/new')}
        style={{ position: 'absolute', right: 24, bottom: insets.bottom + 24 }}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:bg-primary-600"
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

interface ChipRowProps {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

function ChipRow({ options, value, onChange }: ChipRowProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key || 'all'}
            onPress={() => onChange(opt.key)}
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
  );
}

interface ProductRowProps {
  product: Product;
  onPress: () => void;
  onToggleActive: () => void;
}

function ProductRow({ product, onPress, onToggleActive }: ProductRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 rounded-xl border border-border bg-white p-3 active:bg-surface"
    >
      <View className="h-16 w-16 overflow-hidden rounded-lg bg-surface">
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-sm font-semibold text-gray-900"
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text className="text-xs text-muted">
            {formatCurrency(product.price)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <StockBadge quantity={product.availableQuantity} />
          {!product.active ? (
            <View className="rounded-full bg-danger/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-danger">
                INATIVO
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={onToggleActive}
        hitSlop={8}
        className="self-center"
      >
        <FontAwesome
          name={product.active ? 'toggle-on' : 'toggle-off'}
          size={26}
          color={product.active ? '#16a34a' : '#9ca3af'}
        />
      </Pressable>
    </Pressable>
  );
}
