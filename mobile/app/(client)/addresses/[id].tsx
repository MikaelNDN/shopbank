import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { addressApi } from '@/api/addressApi';
import { AddressForm } from '@/components/address/AddressForm';
import { Loading } from '@/components/common';
import type { Address } from '@/types/address';
import { unformatZipCode } from '@/utils/formatZipCode';

export default function EditAddressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    addressApi
      .getById(id)
      .then((data) => setAddress(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading message="Carregando endereço..." />;
  if (!address) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="m-6 text-base text-danger">
          Endereço não encontrado.
        </Text>
      </SafeAreaView>
    );
  }

  const onSubmit = async (values: Parameters<
    React.ComponentProps<typeof AddressForm>['onSubmit']
  >[0]) => {
    try {
      await addressApi.update(address.id, {
        label: values.label,
        zipCode: unformatZipCode(values.zipCode),
        street: values.street,
        number: values.number,
        complement: values.complement || undefined,
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state.toUpperCase(),
        isFavorite: !!values.isFavorite,
      });
      Toast.show({ type: 'success', text1: 'Endereço atualizado' });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao salvar',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const onDelete = () => {
    Alert.alert('Excluir endereço', `Remover "${address.label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await addressApi.remove(address.id);
          Toast.show({ type: 'success', text1: 'Endereço excluído' });
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center">
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <FontAwesome name="angle-left" size={24} color="#111827" />
              </Pressable>
              <Text className="ml-3 text-2xl font-bold text-gray-900">
                Editar endereço
              </Text>
            </View>
            <Pressable onPress={onDelete} hitSlop={12}>
              <FontAwesome name="trash-o" size={20} color="#dc2626" />
            </Pressable>
          </View>

          <View className="px-6">
            <AddressForm
              initial={address}
              submitLabel="Salvar alterações"
              onSubmit={onSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
