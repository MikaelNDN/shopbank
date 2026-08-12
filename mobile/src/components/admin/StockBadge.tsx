import { Text, View } from 'react-native';

interface StockBadgeProps {
  quantity: number;
  threshold?: number;
}

export function StockBadge({ quantity, threshold = 5 }: StockBadgeProps) {
  let bg = 'bg-success';
  let label = `${quantity} un.`;
  if (quantity === 0) {
    bg = 'bg-danger';
    label = 'Sem estoque';
  } else if (quantity <= threshold) {
    bg = 'bg-warning';
  }
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${bg}`}>
      <Text className="text-xs font-bold text-white">{label}</Text>
    </View>
  );
}
