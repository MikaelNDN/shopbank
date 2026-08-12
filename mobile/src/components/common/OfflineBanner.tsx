import FontAwesome from '@expo/vector-icons/FontAwesome';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!offline) return null;

  return (
    <SafeAreaView edges={['top']} className="absolute inset-x-0 top-0 z-50">
      <View className="flex-row items-center justify-center gap-2 bg-danger px-4 py-2">
        <FontAwesome name="wifi" size={12} color="#fff" />
        <Text className="text-xs font-semibold text-white">
          Sem conexão — algumas ações ficam indisponíveis
        </Text>
      </View>
    </SafeAreaView>
  );
}
