import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Button, EmptyState, Loading } from '@/components/common';
import { ProductCard } from '@/components/product/ProductCard';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { useCart } from '@/hooks/useCart';
import { useProduct } from '@/hooks/useProduct';
import { formatCurrency } from '@/utils/formatCurrency';
import { haptics } from '@/utils/haptics';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, related, isLoading, error } = useProduct(id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return <Loading message="Carregando produto..." />;
  }

  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          icon="exclamation-triangle"
          title="Produto não encontrado"
          description={error ?? 'Esse produto não existe mais.'}
          ctaLabel="Voltar"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const outOfStock = product.availableQuantity === 0;
  const inactive = !product.active;
  const blocked = outOfStock || inactive;
  const maxQty = Math.max(1, product.availableQuantity);

  const addToCart = async () => {
    try {
      await addItem(product, quantity);
      haptics.medium();
      Toast.show({
        type: 'success',
        text1: 'Adicionado ao carrinho',
        text2: `${quantity}x ${product.name}`,
      });
    } catch (e) {
      haptics.error();
      Toast.show({
        type: 'error',
        text1: 'Não foi possível adicionar',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const buyNow = async () => {
    try {
      await addItem(product, quantity);
      router.push('/(client)/(tabs)/cart');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível adicionar',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="aspect-square w-full bg-surface">
          <Image
            source={{ uri: product.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
          {blocked ? (
            <View className="absolute right-4 top-12 rounded-md bg-danger px-3 py-1.5">
              <Text className="text-xs font-semibold uppercase text-white">
                {inactive ? 'Inativo' : 'Sem estoque'}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-6 pt-6">
          <Text className="text-2xl font-bold text-gray-900">
            {product.name}
          </Text>
          <Text className="mt-2 text-3xl font-bold text-primary-600">
            {formatCurrency(product.price)}
          </Text>

          <View className="mt-3 flex-row items-center">
            <FontAwesome
              name={outOfStock ? 'times-circle' : 'check-circle'}
              size={14}
              color={outOfStock ? '#dc2626' : '#16a34a'}
            />
            <Text
              className={`ml-2 text-sm ${
                outOfStock ? 'text-danger' : 'text-success'
              }`}
            >
              {outOfStock
                ? 'Indisponível'
                : `${product.availableQuantity} em estoque`}
            </Text>
          </View>

          <Text className="mt-6 text-base font-semibold text-gray-900">
            Descrição
          </Text>
          <Text className="mt-1 text-sm leading-relaxed text-gray-700">
            {product.description}
          </Text>

          {!blocked ? (
            <View className="mt-6 flex-row items-center gap-4">
              <Text className="text-sm font-semibold text-gray-900">
                Quantidade
              </Text>
              <QuantityStepper
                value={quantity}
                min={1}
                max={maxQty}
                onChange={setQuantity}
              />
            </View>
          ) : null}
        </View>

        {related.length > 0 ? (
          <View className="mt-10">
            <Text className="mb-3 px-6 text-lg font-bold text-gray-900">
              Produtos relacionados
            </Text>
            <FlatList
              data={related}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              renderItem={({ item }) => (
                <ProductCard product={item} variant="horizontal" />
              )}
            />
          </View>
        ) : null}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-white px-6 py-4 pb-6">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Adicionar"
              variant="outline"
              onPress={addToCart}
              disabled={blocked}
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              label="Comprar"
              onPress={buyNow}
              disabled={blocked}
              fullWidth
            />
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: insets.top + 8, left: 16 }}
        className="h-10 w-10 items-center justify-center rounded-full bg-white shadow"
      >
        <FontAwesome name="angle-left" size={22} color="#111827" />
      </Pressable>
    </View>
  );
}
