import { Pressable, Text } from 'react-native';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({
  label,
  selected = false,
  onPress,
}: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected
          ? 'border-primary-500 bg-primary-500'
          : 'border-border bg-white active:bg-surface'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
