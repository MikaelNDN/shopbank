import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBar, Skeleton } from '@/components/common';
import { CategoryChip } from '@/components/product/CategoryChip';
import { ProductCard } from '@/components/product/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { categories, isLoading: catsLoading } = useCategories();
  const { products: featured, isLoading: featuredLoading } =
    useFeaturedProducts(6);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const submitSearch = () => {
    const term = search.trim();
    if (term.length === 0) return;
    router.push(`/(client)/(tabs)/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 pb-4 pt-2">
          <Text className="text-2xl font-bold text-gray-900">
            Olá, {user?.name?.split(' ')[0] ?? 'cliente'}!
          </Text>
          <Text className="mt-1 text-sm text-muted">
            O que você quer comprar hoje?
          </Text>

          <View className="mt-4">
            <SearchBar
              value={search}
              onChangeText={setSearch}
              onSubmit={submitSearch}
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(client)/(tabs)/products')}
          className="mx-6 overflow-hidden rounded-2xl bg-primary-500 p-5"
        >
          <Text className="text-xs font-semibold uppercase text-white/80">
            Destaque da semana
          </Text>
          <Text className="mt-1 text-2xl font-bold text-white">
            Frete grátis acima de R$ 199
          </Text>
          <Text className="mt-1 text-sm text-white/90">
            Aproveite e abasteça seu carrinho.
          </Text>
          <View className="mt-3 flex-row items-center">
            <Text className="text-sm font-semibold text-white">
              Comprar agora
            </Text>
            <FontAwesome
              name="angle-right"
              size={16}
              color="#fff"
              style={{ marginLeft: 4 }}
            />
          </View>
        </Pressable>

        <SectionHeader
          title="Categorias"
          actionLabel="Ver todas"
          onAction={() => router.push('/(client)/(tabs)/products')}
        />
        {catsLoading ? (
          <View className="flex-row gap-3 px-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width={90} height={36} rounded="full" />
            ))}
          </View>
        ) : (
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
            renderItem={({ item }) => (
              <CategoryChip
                label={item.name}
                onPress={() =>
                  router.push(
                    `/(client)/(tabs)/products?category=${item.id}`,
                  )
                }
              />
            )}
          />
        )}

        <SectionHeader
          title="Destaques"
          actionLabel="Ver mais"
          onAction={() => router.push('/(client)/(tabs)/products')}
        />
        {featuredLoading ? (
          <View className="flex-row gap-3 px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width={176} height={240} rounded="lg" />
            ))}
          </View>
        ) : (
          <FlatList
            data={featured}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            renderItem={({ item }) => (
              <ProductCard product={item} variant="horizontal" />
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between px-6">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary-600">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
