import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pressable, Text, View } from 'react-native';

import { StatusBadge } from '@/components/order/StatusBadge';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils/formatCurrency';

interface AdminOrderRowProps {
  order: Order;
  customerName?: string;
  onPress?: () => void;
}

export function AdminOrderRow({
  order,
  customerName,
  onPress,
}: AdminOrderRowProps) {
  const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);
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
      <View className="mt-2 flex-row items-end justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-sm font-semibold text-gray-900"
            numberOfLines={1}
          >
            {customerName ?? 'Cliente'}
          </Text>
          <Text className="text-xs text-muted">
            {format(new Date(order.createdAt), "d 'de' MMM, HH:mm", {
              locale: ptBR,
            })}
            {' · '}
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </Text>
        </View>
        <Text className="text-base font-bold text-primary-600">
          {formatCurrency(order.total)}
        </Text>
      </View>
    </Pressable>
  );
}
