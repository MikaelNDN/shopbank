import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, TextInput, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar produtos...',
  onSubmit,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-full border border-border bg-white px-4">
      <FontAwesome name="search" size={16} color="#9ca3af" />
      <TextInput
        className="ml-2 flex-1 py-2 text-base text-gray-900"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <FontAwesome name="times-circle" size={16} color="#9ca3af" />
        </Pressable>
      ) : null}
    </View>
  );
}
