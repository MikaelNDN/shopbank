import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function AccessDeniedScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleBack = () => {
    if (user?.role === 'ADMIN') {
      router.replace('/(admin)/dashboard');
    } else if (user?.role === 'CLIENT') {
      router.replace('/(client)/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-danger/10">
          <FontAwesome name="lock" size={36} color="#dc2626" />
        </View>
        <Text className="mt-6 text-2xl font-bold text-gray-900">
          Acesso negado
        </Text>
        <Text className="mt-2 text-center text-base text-muted">
          Você não tem permissão para acessar esta área.
        </Text>

        <View className="mt-10 w-full gap-3">
          <Button label="Voltar para minha área" onPress={handleBack} />
          <Button label="Sair" variant="outline" onPress={logout} />
        </View>
      </View>
    </SafeAreaView>
  );
}
