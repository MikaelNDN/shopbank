import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  tone?: Tone;
  width?: number;
}

const TONE_STYLES: Record<
  Tone,
  { bg: string; iconBg: string; iconColor: string; valueColor: string }
> = {
  neutral: {
    bg: 'bg-white border border-border',
    iconBg: 'bg-surface',
    iconColor: '#6b7280',
    valueColor: 'text-gray-900',
  },
  primary: {
    bg: 'bg-primary-50 border border-primary-200',
    iconBg: 'bg-primary-500',
    iconColor: '#fff',
    valueColor: 'text-primary-700',
  },
  success: {
    bg: 'bg-success/10 border border-success/30',
    iconBg: 'bg-success',
    iconColor: '#fff',
    valueColor: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10 border border-warning/30',
    iconBg: 'bg-warning',
    iconColor: '#fff',
    valueColor: 'text-yellow-800',
  },
  danger: {
    bg: 'bg-danger/10 border border-danger/30',
    iconBg: 'bg-danger',
    iconColor: '#fff',
    valueColor: 'text-danger',
  },
};

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  width,
}: KpiCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <View
      className={`rounded-xl p-4 ${styles.bg}`}
      style={width ? { width } : undefined}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium uppercase text-muted">
          {label}
        </Text>
        {icon ? (
          <View
            className={`h-8 w-8 items-center justify-center rounded-full ${styles.iconBg}`}
          >
            <FontAwesome name={icon} size={14} color={styles.iconColor} />
          </View>
        ) : null}
      </View>
      <Text
        className={`mt-3 text-2xl font-bold ${styles.valueColor}`}
        numberOfLines={1}
      >
        {value}
      </Text>
      {hint ? (
        <Text className="mt-1 text-xs text-muted" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
