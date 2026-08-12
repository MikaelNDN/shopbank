import { Pressable, ScrollView, Text } from 'react-native';

import type { DashboardPeriod } from '@/api/adminApi';

interface PeriodFilterProps {
  value: DashboardPeriod;
  onChange: (next: DashboardPeriod) => void;
}

const OPTIONS: { key: DashboardPeriod; label: string }[] = [
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: 'month', label: 'Mês atual' },
  { key: 'all', label: 'Tudo' },
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            className={`self-start rounded-full border px-3.5 py-1.5 ${
              selected
                ? 'border-primary-500 bg-primary-500'
                : 'border-border bg-white'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                selected ? 'text-white' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
