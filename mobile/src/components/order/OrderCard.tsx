import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pressable, Text, View } from 'react-native';

import { StatusBadge } from '@/components/order/StatusBadge';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils/formatCurrency';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
  const dateLabel = format(new Date(order.createdAt), "d 'de' MMM, HH:mm", {
    locale: ptBR,
  });
  const thumb = order.items[0]?.imageUrl;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl border border-border bg-white p-4 active:bg-surface"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-muted">
          #{order.id.slice(-8).toUpperCase()}
        </Text>
        <StatusBadge status={order.status} />
      </View>

      <View className="mt-3 flex-row items-center gap-3">
        {thumb ? (
          <View className="h-12 w-12 overflow-hidden rounded-lg bg-surface">
            <Image
              source={{ uri: thumb }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-surface">
            <FontAwesome name="shopping-bag" size={16} color="#9ca3af" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
            {order.items[0]?.name ?? 'Pedido'}
          </Text>
          {itemCount > 1 ? (
            <Text className="text-xs text-muted">
              + {itemCount - (order.items[0]?.quantity ?? 0)} outros itens
            </Text>
          ) : null}
          <Text className="text-xs text-muted">{dateLabel}</Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-bold text-primary-600">
            {formatCurrency(order.total)}
          </Text>
          <Text className="text-[10px] text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
