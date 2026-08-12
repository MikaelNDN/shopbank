import FontAwesome from '@expo/vector-icons/FontAwesome';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pressable, Text, View } from 'react-native';

import type { CustomerSummary } from '@/api/adminApi';
import { formatCurrency } from '@/utils/formatCurrency';

interface CustomerRowProps {
  customer: CustomerSummary;
  onPress?: () => void;
}

export function CustomerRow({ customer, onPress }: CustomerRowProps) {
  const initials = customer.user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border bg-white p-4 active:bg-surface"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-50">
        {initials ? (
          <Text className="text-base font-bold text-primary-700">
            {initials}
          </Text>
        ) : (
          <FontAwesome name="user" size={18} color="#b84613" />
        )}
      </View>
      <View className="flex-1">
        <Text
          className="text-sm font-semibold text-gray-900"
          numberOfLines={1}
        >
          {customer.user.name}
        </Text>
        <Text className="text-xs text-muted" numberOfLines={1}>
          {customer.user.email}
        </Text>
        <Text className="mt-1 text-xs text-muted">
          {customer.totalOrders}{' '}
          {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
          {customer.lastOrderAt
            ? ` · último em ${format(new Date(customer.lastOrderAt), 'd MMM', { locale: ptBR })}`
            : ''}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold text-primary-600">
          {formatCurrency(customer.totalSpent)}
        </Text>
        <Text className="text-[10px] text-muted">total gasto</Text>
      </View>
    </Pressable>
  );
}
