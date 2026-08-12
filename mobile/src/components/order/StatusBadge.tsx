import { Text, View } from 'react-native';

import type { OrderStatus } from '@/types/order';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

const STATUS_TONE: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  PENDING_PAYMENT: {
    bg: 'bg-warning/15',
    text: 'text-yellow-800',
    dot: 'bg-warning',
  },
  PAID: { bg: 'bg-success/15', text: 'text-success', dot: 'bg-success' },
  SHIPPED: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-700',
    dot: 'bg-secondary-600',
  },
  DELIVERED: {
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    dot: 'bg-primary-500',
  },
  CANCELED: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const tone = STATUS_TONE[status];
  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full ${tone.bg} ${
        size === 'md' ? 'px-3 py-1.5' : 'px-2 py-1'
      }`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      <Text
        className={`font-semibold ${tone.text} ${
          size === 'md' ? 'text-xs' : 'text-[10px]'
        }`}
      >
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}
