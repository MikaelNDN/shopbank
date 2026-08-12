import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from 'react-native';

import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-surface">
        <FontAwesome name={icon} size={32} color="#9ca3af" />
      </View>
      <Text className="mt-4 text-center text-lg font-semibold text-gray-900">
        {title}
      </Text>
      {description ? (
        <Text className="mt-1 text-center text-sm text-muted">
          {description}
        </Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <View className="mt-6 w-full max-w-xs">
          <Button label={ctaLabel} onPress={onCtaPress} fullWidth />
        </View>
      ) : null}
    </View>
  );
}
