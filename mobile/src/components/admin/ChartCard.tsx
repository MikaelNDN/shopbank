import { Text, View } from 'react-native';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <View className="rounded-xl border border-border bg-white p-4">
      <Text className="text-base font-bold text-gray-900">{title}</Text>
      {subtitle ? (
        <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text>
      ) : null}
      <View className="mt-4">{children}</View>
    </View>
  );
}
