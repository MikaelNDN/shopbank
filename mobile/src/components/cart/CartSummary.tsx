import { Text, View } from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
}

export function CartSummary({ subtotal, shipping = 0 }: CartSummaryProps) {
  const total = subtotal + shipping;
  return (
    <View className="gap-2 rounded-xl border border-border bg-surface p-4">
      <Row label="Subtotal" value={formatCurrency(subtotal)} />
      <Row
        label="Frete"
        value={shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
        valueClassName={shipping === 0 ? 'text-success' : undefined}
      />
      <View className="my-1 h-px bg-border" />
      <Row label="Total" value={formatCurrency(total)} bold />
    </View>
  );
}

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  valueClassName?: string;
}

function Row({ label, value, bold = false, valueClassName }: RowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${
          bold ? 'font-bold text-gray-900' : 'text-gray-900'
        } ${valueClassName ?? ''}`}
      >
        {value}
      </Text>
    </View>
  );
}
