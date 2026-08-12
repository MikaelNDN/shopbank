import { useRouter } from 'expo-router';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Button, EmptyState, Loading } from '@/components/common';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    subtotal,
    isLoading,
    updateQuantity,
    removeItem,
    hasUnavailableItems,
  } = useCart();

  if (isLoading) {
    return <Loading message="Carregando carrinho..." />;
  }

  const handleQuantityChange = async (productId: string, qty: number) => {
    try {
      await updateQuantity(productId, qty);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível atualizar',
        text2: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleRemove = (productId: string, name: string) => {
    Alert.alert('Remover item', `Remover "${name}" do carrinho?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => removeItem(productId),
      },
    ]);
  };

  const handleCheckout = () => {
    if (hasUnavailableItems) {
      Toast.show({
        type: 'error',
        text1: 'Itens indisponíveis',
        text2: 'Remova ou ajuste os itens marcados antes de continuar.',
      });
      return;
    }
    router.push('/(client)/checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <EmptyState
          icon="shopping-cart"
          title="Seu carrinho está vazio"
          description="Adicione produtos para continuar."
          ctaLabel="Ir para a loja"
          onCtaPress={() => router.push('/(client)/(tabs)/products')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">Carrinho</Text>
        <Text className="mt-1 text-sm text-muted">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.productId}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 12,
        }}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onChangeQuantity={(qty) => handleQuantityChange(item.productId, qty)}
            onRemove={() => handleRemove(item.productId, item.name)}
          />
        )}
      />

      <View className="border-t border-border bg-white px-6 py-4 pb-6">
        <CartSummary subtotal={subtotal} />
        <View className="mt-4">
          <Button
            label="Finalizar compra"
            size="lg"
            fullWidth
            onPress={handleCheckout}
            disabled={hasUnavailableItems}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
