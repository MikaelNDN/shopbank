import { Text, View } from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';

interface OrderSummaryProps {
  subtotal: number;
  shipping?: number;
  itemCount?: number;
  discount?: number;
}

export function OrderSummary({
  subtotal,
  shipping = 0,
  itemCount,
  discount = 0,
}: OrderSummaryProps) {
  const total = subtotal + shipping - discount;
  return (
    <View className="gap-2 rounded-xl border border-border bg-surface p-4">
      {itemCount !== undefined ? (
        <Row
          label={`${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
          value={formatCurrency(subtotal)}
        />
      ) : (
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
      )}
      <Row
        label="Frete"
        value={shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
        positive={shipping === 0}
      />
      {discount > 0 ? (
        <Row label="Desconto" value={`- ${formatCurrency(discount)}`} positive />
      ) : null}
      <View className="my-1 h-px bg-border" />
      <Row label="Total" value={formatCurrency(total)} bold />
    </View>
  );
}

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}

function Row({ label, value, bold = false, positive = false }: RowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${
          bold
            ? 'font-bold text-gray-900'
            : positive
              ? 'text-success'
              : 'text-gray-900'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
