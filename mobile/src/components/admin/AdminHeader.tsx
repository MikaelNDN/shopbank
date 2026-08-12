import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, rightSlot }: AdminHeaderProps) {
  const navigation = useNavigation();

  return (
    <View className="flex-row items-center px-6 py-4">
      <Pressable
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        hitSlop={12}
        className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface active:bg-border"
      >
        <FontAwesome name="bars" size={18} color="#374151" />
      </Pressable>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-muted">{subtitle}</Text>
        ) : null}
      </View>
      {rightSlot}
    </View>
  );
}
