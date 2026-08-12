import { Alert, View } from 'react-native';

import { Button } from '@/components/common';
import { STATUS_LABEL } from '@/components/order/StatusBadge';
import type { OrderStatus } from '@/types/order';
import { nextStatuses } from '@/utils/orderStatus';

interface OrderStatusActionsProps {
  current: OrderStatus;
  onTransition: (next: OrderStatus) => Promise<void>;
}

export function OrderStatusActions({
  current,
  onTransition,
}: OrderStatusActionsProps) {
  const targets = nextStatuses(current);
  if (targets.length === 0) return null;

  const handle = (target: OrderStatus) => {
    Alert.alert(
      'Confirmar mudança',
      `Mudar status para "${STATUS_LABEL[target]}"?${
        target === 'CANCELED' && current === 'PAID'
          ? '\n\nIsso vai estornar o pagamento e devolver os itens ao estoque.'
          : ''
      }`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: target === 'CANCELED' ? 'destructive' : 'default',
          onPress: () => onTransition(target),
        },
      ],
    );
  };

  return (
    <View className="gap-2">
      {targets.map((target) => (
        <Button
          key={target}
          label={STATUS_LABEL[target]}
          variant={target === 'CANCELED' ? 'outline' : 'primary'}
          fullWidth
          onPress={() => handle(target)}
        />
      ))}
    </View>
  );
}
