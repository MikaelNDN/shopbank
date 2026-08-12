import FontAwesome from '@expo/vector-icons/FontAwesome';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, SearchBar, Skeleton } from '@/components/common';
import { FilterSheet, type FilterSheetRef } from '@/components/product/FilterSheet';
import { ProductCard } from '@/components/product/ProductCard';
import { SortSheet } from '@/components/product/SortSheet';
import { useCategories } from '@/hooks/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '@/hooks/useProducts';
import type { ProductFilters } from '@/types/product';

export default function ProductsScreen() {
  const params = useLocalSearchParams<{
    search?: string;
    category?: string;
  }>();

  const [search, setSearch] = useState(params.search ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(
    params.category,
  );
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] =
    useState<NonNullable<ProductFilters['sortBy']>>('relevance');

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    if (params.search !== undefined) setSearch(params.search);
    if (params.category !== undefined) setCategoryId(params.category);
  }, [params.search, params.category]);

  const filters = useMemo<ProductFilters>(
    () => ({
      search: debouncedSearch,
      categoryId,
      inStockOnly,
      sortBy,
    }),
    [debouncedSearch, categoryId, inStockOnly, sortBy],
  );

  const { products, isLoading, refetch } = useProducts(filters);
  const { categories } = useCategories();

  const filterRef = useRef<FilterSheetRef & BottomSheetModal>(null);
  const sortRef = useRef<BottomSheetModal>(null);

  const activeFilterCount = (categoryId ? 1 : 0) + (inStockOnly ? 1 : 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 pb-3 pt-2">
        <SearchBar value={search} onChangeText={setSearch} />
        <View className="mt-3 flex-row gap-2">
          <ToolbarButton
            icon="sliders"
            label={
              activeFilterCount > 0
                ? `Filtros · ${activeFilterCount}`
                : 'Filtros'
            }
            highlighted={activeFilterCount > 0}
            onPress={() => filterRef.current?.present()}
          />
          <ToolbarButton
            icon="sort"
            label="Ordenar"
            onPress={() => sortRef.current?.present()}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 px-6">
          <View className="flex-row flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="48%" height={240} rounded="lg" />
            ))}
          </View>
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nada encontrado"
          description="Ajuste a busca ou os filtros para tentar novamente."
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 24 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingBottom: 24 }}
          renderItem={({ item }) => <ProductCard product={item} />}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
        />
      )}

      <FilterSheet
        ref={filterRef}
        categories={categories}
        initial={{ categoryId, inStockOnly }}
        onApply={({ categoryId: c, inStockOnly: s }) => {
          setCategoryId(c);
          setInStockOnly(s ?? false);
        }}
      />
      <SortSheet ref={sortRef} value={sortBy} onChange={setSortBy} />
    </SafeAreaView>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  highlighted?: boolean;
}

function ToolbarButton({
  icon,
  label,
  onPress,
  highlighted = false,
}: ToolbarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${
        highlighted
          ? 'border-primary-500 bg-primary-50'
          : 'border-border bg-white active:bg-surface'
      }`}
    >
      <FontAwesome
        name={icon}
        size={14}
        color={highlighted ? '#b84613' : '#374151'}
      />
      <Text
        className={`text-sm font-medium ${
          highlighted ? 'text-primary-700' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
