import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import type { PaymentMethod } from '@/types/order';

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

interface Option {
  key: PaymentMethod;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}

const OPTIONS: Option[] = [
  {
    key: 'ABACATEPAY',
    label: 'AbacatePay',
    hint: 'Checkout seguro',
    icon: 'shopping-bag',
  },
  { key: 'PIX', label: 'PIX', hint: 'Aprovação imediata', icon: 'qrcode' },
  {
    key: 'CREDIT_CARD',
    label: 'Cartão de débito',
    hint: 'Pagamento seguro',
    icon: 'credit-card',
  },
  { key: 'BOLETO', label: 'Boleto', hint: '1 a 3 dias úteis', icon: 'barcode' },
];

export function PaymentMethodPicker({
  value,
  onChange,
}: PaymentMethodPickerProps) {
  return (
    <View className="gap-2">
      {OPTIONS.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`flex-row items-center rounded-xl border px-4 py-3 ${
              selected
                ? 'border-primary-500 bg-primary-50'
                : 'border-border bg-white active:bg-surface'
            }`}
          >
            <View
              className={`h-9 w-9 items-center justify-center rounded-full ${
                selected ? 'bg-primary-500' : 'bg-surface'
              }`}
            >
              <FontAwesome
                name={opt.icon}
                size={16}
                color={selected ? '#fff' : '#6b7280'}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-gray-900">
                {opt.label}
              </Text>
              <Text className="text-xs text-muted">{opt.hint}</Text>
            </View>
            {selected ? (
              <FontAwesome name="check-circle" size={18} color="#b84613" />
            ) : (
              <View className="h-4 w-4 rounded-full border border-border" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
