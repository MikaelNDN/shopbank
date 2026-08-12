import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 px-6 py-6">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <FontAwesome name="user" size={28} color="#ed751e" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {user?.name}
            </Text>
            <Text className="text-sm text-muted">{user?.email}</Text>
          </View>
        </View>

        <View className="mt-8 gap-2">
          <ProfileLink
            icon="credit-card"
            label="Minha conta"
            onPress={() => router.push('/(client)/account')}
          />
          <ProfileLink
            icon="map-marker"
            label="Meus endereços"
            onPress={() => router.push('/(client)/addresses')}
          />
          <ProfileLink
            icon="list-alt"
            label="Meus pedidos"
            onPress={() => router.push('/(client)/(tabs)/orders')}
          />
          <ProfileLink icon="cog" label="Configurações" disabled />
        </View>

        <View className="mt-auto">
          <Button
            label="Sair"
            variant="outline"
            size="lg"
            fullWidth
            onPress={logout}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

interface ProfileLinkProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

function ProfileLink({ icon, label, onPress, disabled }: ProfileLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center rounded-lg border border-border bg-surface px-4 py-3 ${
        disabled ? 'opacity-50' : 'active:bg-gray-100'
      }`}
    >
      <FontAwesome name={icon} size={18} color="#6b7280" />
      <Text className="ml-3 flex-1 text-base text-gray-900">{label}</Text>
      <FontAwesome name="angle-right" size={18} color="#9ca3af" />
    </Pressable>
  );
}
