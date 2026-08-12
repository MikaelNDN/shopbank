import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';
import type { Product } from '@/types/product';

type Variant = 'grid' | 'horizontal';

interface ProductCardProps {
  product: Product;
  variant?: Variant;
}

export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const outOfStock = product.availableQuantity === 0;
  const inactive = !product.active;

  const containerClass =
    variant === 'horizontal'
      ? 'mr-3 w-44 overflow-hidden rounded-xl border border-border bg-white'
      : 'flex-1 overflow-hidden rounded-xl border border-border bg-white';

  return (
    <Pressable
      className={`${containerClass} active:opacity-80`}
      onPress={() => router.push(`/(client)/product/${product.id}`)}
    >
      <View className="relative aspect-square w-full bg-surface">
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
        {outOfStock || inactive ? (
          <View className="absolute right-2 top-2 rounded-md bg-danger px-2 py-1">
            <Text className="text-[10px] font-semibold uppercase text-white">
              {inactive ? 'Inativo' : 'Sem estoque'}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-3">
        <Text
          className="text-sm font-medium text-gray-900"
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <Text className="mt-2 text-base font-bold text-primary-600">
          {formatCurrency(product.price)}
        </Text>
      </View>
    </Pressable>
  );
}
