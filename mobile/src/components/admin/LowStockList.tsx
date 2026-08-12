import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

interface LowStockListProps {
  items: { id: string; name: string; qty: number }[];
}

export function LowStockList({ items }: LowStockListProps) {
  if (items.length === 0) {
    return (
      <View className="items-center py-6">
        <FontAwesome name="check-circle" size={28} color="#16a34a" />
        <Text className="mt-2 text-sm text-muted">
          Estoque saudável em todos os produtos.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {items.map((item) => {
        const critical = item.qty === 0;
        return (
          <View
            key={item.id}
            className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
          >
            <Text
              className="flex-1 text-sm text-gray-900"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View
              className={`rounded-full px-2 py-0.5 ${
                critical ? 'bg-danger' : 'bg-warning'
              }`}
            >
              <Text className="text-xs font-bold text-white">
                {item.qty} un.
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
