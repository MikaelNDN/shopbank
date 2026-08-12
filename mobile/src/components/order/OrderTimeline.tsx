import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import type { OrderStatus } from '@/types/order';

interface OrderTimelineProps {
  status: OrderStatus;
}

interface Step {
  key: OrderStatus;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}

const STEPS: Step[] = [
  { key: 'PENDING_PAYMENT', label: 'Pedido criado', icon: 'file-text-o' },
  { key: 'PAID', label: 'Pagamento aprovado', icon: 'check-circle' },
  { key: 'SHIPPED', label: 'Enviado', icon: 'truck' },
  { key: 'DELIVERED', label: 'Entregue', icon: 'home' },
];

const ORDER: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'SHIPPED',
  'DELIVERED',
];

export function OrderTimeline({ status }: OrderTimelineProps) {
  if (status === 'CANCELED') {
    return (
      <View className="rounded-xl border border-danger/30 bg-danger/10 p-4">
        <View className="flex-row items-center gap-2">
          <FontAwesome name="times-circle" size={16} color="#dc2626" />
          <Text className="text-sm font-semibold text-danger">
            Pedido cancelado
          </Text>
        </View>
      </View>
    );
  }

  const currentIdx = ORDER.indexOf(status);

  return (
    <View>
      {STEPS.map((step, idx) => {
        const completed = idx <= currentIdx;
        const active = idx === currentIdx;
        const isLast = idx === STEPS.length - 1;

        return (
          <View key={step.key} className="flex-row">
            <View className="items-center">
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  completed ? 'bg-primary-500' : 'bg-surface border border-border'
                }`}
              >
                <FontAwesome
                  name={step.icon}
                  size={14}
                  color={completed ? '#fff' : '#9ca3af'}
                />
              </View>
              {!isLast ? (
                <View
                  className={`my-1 w-0.5 flex-1 ${
                    idx < currentIdx ? 'bg-primary-500' : 'bg-border'
                  }`}
                  style={{ minHeight: 28 }}
                />
              ) : null}
            </View>
            <View className="ml-3 flex-1 pb-6">
              <Text
                className={`text-sm font-semibold ${
                  active
                    ? 'text-primary-700'
                    : completed
                      ? 'text-gray-900'
                      : 'text-muted'
                }`}
              >
                {step.label}
              </Text>
              {active ? (
                <Text className="mt-0.5 text-xs text-muted">Status atual</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
