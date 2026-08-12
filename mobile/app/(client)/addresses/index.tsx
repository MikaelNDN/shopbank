import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { addressApi } from '@/api/addressApi';
import { EmptyState, Loading } from '@/components/common';
import { AddressCard } from '@/components/address/AddressCard';
import { useAddresses } from '@/hooks/useAddresses';

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addresses, isLoading, refetch } = useAddresses();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleSetFavorite = async (id: string) => {
    try {
      await addressApi.setFavorite(id);
      Toast.show({ type: 'success', text1: 'Favorito atualizado' });
      refetch();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Falhou',
        text2: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Excluir endereço', `Remover "${label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await addressApi.remove(id);
          Toast.show({ type: 'success', text1: 'Endereço excluído' });
          refetch();
        },
      },
    ]);
  };

  if (isLoading) return <Loading message="Carregando endereços..." />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="angle-left" size={24} color="#111827" />
        </Pressable>
        <Text className="ml-3 text-2xl font-bold text-gray-900">
          Meus endereços
        </Text>
      </View>

      {addresses.length === 0 ? (
        <EmptyState
          icon="map-marker"
          title="Nenhum endereço cadastrado"
          description="Cadastre um endereço para finalizar suas compras."
          ctaLabel="Cadastrar endereço"
          onCtaPress={() => router.push('/(client)/addresses/new')}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 96,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <AddressCard
              address={item}
              onPress={() => router.push(`/(client)/addresses/${item.id}`)}
              onSetFavorite={() => handleSetFavorite(item.id)}
              onDelete={() => handleDelete(item.id, item.label)}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => router.push('/(client)/addresses/new')}
        style={{ position: 'absolute', right: 24, bottom: insets.bottom + 24 }}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:bg-primary-600"
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}
