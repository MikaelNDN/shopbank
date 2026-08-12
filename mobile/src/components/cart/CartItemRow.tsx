import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { QuantityStepper } from '@/components/product/QuantityStepper';
import type { CartItem } from '@/types/cart';
import { formatCurrency } from '@/utils/formatCurrency';

interface CartItemRowProps {
  item: CartItem;
  onChangeQuantity: (qty: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onChangeQuantity,
  onRemove,
}: CartItemRowProps) {
  const blocked = !item.active || item.availableQuantity === 0;

  return (
    <View className="flex-row gap-3 rounded-xl border border-border bg-white p-3">
      <View className="h-20 w-20 overflow-hidden rounded-lg bg-surface">
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between">
          <Text
            className="flex-1 pr-2 text-sm font-medium text-gray-900"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Pressable onPress={onRemove} hitSlop={8}>
            <FontAwesome name="trash-o" size={18} color="#9ca3af" />
          </Pressable>
        </View>
        {blocked ? (
          <Text className="text-xs font-semibold text-danger">
            {!item.active ? 'Produto inativo' : 'Sem estoque'}
          </Text>
        ) : (
          <Text className="text-base font-bold text-primary-600">
            {formatCurrency(item.price * item.quantity)}
          </Text>
        )}
        <View className="flex-row items-center justify-between">
          <QuantityStepper
            value={item.quantity}
            min={1}
            max={Math.max(1, item.availableQuantity)}
            onChange={onChangeQuantity}
            disabled={blocked}
          />
          <Text className="text-xs text-muted">
            {formatCurrency(item.price)} un.
          </Text>
        </View>
      </View>
    </View>
  );
}
